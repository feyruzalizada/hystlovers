import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_slides\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_order\` text,
  	\`cta_url\` text,
  	\`image_id\` integer,
  	\`image_mobile_id\` integer,
  	\`video_id\` integer,
  	\`is_active\` integer DEFAULT true,
  	\`starts_at\` text,
  	\`ends_at\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_mobile_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`video_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_slides\`("id", "_order", "cta_url", "image_id", "image_mobile_id", "video_id", "is_active", "starts_at", "ends_at", "updated_at", "created_at") SELECT "id", "_order", "cta_url", "image_id", "image_mobile_id", NULL, "is_active", "starts_at", "ends_at", "updated_at", "created_at" FROM \`slides\`;`)
  await db.run(sql`DROP TABLE \`slides\`;`)
  await db.run(sql`ALTER TABLE \`__new_slides\` RENAME TO \`slides\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`slides__order_idx\` ON \`slides\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`slides_image_idx\` ON \`slides\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`slides_image_mobile_idx\` ON \`slides\` (\`image_mobile_id\`);`)
  await db.run(sql`CREATE INDEX \`slides_video_idx\` ON \`slides\` (\`video_id\`);`)
  await db.run(sql`CREATE INDEX \`slides_updated_at_idx\` ON \`slides\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`slides_created_at_idx\` ON \`slides\` (\`created_at\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_slides\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_order\` text,
  	\`cta_url\` text,
  	\`image_id\` integer NOT NULL,
  	\`image_mobile_id\` integer,
  	\`is_active\` integer DEFAULT true,
  	\`starts_at\` text,
  	\`ends_at\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_mobile_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_slides\`("id", "_order", "cta_url", "image_id", "image_mobile_id", "is_active", "starts_at", "ends_at", "updated_at", "created_at") SELECT "id", "_order", "cta_url", "image_id", "image_mobile_id", "is_active", "starts_at", "ends_at", "updated_at", "created_at" FROM \`slides\`;`)
  await db.run(sql`DROP TABLE \`slides\`;`)
  await db.run(sql`ALTER TABLE \`__new_slides\` RENAME TO \`slides\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`slides__order_idx\` ON \`slides\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`slides_image_idx\` ON \`slides\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`slides_image_mobile_idx\` ON \`slides\` (\`image_mobile_id\`);`)
  await db.run(sql`CREATE INDEX \`slides_updated_at_idx\` ON \`slides\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`slides_created_at_idx\` ON \`slides\` (\`created_at\`);`)
}
