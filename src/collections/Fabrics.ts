import type { CollectionConfig } from "payload";
import { adminAccess } from "./access";
import { LIST_FILTERS, TOGGLE_CELL } from "./admin-components";
import { missingTranslations } from "./missing-translations";
import { revalidateHooks } from "./revalidate";

/**
 * The fabric checkboxes of the collection filter. A product joins a fabric by
 * the slug of its Azerbaijani fabric name; fabrics of new products are added
 * here on their own (see filter-sync.ts).
 */
export const Fabrics: CollectionConfig = {
  slug: "fabrics",
  // Drag rows to set the order of the fabrics in the filter.
  orderable: true,
  hooks: revalidateHooks,
  labels: { singular: "Fabric", plural: "Fabrics" },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "showInFilter", "missingTranslations"],
    group: "Shop",
    listSearchableFields: ["name", "slug"],
    components: { beforeListTable: [LIST_FILTERS] },
  },
  // Fabrics come from products (filter-sync.ts); switching one off replaces deleting it.
  access: { ...adminAccess, create: () => false, delete: () => false },
  defaultSort: "_order",
  disableDuplicate: true,
  fields: [
    { name: "name", type: "text", required: true, localized: true },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        description: "Taken from the products' Azerbaijani fabric name.",
      },
    },
    {
      name: "showInFilter",
      type: "checkbox",
      label: "Show in filter",
      defaultValue: true,
      index: true,
      admin: { components: { Cell: TOGGLE_CELL } },
    },
    missingTranslations("fabrics", ["name"]),
  ],
};
