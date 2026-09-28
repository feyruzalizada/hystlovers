import { spawnSync } from "child_process";

/**
 * `npm run migrate:create <name>` writes the migration for both adapters, so
 * SQLite and Postgres never drift apart. Neither needs a running database.
 */
const name = process.argv[2];
if (!name) {
  console.error("usage: npm run migrate:create <name>");
  process.exit(1);
}

for (const uri of ["file:./hystlovers.db", "postgres://localhost/generate-only"]) {
  const result = spawnSync("npm", ["run", "payload", "--", "migrate:create", name], {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, DATABASE_URI: uri },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
