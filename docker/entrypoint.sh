#!/bin/sh
set -e

# Migrations and the first content import need the database, so they run here.
npm run db:setup

# Prerendered once per container; panel edits revalidate the pages after that.
if [ ! -f .next/prerendered ]; then
  NODE_OPTIONS="--no-deprecation --max-old-space-size=8000" npx next build --experimental-build-mode=generate
  touch .next/prerendered
fi

exec npm run start
