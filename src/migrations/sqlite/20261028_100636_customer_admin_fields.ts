import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`customers\` ADD \`panel_access\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`customers\` ADD \`orders_count\` numeric DEFAULT 0;`)
  await db.run(sql`CREATE INDEX \`customers_panel_access_idx\` ON \`customers\` (\`panel_access\`);`)
  await db.run(sql`CREATE INDEX \`customers_orders_count_idx\` ON \`customers\` (\`orders_count\`);`)
  // Existing customers start with their real order count and any admin account they already have.
  await db.run(sql`UPDATE \`customers\` SET \`orders_count\` = (SELECT count(*) FROM \`orders\` WHERE \`orders\`.\`customer_id\` = \`customers\`.\`id\`);`)
  await db.run(sql`UPDATE \`customers\` SET \`panel_access\` = EXISTS (SELECT 1 FROM \`users\` WHERE \`users\`.\`email\` = \`customers\`.\`email\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX \`customers_panel_access_idx\`;`)
  await db.run(sql`DROP INDEX \`customers_orders_count_idx\`;`)
  await db.run(sql`ALTER TABLE \`customers\` DROP COLUMN \`panel_access\`;`)
  await db.run(sql`ALTER TABLE \`customers\` DROP COLUMN \`orders_count\`;`)
}
