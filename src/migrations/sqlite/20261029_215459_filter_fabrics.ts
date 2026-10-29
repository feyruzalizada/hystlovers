import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`fabrics\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_order\` text,
  	\`slug\` text NOT NULL,
  	\`show_in_filter\` integer DEFAULT true,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`fabrics__order_idx\` ON \`fabrics\` (\`_order\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`fabrics_slug_idx\` ON \`fabrics\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`fabrics_show_in_filter_idx\` ON \`fabrics\` (\`show_in_filter\`);`)
  await db.run(sql`CREATE INDEX \`fabrics_updated_at_idx\` ON \`fabrics\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`fabrics_created_at_idx\` ON \`fabrics\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`fabrics_locales\` (
  	\`name\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`fabrics\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`fabrics_locales_locale_parent_id_unique\` ON \`fabrics_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`fabrics_id\` integer REFERENCES fabrics(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_fabrics_id_idx\` ON \`payload_locked_documents_rels\` (\`fabrics_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`fabrics\`;`)
  await db.run(sql`DROP TABLE \`fabrics_locales\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`orders_id\` integer,
  	\`customers_id\` integer,
  	\`products_id\` integer,
  	\`categories_id\` integer,
  	\`colors_id\` integer,
  	\`slides_id\` integer,
  	\`home_sections_id\` integer,
  	\`pages_id\` integer,
  	\`posts_id\` integer,
  	\`site_texts_id\` integer,
  	\`contact_messages_id\` integer,
  	\`newsletter_subscribers_id\` integer,
  	\`stock_notifications_id\` integer,
  	\`media_id\` integer,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`orders_id\`) REFERENCES \`orders\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`customers_id\`) REFERENCES \`customers\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`products_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`categories_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`colors_id\`) REFERENCES \`colors\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`slides_id\`) REFERENCES \`slides\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`home_sections_id\`) REFERENCES \`home_sections\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`posts_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`site_texts_id\`) REFERENCES \`site_texts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`contact_messages_id\`) REFERENCES \`contact_messages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`newsletter_subscribers_id\`) REFERENCES \`newsletter_subscribers\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`stock_notifications_id\`) REFERENCES \`stock_notifications\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "orders_id", "customers_id", "products_id", "categories_id", "colors_id", "slides_id", "home_sections_id", "pages_id", "posts_id", "site_texts_id", "contact_messages_id", "newsletter_subscribers_id", "stock_notifications_id", "media_id", "users_id") SELECT "id", "order", "parent_id", "path", "orders_id", "customers_id", "products_id", "categories_id", "colors_id", "slides_id", "home_sections_id", "pages_id", "posts_id", "site_texts_id", "contact_messages_id", "newsletter_subscribers_id", "stock_notifications_id", "media_id", "users_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_orders_id_idx\` ON \`payload_locked_documents_rels\` (\`orders_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_customers_id_idx\` ON \`payload_locked_documents_rels\` (\`customers_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_products_id_idx\` ON \`payload_locked_documents_rels\` (\`products_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_categories_id_idx\` ON \`payload_locked_documents_rels\` (\`categories_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_colors_id_idx\` ON \`payload_locked_documents_rels\` (\`colors_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_slides_id_idx\` ON \`payload_locked_documents_rels\` (\`slides_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_home_sections_id_idx\` ON \`payload_locked_documents_rels\` (\`home_sections_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`pages_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_posts_id_idx\` ON \`payload_locked_documents_rels\` (\`posts_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_site_texts_id_idx\` ON \`payload_locked_documents_rels\` (\`site_texts_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_contact_messages_id_idx\` ON \`payload_locked_documents_rels\` (\`contact_messages_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_newsletter_subscribers_id_idx\` ON \`payload_locked_documents_rels\` (\`newsletter_subscribers_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_stock_notifications_id_idx\` ON \`payload_locked_documents_rels\` (\`stock_notifications_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
}
