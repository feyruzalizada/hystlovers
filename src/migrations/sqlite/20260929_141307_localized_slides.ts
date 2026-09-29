import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`slides_locales\` (
  	\`title\` text NOT NULL,
  	\`subtitle\` text,
  	\`cta_label\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`slides\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`slides_locales_locale_parent_id_unique\` ON \`slides_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`home_sections_locales\` (
  	\`title\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_sections\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`home_sections_locales_locale_parent_id_unique\` ON \`home_sections_locales\` (\`_locale\`,\`_parent_id\`);`)
  // Existing texts become the default language.
  await db.run(sql`INSERT INTO \`slides_locales\` (\`title\`, \`subtitle\`, \`cta_label\`, \`_locale\`, \`_parent_id\`) SELECT \`title\`, \`subtitle\`, \`cta_label\`, 'az', \`id\` FROM \`slides\`;`)
  await db.run(sql`INSERT INTO \`home_sections_locales\` (\`title\`, \`_locale\`, \`_parent_id\`) SELECT \`title\`, 'az', \`id\` FROM \`home_sections\`;`)
  await db.run(sql`ALTER TABLE \`slides\` DROP COLUMN \`title\`;`)
  await db.run(sql`ALTER TABLE \`slides\` DROP COLUMN \`subtitle\`;`)
  await db.run(sql`ALTER TABLE \`slides\` DROP COLUMN \`cta_label\`;`)
  await db.run(sql`ALTER TABLE \`home_sections\` DROP COLUMN \`title\`;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`slides\` ADD \`title\` text NOT NULL DEFAULT '';`)
  await db.run(sql`ALTER TABLE \`slides\` ADD \`subtitle\` text;`)
  await db.run(sql`ALTER TABLE \`slides\` ADD \`cta_label\` text;`)
  await db.run(sql`ALTER TABLE \`home_sections\` ADD \`title\` text;`)
  // The default language goes back into the columns; the others are dropped.
  await db.run(sql`UPDATE \`slides\` SET (\`title\`, \`subtitle\`, \`cta_label\`) = (SELECT \`title\`, \`subtitle\`, \`cta_label\` FROM \`slides_locales\` WHERE \`_parent_id\` = \`slides\`.\`id\` AND \`_locale\` = 'az') WHERE EXISTS (SELECT 1 FROM \`slides_locales\` WHERE \`_parent_id\` = \`slides\`.\`id\` AND \`_locale\` = 'az');`)
  await db.run(sql`UPDATE \`home_sections\` SET \`title\` = (SELECT \`title\` FROM \`home_sections_locales\` WHERE \`_parent_id\` = \`home_sections\`.\`id\` AND \`_locale\` = 'az');`)
  await db.run(sql`DROP TABLE \`slides_locales\`;`)
  await db.run(sql`DROP TABLE \`home_sections_locales\`;`)
}
