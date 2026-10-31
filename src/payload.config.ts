import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { FixedToolbarFeature, lexicalEditor } from "@payloadcms/richtext-lexical";
import { nodemailerAdapter } from "@payloadcms/email-nodemailer";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import sharp from "sharp";

import { Users } from "./collections/Users";
import { Media } from "./collections/Media";
import { Categories } from "./collections/Categories";
import { Colors } from "./collections/Colors";
import { Fabrics } from "./collections/Fabrics";
import { Products } from "./collections/Products";
import { Slides, HomeSections, Pages, Posts, SiteTexts } from "./collections/Content";
import {
  Customers,
  Orders,
  ContactMessages,
  NewsletterSubscribers,
  StockNotifications,
} from "./collections/Commerce";
import { Brand } from "./globals/Brand";
import { ContactDetails } from "./globals/ContactDetails";
import { PageBanners } from "./globals/PageBanners";
import { Settings } from "./globals/Settings";
import { navBadges } from "./endpoints/nav-badges";
import { withGlobalPanelLayout, withPanelLayout } from "./collections/panel-layout";

const dirname = path.dirname(fileURLToPath(import.meta.url));
// Without DATABASE_URI the app opens the read-only demo database that ships
// with the repository, so a deployment needs no database server.
// DATABASE_URL is what Vercel's Neon integration sets.
const databaseUri =
  process.env.DATABASE_URI || process.env.DATABASE_URL || "file:./src/seed/demo.sqlite";

/**
 * Postgres in production, SQLite locally — the same split the PHP app used, so
 * a developer needs no database server to run the shop. Schema changes go
 * through migrations (`npm run migrate`), never through Payload's dev push,
 * which stops to ask about every renamed column.
 */
const db = databaseUri.startsWith("postgres")
  ? postgresAdapter({
      pool: { connectionString: databaseUri },
      push: false,
      migrationDir: path.resolve(dirname, "migrations/postgres"),
    })
  : sqliteAdapter({
      client: { url: databaseUri },
      push: false,
      migrationDir: path.resolve(dirname, "migrations/sqlite"),
    });

/** SMTP when it is configured, otherwise Payload logs the message to the console. */
const email = process.env.SMTP_HOST
  ? nodemailerAdapter({
      defaultFromAddress: process.env.SMTP_FROM_ADDRESS ?? "no-reply@hystlovers.com",
      defaultFromName: process.env.SMTP_FROM_NAME ?? "Hystlovers",
      transportOptions: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_PORT === "465",
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
          : undefined,
      },
    })
  : undefined;

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: " — Hystlovers" },
    // The source panel's date-time format, e.g. "Sep 24, 2026 11:35".
    dateFormat: "MMM d, yyyy HH:mm",
    avatar: { Component: "/components/admin/Avatar#default" },
    components: {
      graphics: { Logo: "/components/admin/Logo#default", Icon: "/components/admin/HomeIcon#default" },
      beforeLogin: ["/components/admin/SignInHeading#default"],
      beforeNavLinks: ["/components/admin/NavBrand#default"],
      afterNavLinks: ["/components/admin/NavBadges#default"],
      views: { dashboard: { Component: "/components/admin/Dashboard#default" } },
    },
  },
  // Order matters: the panel groups by `admin.group` and keeps this order
  // inside each group, which is how the source panel was arranged.
  collections: [
    Orders,
    Customers,
    Products,
    Categories,
    Colors,
    Fabrics,
    Slides,
    HomeSections,
    Pages,
    Posts,
    SiteTexts,
    ContactMessages,
    NewsletterSubscribers,
    StockNotifications,
    Media,
    Users,
  ].map(withPanelLayout),
  globals: [Settings, Brand, PageBanners, ContactDetails].map(withGlobalPanelLayout),
  endpoints: [navBadges],
  // The source panel's wording for empty selects.
  i18n: { translations: { en: { general: { selectValue: "Select an option" } } } },
  localization: {
    locales: [
      { label: "Azərbaycan", code: "az" },
      { label: "English", code: "en" },
      { label: "Русский", code: "ru" },
    ],
    defaultLocale: "az",
    fallback: true,
  },
  // A toolbar always in view, as the source panel's rich editor had.
  editor: lexicalEditor({ features: ({ defaultFeatures }) => [...defaultFeatures, FixedToolbarFeature()] }),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  db,
  email,
  sharp,
  // serverURL only fills in absolute links (password resets); leaving CORS and
  // CSRF at their defaults keeps cookie auth working on every origin the app
  // is actually served from.
  serverURL: process.env.SERVER_URL,
  plugins: [
    // Vercel's filesystem is read-only, so panel uploads go to Blob there.
    // Without the token files stay in public/media.
    vercelBlobStorage({
      token: process.env.BLOB_READ_WRITE_TOKEN,
      collections: { media: { disablePayloadAccessControl: true } },
      clientUploads: true,
      // Keeps the schema, and so the migrations, the same with or without Blob.
      alwaysInsertFields: true,
    }),
  ],
});
