import type { CollectionConfig } from "payload";
import { markCustomerAfterUserChange, markCustomerAfterUserDelete } from "./customer-sync";

/** Admin panel accounts. Storefront shoppers live in `customers`. */
export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: { useAsTitle: "email", group: "System" },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    afterChange: [markCustomerAfterUserChange],
    afterDelete: [markCustomerAfterUserDelete],
  },
  fields: [{ name: "name", type: "text", required: true }],
};
