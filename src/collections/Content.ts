import type { CollectionConfig } from "payload";
import { adminAccess } from "./access";
import { LIST_FILTERS, TOGGLE_CELL, listCell, noteCell } from "./admin-components";
import { hiddenOnCopy } from "./duplicate";
import { slugField } from "./slug";
import { missingTranslations } from "./missing-translations";
import { slugify } from "@/lib/slug";
import { revalidateAfterChange, revalidateAfterDelete, revalidateHooks } from "./revalidate";

/** Rich text counts as filled once it holds some text. */
const requiredBody = (value: unknown) => {
  const root = (value as { root?: { children?: { children?: unknown[] }[] } } | null)?.root;
  return root?.children?.some((node) => (node.children ?? []).length > 0) ? true : "This field is required.";
};

export const FOOTER_GROUPS = [
  { label: "Company", value: "company" },
  { label: "Help", value: "help" },
];

export const Slides: CollectionConfig = {
  slug: "slides",
  // Rows are dragged into place in the panel, as they were in the source.
  orderable: true,
  hooks: revalidateHooks,
  labels: { singular: "Slide", plural: "Slider" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["image", "title", "ctaLabel", "missingTranslations", "isActive", "startsAt", "updatedAt"],
    group: "Content",
    components: { beforeListTable: [LIST_FILTERS] },
    listSearchableFields: ["title"],
  },
  access: adminAccess,
  defaultSort: "_order",
  fields: [
    {
      type: "collapsible",
      label: "Content",
      admin: { description: "Text shown on top of the slide image." },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "title",
              type: "text",
              required: true,
              localized: true,
              maxLength: 255,
              admin: { width: "50%", placeholder: "KAI", components: { Cell: noteCell("subtitle") } },
            },
            {
              name: "subtitle",
              type: "text",
              localized: true,
              maxLength: 255,
              admin: { width: "50%", placeholder: "In new colors" },
            },
          ],
        },
        {
          type: "row",
          fields: [
            {
              name: "ctaLabel",
              type: "text",
              label: "Button label",
              localized: true,
              maxLength: 255,
              admin: { width: "50%", placeholder: "Order Now", components: { Cell: noteCell("ctaUrl") } },
              validate: (value: unknown, { siblingData }: { siblingData: { ctaUrl?: string | null } }) =>
                value || !siblingData.ctaUrl ? true : "Add a label for the button link.",
            },
            {
              name: "ctaUrl",
              type: "text",
              label: "Button link",
              maxLength: 255,
              admin: {
                width: "50%",
                placeholder: "/collections/kai",
                description: "Relative path (/collections/kai) or full URL.",
              },
              validate: (value: unknown, { siblingData }: { siblingData: { ctaLabel?: string | null } }) => {
                if (!value) return siblingData.ctaLabel ? "Add a link for the button label." : true;
                // Blocks javascript: and other non-http schemes.
                return /^(\/|https?:\/\/)/.test(String(value)) ? true : "The link must start with / or https://.";
              },
            },
          ],
        },
      ],
    },
    {
      type: "collapsible",
      label: "Images",
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          label: "Desktop image",
          required: true,
          admin: { description: "Recommended: 2400×1400 (21:9 on large screens).", components: { Cell: listCell("ImageCell") } },
        },
        {
          name: "imageMobile",
          type: "upload",
          relationTo: "media",
          label: "Mobile image (optional)",
          admin: { description: "Recommended: 1080×1350 (4:5). Falls back to the desktop image." },
        },
      ],
    },
    {
      type: "collapsible",
      label: "Visibility",
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "isActive",
              type: "checkbox",
              label: "Active",
              defaultValue: true,
              admin: { width: "33%", components: { Cell: TOGGLE_CELL } },
              hooks: { beforeDuplicate: [hiddenOnCopy] },
            },
            {
              name: "startsAt",
              type: "date",
              label: "Show from",
              admin: {
                width: "33%",
                date: { pickerAppearance: "dayAndTime" },
                description: "Leave empty to show immediately.",
              },
            },
            {
              name: "endsAt",
              type: "date",
              label: "Show until",
              admin: {
                width: "33%",
                date: { pickerAppearance: "dayAndTime" },
                description: "Leave empty to show indefinitely.",
              },
              validate: (value: unknown, { siblingData }: { siblingData: { startsAt?: string | null } }) =>
                !value || !siblingData.startsAt || new Date(String(value)) > new Date(siblingData.startsAt)
                  ? true
                  : "Show until must be after Show from.",
            },
          ],
        },
      ],
    },
    missingTranslations("slides", ["title", "subtitle", "ctaLabel"]),
  ],
};

export const HomeSections: CollectionConfig = {
  slug: "home-sections",
  // Rows are dragged into place in the panel, as they were in the source.
  orderable: true,
  hooks: revalidateHooks,
  labels: { singular: "Homepage section", plural: "Homepage" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "category", "productLimit", "missingTranslations", "isActive"],
    group: "Content",
    components: { beforeListTable: [LIST_FILTERS] },
  },
  access: adminAccess,
  defaultSort: "_order",
  fields: [
    {
      type: "collapsible",
      label: "Homepage section",
      admin: { description: "A product showcase on the homepage, fed by a category." },
      fields: [
        {
          name: "category",
          type: "relationship",
          relationTo: "categories",
          required: true,
          filterOptions: { isActive: { equals: true } },
        },
        {
          type: "row",
          fields: [
            {
              name: "title",
              type: "text",
              label: "Title override (optional)",
              localized: true,
              maxLength: 255,
              admin: {
                width: "50%",
                placeholder: "Leave empty to use the category name",
                description: 'E.g. show the "Sets" category as "Summer Sets".',
              },
            },
            {
              name: "productLimit",
              type: "number",
              label: "Products shown",
              required: true,
              defaultValue: 8,
              min: 2,
              max: 24,
              admin: { width: "50%" },
            },
          ],
        },
        {
          name: "isActive",
          type: "checkbox",
          label: "Active",
          defaultValue: true,
          admin: { components: { Cell: TOGGLE_CELL } },
          hooks: { beforeDuplicate: [hiddenOnCopy] },
        },
      ],
    },
    missingTranslations("home-sections", ["title"]),
  ],
};

export const Pages: CollectionConfig = {
  slug: "pages",
  // Rows are dragged into place in the panel, as they were in the source.
  orderable: true,
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "footerGroup", "missingTranslations", "isActive", "updatedAt"],
    group: "Content",
    components: { beforeListTable: [LIST_FILTERS] },
    listSearchableFields: ["title", "slug"],
  },
  access: adminAccess,
  defaultSort: "_order",
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
    beforeValidate: [
      ({ data }) => {
        if (data) data.slug = slugify(data.slug || data.title || "");
        return data;
      },
    ],
  },
  fields: [
    {
      type: "collapsible",
      label: "Page",
      admin: { description: "Written in Azerbaijani; switch the language at the top for the others." },
      fields: [
        { name: "title", type: "text", required: true, localized: true, maxLength: 255 },
        slugField("pages", ["title"], { description: "Auto-generated from the title; the page lives at /pages/<slug>." }),
        { name: "body", type: "richText", localized: true, validate: requiredBody },
      ],
    },
    {
      type: "collapsible",
      label: "Placement",
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "footerGroup",
              type: "select",
              label: "Footer column",
              options: FOOTER_GROUPS,
              index: true,
              admin: {
                width: "50%",
                placeholder: "Not linked in the footer",
                description: "The page stays reachable by its URL either way.",
              },
            },
            {
              name: "isActive",
              type: "checkbox",
              label: "Active",
              defaultValue: true,
              admin: { width: "50%", components: { Cell: TOGGLE_CELL } },
              hooks: { beforeDuplicate: [hiddenOnCopy] },
            },
          ],
        },
      ],
    },
    missingTranslations("pages", ["title", "body"]),
  ],
};

export const Posts: CollectionConfig = {
  slug: "posts",
  labels: { singular: "Post", plural: "Blog" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["coverImage", "title", "missingTranslations", "isActive", "publishedAt"],
    group: "Content",
    components: { beforeListTable: [LIST_FILTERS] },
  },
  access: adminAccess,
  defaultSort: "-publishedAt",
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
    beforeValidate: [
      ({ data }) => {
        if (data) data.slug = slugify(data.slug || data.title || "");
        return data;
      },
    ],
  },
  fields: [
    {
      type: "collapsible",
      label: "Post",
      admin: { description: "Written in Azerbaijani; switch the language at the top for the others." },
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
          localized: true,
          maxLength: 255,
          admin: { components: { Cell: noteCell("slug", { notePrefix: "/blog/" }) } },
        },
        slugField("posts", ["title"], { description: "Auto-generated from the title; the post lives at /blog/<slug>." }),
        {
          name: "excerpt",
          type: "textarea",
          localized: true,
          maxLength: 500,
          admin: { description: "Shown on the blog index and used as the Google search description." },
        },
        { name: "body", type: "richText", localized: true, validate: requiredBody },
      ],
    },
    {
      type: "collapsible",
      label: "Images",
      fields: [
        {
          name: "coverImage",
          type: "upload",
          relationTo: "media",
          label: "Cover image",
          admin: {
            description: "Shown on the blog index and when the post is shared. Recommended ratio 4:3.",
            components: { Cell: listCell("ImageCell") },
          },
        },
        {
          name: "images",
          type: "array",
          label: "Extra images",
          maxRows: 12,
          admin: { description: "Optional gallery shown underneath the article." },
          fields: [{ name: "image", type: "upload", relationTo: "media", required: true }],
        },
      ],
    },
    {
      type: "collapsible",
      label: "Publishing",
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "publishedAt",
              type: "date",
              label: "Publish at",
              defaultValue: () => new Date().toISOString(),
              admin: {
                width: "50%",
                date: { pickerAppearance: "dayAndTime" },
                description: "Leave empty to keep it a draft. A future time schedules the post.",
              },
            },
            {
              name: "isActive",
              type: "checkbox",
              label: "Active",
              defaultValue: true,
              admin: { width: "50%", components: { Cell: listCell("BooleanIconCell") } },
              hooks: { beforeDuplicate: [hiddenOnCopy] },
            },
          ],
        },
      ],
    },
    missingTranslations("posts", ["title", "excerpt", "body"]),
  ],
};

/**
 * Every fixed UI string, editable from the panel — the source app's site_texts
 * table. Kept as one row per key with a column per language rather than a
 * localized field, so the panel shows all three side by side.
 */
export const SiteTexts: CollectionConfig = {
  slug: "site-texts",
  hooks: revalidateHooks,
  labels: { singular: "Site text", plural: "Site texts" },
  admin: {
    description: "Every fixed word on the storefront. Product, category and page wording is edited on those records instead.",
    useAsTitle: "key",
    defaultColumns: ["key", "group", "az", "en", "ru"],
    group: "Content",
    components: { beforeListTable: [LIST_FILTERS] },
    listSearchableFields: ["key", "az", "en", "ru"],
  },
  access: { ...adminAccess, create: () => false },
  disableDuplicate: true,
  defaultSort: "key",
  fields: [
    { name: "key", type: "text", required: true, unique: true, index: true },
    { name: "group", type: "text", required: true, index: true },
    {
      name: "az",
      type: "textarea",
      label: "Azərbaycan",
      required: true,
      admin: {
        rows: 2,
        description:
          "Shown when a language below is left empty. Placeholders written :like_this are filled in automatically and must be kept.",
      },
    },
    { name: "en", type: "textarea", label: "English", admin: { rows: 2 } },
    { name: "ru", type: "textarea", label: "Русский", admin: { rows: 2 } },
    { name: "hint", type: "text" },
  ],
};
