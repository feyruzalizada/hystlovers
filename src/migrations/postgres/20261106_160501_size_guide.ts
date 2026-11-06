import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "settings_size_guide" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"size" varchar NOT NULL,
  	"chest" varchar,
  	"waist" varchar,
  	"hips" varchar
  );
  
  ALTER TABLE "settings_size_guide" ADD CONSTRAINT "settings_size_guide_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "settings_size_guide_order_idx" ON "settings_size_guide" USING btree ("_order");
  CREATE INDEX "settings_size_guide_parent_id_idx" ON "settings_size_guide" USING btree ("_parent_id");`)
  // The measurements the product page showed until now.
  await db.execute(sql`
   INSERT INTO "settings_size_guide" ("_order", "_parent_id", "id", "size", "chest", "waist", "hips")
   SELECT 1, "id", '6a0b5e000000000000000001', 'XS/S', '82-88', '62-68', '88-94' FROM "settings"
   UNION ALL SELECT 2, "id", '6a0b5e000000000000000002', 'M/L', '90-98', '70-78', '96-104' FROM "settings";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "settings_size_guide" CASCADE;`)
}
