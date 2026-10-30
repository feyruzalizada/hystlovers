import { getPayload, type Where } from "payload";
import config from "@payload-config";
import * as qs from "qs-esm";
import { Icon, type IconName } from "./icons";

/**
 * The stat row the Filament panel showed above its dashboard: what needs
 * attention today (orders, stock, unread messages) rather than raw totals.
 */
const startOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
};

const weekAgo = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

// The source widget's colours: success, primary, warning, danger or gray.
type Tone = "success" | "primary" | "warning" | "danger" | "gray";

type Stat = { label: string; value: string; description: string; href: string; tone: Tone; icon: IconName };

const money = new Intl.NumberFormat("en", { style: "currency", currency: "AZN" });

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
    liveSlides,
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
    count("slides", {
      and: [
        { isActive: { equals: true } },
        { or: [{ startsAt: { exists: false } }, { startsAt: { less_than_equal: new Date().toISOString() } }] },
        { or: [{ endsAt: { exists: false } }, { endsAt: { greater_than_equal: new Date().toISOString() } }] },
      ],
    }),
    count("pages", { isActive: { equals: true } }),
  ]);

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
      tone: pendingOrders > 0 ? "warning" : "success",
      icon: "orders",
    },
    {
      label: "Revenue (month)",
      value: money.format(revenue),
      description: "Excludes cancelled orders",
      href: "/admin/collections/orders",
      tone: "primary",
      icon: "banknotes",
    },
    {
      label: "Products",
      value: String(products),
      description: `${activeProducts} active · ${newIn} new in`,
      href: "/admin/collections/products",
      tone: "primary",
      icon: "bag",
    },
    {
      label: "Out of stock",
      value: String(outOfStock),
      description: outOfStock > 0 ? "Needs restocking" : "All products available",
      href: `/admin/collections/products${qs.stringify({ where: { and: [{ inStock: { equals: false } }] } }, { addQueryPrefix: true })}`,
      tone: outOfStock > 0 ? "warning" : "success",
      icon: outOfStock > 0 ? "warning" : "check",
    },
    {
      label: "Messages",
      value: String(messages),
      description:
        unreadMessages > 0
          ? `${unreadMessages} unread · ${messagesThisWeek} this week`
          : `All read · ${messagesThisWeek} this week`,
      href: "/admin/collections/contact-messages",
      tone: unreadMessages > 0 ? "danger" : "success",
      icon: "envelope",
    },
    {
      label: "Categories",
      value: String(categories),
      description: `${rootCategories} top level`,
      href: "/admin/collections/categories",
      tone: "gray",
      icon: "squares",
    },
    {
      label: "Slides",
      value: String(slides),
      description: `${liveSlides} live on the homepage`,
      href: "/admin/collections/slides",
      tone: "gray",
      icon: "photo",
    },
    {
      label: "Pages",
      value: String(pages),
      description: "Published CMS pages",
      href: "/admin/collections/pages",
      tone: "gray",
      icon: "document",
    },
  ];

  return (
    <div className="dashboard-stats">
      {stats.map((stat) => (
        <a key={stat.label} href={stat.href} className={`dashboard-card dashboard-card--${stat.tone}`}>
          <span className="dashboard-card__label">{stat.label}</span>
          <span className="dashboard-card__value">{stat.value}</span>
          <span className="dashboard-card__description">
            {stat.description}
            <Icon name={stat.icon} />
          </span>
        </a>
      ))}
    </div>
  );
}
