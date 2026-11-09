import "server-only";
import { payloadClient } from "./cms";
import { isPayable, syncCardPayment } from "./payments";
import { productName } from "./product-name";
import type { Order, Setting } from "@/payload-types";
import type { Locale } from "./types";

export type OrderItemView = {
  name: string;
  color: string;
  size: string;
  qty: number;
  isPreorder: boolean;
  unitPrice: number;
  lineTotal: number;
  slug: string | null;
};

export type OrderView = {
  number: string;
  status: string;
  statusKey: string;
  paymentMethod: string;
  paymentMethodKey: string;
  paymentStatus: string;
  paymentStatusKey: string;
  canPay: boolean;
  hasPreorder: boolean;
  customerName: string;
  phone: string;
  city: string;
  address: string;
  note: string | null;
  subtotal: number;
  shippingTotal: number;
  total: number;
  createdAt: string;
  items: OrderItemView[];
};

/** Orders store names in the default language; a product that still exists is named in the shopper's. */
function toView(doc: Order, locale: Locale): OrderView {
  const items: OrderItemView[] = (doc.items ?? []).map((item) => ({
    name: item.product && typeof item.product === "object" ? productName(item.product, locale) : item.name,
    color: item.product && typeof item.product === "object" ? item.product.colorName : item.colorName,
    size: item.size,
    qty: item.qty,
    isPreorder: Boolean(item.isPreorder),
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
    slug: item.product && typeof item.product === "object" ? item.product.slug : null,
  }));

  const created = new Date(doc.createdAt);

  return {
    number: doc.number,
    status: doc.status,
    statusKey: `order.status.${doc.status}`,
    paymentMethod: doc.paymentMethod,
    paymentMethodKey: `checkout.payment.${doc.paymentMethod}`,
    paymentStatus: doc.paymentStatus,
    paymentStatusKey: `order.payment_status.${doc.paymentStatus}`,
    canPay: isPayable(doc),
    hasPreorder: items.some((item) => item.isPreorder),
    customerName: doc.customerName,
    phone: doc.phone,
    city: doc.city,
    address: doc.address,
    note: doc.note ?? null,
    subtotal: doc.subtotal,
    shippingTotal: doc.shippingTotal,
    total: doc.total,
    createdAt: `${created.toLocaleDateString("en-GB").replaceAll("/", ".")} ${created
      .toTimeString()
      .slice(0, 5)}`,
    items,
  };
}

export async function getOrdersFor(customerId: string | number, locale: Locale): Promise<OrderView[]> {
  const payload = await payloadClient();
  const result = await payload.find({
    collection: "orders",
    where: { customer: { equals: customerId } },
    sort: "-createdAt",
    depth: 2,
    locale,
    limit: 0,
    pagination: false,
    overrideAccess: true,
  });
  return result.docs.map((doc) => toView(doc, locale));
}

export async function getOrderFor(
  customerId: string | number,
  number: string,
  locale: Locale,
): Promise<OrderView | null> {
  const payload = await payloadClient();
  const result = await payload.find({
    collection: "orders",
    where: { number: { equals: number }, customer: { equals: customerId } },
    depth: 2,
    locale,
    limit: 1,
    overrideAccess: true,
  });
  const doc = result.docs[0];
  return doc ? toView(doc, locale) : null;
}

/** A card order still awaiting payment is checked with the bank, in case the shopper never came back. */
export async function refreshCardPayment(customerId: string | number, number: string): Promise<void> {
  const payload = await payloadClient();
  const { docs } = await payload.find({
    collection: "orders",
    where: { number: { equals: number }, customer: { equals: customerId } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const doc = docs[0];
  if (!doc || doc.paymentMethod !== "card" || doc.paymentStatus !== "pending" || !doc.bankOrderId) return;
  try {
    await syncCardPayment(payload, doc);
  } catch (error) {
    payload.logger.error(`order ${number}: ${(error as Error).message}`);
  }
}

export async function getBankTransferDetails(locale: Locale): Promise<string | null> {
  const payload = await payloadClient();
  const settings: Setting = await payload.findGlobal({ slug: "settings", locale });
  return settings.bankTransferDetails || null;
}
