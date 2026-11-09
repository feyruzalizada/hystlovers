import type { Payload } from "payload";
import type { Order } from "@/payload-types";
import { createPurchase, getOrder, kapitalEnabled } from "./kapital";
import { sendOrderEmail } from "./order-email";
import { serverUrl } from "./server-url";

type PaymentStatus = Order["paymentStatus"];

// Bank statuses that settle the order's payment; anything else is still in progress.
const SETTLED: Record<string, PaymentStatus> = {
  FullyPaid: "paid",
  Refunded: "refunded",
  Voided: "refunded",
  Declined: "failed",
  Cancelled: "failed",
  Rejected: "failed",
  Refused: "failed",
  Expired: "failed",
};

/** A card order the shopper can still pay: not paid, refunded or cancelled. */
export function isPayable(order: Pick<Order, "paymentMethod" | "paymentStatus" | "status">): boolean {
  return (
    kapitalEnabled &&
    order.paymentMethod === "card" &&
    order.status !== "cancelled" &&
    (order.paymentStatus === "pending" || order.paymentStatus === "failed")
  );
}

/** Opens a bank order for the full total and returns the hosted payment page. */
export async function startCardPayment(payload: Payload, order: Order): Promise<string> {
  const settings = await payload.findGlobal({ slug: "settings" });
  const { id, paymentUrl } = await createPurchase({
    amount: order.total,
    currency: order.currency,
    language: order.locale,
    title: settings.shopName || "Hystlovers",
    // The return URL and the description both carry the number, so a stale tab still lands on its order.
    description: order.number,
    redirectUrl: `${serverUrl ?? "http://localhost:3000"}/api/orders/payment/${encodeURIComponent(order.number)}`,
  });

  await payload.update({
    collection: "orders",
    id: order.id,
    overrideAccess: true,
    data: { bankOrderId: id, bankStatus: "Preparing", paymentStatus: "pending" },
  });
  return paymentUrl;
}

/**
 * Reads the bank order and copies its outcome onto ours. The status in the
 * return URL can be temporary, so only the API's answer is trusted.
 */
export async function syncCardPayment(payload: Payload, order: Order, bankOrderId = order.bankOrderId): Promise<Order> {
  if (!bankOrderId || order.paymentMethod !== "card") return order;

  const bank = await getOrder(bankOrderId);
  // Anyone can open the return URL, so the bank order must be this one's.
  if (bank.description !== order.number) return order;

  let paymentStatus = SETTLED[bank.status] ?? order.paymentStatus;
  if (paymentStatus === "paid" && (Math.abs(bank.amount - order.total) > 0.001 || bank.currency !== order.currency)) {
    payload.logger.error(`order ${order.number}: bank order ${bank.id} paid ${bank.amount} ${bank.currency}`);
    paymentStatus = order.paymentStatus;
  }
  // A declined retry never undoes an earlier successful payment.
  if (order.paymentStatus === "paid" && paymentStatus === "failed") return order;

  if (bank.id === order.bankOrderId && bank.status === order.bankStatus && paymentStatus === order.paymentStatus) {
    return order;
  }

  const updated = await payload.update({
    collection: "orders",
    id: order.id,
    overrideAccess: true,
    depth: 0,
    data: { bankOrderId: bank.id, bankStatus: bank.status, paymentStatus },
  });

  if (paymentStatus === "paid" && order.paymentStatus !== "paid") await sendOrderEmail(payload, updated);
  return updated;
}
