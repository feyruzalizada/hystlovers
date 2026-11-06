import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`customers\` ADD \`reset_password_requested_at\` text;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`_objectkey\` text;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`reset_password_requested_at\` text;`)
  await db.run(sql`CREATE INDEX \`products_locales_parent_id_idx\` ON \`products_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_locales_parent_id_idx\` ON \`categories_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`colors_locales_parent_id_idx\` ON \`colors_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`fabrics_locales_parent_id_idx\` ON \`fabrics_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`slides_locales_parent_id_idx\` ON \`slides_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`home_sections_locales_parent_id_idx\` ON \`home_sections_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_locales_parent_id_idx\` ON \`pages_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`posts_locales_parent_id_idx\` ON \`posts_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`settings_locales_parent_id_idx\` ON \`settings_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`brand_locales_parent_id_idx\` ON \`brand_locales\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`contact_details_locales_parent_id_idx\` ON \`contact_details_locales\` (\`_parent_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX \`products_locales_parent_id_idx\`;`)
  await db.run(sql`DROP INDEX \`categories_locales_parent_id_idx\`;`)
  await db.run(sql`DROP INDEX \`colors_locales_parent_id_idx\`;`)
  await db.run(sql`DROP INDEX \`fabrics_locales_parent_id_idx\`;`)
  await db.run(sql`DROP INDEX \`slides_locales_parent_id_idx\`;`)
  await db.run(sql`DROP INDEX \`home_sections_locales_parent_id_idx\`;`)
  await db.run(sql`DROP INDEX \`pages_locales_parent_id_idx\`;`)
  await db.run(sql`DROP INDEX \`posts_locales_parent_id_idx\`;`)
  await db.run(sql`DROP INDEX \`settings_locales_parent_id_idx\`;`)
  await db.run(sql`DROP INDEX \`brand_locales_parent_id_idx\`;`)
  await db.run(sql`DROP INDEX \`contact_details_locales_parent_id_idx\`;`)
  await db.run(sql`ALTER TABLE \`customers\` DROP COLUMN \`reset_password_requested_at\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`_objectkey\`;`)
  await db.run(sql`ALTER TABLE \`users\` DROP COLUMN \`reset_password_requested_at\`;`)
}
