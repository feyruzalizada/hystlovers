import type { CollectionConfig } from "payload";
import { adminOnly } from "./access";
import { LIST_FILTERS, noteCell } from "./admin-components";
import {
  countOrdersAfterChange,
  countOrdersAfterDelete,
  guardOwnPanelAccess,
  syncPanelAccount,
} from "./customer-sync";
import { ordersExport } from "@/endpoints/orders-export";
import { resetEmailHtml, resetEmailSubject } from "@/lib/reset-email";

export const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;
export const PAYMENT_METHODS = ["cod", "bank_transfer"] as const;
export const PAYMENT_STATUSES = ["pending", "paid"] as const;
export const CONTACT_SUBJECTS = ["order", "return", "product", "other"] as const;

// Wording the source panel used; anything not listed is just capitalised.
const ADMIN_LABELS: Record<string, string> = {
  cod: "Cash on delivery",
  bank_transfer: "Bank transfer",
  return: "Return / Exchange",
  product: "Product question",
};

export const adminLabel = (value: string | null | undefined) =>
  value ? (ADMIN_LABELS[value] ?? value.charAt(0).toUpperCase() + value.slice(1)) : "";

const options = (values: readonly string[]) => values.map((value) => ({ label: adminLabel(value), value }));

/** Storefront shoppers. Separate from `users`, which is admin-panel only. */
export const Customers: CollectionConfig = {
  slug: "customers",
  auth: {
    tokenExpiration: 60 * 60 * 24 * 30,
    maxLoginAttempts: 5,
    lockTime: 60 * 1000,
    // The reset link goes to the storefront, not the panel, in the shopper's language.
    forgotPassword: {
      generateEmailSubject: (args) => resetEmailSubject(args?.req),
      generateEmailHTML: (args) => resetEmailHtml(args?.req, args?.token ?? ""),
    },
  },
  admin: {
    useAsTitle: "email",
    defaultColumns: ["name", "email", "ordersCount", "spent", "panelAccess", "createdAt"],
    group: "Shop",
    listSearchableFields: ["name", "email"],
    components: { beforeListTable: [LIST_FILTERS] },
  },
  disableDuplicate: true,
  hooks: {
    beforeChange: [guardOwnPanelAccess],
    afterChange: [syncPanelAccount],
  },
  access: {
    // A shopper may read and update only their own record.
    read: ({ req }) =>
      req.user?.collection === "users" ? true : req.user ? { id: { equals: req.user.id } } : false,
    // Registration goes through the server action, which overrides access.
    create: () => false,
    update: ({ req }) =>
      req.user?.collection === "users" ? true : req.user ? { id: { equals: req.user.id } } : false,
    delete: adminOnly,
  },
  defaultSort: "-createdAt",
  // The source panel shows a customer read-only; only panel access changes.
  fields: [
    { name: "name", type: "text", required: true, admin: { readOnly: true } },
    {
      name: "panelAccess",
      type: "checkbox",
      defaultValue: false,
      index: true,
      admin: {
        position: "sidebar",
        description: "Lets this customer sign in to the admin panel with the same email and, at first, the same password.",
      },
    },
    {
      // Stored, not virtual, so the list can sort and filter on it.
      name: "ordersCount",
      type: "number",
      label: "Orders",
      defaultValue: 0,
      index: true,
      admin: { readOnly: true },
    },
    {
      // Cancelled orders are left out, as in the source panel.
      name: "spent",
      type: "number",
      virtual: true,
      label: "Spent",
      admin: { readOnly: true },
      hooks: {
        afterRead: [
          async ({ data, req }) => {
            if (!data?.id) return 0;
            const { docs } = await req.payload.find({
              collection: "orders",
              where: {
                and: [{ customer: { equals: data.id } }, { status: { not_equals: "cancelled" } }],
              },
              limit: 0,
              pagination: false,
              depth: 0,
              overrideAccess: true,
            });
            return docs.reduce((sum, order) => sum + Number(order.total ?? 0), 0);
          },
        ],
      },
    },
    {
      name: "orders",
      type: "join",
      collection: "orders",
      on: "customer",
      defaultSort: "-createdAt",
      admin: { defaultColumns: ["number", "status", "total", "createdAt"], allowCreate: false },
    },
  ],
};

export const Orders: CollectionConfig = {
  slug: "orders",
  admin: {
    useAsTitle: "number",
    defaultColumns: ["number", "customerName", "itemsCount", "total", "paymentMethod", "status", "createdAt"],
    group: "Shop",
    listSearchableFields: ["number", "customerName"],
    components: { beforeListTable: [LIST_FILTERS] },
  },
  disableDuplicate: true,
  endpoints: [ordersExport],
  hooks: {
    afterChange: [countOrdersAfterChange],
    afterDelete: [countOrdersAfterDelete],
  },
  access: {
    read: ({ req }) =>
      req.user?.collection === "users"
        ? true
        : req.user
          ? { customer: { equals: req.user.id } }
          : false,
    // Orders are only ever created by checkout, which uses a privileged
    // Local API call rather than an authenticated request.
    create: () => false,
    update: adminOnly,
    delete: adminOnly,
  },
  defaultSort: "-createdAt",
  fields: [
    { name: "number", type: "text", required: true, unique: true, index: true, admin: { readOnly: true } },
    {
      name: "itemsCount",
      type: "number",
      virtual: true,
      label: "Items",
      admin: { readOnly: true },
      hooks: {
        afterRead: [({ siblingData }) => ((siblingData?.items ?? []) as unknown[]).length],
      },
    },
    { name: "customer", type: "relationship", relationTo: "customers", index: true, admin: { readOnly: true } },
    {
      type: "row",
      fields: [
        {
          name: "status",
          type: "select",
          options: options(ORDER_STATUSES),
          defaultValue: "pending",
          required: true,
          index: true,
          // Changed straight from the list, as the source table's select column allowed.
          admin: { width: "33%", components: { Cell: "/components/admin/OrderStatusCell#default" } },
        },
        {
          name: "paymentMethod",
          type: "select",
          label: "Payment",
          options: options(PAYMENT_METHODS),
          required: true,
          admin: { width: "33%", readOnly: true, components: { Cell: noteCell("paymentStatus", { labels: true }) } },
        },
        {
          name: "paymentStatus",
          type: "select",
          options: options(PAYMENT_STATUSES),
          defaultValue: "pending",
          required: true,
          admin: { width: "33%" },
        },
      ],
    },
    {
      type: "collapsible",
      label: "Delivery",
      fields: [
        {
          name: "customerName",
          type: "text",
          label: "Customer",
          required: true,
          admin: { readOnly: true, components: { Cell: noteCell("phone") } },
        },
        { name: "customerEmail", type: "email", required: true, admin: { readOnly: true } },
        { name: "phone", type: "text", required: true, admin: { readOnly: true } },
        { name: "city", type: "text", required: true, admin: { readOnly: true } },
        { name: "address", type: "textarea", required: true, admin: { readOnly: true } },
        { name: "note", type: "textarea", admin: { readOnly: true } },
      ],
    },
    {
      name: "items",
      type: "array",
      required: true,
      admin: { readOnly: true },
      fields: [
        { name: "product", type: "relationship", relationTo: "products" },
        { name: "name", type: "text", required: true },
        { name: "colorName", type: "text", required: true },
        { name: "size", type: "text", required: true },
        { name: "unitPrice", type: "number", required: true },
        { name: "qty", type: "number", required: true, min: 1 },
        { name: "lineTotal", type: "number", required: true },
        { name: "isPreorder", type: "checkbox", defaultValue: false },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "subtotal", type: "number", required: true, admin: { width: "33%", readOnly: true } },
        { name: "shippingTotal", type: "number", required: true, defaultValue: 0, admin: { width: "33%", readOnly: true } },
        { name: "total", type: "number", required: true, admin: { width: "33%", readOnly: true } },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "currency", type: "text", required: true, admin: { width: "50%", readOnly: true } },
        { name: "locale", type: "text", required: true, admin: { width: "50%", readOnly: true } },
      ],
    },
  ],
};

export const ContactMessages: CollectionConfig = {
  slug: "contact-messages",
  labels: { singular: "Message", plural: "Messages" },
  admin: {
    useAsTitle: "subject",
    defaultColumns: ["name", "subject", "message", "readAt", "createdAt"],
    group: "Contact",
    listSearchableFields: ["name", "message"],
    components: { beforeListTable: [LIST_FILTERS] },
  },
  disableDuplicate: true,
  access: { read: adminOnly, create: () => false, update: adminOnly, delete: adminOnly },
  defaultSort: "-createdAt",
  hooks: {
    // Opening a single message in the panel marks it read, as the Filament
    // view page did. List views (findMany) leave it alone.
    afterRead: [
      async ({ doc, req, findMany, context }) => {
        // context guards against the update below re-entering this hook.
        if (findMany || context.skipRead || doc.readAt || req.user?.collection !== "users") {
          return doc;
        }

        const readAt = new Date().toISOString();
        await req.payload.update({
          collection: "contact-messages",
          id: doc.id,
          data: { readAt },
          overrideAccess: true,
          context: { skipRead: true },
        });

        return { ...doc, readAt };
      },
    ],
  },
  fields: [
    { name: "name", type: "text", required: true, admin: { readOnly: true, components: { Cell: noteCell("email") } } },
    { name: "email", type: "email", required: true, admin: { readOnly: true } },
    { name: "subject", type: "select", options: options(CONTACT_SUBJECTS), required: true, admin: { readOnly: true } },
    { name: "message", type: "textarea", required: true, admin: { readOnly: true } },
    { name: "readAt", type: "date", admin: { readOnly: true } },
  ],
};

export const NewsletterSubscribers: CollectionConfig = {
  slug: "newsletter-subscribers",
  labels: { singular: "Newsletter subscriber", plural: "Newsletter" },
  admin: { useAsTitle: "email", defaultColumns: ["email", "createdAt"], group: "Contact" },
  access: { read: adminOnly, create: () => false, update: adminOnly, delete: adminOnly },
  disableDuplicate: true,
  defaultSort: "-createdAt",
  // Subscriptions come from the storefront; the panel only lists them.
  fields: [
    {
      name: "email",
      type: "email",
      required: true,
      unique: true,
      index: true,
      admin: { readOnly: true },
    },
  ],
};

export const StockNotifications: CollectionConfig = {
  slug: "stock-notifications",
  labels: { singular: "Stock alert", plural: "Stock alerts" },
  admin: {
    useAsTitle: "email",
    defaultColumns: ["product", "email", "createdAt"],
    group: "Contact",
    components: { beforeListTable: [LIST_FILTERS] },
  },
  access: { read: adminOnly, create: () => false, update: adminOnly, delete: adminOnly },
  disableDuplicate: true,
  defaultSort: "-createdAt",
  fields: [
    { name: "product", type: "relationship", relationTo: "products", required: true, admin: { readOnly: true } },
    { name: "email", type: "email", required: true, admin: { readOnly: true } },
    { name: "notifiedAt", type: "date", admin: { description: "Set once the back-in-stock mail goes out." } },
  ],
};
