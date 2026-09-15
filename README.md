# Hystlovers

TypeScript rewrite of [hystlovers.com](https://hystlovers.com) — storefront and admin in one
Next.js app with an embedded [Payload CMS](https://payloadcms.com).

## Getting started

```bash
cp .env.example .env     # set PAYLOAD_SECRET
npm install
npm run seed             # imports the catalogue, pages, posts and UI texts
npm run dev
```

- Storefront: <http://localhost:3000/az>
- Admin panel: <http://localhost:3000/admin>

The seed creates an administrator from `ADMIN_EMAIL` / `ADMIN_PASSWORD` (defaults:
`admin@hystlovers.com` / `hystlovers123` — change both before deploying).

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

## Email

Password resets and order confirmations need SMTP. Leave `SMTP_HOST` empty in development and
Payload prints the messages to the console instead.

## Tests

```bash
npm run test
```

Playwright covers the catalogue, language switching, filters, and the full register → cart →
checkout → order flow.
