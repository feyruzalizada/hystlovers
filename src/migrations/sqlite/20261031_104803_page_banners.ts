import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`page_banners_series\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`image_id\` integer NOT NULL,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`page_banners\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`page_banners_series_order_idx\` ON \`page_banners_series\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`page_banners_series_parent_id_idx\` ON \`page_banners_series\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`page_banners_series_image_idx\` ON \`page_banners_series\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`page_banners\` (
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
  await db.run(sql`CREATE INDEX \`page_banners_all_products_idx\` ON \`page_banners\` (\`all_products_id\`);`)
  await db.run(sql`CREATE INDEX \`page_banners_new_in_idx\` ON \`page_banners\` (\`new_in_id\`);`)
  await db.run(sql`CREATE INDEX \`page_banners_blog_idx\` ON \`page_banners\` (\`blog_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`page_banners_series\`;`)
  await db.run(sql`DROP TABLE \`page_banners\`;`)
}
