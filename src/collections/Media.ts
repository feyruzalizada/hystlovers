import type { CollectionConfig } from "payload";
import { adminOnly, publicRead } from "./access";

export const Media: CollectionConfig = {
  slug: "media",
  admin: { group: "System" },
  access: { read: publicRead, create: adminOnly, update: adminOnly, delete: adminOnly },
  upload: {
    staticDir: "public/media",
    mimeTypes: ["image/*"],
    imageSizes: [
      { name: "card", width: 600, height: 800, position: "centre" },
      { name: "detail", width: 1200 },
      { name: "hero", width: 2000 },
    ],
    formatOptions: { format: "webp", options: { quality: 82 } },
  },
  fields: [{ name: "alt", type: "text" }],
};
