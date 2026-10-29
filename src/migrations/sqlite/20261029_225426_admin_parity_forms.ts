import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'
import { refreshCategoryPaths } from '../../collections/category-paths'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`contact_details\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`contact_email\` text,
  	\`contact_phone\` text,
  	\`contact_whatsapp\` text,
  	\`instagram\` text,
  	\`facebook\` text,
  	\`tiktok\` text,
  	\`x\` text,
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`CREATE TABLE \`contact_details_locales\` (
  	\`working_hours\` text,
  	\`contact_address\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`contact_details\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`contact_details_locales_locale_parent_id_unique\` ON \`contact_details_locales\` (\`_locale\`,\`_parent_id\`);`)
  // Contact and social fields move from the store settings to their own page, as in the source panel.
  await db.run(sql`INSERT INTO \`contact_details\`("id", "contact_email", "contact_phone", "contact_whatsapp", "instagram", "facebook", "tiktok", "x", "updated_at", "created_at") SELECT "id", "contact_email", "contact_phone", "contact_whatsapp", "instagram", "facebook", "tiktok", "x", "updated_at", "created_at" FROM \`settings\`;`)
  await db.run(sql`INSERT INTO \`contact_details_locales\`("working_hours", "contact_address", "_locale", "_parent_id") SELECT "working_hours", "contact_address", "_locale", "_parent_id" FROM \`settings_locales\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_home_sections\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_order\` text,
  	\`category_id\` integer NOT NULL,
  	\`product_limit\` numeric DEFAULT 8 NOT NULL,
  	\`is_active\` integer DEFAULT true,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_home_sections\`("id", "_order", "category_id", "product_limit", "is_active", "updated_at", "created_at") SELECT "id", "_order", "category_id", COALESCE("product_limit", 8), "is_active", "updated_at", "created_at" FROM \`home_sections\`;`)
  await db.run(sql`DROP TABLE \`home_sections\`;`)
  await db.run(sql`ALTER TABLE \`__new_home_sections\` RENAME TO \`home_sections\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`home_sections__order_idx\` ON \`home_sections\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`home_sections_category_idx\` ON \`home_sections\` (\`category_id\`);`)
  await db.run(sql`CREATE INDEX \`home_sections_updated_at_idx\` ON \`home_sections\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`home_sections_created_at_idx\` ON \`home_sections\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`__new_settings\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`free_shipping_threshold\` numeric DEFAULT 100 NOT NULL,
  	\`shipping_fee\` numeric DEFAULT 5 NOT NULL,
  	\`shop_name\` text DEFAULT 'Hystlovers',
  	\`currency_code\` text DEFAULT 'AZN',
  	\`currency_symbol\` text DEFAULT '₼',
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`INSERT INTO \`__new_settings\`("id", "free_shipping_threshold", "shipping_fee", "shop_name", "currency_code", "currency_symbol", "updated_at", "created_at") SELECT "id", COALESCE("free_shipping_threshold", 100), COALESCE("shipping_fee", 5), "shop_name", "currency_code", "currency_symbol", "updated_at", "created_at" FROM \`settings\`;`)
  await db.run(sql`DROP TABLE \`settings\`;`)
  await db.run(sql`ALTER TABLE \`__new_settings\` RENAME TO \`settings\`;`)
  await db.run(sql`ALTER TABLE \`categories\` ADD \`path_name\` text;`)
  await db.run(sql`CREATE INDEX \`categories_path_name_idx\` ON \`categories\` (\`path_name\`);`)
  await db.run(sql`ALTER TABLE \`settings_locales\` DROP COLUMN \`contact_address\`;`)
  await db.run(sql`ALTER TABLE \`settings_locales\` DROP COLUMN \`working_hours\`;`)
  await refreshCategoryPaths(payload, req)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`contact_details\`;`)
  await db.run(sql`DROP TABLE \`contact_details_locales\`;`)
  await db.run(sql`DROP INDEX \`categories_path_name_idx\`;`)
  await db.run(sql`ALTER TABLE \`categories\` DROP COLUMN \`path_name\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_home_sections\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_order\` text,
  	\`category_id\` integer NOT NULL,
  	\`product_limit\` numeric DEFAULT 8,
  	\`is_active\` integer DEFAULT true,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_home_sections\`("id", "_order", "category_id", "product_limit", "is_active", "updated_at", "created_at") SELECT "id", "_order", "category_id", "product_limit", "is_active", "updated_at", "created_at" FROM \`home_sections\`;`)
  await db.run(sql`DROP TABLE \`home_sections\`;`)
  await db.run(sql`ALTER TABLE \`__new_home_sections\` RENAME TO \`home_sections\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`home_sections__order_idx\` ON \`home_sections\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`home_sections_category_idx\` ON \`home_sections\` (\`category_id\`);`)
  await db.run(sql`CREATE INDEX \`home_sections_updated_at_idx\` ON \`home_sections\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`home_sections_created_at_idx\` ON \`home_sections\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`__new_settings\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`shop_name\` text DEFAULT 'Hystlovers',
  	\`currency_code\` text DEFAULT 'AZN',
  	\`currency_symbol\` text DEFAULT '₼',
  	\`free_shipping_threshold\` numeric DEFAULT 100,
  	\`shipping_fee\` numeric DEFAULT 5,
  	\`contact_email\` text,
  	\`contact_phone\` text,
  	\`contact_whatsapp\` text,
  	\`instagram\` text,
  	\`facebook\` text,
  	\`tiktok\` text,
  	\`x\` text,
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`INSERT INTO \`__new_settings\`("id", "shop_name", "currency_code", "currency_symbol", "free_shipping_threshold", "shipping_fee", "contact_email", "contact_phone", "contact_whatsapp", "instagram", "facebook", "tiktok", "x", "updated_at", "created_at") SELECT "id", "shop_name", "currency_code", "currency_symbol", "free_shipping_threshold", "shipping_fee", "contact_email", "contact_phone", "contact_whatsapp", "instagram", "facebook", "tiktok", "x", "updated_at", "created_at" FROM \`settings\`;`)
  await db.run(sql`DROP TABLE \`settings\`;`)
  await db.run(sql`ALTER TABLE \`__new_settings\` RENAME TO \`settings\`;`)
  await db.run(sql`ALTER TABLE \`settings_locales\` ADD \`contact_address\` text;`)
  await db.run(sql`ALTER TABLE \`settings_locales\` ADD \`working_hours\` text;`)
}
