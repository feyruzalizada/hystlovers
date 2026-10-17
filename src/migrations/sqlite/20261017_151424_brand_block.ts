import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`brand\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`home_button_url\` text DEFAULT '/pages/about-us',
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`CREATE TABLE \`brand_locales\` (
  	\`home_label\` text,
  	\`home_text\` text,
  	\`home_button\` text,
  	\`footer_title\` text,
  	\`footer_text\` text,
  	\`newsletter_title\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`brand\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`brand_locales_locale_parent_id_unique\` ON \`brand_locales\` (\`_locale\`,\`_parent_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`brand\`;`)
  await db.run(sql`DROP TABLE \`brand_locales\`;`)
}
