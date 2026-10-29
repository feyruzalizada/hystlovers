import type { CollectionConfig } from "payload";
import { adminAccess } from "./access";
import { LIST_FILTERS } from "./admin-components";
import { missingTranslations } from "./missing-translations";
import { revalidateHooks } from "./revalidate";

export const HEX = /^#[0-9a-fA-F]{6}$/;

/**
 * The colour swatches of the collection filter. A product joins a swatch by
 * the slug of its Azerbaijani colour name; colours of new products are added
 * here on their own (see color-sync.ts).
 */
export const Colors: CollectionConfig = {
  slug: "colors",
  // Drag rows to set the order of the swatches in the filter.
  orderable: true,
  hooks: revalidateHooks,
  labels: { singular: "Color", plural: "Colors" },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "hex", "slug", "showInFilter", "missingTranslations"],
    group: "Shop",
    listSearchableFields: ["name", "slug"],
    components: { beforeListTable: [LIST_FILTERS] },
  },
  // Swatches come from products (color-sync.ts); switching one off replaces deleting it.
  access: { ...adminAccess, create: () => false, delete: () => false },
  defaultSort: "_order",
  disableDuplicate: true,
  fields: [
    {
      type: "row",
      fields: [
        { name: "name", type: "text", required: true, localized: true, admin: { width: "50%" } },
        {
          name: "hex",
          type: "text",
          required: true,
          label: "Swatch",
          validate: (value: unknown) => (typeof value === "string" && HEX.test(value) ? true : "Use a #rrggbb colour value."),
          admin: {
            width: "50%",
            components: {
              Field: "/components/admin/ColorField#default",
              Cell: "/components/admin/ColorCell#default",
            },
          },
        },
      ],
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        description: "Taken from the products' Azerbaijani colour name; used in links such as ?color=qehveyi.",
      },
    },
    {
      name: "showInFilter",
      type: "checkbox",
      label: "Show in filter",
      defaultValue: true,
      index: true,
    },
    missingTranslations("colors", ["name"]),
  ],
};
