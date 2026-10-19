import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`DROP INDEX \`products_item_idx\`;`)
  await db.run(sql`ALTER TABLE \`products_locales\` ADD \`item\` text NOT NULL DEFAULT '';`)
  // Every language starts from the old value; the seed then translates it.
  await db.run(sql`INSERT INTO \`products_locales\` (\`_locale\`, \`_parent_id\`, \`color_name\`) SELECT 'az', \`id\`, '' FROM \`products\` WHERE NOT EXISTS (SELECT 1 FROM \`products_locales\` WHERE \`_parent_id\` = \`products\`.\`id\` AND \`_locale\` = 'az');`)
  await db.run(sql`UPDATE \`products_locales\` SET \`item\` = (SELECT \`item\` FROM \`products\` WHERE \`products\`.\`id\` = \`products_locales\`.\`_parent_id\`);`)
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`item\`;`)
  await db.run(sql`CREATE INDEX \`products_item_idx\` ON \`products_locales\` (\`item\`,\`_locale\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX \`products_item_idx\`;`)
  await db.run(sql`ALTER TABLE \`products\` ADD \`item\` text NOT NULL DEFAULT '';`)
  await db.run(sql`UPDATE \`products\` SET \`item\` = COALESCE((SELECT \`item\` FROM \`products_locales\` WHERE \`_parent_id\` = \`products\`.\`id\` AND \`_locale\` = 'en'), '');`)
  await db.run(sql`ALTER TABLE \`products_locales\` DROP COLUMN \`item\`;`)
  await db.run(sql`CREATE INDEX \`products_item_idx\` ON \`products\` (\`item\`);`)
}
