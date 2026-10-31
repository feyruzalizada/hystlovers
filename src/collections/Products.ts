import type { CollectionConfig } from "payload";
import { adminAccess } from "./access";
import { LIST_FILTERS, TOGGLE_CELL, noteCell, listCell } from "./admin-components";
import { addProductFilters } from "./filter-sync";
import { hiddenOnCopy } from "./duplicate";
import { slugField } from "./slug";
import { suggest } from "./suggest";
import { HEX } from "./Colors";
import { missingTranslations } from "./missing-translations";
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
  // Rows are dragged into place in the panel, as they were in the source.
  orderable: true,
  admin: {
    useAsTitle: "slug",
    defaultColumns: [
      "thumbnail",
      "product",
      "category",
      "price",
      "stock",
      "inStock",
      "isPreorder",
      "isNew",
      "isActive",
      "missingTranslations",
    ],
    group: "Shop",
    listSearchableFields: ["series", "item", "colorName"],
    components: { beforeListTable: [LIST_FILTERS] },
  },
  access: adminAccess,
  defaultSort: "_order",
  hooks: {
    afterChange: [revalidateAfterChange, addProductFilters],
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
      type: "collapsible",
      label: "Product",
      admin: {
        description:
          "Products sharing the same series + item are colorways of one garment and appear together in the color picker. Written in Azerbaijani; switch the language at the top for the others.",
      },
      fields: [
        {
          type: "row",
          fields: [
            suggest({ name: "series", type: "text", required: true, index: true, maxLength: 255 }, "KAI", { from: "series" }),
            suggest(
              { name: "item", type: "text", required: true, localized: true, index: true, maxLength: 255 },
              "Set / T-Shirt / Dress…",
              { from: "item" },
            ),
            {
              name: "category",
              type: "relationship",
              relationTo: "categories",
              index: true,
              // Kept out of `required` so the column stays nullable; the form still insists.
              validate: (value: unknown) => (value ? true : "Choose a category."),
              filterOptions: { isActive: { equals: true } },
              admin: { width: "33%", allowCreate: false, components: { Cell: listCell("CategoryBadgeCell") } },
            },
          ],
        },
        slugField("products", ["series", "item", "colorName"], {
          description: "Auto-generated from series + item + color; you can also type your own.",
        }),
        { name: "description", type: "textarea", localized: true, maxLength: 2000 },
      ],
    },
    {
      // Mirrors the source panel's "Units" column: a per-size breakdown, or a
      // dash when no size is stock-tracked (those sell without a limit).
      name: "stock",
      type: "text",
      virtual: true,
      label: "Units",
      // A list column only; the form edits the sizes themselves.
      admin: { readOnly: true, condition: () => false, components: { Cell: listCell("StockCell") } },
      hooks: {
        afterRead: [
          ({ siblingData }) => {
            const sizes = (siblingData?.sizes ?? []) as { size?: string; quantity?: number | null }[];
            const tracked = sizes.filter(
              (row) => row.quantity !== null && row.quantity !== undefined,
            );
            if (tracked.length === 0) return "—";
            return tracked.map((row) => `${row.size}: ${row.quantity}`).join(" · ");
          },
        ],
      },
    },
    {
      type: "collapsible",
      label: "Color & sizes",
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "colorName",
              type: "text",
              label: "Color name",
              required: true,
              localized: true,
              maxLength: 255,
              admin: { width: "50%", placeholder: "Mint" },
            },
            {
              name: "colorHex",
              type: "text",
              label: "Color swatch",
              required: true,
              admin: { width: "50%", components: { Field: "/components/admin/ColorField#default" } },
              validate: (value: unknown) =>
                typeof value === "string" && HEX.test(value) ? true : "The color must be a 6-digit hex value like #a8c3b1.",
            },
          ],
        },
        {
          name: "sizes",
          type: "array",
          required: true,
          minRows: 1,
          labels: { singular: "Size", plural: "Sizes" },
          admin: {
            description:
              "A size with an empty quantity is not counted — it stays on sale indefinitely. Tracked sizes count down with each order, and the product sells out on its own when every tracked size reaches zero.",
          },
          fields: [
            {
              type: "row",
              fields: [
                suggest({ name: "size", type: "text", required: true }, "Add a size…", { suggestions: SIZE_SUGGESTIONS }, "50%"),
                {
                  name: "quantity",
                  type: "number",
                  label: "Units in stock",
                  min: 0,
                  admin: { width: "50%", description: "Leave empty for untracked stock (always available)." },
                },
              ],
            },
          ],
        },
        {
          name: "inStock",
          type: "checkbox",
          label: "On sale",
          defaultValue: true,
          admin: { description: "Turn off to pull the product from sale regardless of stock.", components: { Cell: TOGGLE_CELL } },
        },
      ],
    },
    {
      type: "collapsible",
      label: "Pre-order",
      admin: {
        description: "A pre-order product can be bought while it is out of stock; stock is not counted down for it.",
      },
      fields: [
        {
          type: "row",
          fields: [
            { name: "isPreorder", type: "checkbox", label: "Sell as pre-order", defaultValue: false, admin: { width: "50%", components: { Cell: TOGGLE_CELL } } },
            {
              name: "preorderShipsAt",
              type: "date",
              label: "Expected dispatch date",
              admin: {
                width: "50%",
                condition: (data) => Boolean(data?.isPreorder),
                description: "Shown on the product page. Leave empty if the date is not known yet.",
              },
            },
          ],
        },
      ],
    },
    {
      type: "collapsible",
      label: "Pricing",
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "price",
              type: "number",
              label: "Price (AZN)",
              required: true,
              min: 0,
              admin: { width: "50%", components: { Cell: listCell("PriceCell") } },
            },
            {
              name: "compareAtPrice",
              type: "number",
              label: "Compare-at price (AZN)",
              min: 0,
              admin: { width: "50%", description: "Old price shown struck through; leave empty if not on sale." },
              validate: (value: unknown, { siblingData }: { siblingData: { price?: number | null } }) =>
                value === null || value === undefined || siblingData.price == null || Number(value) > Number(siblingData.price)
                  ? true
                  : "The compare-at price must be greater than the price.",
            },
          ],
        },
      ],
    },
    {
      type: "collapsible",
      label: "Details",
      fields: [
        {
          type: "row",
          fields: [
            suggest(
              { name: "fabric", type: "text", localized: true, maxLength: 255, admin: { description: "Used as a storefront filter." } },
              undefined,
              { suggestions: FABRIC_SUGGESTIONS, from: "fabric" },
              "50%",
            ),
            {
              name: "composition",
              type: "text",
              localized: true,
              maxLength: 255,
              admin: { width: "50%", placeholder: "95% viscose, 5% elastane" },
            },
          ],
        },
        {
          name: "features",
          type: "array",
          localized: true,
          admin: {
            description: "Shown as bullet points on the product page. Keep the same number of lines in every language.",
          },
          fields: [{ name: "value", type: "text", required: true, admin: { placeholder: "Add a feature line…" } }],
        },
        {
          name: "setParts",
          type: "array",
          label: "Set includes",
          localized: true,
          admin: { description: 'Fill only for sets — shown as "Set Includes" and appended to the product name.' },
          fields: [{ name: "value", type: "text", required: true, admin: { placeholder: "e.g. Long Sleeve Shirt" } }],
        },
      ],
    },
    {
      type: "collapsible",
      label: "Images",
      fields: [
        {
          name: "images",
          type: "array",
          label: "Product images",
          required: true,
          minRows: 1,
          maxRows: 8,
          admin: { description: "First image is the main one; the second appears on card hover. Recommended ratio 3:4." },
          fields: [{ name: "image", type: "upload", relationTo: "media", required: true }],
        },
      ],
    },
    {
      type: "collapsible",
      label: "Status",
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "isActive",
              type: "checkbox",
              label: "Active",
              defaultValue: true,
              index: true,
              admin: { width: "50%", components: { Cell: TOGGLE_CELL } },
              hooks: { beforeDuplicate: [hiddenOnCopy] },
            },
            {
              name: "isNew",
              type: "checkbox",
              label: "New in",
              defaultValue: false,
              index: true,
              admin: { width: "50%", description: "Shows the product in the New In collection.", components: { Cell: TOGGLE_CELL } },
            },
          ],
        },
      ],
    },
    // List-only columns of the source table.
    { name: "thumbnail", type: "ui", label: " ", admin: { components: { Cell: listCell("ThumbnailCell") } } },
    {
      name: "product",
      type: "ui",
      label: "Product",
      admin: { components: { Cell: noteCell("colorName", { value: "series", append: "item" }) } },
    },
    missingTranslations("products", ["item", "colorName", "fabric", "composition", "description", "features", "setParts"]),
  ],
};
