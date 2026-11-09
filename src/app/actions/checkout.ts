"use server";

import { payloadClient } from "@/lib/cms";
import { getTranslator } from "@/lib/server-i18n";
import { getCustomer } from "@/lib/auth";
import { defaultLocale, isLocale, localePath } from "@/lib/i18n";
import { availableIn, hit, tooManyAttempts } from "@/lib/rate-limit";
import { PAYMENT_METHODS } from "@/collections/Commerce";
import type { Order, Product, Setting } from "@/payload-types";
import type { Locale } from "@/lib/types";
import { kapitalEnabled } from "@/lib/kapital";
import { sendOrderEmail } from "@/lib/order-email";
import { isPayable, startCardPayment, syncCardPayment } from "@/lib/payments";
import { productName } from "@/lib/product-name";

type OrderItem = NonNullable<Order["items"]>[number];
type PaymentMethod = Order["paymentMethod"];

export type CheckoutLine = { slug: string; size: string; qty: number };
export type CheckoutResult =
  | { ok: true; number: string; paymentUrl?: string; paymentError?: boolean }
  | { ok: false; message: string };
export type PayResult = { ok: true; paymentUrl: string | null } | { ok: false; message: string };

const PHONE = /^\+?[0-9 ()-]{7,}$/;

function localeOf(value: string): Locale {
  return isLocale(value) ? value : defaultLocale;
}

function remainingFor(doc: Product, size: string): number | null {
  const quantity = (doc.sizes ?? []).find((entry) => entry.size === size)?.quantity;
  return quantity === null || quantity === undefined ? null : Math.max(0, quantity);
}

function isOrderable(doc: Product, size: string, qty: number): boolean {
  const sizes = (doc.sizes ?? []).map((entry) => entry.size);
  if (!sizes.includes(size)) return false;
  if (doc.isPreorder) return true;
  if (!doc.inStock) return false;
  const remaining = remainingFor(doc, size);
  return remaining === null || remaining >= qty;
}

async function generateNumber(payload: Awaited<ReturnType<typeof payloadClient>>): Promise<string> {
  const stamp = new Date().toISOString().slice(2, 10).replaceAll("-", "");
  for (let attempt = 0; attempt < 20; attempt++) {
    const number = `HL${stamp}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
    const taken = await payload.count({
      collection: "orders",
      where: { number: { equals: number } },
      overrideAccess: true,
    });
    if (taken.totalDocs === 0) return number;
  }
  return `HL${stamp}-${Date.now().toString().slice(-4)}`;
}

export async function placeOrder(input: {
  locale: string;
  customerName: string;
  phone: string;
  city: string;
  address: string;
  note?: string;
  paymentMethod: string;
  items: CheckoutLine[];
}): Promise<CheckoutResult> {
  const locale = localeOf(input.locale);
  const t = await getTranslator(locale);

  const customer = await getCustomer();
  if (!customer) return { ok: false, message: t("auth.failed") };

  const key = `checkout:${customer.id}`;
  if (tooManyAttempts(key, 10)) {
    return { ok: false, message: t("auth.throttled", { seconds: availableIn(key) }) };
  }
  hit(key, 60);

  if (!input.customerName.trim() || !input.city.trim() || !input.address.trim()) {
    return { ok: false, message: t("form.error.invalid") };
  }
  if (!PHONE.test(input.phone.trim())) {
    return { ok: false, message: t("checkout.error.phone") };
  }
  if (
    !PAYMENT_METHODS.includes(input.paymentMethod as PaymentMethod) ||
    (input.paymentMethod === "card" && !kapitalEnabled)
  ) {
    return { ok: false, message: t("form.error.invalid") };
  }
  if (input.items.length === 0 || input.items.length > 50) {
    return { ok: false, message: t("checkout.empty") };
  }

  const payload = await payloadClient();
  const settings: Setting = await payload.findGlobal({ slug: "settings", locale });

  const lines: OrderItem[] = [];
  const stockWrites = new Map<number, { sizes: Product["sizes"]; inStock: boolean }>();
  // Two lines of one product share a doc, so the second sees the first's decrement.
  const docs = new Map<string, Product>();

  for (const item of input.items) {
    const qty = Math.max(1, Math.min(20, Math.trunc(item.qty)));
    let doc = docs.get(item.slug);
    if (!doc) {
      const found = await payload.find({
        collection: "products",
        where: { slug: { equals: item.slug }, isActive: { equals: true } },
        locale,
        limit: 1,
        overrideAccess: true,
      });
      doc = found.docs[0];
      if (doc) docs.set(item.slug, doc);
    }
    if (!doc) return { ok: false, message: t("checkout.error.unavailable") };

    if (!isOrderable(doc, item.size, qty)) {
      return {
        ok: false,
        message: t("checkout.error.out_of_stock", { product: productName(doc, locale), size: item.size }),
      };
    }

    // The order keeps the shop's default language; the shopper reads their own.
    const stored =
      locale === defaultLocale
        ? doc
        : await payload.findByID({ collection: "products", id: doc.id, locale: defaultLocale, depth: 0, overrideAccess: true });

    // Prices always come from the database, never from the submitted cart.
    const unitPrice = doc.price;
    lines.push({
      product: doc.id,
      name: productName(stored, defaultLocale),
      colorName: stored.colorName,
      size: item.size,
      unitPrice,
      qty,
      lineTotal: Math.round(unitPrice * qty * 100) / 100,
      isPreorder: Boolean(doc.isPreorder),
    });

    if (!doc.isPreorder && remainingFor(doc, item.size) !== null) {
      const sizes = (doc.sizes ?? []).map((row) =>
        row.size === item.size
          ? { ...row, quantity: Math.max(0, (row.quantity ?? 0) - qty) }
          : row,
      );
      const tracked = sizes
        .map((row) => row.quantity)
        .filter((quantity): quantity is number => quantity !== null && quantity !== undefined);

      const inStock = tracked.length > 0 ? Math.max(...tracked) > 0 : Boolean(doc.inStock);
      doc.sizes = sizes;
      doc.inStock = inStock;
      stockWrites.set(doc.id, { sizes, inStock });
    }
  }

  const subtotal = Math.round(lines.reduce((sum, line) => sum + line.lineTotal, 0) * 100) / 100;
  const threshold = Number(settings.freeShippingThreshold ?? 0);
  const shippingTotal = subtotal >= threshold ? 0 : Number(settings.shippingFee ?? 0);

  const number = await generateNumber(payload);

  const order = await payload.create({
    collection: "orders",
    overrideAccess: true,
    data: {
      number,
      customer: Number(customer.id),
      status: "pending",
      paymentMethod: input.paymentMethod as PaymentMethod,
      paymentStatus: "pending",
      customerName: input.customerName.trim(),
      customerEmail: customer.email,
      phone: input.phone.trim(),
      city: input.city.trim(),
      address: input.address.trim(),
      note: input.note?.trim() || null,
      items: lines,
      subtotal,
      shippingTotal,
      total: Math.round((subtotal + shippingTotal) * 100) / 100,
      currency: settings.currencyCode ?? "AZN",
      locale,
    },
  });

  for (const [id, write] of stockWrites) {
    await payload.update({
      collection: "products",
      id,
      overrideAccess: true,
      data: { sizes: write.sizes, inStock: write.inStock },
    });
  }

  if (order.paymentMethod !== "card") {
    await sendOrderEmail(payload, order);
    return { ok: true, number };
  }

  // The order is kept either way; an unpaid one can be paid from its page.
  try {
    return { ok: true, number, paymentUrl: await startCardPayment(payload, order) };
  } catch (error) {
    payload.logger.error(`order ${number}: ${(error as Error).message}`);
    return { ok: true, number, paymentError: true };
  }
}

/** "Pay by card" on an unpaid card order: a fresh bank order, unless the last one went through. */
export async function payOrder(input: { locale: string; number: string }): Promise<PayResult> {
  const locale = localeOf(input.locale);
  const t = await getTranslator(locale);

  const customer = await getCustomer();
  if (!customer) return { ok: false, message: t("auth.failed") };

  const key = `pay:${customer.id}`;
  if (tooManyAttempts(key, 10)) {
    return { ok: false, message: t("auth.throttled", { seconds: availableIn(key) }) };
  }
  hit(key, 60);

  const payload = await payloadClient();
  const { docs } = await payload.find({
    collection: "orders",
    where: { number: { equals: input.number }, customer: { equals: customer.id } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  let order = docs[0];
  if (!order || !isPayable(order)) return { ok: false, message: t("form.error.invalid") };

  try {
    order = await syncCardPayment(payload, order);
    if (!isPayable(order)) return { ok: true, paymentUrl: null };
    return { ok: true, paymentUrl: await startCardPayment(payload, order) };
  } catch (error) {
    payload.logger.error(`order ${order.number}: ${(error as Error).message}`);
    return { ok: false, message: t("account.order.payment_error") };
  }
}

export async function orderPath(locale: string, number: string): Promise<string> {
  return localePath(localeOf(locale), `/account/orders/${number}`);
}
