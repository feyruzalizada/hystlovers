import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`orders\` ADD \`bank_order_id\` numeric;`)
  await db.run(sql`ALTER TABLE \`orders\` ADD \`bank_status\` text;`)
  await db.run(sql`CREATE INDEX \`orders_bank_order_id_idx\` ON \`orders\` (\`bank_order_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX \`orders_bank_order_id_idx\`;`)
  await db.run(sql`ALTER TABLE \`orders\` DROP COLUMN \`bank_order_id\`;`)
  await db.run(sql`ALTER TABLE \`orders\` DROP COLUMN \`bank_status\`;`)
}
