import type { CollectionConfig } from "payload";
import { adminAccess } from "./access";
import { slugify } from "@/lib/slug";
import { revalidateAfterChange, revalidateAfterDelete } from "./revalidate";

export const SIZE_SUGGESTIONS = ["XS/S", "M/L", "One Size"];
export const FABRIC_SUGGESTIONS = ["Bamboo", "Cotton", "Lycra", "Modal", "Terry Cloth", "Viscose"];

/**
 * One row per colorway, as in the source shop: products sharing series + item
 * are colorways of the same garment and become the product page's color picker.
 */
export const Products: CollectionConfig = {
  slug: "products",
  admin: {
    useAsTitle: "slug",
    defaultColumns: ["slug", "series", "item", "colorName", "price", "isActive"],
    group: "Shop",
  },
  access: adminAccess,
  defaultSort: "sortOrder",
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
    beforeValidate: [
      ({ data }) => {
        if (data) {
          data.slug = slugify(data.slug || `${data.series ?? ""} ${data.item ?? ""} ${data.colorName ?? ""}`);
        }
        return data;
      },
    ],
  },
  fields: [
    {
      type: "row",
      fields: [
        { name: "series", type: "text", required: true, index: true, admin: { width: "50%" } },
        { name: "item", type: "text", required: true, index: true, admin: { width: "50%" } },
      ],
    },
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "category", type: "relationship", relationTo: "categories", index: true },
    {
      type: "row",
      fields: [
        { name: "colorName", type: "text", required: true, localized: true, admin: { width: "50%" } },
        {
          name: "colorHex",
          type: "text",
          required: true,
          admin: { width: "50%", description: "#rrggbb" },
          validate: (value: unknown) =>
            typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value)
              ? true
              : "Use a #rrggbb colour value.",
        },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "price", type: "number", required: true, min: 0, admin: { width: "50%" } },
        { name: "compareAtPrice", type: "number", min: 0, admin: { width: "50%" } },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "fabric",
          type: "text",
          localized: true,
          admin: { width: "50%", description: FABRIC_SUGGESTIONS.join(", ") },
        },
        { name: "composition", type: "text", localized: true, admin: { width: "50%" } },
      ],
    },
    { name: "description", type: "textarea", localized: true },
    {
      name: "sizes",
      type: "array",
      required: true,
      labels: { singular: "Size", plural: "Sizes" },
      admin: { description: SIZE_SUGGESTIONS.join(", ") },
      fields: [
        { name: "size", type: "text", required: true },
        {
          name: "quantity",
          type: "number",
          min: 0,
          admin: { description: "Leave empty for untracked stock (always available)." },
        },
      ],
    },
    {
      name: "features",
      type: "array",
      localized: true,
      fields: [{ name: "value", type: "text", required: true }],
    },
    {
      name: "setParts",
      type: "array",
      localized: true,
      admin: { description: "Filling this in makes the product a set." },
      fields: [{ name: "value", type: "text", required: true }],
    },
    { name: "images", type: "array", fields: [{ name: "image", type: "upload", relationTo: "media", required: true }] },
    {
      type: "row",
      fields: [
        { name: "inStock", type: "checkbox", defaultValue: true, admin: { width: "33%" } },
        { name: "isNew", type: "checkbox", defaultValue: false, index: true, admin: { width: "33%" } },
        { name: "isActive", type: "checkbox", defaultValue: true, index: true, admin: { width: "33%" } },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "isPreorder", type: "checkbox", defaultValue: false, admin: { width: "50%" } },
        {
          name: "preorderShipsAt",
          type: "date",
          admin: { width: "50%", condition: (data) => Boolean(data?.isPreorder) },
        },
      ],
    },
    { name: "sortOrder", type: "number", defaultValue: 0, index: true },
  ],
};
