import type { GlobalConfig } from "payload";
import { adminOnly, publicRead } from "@/collections/access";
import { revalidateGlobalAfterChange } from "@/collections/revalidate";
import { suggest } from "@/collections/suggest";

const HINT = "Shown behind the page title. Landscape, at least 1920×600; without it the plain grey band stays.";

const banner = (name: string, label: string) =>
  ({ name, label, type: "upload", relationTo: "media", admin: { description: HINT } }) as const;

/**
 * Posters for the title band of the pages that are not a category: the two
 * catalogue-wide collections, the series pages and the blog. A category sets
 * its own poster on the category itself.
 */
export const PageBanners: GlobalConfig = {
  slug: "page-banners",
  label: "Page banners",
  admin: { group: "Content" },
  access: { read: publicRead, update: adminOnly },
  hooks: { afterChange: [revalidateGlobalAfterChange] },
  fields: [
    {
      type: "collapsible",
      label: "Collections",
      admin: { description: "Category pages take their poster from Shop → Categories." },
      fields: [banner("allProducts", "All products"), banner("newIn", "New in")],
    },
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
            {
              type: "row",
              fields: [
                suggest({ name: "name", type: "text", label: "Series", required: true }, "KAI", { from: "series" }, "30%"),
                { ...banner("image", "Poster"), required: true, admin: { ...banner("image", "Poster").admin, width: "70%" } },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "collapsible",
      label: "Blog",
      fields: [banner("blog", "Blog")],
    },
  ],
};
