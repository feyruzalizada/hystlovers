import type { GlobalConfig } from "payload";
import { adminOnly, publicRead } from "@/collections/access";
import { revalidateGlobalAfterChange } from "@/collections/revalidate";

export const Settings: GlobalConfig = {
  slug: "settings",
  label: "Store settings",
  admin: { group: "Shop" },
  access: { read: publicRead, update: adminOnly },
  hooks: { afterChange: [revalidateGlobalAfterChange] },
  fields: [
    {
      type: "collapsible",
      label: "Shipping",
      admin: { description: "Applied to every new order at checkout." },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "freeShippingThreshold",
              type: "number",
              label: "Free shipping from (AZN)",
              required: true,
              min: 0,
              defaultValue: 100,
              admin: { width: "50%", description: "Orders at or above this amount ship free." },
            },
            {
              name: "shippingFee",
              type: "number",
              label: "Shipping fee (AZN)",
              required: true,
              min: 0,
              defaultValue: 5,
              admin: { width: "50%", description: "Charged on orders below the threshold." },
            },
          ],
        },
      ],
    },
    {
      type: "collapsible",
      label: "Bank transfer",
      admin: {
        description:
          "Shown on the order confirmation page and in the confirmation e-mail when the customer pays by transfer.",
      },
      fields: [
        {
          name: "bankTransferDetails",
          type: "textarea",
          label: "Bank details",
          localized: true,
          admin: {
            rows: 5,
            placeholder: "Beneficiary: …\nIBAN: …\nBank: …",
            description: "Line breaks are preserved. Leave empty to hide the section entirely.",
          },
        },
      ],
    },
    {
      type: "collapsible",
      label: "Shop",
      admin: {
        initCollapsed: true,
        description:
          'The announcement bar is edited under Content → Header, homepage & footer, so it can be worded per language.',
      },
      fields: [
        { name: "shopName", type: "text", defaultValue: "Hystlovers" },
        {
          type: "row",
          fields: [
            { name: "currencyCode", type: "text", defaultValue: "AZN", admin: { width: "50%" } },
            { name: "currencySymbol", type: "text", defaultValue: "₼", admin: { width: "50%" } },
          ],
        },
      ],
    },
  ],
};
