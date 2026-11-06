import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`settings_size_guide\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`size\` text NOT NULL,
  	\`chest\` text,
  	\`waist\` text,
  	\`hips\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`settings\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`settings_size_guide_order_idx\` ON \`settings_size_guide\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`settings_size_guide_parent_id_idx\` ON \`settings_size_guide\` (\`_parent_id\`);`)
  // The measurements the product page showed until now.
  await db.run(sql`INSERT INTO \`settings_size_guide\` (\`_order\`, \`_parent_id\`, \`id\`, \`size\`, \`chest\`, \`waist\`, \`hips\`)
    SELECT 1, \`id\`, '6a0b5e000000000000000001', 'XS/S', '82-88', '62-68', '88-94' FROM \`settings\`
    UNION ALL SELECT 2, \`id\`, '6a0b5e000000000000000002', 'M/L', '90-98', '70-78', '96-104' FROM \`settings\`;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`settings_size_guide\`;`)
}
