import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import sharp from "sharp";

import { Users } from "./collections/Users";
import { Media } from "./collections/Media";
import { Categories } from "./collections/Categories";
import { Products } from "./collections/Products";
import { Slides, HomeSections, Pages, Posts, SiteTexts } from "./collections/Content";
import {
  Customers,
  Orders,
  ContactMessages,
  NewsletterSubscribers,
  StockNotifications,
} from "./collections/Commerce";
import { Settings } from "./globals/Settings";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const databaseUri = process.env.DATABASE_URI ?? "file:./hystlovers.db";

/**
 * Postgres in production, SQLite locally — the same split the PHP app used, so
 * a developer needs no database server to run the shop.
 */
const db = databaseUri.startsWith("postgres")
  ? postgresAdapter({ pool: { connectionString: databaseUri } })
  : sqliteAdapter({ client: { url: databaseUri } });

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: " — Hystlovers" },
  },
  collections: [
    Categories,
    Products,
    Slides,
    HomeSections,
    Pages,
    Posts,
    SiteTexts,
    Customers,
    Orders,
    ContactMessages,
    NewsletterSubscribers,
    StockNotifications,
    Media,
    Users,
  ],
  globals: [Settings],
  localization: {
    locales: [
      { label: "Azərbaycan", code: "az" },
      { label: "English", code: "en" },
      { label: "Русский", code: "ru" },
    ],
    defaultLocale: "az",
    fallback: true,
  },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  db,
  sharp,
});
