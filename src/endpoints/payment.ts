import type { Endpoint } from "payload";
import { defaultLocale, isLocale, localePath } from "@/lib/i18n";
import { refund } from "@/lib/kapital";
import { syncCardPayment } from "@/lib/payments";
import { serverUrl } from "@/lib/server-url";

/**
 * Kapital Bank sends the shopper back here with ?ID=…&STATUS=…; the order is
 * checked with the bank, then the shopper lands on it with a banner.
 */
export const paymentReturn: Endpoint = {
  path: "/payment/:number",
  method: "get",
  handler: async (req) => {
    const origin = serverUrl ?? new URL(req.url ?? "http://localhost:3000").origin;
    const number = String(req.routeParams?.number ?? "");
    const { docs } = await req.payload.find({
      collection: "orders",
      where: { number: { equals: number } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const order = docs[0];
    if (!order) return Response.redirect(`${origin}/`, 303);

    const bankOrderId = Number(req.query?.ID);
    let synced = order;
    try {
      synced = await syncCardPayment(req.payload, order, Number.isInteger(bankOrderId) && bankOrderId > 0 ? bankOrderId : undefined);
    } catch (error) {
      req.payload.logger.error(`order ${number}: ${(error as Error).message}`);
    }

    const result = synced.paymentStatus === "paid" ? "success" : synced.paymentStatus === "failed" ? "failed" : null;
    const locale = isLocale(order.locale) ? order.locale : defaultLocale;
    const path = localePath(locale, `/account/orders/${encodeURIComponent(number)}`);
    return Response.redirect(`${origin}${path}${result ? `?payment=${result}` : ""}`, 303);
  },
};

/** "Refund payment" on the view page: returns the full card payment through the bank. */
export const paymentRefund: Endpoint = {
  path: "/:id/refund",
  method: "post",
  handler: async (req) => {
    if (req.user?.collection !== "users") return Response.json({ error: "Unauthorized" }, { status: 401 });

    const order = await req.payload.findByID({
      collection: "orders",
      id: String(req.routeParams?.id ?? ""),
      depth: 0,
      overrideAccess: true,
      disableErrors: true,
    });
    if (!order || order.paymentMethod !== "card" || order.paymentStatus !== "paid" || !order.bankOrderId) {
      return Response.json({ error: "Only a paid card order can be refunded" }, { status: 400 });
    }

    try {
      await refund(order.bankOrderId, order.total);
      const doc = await syncCardPayment(req.payload, order);
      return Response.json({ doc });
    } catch (error) {
      req.payload.logger.error(`order ${order.number}: ${(error as Error).message}`);
      return Response.json({ error: (error as Error).message }, { status: 502 });
    }
  },
};
