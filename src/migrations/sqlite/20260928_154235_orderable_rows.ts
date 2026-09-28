import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'
import { generateNKeysBetween } from 'payload/shared'

// Carries the old sort_order numbers over as fractional keys, keeping the row order.
async function copyOrder(db: MigrateUpArgs['db'], table: string) {
  const rows = await db.all<{ id: number }>(
    sql.raw(`SELECT id FROM \`${table}\` ORDER BY sort_order, id`),
  )
  const keys = generateNKeysBetween(null, null, rows.length)
  for (const [i, row] of rows.entries()) {
    await db.run(sql`UPDATE ${sql.identifier(table)} SET _order = ${keys[i]} WHERE id = ${row.id}`)
  }
}

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`DROP INDEX \`products_sort_order_idx\`;`)
  await db.run(sql`ALTER TABLE \`products\` ADD \`_order\` text;`)
  await db.run(sql`CREATE INDEX \`products__order_idx\` ON \`products\` (\`_order\`);`)
  await copyOrder(db, 'products')
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`sort_order\`;`)
  await db.run(sql`DROP INDEX \`categories_sort_order_idx\`;`)
  await db.run(sql`ALTER TABLE \`categories\` ADD \`_order\` text;`)
  await db.run(sql`CREATE INDEX \`categories__order_idx\` ON \`categories\` (\`_order\`);`)
  await copyOrder(db, 'categories')
  await db.run(sql`ALTER TABLE \`categories\` DROP COLUMN \`sort_order\`;`)
  await db.run(sql`ALTER TABLE \`slides\` ADD \`_order\` text;`)
  await db.run(sql`CREATE INDEX \`slides__order_idx\` ON \`slides\` (\`_order\`);`)
  await copyOrder(db, 'slides')
  await db.run(sql`ALTER TABLE \`slides\` DROP COLUMN \`sort_order\`;`)
  await db.run(sql`ALTER TABLE \`home_sections\` ADD \`_order\` text;`)
  await db.run(sql`CREATE INDEX \`home_sections__order_idx\` ON \`home_sections\` (\`_order\`);`)
  await copyOrder(db, 'home_sections')
  await db.run(sql`ALTER TABLE \`home_sections\` DROP COLUMN \`sort_order\`;`)
  await db.run(sql`ALTER TABLE \`pages\` ADD \`_order\` text;`)
  await db.run(sql`CREATE INDEX \`pages__order_idx\` ON \`pages\` (\`_order\`);`)
  await copyOrder(db, 'pages')
  await db.run(sql`ALTER TABLE \`pages\` DROP COLUMN \`sort_order\`;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX \`products__order_idx\`;`)
  await db.run(sql`ALTER TABLE \`products\` ADD \`sort_order\` numeric DEFAULT 0;`)
  await db.run(sql`CREATE INDEX \`products_sort_order_idx\` ON \`products\` (\`sort_order\`);`)
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`_order\`;`)
  await db.run(sql`DROP INDEX \`categories__order_idx\`;`)
  await db.run(sql`ALTER TABLE \`categories\` ADD \`sort_order\` numeric DEFAULT 0;`)
  await db.run(sql`CREATE INDEX \`categories_sort_order_idx\` ON \`categories\` (\`sort_order\`);`)
  await db.run(sql`ALTER TABLE \`categories\` DROP COLUMN \`_order\`;`)
  await db.run(sql`DROP INDEX \`slides__order_idx\`;`)
  await db.run(sql`ALTER TABLE \`slides\` ADD \`sort_order\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`slides\` DROP COLUMN \`_order\`;`)
  await db.run(sql`DROP INDEX \`home_sections__order_idx\`;`)
  await db.run(sql`ALTER TABLE \`home_sections\` ADD \`sort_order\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`home_sections\` DROP COLUMN \`_order\`;`)
  await db.run(sql`DROP INDEX \`pages__order_idx\`;`)
  await db.run(sql`ALTER TABLE \`pages\` ADD \`sort_order\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`pages\` DROP COLUMN \`_order\`;`)
}
