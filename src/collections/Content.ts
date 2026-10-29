import type { CollectionConfig } from "payload";
import { adminAccess } from "./access";
import { LIST_FILTERS } from "./admin-components";
import { hiddenOnCopy } from "./duplicate";
import { slugField } from "./slug";
import { missingTranslations } from "./missing-translations";
import { slugify } from "@/lib/slug";
import { revalidateAfterChange, revalidateAfterDelete, revalidateHooks } from "./revalidate";

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
    { name: "title", type: "text", required: true, localized: true },
    { name: "subtitle", type: "text", localized: true },
    {
      type: "row",
      fields: [
        { name: "ctaLabel", type: "text", localized: true, admin: { width: "50%" } },
        { name: "ctaUrl", type: "text", admin: { width: "50%", description: "e.g. /collections/kai" } },
      ],
    },
    { name: "image", type: "upload", relationTo: "media", required: true },
    { name: "imageMobile", type: "upload", relationTo: "media" },
    {
      type: "row",
      fields: [
        { name: "startsAt", type: "date", admin: { width: "50%" } },
        { name: "endsAt", type: "date", admin: { width: "50%" } },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "isActive",
          type: "checkbox",
          defaultValue: true,
          admin: { width: "50%" },
          hooks: { beforeDuplicate: [hiddenOnCopy] },
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
    { name: "category", type: "relationship", relationTo: "categories", required: true },
    { name: "title", type: "text", localized: true, admin: { description: "Leave empty to use the category name." } },
    { name: "productLimit", type: "number", defaultValue: 8, min: 1, max: 24 },
    {
      type: "row",
      fields: [
        {
          name: "isActive",
          type: "checkbox",
          defaultValue: true,
          admin: { width: "50%" },
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
    { name: "title", type: "text", required: true, localized: true },
    slugField("pages", ["title"], { description: "Auto-generated from the title." }),
    { name: "body", type: "richText", localized: true },
    { name: "footerGroup", type: "select", options: FOOTER_GROUPS, index: true },
    {
      type: "row",
      fields: [
        {
          name: "isActive",
          type: "checkbox",
          defaultValue: true,
          admin: { width: "50%" },
          hooks: { beforeDuplicate: [hiddenOnCopy] },
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
    { name: "title", type: "text", required: true, localized: true },
    slugField("posts", ["title"], { description: "Auto-generated from the title." }),
    { name: "excerpt", type: "textarea", localized: true },
    { name: "body", type: "richText", localized: true },
    { name: "coverImage", type: "upload", relationTo: "media" },
    {
      name: "images",
      type: "array",
      admin: { description: "Shown as a gallery under the article." },
      fields: [{ name: "image", type: "upload", relationTo: "media", required: true }],
    },
    {
      type: "row",
      fields: [
        {
          name: "isActive",
          type: "checkbox",
          defaultValue: true,
          admin: { width: "50%" },
          hooks: { beforeDuplicate: [hiddenOnCopy] },
        },
        { name: "publishedAt", type: "date", admin: { width: "50%" } },
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
    { name: "az", type: "textarea", required: true },
    { name: "en", type: "textarea" },
    { name: "ru", type: "textarea" },
    { name: "hint", type: "text" },
  ],
};
