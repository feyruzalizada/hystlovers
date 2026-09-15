import type { GlobalConfig } from "payload";
import { adminOnly, publicRead } from "@/collections/access";

export const Settings: GlobalConfig = {
  slug: "settings",
  admin: { group: "System" },
  access: { read: publicRead, update: adminOnly },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Shop",
          fields: [
            { name: "shopName", type: "text", defaultValue: "Hystlovers" },
            {
              type: "row",
              fields: [
                { name: "currencyCode", type: "text", defaultValue: "AZN", admin: { width: "50%" } },
                { name: "currencySymbol", type: "text", defaultValue: "₼", admin: { width: "50%" } },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "freeShippingThreshold",
                  type: "number",
                  defaultValue: 100,
                  admin: { width: "50%" },
                },
                { name: "shippingFee", type: "number", defaultValue: 5, admin: { width: "50%" } },
              ],
            },
            { name: "bankTransferDetails", type: "textarea" },
          ],
        },
        {
          label: "Contact",
          fields: [
            { name: "contactEmail", type: "email" },
            { name: "contactPhone", type: "text" },
            { name: "contactWhatsapp", type: "text" },
            { name: "contactAddress", type: "textarea" },
            { name: "workingHours", type: "text", localized: true },
          ],
        },
        {
          label: "Social",
          fields: [
            { name: "instagram", type: "text" },
            { name: "facebook", type: "text" },
            { name: "tiktok", type: "text" },
            { name: "x", type: "text" },
          ],
        },
      ],
    },
  ],
};
