import { getPayload, type Where } from "payload";
import config from "@payload-config";

/**
 * The stat row the Filament panel showed above its dashboard: what needs
 * attention today (orders, stock, unread messages) rather than raw totals.
 */
const startOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
};

const weekAgo = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

type Tone = "neutral" | "good" | "warn";

type Stat = { label: string; value: string; description: string; href: string; tone: Tone };

export default async function DashboardStats() {
  const payload = await getPayload({ config });

  const count = async (
    collection: Parameters<typeof payload.count>[0]["collection"],
    where?: Where,
  ) => (await payload.count({ collection, where, overrideAccess: true })).totalDocs;

  const [
    orders,
    pendingOrders,
    ordersThisMonth,
    monthOrders,
    products,
    activeProducts,
    newIn,
    outOfStock,
    messages,
    unreadMessages,
    messagesThisWeek,
    categories,
    rootCategories,
    slides,
    pages,
  ] = await Promise.all([
    count("orders"),
    count("orders", { status: { equals: "pending" } }),
    count("orders", { createdAt: { greater_than_equal: startOfMonth() } }),
    payload.find({
      collection: "orders",
      where: {
        createdAt: { greater_than_equal: startOfMonth() },
        status: { not_equals: "cancelled" },
      },
      limit: 0,
      pagination: false,
      overrideAccess: true,
    }),
    count("products"),
    count("products", { isActive: { equals: true } }),
    count("products", { isActive: { equals: true }, isNew: { equals: true } }),
    count("products", { isActive: { equals: true }, inStock: { equals: false } }),
    count("contact-messages"),
    count("contact-messages", { readAt: { exists: false } }),
    count("contact-messages", { createdAt: { greater_than_equal: weekAgo() } }),
    count("categories", { isActive: { equals: true } }),
    count("categories", { parent: { exists: false } }),
    count("slides"),
    count("pages", { isActive: { equals: true } }),
  ]);

  const settings = await payload.findGlobal({ slug: "settings" });
  const revenue = monthOrders.docs.reduce((sum, order) => sum + Number(order.total ?? 0), 0);

  const stats: Stat[] = [
    {
      label: "Orders",
      value: String(orders),
      description:
        pendingOrders > 0
          ? `${pendingOrders} pending · ${ordersThisMonth} this month`
          : `None pending · ${ordersThisMonth} this month`,
      href: "/admin/collections/orders",
      tone: pendingOrders > 0 ? "warn" : "good",
    },
    {
      label: "Revenue (month)",
      value: `${revenue.toFixed(2)} ${settings.currencySymbol ?? ""}`,
      description: "Excludes cancelled orders",
      href: "/admin/collections/orders",
      tone: "neutral",
    },
    {
      label: "Products",
      value: String(products),
      description: `${activeProducts} active · ${newIn} new in`,
      href: "/admin/collections/products",
      tone: "neutral",
    },
    {
      label: "Out of stock",
      value: String(outOfStock),
      description: outOfStock > 0 ? "Needs restocking" : "All products available",
      href: "/admin/collections/products",
      tone: outOfStock > 0 ? "warn" : "good",
    },
    {
      label: "Messages",
      value: String(messages),
      description:
        unreadMessages > 0
          ? `${unreadMessages} unread · ${messagesThisWeek} this week`
          : `All read · ${messagesThisWeek} this week`,
      href: "/admin/collections/contact-messages",
      tone: unreadMessages > 0 ? "warn" : "good",
    },
    {
      label: "Categories",
      value: String(categories),
      description: `${rootCategories} top level`,
      href: "/admin/collections/categories",
      tone: "neutral",
    },
    {
      label: "Slides",
      value: String(slides),
      description: "On the homepage slider",
      href: "/admin/collections/slides",
      tone: "neutral",
    },
    {
      label: "Pages",
      value: String(pages),
      description: "Published CMS pages",
      href: "/admin/collections/pages",
      tone: "neutral",
    },
  ];

  const toneColor: Record<Tone, string> = {
    neutral: "var(--theme-elevation-500)",
    good: "#2f855a",
    warn: "#b7791f",
  };

  return (
    <div style={{ marginBottom: "2rem" }}>
      <div
        style={{
          display: "grid",
          gap: "0.75rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        }}
      >
        {stats.map((stat) => (
          <a
            key={stat.label}
            href={stat.href}
            style={{
              display: "block",
              padding: "1rem 1.25rem",
              border: "1px solid var(--theme-elevation-150)",
              background: "var(--theme-elevation-50)",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <span
              style={{
                display: "block",
                fontSize: "0.7rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--theme-elevation-500)",
              }}
            >
              {stat.label}
            </span>
            <strong style={{ display: "block", fontSize: "1.6rem", lineHeight: 1.4 }}>
              {stat.value}
            </strong>
            <span style={{ display: "block", fontSize: "0.75rem", color: toneColor[stat.tone] }}>
              {stat.description}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
