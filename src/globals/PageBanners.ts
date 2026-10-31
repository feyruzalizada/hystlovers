import type { GlobalConfig } from "payload";
import { adminOnly, publicRead } from "@/collections/access";
import { POSTER_HINT, posterFields } from "@/collections/poster";
import { revalidateGlobalAfterChange } from "@/collections/revalidate";
import { suggest } from "@/collections/suggest";

/**
 * Posters for the title band of the pages that are not a category: the two
 * catalogue-wide collections, the series pages and the blog. A category sets
 * its own poster on the category itself.
 */
export const PageBanners: GlobalConfig = {
  slug: "page-banners",
  label: "Page banners",
  admin: { group: "Content", description: POSTER_HINT },
  access: { read: publicRead, update: adminOnly },
  hooks: { afterChange: [revalidateGlobalAfterChange] },
  fields: [
    {
      type: "collapsible",
      label: "All products",
      admin: { description: "Category pages take their poster from Shop → Categories." },
      fields: posterFields("allProducts"),
    },
    { type: "collapsible", label: "New in", fields: posterFields("newIn") },
    {
      type: "collapsible",
      label: "Series",
      admin: { description: "Pages such as /collections/kai, one row per series." },
      fields: [
        {
          name: "series",
          type: "array",
          label: "Series posters",
          labels: { singular: "Series poster", plural: "Series posters" },
          fields: [
            suggest({ name: "name", type: "text", label: "Series", required: true }, "KAI", { from: "series" }, "50%"),
            ...posterFields("image", { required: true }),
          ],
        },
      ],
    },
    { type: "collapsible", label: "Blog", fields: posterFields("blog") },
  ],
};
