import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
import { refreshCategoryPaths } from '../../collections/category-paths'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "contact_details" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"contact_email" varchar,
  	"contact_phone" varchar,
  	"contact_whatsapp" varchar,
  	"instagram" varchar,
  	"facebook" varchar,
  	"tiktok" varchar,
  	"x" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "contact_details_locales" (
  	"working_hours" varchar,
  	"contact_address" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  INSERT INTO "contact_details"("id", "contact_email", "contact_phone", "contact_whatsapp", "instagram", "facebook", "tiktok", "x", "updated_at", "created_at") SELECT "id", "contact_email", "contact_phone", "contact_whatsapp", "instagram", "facebook", "tiktok", "x", "updated_at", "created_at" FROM "settings";
  INSERT INTO "contact_details_locales"("working_hours", "contact_address", "_locale", "_parent_id") SELECT "working_hours", "contact_address", "_locale", "_parent_id" FROM "settings_locales";
  SELECT setval(pg_get_serial_sequence('contact_details', 'id'), COALESCE((SELECT max("id") FROM "contact_details"), 0) + 1, false);
  UPDATE "home_sections" SET "product_limit" = 8 WHERE "product_limit" IS NULL;
  UPDATE "settings" SET "free_shipping_threshold" = 100 WHERE "free_shipping_threshold" IS NULL;
  UPDATE "settings" SET "shipping_fee" = 5 WHERE "shipping_fee" IS NULL;
  ALTER TABLE "home_sections" ALTER COLUMN "product_limit" SET NOT NULL;
  ALTER TABLE "settings" ALTER COLUMN "free_shipping_threshold" SET NOT NULL;
  ALTER TABLE "settings" ALTER COLUMN "shipping_fee" SET NOT NULL;
  ALTER TABLE "categories" ADD COLUMN "path_name" varchar;
  ALTER TABLE "contact_details_locales" ADD CONSTRAINT "contact_details_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."contact_details"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "contact_details_locales_locale_parent_id_unique" ON "contact_details_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "categories_path_name_idx" ON "categories" USING btree ("path_name");
  ALTER TABLE "settings" DROP COLUMN "contact_email";
  ALTER TABLE "settings" DROP COLUMN "contact_phone";
  ALTER TABLE "settings" DROP COLUMN "contact_whatsapp";
  ALTER TABLE "settings" DROP COLUMN "instagram";
  ALTER TABLE "settings" DROP COLUMN "facebook";
  ALTER TABLE "settings" DROP COLUMN "tiktok";
  ALTER TABLE "settings" DROP COLUMN "x";
  ALTER TABLE "settings_locales" DROP COLUMN "contact_address";
  ALTER TABLE "settings_locales" DROP COLUMN "working_hours";`)
  await refreshCategoryPaths(payload, req)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "contact_details" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "contact_details_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "contact_details" CASCADE;
  DROP TABLE "contact_details_locales" CASCADE;
  DROP INDEX "categories_path_name_idx";
  ALTER TABLE "home_sections" ALTER COLUMN "product_limit" DROP NOT NULL;
  ALTER TABLE "settings" ALTER COLUMN "free_shipping_threshold" DROP NOT NULL;
  ALTER TABLE "settings" ALTER COLUMN "shipping_fee" DROP NOT NULL;
  ALTER TABLE "settings" ADD COLUMN "contact_email" varchar;
  ALTER TABLE "settings" ADD COLUMN "contact_phone" varchar;
  ALTER TABLE "settings" ADD COLUMN "contact_whatsapp" varchar;
  ALTER TABLE "settings" ADD COLUMN "instagram" varchar;
  ALTER TABLE "settings" ADD COLUMN "facebook" varchar;
  ALTER TABLE "settings" ADD COLUMN "tiktok" varchar;
  ALTER TABLE "settings" ADD COLUMN "x" varchar;
  ALTER TABLE "settings_locales" ADD COLUMN "contact_address" varchar;
  ALTER TABLE "settings_locales" ADD COLUMN "working_hours" varchar;
  ALTER TABLE "categories" DROP COLUMN "path_name";`)
}
