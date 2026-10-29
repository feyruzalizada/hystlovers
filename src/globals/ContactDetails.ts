import type { GlobalConfig } from "payload";
import { adminOnly, publicRead } from "@/collections/access";
import { revalidateGlobalAfterChange } from "@/collections/revalidate";

export const ContactDetails: GlobalConfig = {
  slug: "contact-details",
  label: "Contact Details",
  admin: { group: "Contact" },
  access: { read: publicRead, update: adminOnly },
  hooks: { afterChange: [revalidateGlobalAfterChange] },
  fields: [
    {
      type: "collapsible",
      label: "Contact information",
      admin: { description: "Shown on the storefront contact page." },
      fields: [
        {
          type: "row",
          fields: [
            { name: "contactEmail", type: "email", label: "Email", admin: { width: "50%", placeholder: "support@hystlovers.com" } },
            { name: "contactPhone", type: "text", label: "Phone", admin: { width: "50%", placeholder: "+90 500 000 00 00" } },
          ],
        },
        {
          type: "row",
          fields: [
            { name: "contactWhatsapp", type: "text", label: "WhatsApp", admin: { width: "50%", placeholder: "+90 500 000 00 00" } },
            {
              name: "workingHours",
              type: "text",
              label: "Working hours",
              localized: true,
              admin: { width: "50%", placeholder: "Weekdays 9 AM — 6 PM" },
            },
          ],
        },
        { name: "contactAddress", type: "textarea", label: "Address", localized: true },
      ],
    },
    {
      type: "collapsible",
      label: "Social accounts",
      admin: { description: "Handles or full profile URLs." },
      fields: [
        {
          type: "row",
          fields: [
            { name: "instagram", type: "text", label: "Instagram", admin: { width: "50%", placeholder: "@hystlovers" } },
            { name: "facebook", type: "text", label: "Facebook", admin: { width: "50%", placeholder: "hystlovers" } },
          ],
        },
        {
          type: "row",
          fields: [
            { name: "tiktok", type: "text", label: "TikTok", admin: { width: "50%", placeholder: "@hystlovers" } },
            { name: "x", type: "text", label: "X (Twitter)", admin: { width: "50%", placeholder: "@hystlovers" } },
          ],
        },
      ],
    },
  ],
};
