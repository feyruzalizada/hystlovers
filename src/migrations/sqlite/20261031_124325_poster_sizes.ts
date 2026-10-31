import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`categories\` ADD \`image_wide_id\` integer REFERENCES media(id);`)
  await db.run(sql`ALTER TABLE \`categories\` ADD \`image_tablet_id\` integer REFERENCES media(id);`)
  await db.run(sql`ALTER TABLE \`categories\` ADD \`image_mobile_id\` integer REFERENCES media(id);`)
  await db.run(sql`CREATE INDEX \`categories_image_wide_idx\` ON \`categories\` (\`image_wide_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_image_tablet_idx\` ON \`categories\` (\`image_tablet_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_image_mobile_idx\` ON \`categories\` (\`image_mobile_id\`);`)
  await db.run(sql`ALTER TABLE \`page_banners_series\` ADD \`image_wide_id\` integer REFERENCES media(id);`)
  await db.run(sql`ALTER TABLE \`page_banners_series\` ADD \`image_tablet_id\` integer REFERENCES media(id);`)
  await db.run(sql`ALTER TABLE \`page_banners_series\` ADD \`image_mobile_id\` integer REFERENCES media(id);`)
  await db.run(sql`CREATE INDEX \`page_banners_series_image_wide_idx\` ON \`page_banners_series\` (\`image_wide_id\`);`)
  await db.run(sql`CREATE INDEX \`page_banners_series_image_tablet_idx\` ON \`page_banners_series\` (\`image_tablet_id\`);`)
  await db.run(sql`CREATE INDEX \`page_banners_series_image_mobile_idx\` ON \`page_banners_series\` (\`image_mobile_id\`);`)
  await db.run(sql`ALTER TABLE \`page_banners\` ADD \`all_products_wide_id\` integer REFERENCES media(id);`)
  await db.run(sql`ALTER TABLE \`page_banners\` ADD \`all_products_tablet_id\` integer REFERENCES media(id);`)
  await db.run(sql`ALTER TABLE \`page_banners\` ADD \`all_products_mobile_id\` integer REFERENCES media(id);`)
  await db.run(sql`ALTER TABLE \`page_banners\` ADD \`new_in_wide_id\` integer REFERENCES media(id);`)
  await db.run(sql`ALTER TABLE \`page_banners\` ADD \`new_in_tablet_id\` integer REFERENCES media(id);`)
  await db.run(sql`ALTER TABLE \`page_banners\` ADD \`new_in_mobile_id\` integer REFERENCES media(id);`)
  await db.run(sql`ALTER TABLE \`page_banners\` ADD \`blog_wide_id\` integer REFERENCES media(id);`)
  await db.run(sql`ALTER TABLE \`page_banners\` ADD \`blog_tablet_id\` integer REFERENCES media(id);`)
  await db.run(sql`ALTER TABLE \`page_banners\` ADD \`blog_mobile_id\` integer REFERENCES media(id);`)
  await db.run(sql`CREATE INDEX \`page_banners_all_products_wide_idx\` ON \`page_banners\` (\`all_products_wide_id\`);`)
  await db.run(sql`CREATE INDEX \`page_banners_all_products_tablet_idx\` ON \`page_banners\` (\`all_products_tablet_id\`);`)
  await db.run(sql`CREATE INDEX \`page_banners_all_products_mobile_idx\` ON \`page_banners\` (\`all_products_mobile_id\`);`)
  await db.run(sql`CREATE INDEX \`page_banners_new_in_wide_idx\` ON \`page_banners\` (\`new_in_wide_id\`);`)
  await db.run(sql`CREATE INDEX \`page_banners_new_in_tablet_idx\` ON \`page_banners\` (\`new_in_tablet_id\`);`)
  await db.run(sql`CREATE INDEX \`page_banners_new_in_mobile_idx\` ON \`page_banners\` (\`new_in_mobile_id\`);`)
  await db.run(sql`CREATE INDEX \`page_banners_blog_wide_idx\` ON \`page_banners\` (\`blog_wide_id\`);`)
  await db.run(sql`CREATE INDEX \`page_banners_blog_tablet_idx\` ON \`page_banners\` (\`blog_tablet_id\`);`)
  await db.run(sql`CREATE INDEX \`page_banners_blog_mobile_idx\` ON \`page_banners\` (\`blog_mobile_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_categories\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_order\` text,
  	\`slug\` text NOT NULL,
  	\`parent_id\` integer,
  	\`path_name\` text,
  	\`image_id\` integer,
  	\`is_active\` integer DEFAULT true,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_categories\`("id", "_order", "slug", "parent_id", "path_name", "image_id", "is_active", "updated_at", "created_at") SELECT "id", "_order", "slug", "parent_id", "path_name", "image_id", "is_active", "updated_at", "created_at" FROM \`categories\`;`)
  await db.run(sql`DROP TABLE \`categories\`;`)
  await db.run(sql`ALTER TABLE \`__new_categories\` RENAME TO \`categories\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`categories__order_idx\` ON \`categories\` (\`_order\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`categories_slug_idx\` ON \`categories\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`categories_parent_idx\` ON \`categories\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_path_name_idx\` ON \`categories\` (\`path_name\`);`)
  await db.run(sql`CREATE INDEX \`categories_image_idx\` ON \`categories\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_is_active_idx\` ON \`categories\` (\`is_active\`);`)
  await db.run(sql`CREATE INDEX \`categories_updated_at_idx\` ON \`categories\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`categories_created_at_idx\` ON \`categories\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`__new_page_banners_series\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`image_id\` integer NOT NULL,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`page_banners\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_page_banners_series\`("_order", "_parent_id", "id", "name", "image_id") SELECT "_order", "_parent_id", "id", "name", "image_id" FROM \`page_banners_series\`;`)
  await db.run(sql`DROP TABLE \`page_banners_series\`;`)
  await db.run(sql`ALTER TABLE \`__new_page_banners_series\` RENAME TO \`page_banners_series\`;`)
  await db.run(sql`CREATE INDEX \`page_banners_series_order_idx\` ON \`page_banners_series\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`page_banners_series_parent_id_idx\` ON \`page_banners_series\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`page_banners_series_image_idx\` ON \`page_banners_series\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_page_banners\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`all_products_id\` integer,
  	\`new_in_id\` integer,
  	\`blog_id\` integer,
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`all_products_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`new_in_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`blog_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_page_banners\`("id", "all_products_id", "new_in_id", "blog_id", "updated_at", "created_at") SELECT "id", "all_products_id", "new_in_id", "blog_id", "updated_at", "created_at" FROM \`page_banners\`;`)
  await db.run(sql`DROP TABLE \`page_banners\`;`)
  await db.run(sql`ALTER TABLE \`__new_page_banners\` RENAME TO \`page_banners\`;`)
  await db.run(sql`CREATE INDEX \`page_banners_all_products_idx\` ON \`page_banners\` (\`all_products_id\`);`)
  await db.run(sql`CREATE INDEX \`page_banners_new_in_idx\` ON \`page_banners\` (\`new_in_id\`);`)
  await db.run(sql`CREATE INDEX \`page_banners_blog_idx\` ON \`page_banners\` (\`blog_id\`);`)
}
