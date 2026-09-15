import type { CollectionConfig } from "payload";
import { adminAccess } from "./access";
import { slugify } from "@/lib/slug";

export const FOOTER_GROUPS = [
  { label: "Company", value: "company" },
  { label: "Help", value: "help" },
];

export const Slides: CollectionConfig = {
  slug: "slides",
  admin: { useAsTitle: "title", defaultColumns: ["title", "isActive", "sortOrder"], group: "Content" },
  access: adminAccess,
  defaultSort: "sortOrder",
  fields: [
    { name: "title", type: "text", required: true },
    { name: "subtitle", type: "text" },
    {
      type: "row",
      fields: [
        { name: "ctaLabel", type: "text", admin: { width: "50%" } },
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
        { name: "isActive", type: "checkbox", defaultValue: true, admin: { width: "50%" } },
        { name: "sortOrder", type: "number", defaultValue: 0, admin: { width: "50%" } },
      ],
    },
  ],
};

export const HomeSections: CollectionConfig = {
  slug: "home-sections",
  labels: { singular: "Home section", plural: "Home sections" },
  admin: { useAsTitle: "title", group: "Content" },
  access: adminAccess,
  defaultSort: "sortOrder",
  fields: [
    { name: "category", type: "relationship", relationTo: "categories", required: true },
    { name: "title", type: "text", admin: { description: "Leave empty to use the category name." } },
    { name: "productLimit", type: "number", defaultValue: 8, min: 1, max: 24 },
    {
      type: "row",
      fields: [
        { name: "isActive", type: "checkbox", defaultValue: true, admin: { width: "50%" } },
        { name: "sortOrder", type: "number", defaultValue: 0, admin: { width: "50%" } },
      ],
    },
  ],
};

export const Pages: CollectionConfig = {
  slug: "pages",
  admin: { useAsTitle: "title", defaultColumns: ["title", "slug", "footerGroup"], group: "Content" },
  access: adminAccess,
  defaultSort: "sortOrder",
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data) data.slug = slugify(data.slug || data.title || "");
        return data;
      },
    ],
  },
  fields: [
    { name: "title", type: "text", required: true, localized: true },
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "body", type: "richText", localized: true },
    { name: "footerGroup", type: "select", options: FOOTER_GROUPS, index: true },
    {
      type: "row",
      fields: [
        { name: "isActive", type: "checkbox", defaultValue: true, admin: { width: "50%" } },
        { name: "sortOrder", type: "number", defaultValue: 0, admin: { width: "50%" } },
      ],
    },
  ],
};

export const Posts: CollectionConfig = {
  slug: "posts",
  admin: { useAsTitle: "title", defaultColumns: ["title", "slug", "publishedAt"], group: "Content" },
  access: adminAccess,
  defaultSort: "-publishedAt",
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data) data.slug = slugify(data.slug || data.title || "");
        return data;
      },
    ],
  },
  fields: [
    { name: "title", type: "text", required: true, localized: true },
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "excerpt", type: "textarea", localized: true },
    { name: "body", type: "richText", localized: true },
    { name: "coverImage", type: "upload", relationTo: "media" },
    {
      type: "row",
      fields: [
        { name: "isActive", type: "checkbox", defaultValue: true, admin: { width: "50%" } },
        { name: "publishedAt", type: "date", admin: { width: "50%" } },
      ],
    },
  ],
};

/**
 * Every fixed UI string, editable from the panel — the source app's site_texts
 * table. Kept as one row per key with a column per language rather than a
 * localized field, so the panel shows all three side by side.
 */
export const SiteTexts: CollectionConfig = {
  slug: "site-texts",
  labels: { singular: "Site text", plural: "Site texts" },
  admin: { useAsTitle: "key", defaultColumns: ["key", "group", "az", "en", "ru"], group: "Content" },
  access: adminAccess,
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
