"use server";

import { payloadClient } from "@/lib/cms";
import { getTranslator } from "@/lib/server-i18n";
import { getCustomer } from "@/lib/auth";
import { defaultLocale, isLocale, localePath } from "@/lib/i18n";
import { availableIn, hit, tooManyAttempts } from "@/lib/rate-limit";
import { PAYMENT_METHODS } from "@/collections/Commerce";
import type { Order, Product, Setting } from "@/payload-types";
import type { Locale } from "@/lib/types";

type OrderItem = NonNullable<Order["items"]>[number];
type PaymentMethod = Order["paymentMethod"];

export type CheckoutLine = { slug: string; size: string; qty: number };
export type CheckoutResult = { ok: true; number: string } | { ok: false; message: string };

const PHONE = /^\+?[0-9 ()-]{7,}$/;

function localeOf(value: string): Locale {
  return isLocale(value) ? value : defaultLocale;
}

function displayName(doc: Product): string {
  const parts = (doc.setParts ?? []).map((part) => part.value).filter(Boolean);
  let name = `${doc.series} ${doc.item}`.toUpperCase() + " - " + String(doc.colorName ?? "").toUpperCase();
  if (parts.length > 0) name += ` (${parts.join(", ").toUpperCase()})`;
  return name;
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
  if (!PAYMENT_METHODS.includes(input.paymentMethod as PaymentMethod)) {
    return { ok: false, message: t("form.error.invalid") };
  }
  if (input.items.length === 0 || input.items.length > 50) {
    return { ok: false, message: t("checkout.empty") };
  }

  const payload = await payloadClient();
  const settings: Setting = await payload.findGlobal({ slug: "settings" });

  const lines: OrderItem[] = [];
  const stockWrites: { id: number; sizes: Product["sizes"]; inStock: boolean }[] = [];

  for (const item of input.items) {
    const qty = Math.max(1, Math.min(20, Math.trunc(item.qty)));
    const found = await payload.find({
      collection: "products",
      where: { slug: { equals: item.slug }, isActive: { equals: true } },
      limit: 1,
      overrideAccess: true,
    });

    const doc = found.docs[0];
    if (!doc) return { ok: false, message: t("checkout.error.unavailable") };

    if (!isOrderable(doc, item.size, qty)) {
      return {
        ok: false,
        message: t("checkout.error.out_of_stock", { product: displayName(doc), size: item.size }),
      };
    }

    // Prices always come from the database, never from the submitted cart.
    const unitPrice = doc.price;
    lines.push({
      product: doc.id,
      name: displayName(doc),
      colorName: doc.colorName,
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

      stockWrites.push({
        id: doc.id,
        sizes,
        inStock: tracked.length > 0 ? Math.max(...tracked) > 0 : Boolean(doc.inStock),
      });
    }
  }

  const subtotal = Math.round(lines.reduce((sum, line) => sum + line.lineTotal, 0) * 100) / 100;
  const threshold = Number(settings.freeShippingThreshold ?? 0);
  const shippingTotal = subtotal >= threshold ? 0 : Number(settings.shippingFee ?? 0);

  const number = await generateNumber(payload);

  await payload.create({
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

  for (const write of stockWrites) {
    await payload.update({
      collection: "products",
      id: write.id,
      overrideAccess: true,
      data: { sizes: write.sizes, inStock: write.inStock },
    });
  }

  // The order stands even if the confirmation email cannot be delivered.
  try {
    await payload.sendEmail({
      to: customer.email,
      subject: t("mail.order.subject", { number }),
      text: [
        t("mail.order.greeting", { name: input.customerName.trim() }),
        t("mail.order.intro", { number }),
        ...(input.paymentMethod === "bank_transfer" && settings.bankTransferDetails
          ? [t("mail.order.bank_intro"), settings.bankTransferDetails, t("mail.order.bank_reference", { number })]
          : []),
      ].join("\n\n"),
    });
  } catch {
    // logged by Payload's email adapter
  }

  return { ok: true, number };
}

export async function orderPath(locale: string, number: string): Promise<string> {
  return localePath(localeOf(locale), `/account/orders/${number}`);
}
