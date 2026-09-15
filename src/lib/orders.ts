import "server-only";
import { payloadClient } from "./cms";
import type { Order, Setting } from "@/payload-types";

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

function toView(doc: Order): OrderView {
  const items: OrderItemView[] = (doc.items ?? []).map((item) => ({
    name: item.name,
    color: item.colorName,
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

export async function getOrdersFor(customerId: string | number): Promise<OrderView[]> {
  const payload = await payloadClient();
  const result = await payload.find({
    collection: "orders",
    where: { customer: { equals: customerId } },
    sort: "-createdAt",
    depth: 2,
    limit: 0,
    pagination: false,
    overrideAccess: true,
  });
  return result.docs.map(toView);
}

export async function getOrderFor(
  customerId: string | number,
  number: string,
): Promise<OrderView | null> {
  const payload = await payloadClient();
  const result = await payload.find({
    collection: "orders",
    where: { number: { equals: number }, customer: { equals: customerId } },
    depth: 2,
    limit: 1,
    overrideAccess: true,
  });
  const doc = result.docs[0];
  return doc ? toView(doc) : null;
}

export async function getBankTransferDetails(): Promise<string | null> {
  const payload = await payloadClient();
  const settings: Setting = await payload.findGlobal({ slug: "settings" });
  return settings.bankTransferDetails || null;
}
