import type { Endpoint } from "payload";

export const navBadges: Endpoint = {
  path: "/nav-badges",
  method: "get",
  handler: async (req) => {
    if (req.user?.collection !== "users") return Response.json({ error: "Unauthorized" }, { status: 401 });

    const [orders, messages] = await Promise.all([
      req.payload.count({ collection: "orders", where: { status: { equals: "pending" } }, overrideAccess: true }),
      req.payload.count({ collection: "contact-messages", where: { readAt: { exists: false } }, overrideAccess: true }),
    ]);

    return Response.json({ orders: orders.totalDocs, "contact-messages": messages.totalDocs });
  },
};
