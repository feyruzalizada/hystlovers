import type { CollectionConfig } from "payload";
import { adminAccess } from "./access";
import { slugify } from "@/lib/slug";
import { revalidateAfterChange, revalidateAfterDelete } from "./revalidate";

export const Categories: CollectionConfig = {
  slug: "categories",
  admin: { useAsTitle: "name", defaultColumns: ["name", "slug", "parent", "isActive"], group: "Catalog" },
  access: adminAccess,
  defaultSort: "sortOrder",
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
    beforeValidate: [
      ({ data }) => {
        if (data) data.slug = slugify(data.slug || data.name || "");
        return data;
      },
    ],
  },
  fields: [
    { name: "name", type: "text", required: true, localized: true },
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "description", type: "textarea", localized: true },
    {
      name: "parent",
      type: "relationship",
      relationTo: "categories",
      admin: { description: "Leave empty for a top-level category." },
    },
    { name: "image", type: "upload", relationTo: "media" },
    { name: "isActive", type: "checkbox", defaultValue: true, index: true },
    { name: "sortOrder", type: "number", defaultValue: 0, index: true },
  ],
};
