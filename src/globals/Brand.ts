import type { GlobalConfig } from "payload";
import { adminOnly, publicRead } from "@/collections/access";
import { revalidateGlobalAfterChange } from "@/collections/revalidate";

export const Brand: GlobalConfig = {
  slug: "brand",
  label: "Homepage & footer",
  admin: { group: "Content" },
  access: { read: publicRead, update: adminOnly },
  hooks: { afterChange: [revalidateGlobalAfterChange] },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Homepage",
          description: "The text block under the product sections.",
          fields: [
            { name: "homeLabel", label: "Small heading", type: "text", localized: true },
            { name: "homeText", label: "Text", type: "textarea", localized: true },
            {
              type: "row",
              fields: [
                { name: "homeButton", label: "Button text", type: "text", localized: true, admin: { width: "50%" } },
                {
                  name: "homeButtonUrl",
                  label: "Button link",
                  type: "text",
                  defaultValue: "/pages/about-us",
                  admin: { width: "50%", description: "A path like /pages/about-us, or a full https:// address." },
                },
              ],
            },
          ],
        },
        {
          label: "Footer",
          fields: [
            { name: "footerTitle", label: "Heading", type: "text", localized: true },
            { name: "footerText", label: "Text", type: "textarea", localized: true },
            { name: "newsletterTitle", label: "Newsletter heading", type: "text", localized: true },
          ],
        },
      ],
    },
  ],
};
