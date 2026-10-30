import type { CollectionConfig, PayloadRequest } from "payload";
import { adminAccess } from "./access";
import { LIST_FILTERS, TOGGLE_CELL } from "./admin-components";
import { descendantIdsWithSelf, refreshCategoryPaths } from "./category-paths";
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
    // Selects elsewhere list categories by their full path, as the source panel did.
    useAsTitle: "pathName",
    defaultColumns: ["name", "slug", "childrenCount", "missingTranslations", "isActive", "updatedAt"],
    group: "Shop",
    listSearchableFields: ["name", "slug"],
    components: { beforeListTable: [LIST_FILTERS] },
  },
  access: adminAccess,
  defaultSort: "_order",
  hooks: {
    afterChange: [
      revalidateAfterChange,
      async ({ doc, req }) => {
        await refreshCategoryPaths(req.payload, req);
        return doc;
      },
    ],
    afterDelete: [revalidateAfterDelete],
    beforeValidate: [
      ({ data }) => {
        if (data) data.slug = slugify(data.slug || data.name || "");
        return data;
      },
    ],
  },
  fields: [
    {
      type: "collapsible",
      label: "Category",
      admin: { description: "Written in Azerbaijani; switch the language at the top for the others." },
      fields: [
        { name: "name", type: "text", required: true, localized: true, maxLength: 255 },
        slugField("categories", ["name"], {
          description: "Auto-generated from the name; you can also type your own.",
          // These collections are built in, so a category with the same slug would be unreachable.
          reserved: ["all-products", "new-in"],
        }),
        {
          name: "parent",
          type: "relationship",
          relationTo: "categories",
          label: "Parent category",
          admin: { description: "Leave empty for a top-level category." },
          // A category can't be its own parent or a child of its descendants.
          filterOptions: async ({ id, req }) =>
            id ? { id: { not_in: await descendantIdsWithSelf(req.payload, id, req) } } : true,
          validate: async (value: unknown, { id, req }: { id?: number | string; req: PayloadRequest }) =>
            !value || !id || !(await descendantIdsWithSelf(req.payload, id, req)).includes(value as number)
              ? true
              : "A category can't sit under itself or one of its subcategories.",
        },
        {
          name: "description",
          type: "textarea",
          localized: true,
          maxLength: 1000,
          admin: { description: "Shown under the category title on the storefront." },
        },
      ],
    },
    { name: "pathName", type: "text", label: "Path", index: true, admin: { hidden: true } },
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
    {
      type: "collapsible",
      label: "Display",
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          label: "Poster (optional)",
          admin: {
            description:
              "Shown behind the title at the top of the category page. Landscape, at least 1920×600; without it the plain grey band stays.",
          },
        },
        {
          name: "isActive",
          type: "checkbox",
          label: "Active",
          defaultValue: true,
          index: true,
          admin: { components: { Cell: TOGGLE_CELL } },
          hooks: { beforeDuplicate: [hiddenOnCopy] },
        },
      ],
    },
    missingTranslations("categories", ["name", "description"]),
  ],
};
