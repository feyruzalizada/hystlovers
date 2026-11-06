import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`brand\` ADD \`background_audio_id\` integer REFERENCES media(id);`)
  await db.run(sql`CREATE INDEX \`brand_background_audio_idx\` ON \`brand\` (\`background_audio_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_brand\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`home_button_url\` text DEFAULT '/pages/about-us',
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`INSERT INTO \`__new_brand\`("id", "home_button_url", "updated_at", "created_at") SELECT "id", "home_button_url", "updated_at", "created_at" FROM \`brand\`;`)
  await db.run(sql`DROP TABLE \`brand\`;`)
  await db.run(sql`ALTER TABLE \`__new_brand\` RENAME TO \`brand\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}
