import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`settings_locales\` ADD \`bank_transfer_details\` text;`)
  await db.run(sql`ALTER TABLE \`settings_locales\` ADD \`contact_address\` text;`)
  // Existing values become the default language.
  await db.run(sql`INSERT INTO \`settings_locales\` (\`_locale\`, \`_parent_id\`) SELECT 'az', \`id\` FROM \`settings\` WHERE NOT EXISTS (SELECT 1 FROM \`settings_locales\` WHERE \`_parent_id\` = \`settings\`.\`id\` AND \`_locale\` = 'az');`)
  await db.run(sql`UPDATE \`settings_locales\` SET (\`bank_transfer_details\`, \`contact_address\`) = (SELECT \`bank_transfer_details\`, \`contact_address\` FROM \`settings\` WHERE \`settings\`.\`id\` = \`settings_locales\`.\`_parent_id\`) WHERE \`_locale\` = 'az';`)
  await db.run(sql`ALTER TABLE \`settings\` DROP COLUMN \`bank_transfer_details\`;`)
  await db.run(sql`ALTER TABLE \`settings\` DROP COLUMN \`contact_address\`;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`settings\` ADD \`bank_transfer_details\` text;`)
  await db.run(sql`ALTER TABLE \`settings\` ADD \`contact_address\` text;`)
  await db.run(sql`UPDATE \`settings\` SET (\`bank_transfer_details\`, \`contact_address\`) = (SELECT \`bank_transfer_details\`, \`contact_address\` FROM \`settings_locales\` WHERE \`_parent_id\` = \`settings\`.\`id\` AND \`_locale\` = 'az');`)
  await db.run(sql`ALTER TABLE \`settings_locales\` DROP COLUMN \`bank_transfer_details\`;`)
  await db.run(sql`ALTER TABLE \`settings_locales\` DROP COLUMN \`contact_address\`;`)
}
