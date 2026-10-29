import type { CollectionConfig } from "payload";
import { adminAccess } from "./access";
import { LIST_FILTERS } from "./admin-components";
import { hiddenOnCopy } from "./duplicate";
import { slugField } from "./slug";
import { missingTranslations } from "./missing-translations";
import { slugify } from "@/lib/slug";
import { revalidateAfterChange, revalidateAfterDelete } from "./revalidate";

export const Categories: CollectionConfig = {
  slug: "categories",
  // Rows are dragged into place in the panel, as they were in the source.
  orderable: true,
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "childrenCount", "missingTranslations", "isActive", "updatedAt"],
    group: "Shop",
    listSearchableFields: ["name", "slug"],
    components: { beforeListTable: [LIST_FILTERS] },
  },
  access: adminAccess,
  defaultSort: "_order",
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
    {
      name: "childrenCount",
      type: "number",
      virtual: true,
      label: "Subcategories",
      admin: { readOnly: true },
      hooks: {
        afterRead: [
          async ({ data, req }) => {
            if (!data?.id) return 0;
            const { totalDocs } = await req.payload.count({
              collection: "categories",
              where: { parent: { equals: data.id } },
              overrideAccess: true,
            });
            return totalDocs;
          },
        ],
      },
    },
    slugField("categories", ["name"], {
      description: "Auto-generated from the name; you can also type your own.",
      // These collections are built in, so a category with the same slug would be unreachable.
      reserved: ["all-products", "new-in"],
    }),
    { name: "description", type: "textarea", localized: true },
    {
      name: "parent",
      type: "relationship",
      relationTo: "categories",
      admin: { description: "Leave empty for a top-level category." },
    },
    { name: "image", type: "upload", relationTo: "media" },
    {
      name: "isActive",
      type: "checkbox",
      defaultValue: true,
      index: true,
      hooks: { beforeDuplicate: [hiddenOnCopy] },
    },
    missingTranslations("categories", ["name", "description"]),
  ],
};
