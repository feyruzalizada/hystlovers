# Hystlovers

TypeScript rewrite of [hystlovers.com](https://hystlovers.com) — storefront and admin in one
Next.js app with an embedded [Payload CMS](https://payloadcms.com).

## Getting started

```bash
cp .env.example .env     # set PAYLOAD_SECRET
npm install
npm run seed             # migrates, then imports the catalogue, pages, posts and UI texts
npm run dev              # migrates, then starts Next
```

- Storefront: <http://localhost:3000/az>
- Admin panel: <http://localhost:3000/admin>

`npm run seed` creates an administrator from `ADMIN_EMAIL` / `ADMIN_PASSWORD` (defaults:
`admin@hystlovers.com` / `hystlovers123`). A production build never uses the default password:
without `ADMIN_PASSWORD` the first administrator signs up on `/admin`.

## What runs where

| Area | Location |
| --- | --- |
| Storefront pages | `src/app/[locale]/` |
| Admin panel + REST/GraphQL | `src/app/(payload)/` |
| CMS schema | `src/collections/`, `src/globals/` |
| Storefront reads | `src/lib/cms.ts` |
| Writes (contact, auth, checkout) | `src/app/actions/` |
| Content import | `src/seed/` |

## Database

SQLite by default (`file:./hystlovers.db`), no server needed. Point `DATABASE_URI` at a
`postgres://` URL and the Postgres adapter is used instead — nothing else changes.

Schema changes go through migrations in `src/migrations/sqlite` and `src/migrations/postgres`.
`npm run dev`, `npm run seed` and `npm run build` apply them first, so nothing ever stops to ask
about the schema. After changing a collection:

```bash
npm run migrate:create <name>   # writes the migration for both adapters
npm run migrate                 # applies it to the database in DATABASE_URI
```

## Deploying to Vercel

1. Add a Postgres database (Neon, Supabase, …) and set `DATABASE_URI`.
2. Set `PAYLOAD_SECRET`, `SERVER_URL` (the site's origin) and, optionally, `ADMIN_PASSWORD`.
3. Create a Blob store in the project's Storage tab — Vercel adds `BLOB_READ_WRITE_TOKEN`, and
   images uploaded in the panel go there, since Vercel's filesystem is read-only.

The build migrates the database and imports the content on first run; later builds add nothing
that already exists. Without `DATABASE_URI` the build serves the read-only demo database in
`src/seed/demo.sqlite`.

## Email

Password resets and order confirmations need SMTP. Leave `SMTP_HOST` empty in development and
Payload prints the messages to the console instead.

## Tests

```bash
npm run test
```

Playwright covers the catalogue, language switching, filters, and the full register → cart →
checkout → order flow.
