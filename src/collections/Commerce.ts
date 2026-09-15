import type { CollectionConfig } from "payload";
import { adminOnly } from "./access";

export const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;
export const PAYMENT_METHODS = ["cod", "bank_transfer"] as const;
export const PAYMENT_STATUSES = ["pending", "paid"] as const;
export const CONTACT_SUBJECTS = ["order", "return", "product", "other"] as const;

const options = (values: readonly string[]) =>
  values.map((value) => ({ label: value.replaceAll("_", " "), value }));

/** Storefront shoppers. Separate from `users`, which is admin-panel only. */
export const Customers: CollectionConfig = {
  slug: "customers",
  auth: {
    tokenExpiration: 60 * 60 * 24 * 30,
    maxLoginAttempts: 5,
    lockTime: 60 * 1000,
  },
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "name", "createdAt"],
    group: "Shop",
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
  fields: [{ name: "name", type: "text", required: true }],
};

export const Orders: CollectionConfig = {
  slug: "orders",
  admin: {
    useAsTitle: "number",
    defaultColumns: ["number", "customerName", "total", "status", "createdAt"],
    group: "Shop",
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
    { name: "number", type: "text", required: true, unique: true, index: true },
    { name: "customer", type: "relationship", relationTo: "customers", index: true },
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
          admin: { width: "33%" },
        },
        {
          name: "paymentMethod",
          type: "select",
          options: options(PAYMENT_METHODS),
          required: true,
          admin: { width: "33%" },
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
        { name: "customerName", type: "text", required: true },
        { name: "customerEmail", type: "email", required: true },
        { name: "phone", type: "text", required: true },
        { name: "city", type: "text", required: true },
        { name: "address", type: "textarea", required: true },
        { name: "note", type: "textarea" },
      ],
    },
    {
      name: "items",
      type: "array",
      required: true,
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
        { name: "subtotal", type: "number", required: true, admin: { width: "33%" } },
        { name: "shippingTotal", type: "number", required: true, defaultValue: 0, admin: { width: "33%" } },
        { name: "total", type: "number", required: true, admin: { width: "33%" } },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "currency", type: "text", required: true, admin: { width: "50%" } },
        { name: "locale", type: "text", required: true, admin: { width: "50%" } },
      ],
    },
  ],
};

export const ContactMessages: CollectionConfig = {
  slug: "contact-messages",
  labels: { singular: "Contact message", plural: "Contact messages" },
  admin: {
    useAsTitle: "subject",
    defaultColumns: ["name", "email", "subject", "readAt", "createdAt"],
    group: "Contact",
  },
  access: { read: adminOnly, create: () => false, update: adminOnly, delete: adminOnly },
  defaultSort: "-createdAt",
  fields: [
    { name: "name", type: "text", required: true },
    { name: "email", type: "email", required: true },
    { name: "subject", type: "select", options: options(CONTACT_SUBJECTS), required: true },
    { name: "message", type: "textarea", required: true },
    { name: "readAt", type: "date" },
  ],
};

export const NewsletterSubscribers: CollectionConfig = {
  slug: "newsletter-subscribers",
  labels: { singular: "Newsletter subscriber", plural: "Newsletter" },
  admin: { useAsTitle: "email", group: "Contact" },
  access: { read: adminOnly, create: () => false, update: adminOnly, delete: adminOnly },
  defaultSort: "-createdAt",
  fields: [{ name: "email", type: "email", required: true, unique: true, index: true }],
};

export const StockNotifications: CollectionConfig = {
  slug: "stock-notifications",
  labels: { singular: "Stock alert", plural: "Stock alerts" },
  admin: { useAsTitle: "email", defaultColumns: ["email", "product", "createdAt"], group: "Contact" },
  access: { read: adminOnly, create: () => false, update: adminOnly, delete: adminOnly },
  defaultSort: "-createdAt",
  fields: [
    { name: "product", type: "relationship", relationTo: "products", required: true },
    { name: "email", type: "email", required: true },
  ],
};
