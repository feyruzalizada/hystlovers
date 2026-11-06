import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "customers" ADD COLUMN "reset_password_requested_at" timestamp(3) with time zone;
  ALTER TABLE "media" ADD COLUMN "_objectkey" varchar;
  ALTER TABLE "users" ADD COLUMN "reset_password_requested_at" timestamp(3) with time zone;
  CREATE INDEX "products_locales_parent_id_idx" ON "products_locales" USING btree ("_parent_id");
  CREATE INDEX "categories_locales_parent_id_idx" ON "categories_locales" USING btree ("_parent_id");
  CREATE INDEX "colors_locales_parent_id_idx" ON "colors_locales" USING btree ("_parent_id");
  CREATE INDEX "fabrics_locales_parent_id_idx" ON "fabrics_locales" USING btree ("_parent_id");
  CREATE INDEX "slides_locales_parent_id_idx" ON "slides_locales" USING btree ("_parent_id");
  CREATE INDEX "home_sections_locales_parent_id_idx" ON "home_sections_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_locales_parent_id_idx" ON "pages_locales" USING btree ("_parent_id");
  CREATE INDEX "posts_locales_parent_id_idx" ON "posts_locales" USING btree ("_parent_id");
  CREATE INDEX "settings_locales_parent_id_idx" ON "settings_locales" USING btree ("_parent_id");
  CREATE INDEX "brand_locales_parent_id_idx" ON "brand_locales" USING btree ("_parent_id");
  CREATE INDEX "contact_details_locales_parent_id_idx" ON "contact_details_locales" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "products_locales_parent_id_idx";
  DROP INDEX "categories_locales_parent_id_idx";
  DROP INDEX "colors_locales_parent_id_idx";
  DROP INDEX "fabrics_locales_parent_id_idx";
  DROP INDEX "slides_locales_parent_id_idx";
  DROP INDEX "home_sections_locales_parent_id_idx";
  DROP INDEX "pages_locales_parent_id_idx";
  DROP INDEX "posts_locales_parent_id_idx";
  DROP INDEX "settings_locales_parent_id_idx";
  DROP INDEX "brand_locales_parent_id_idx";
  DROP INDEX "contact_details_locales_parent_id_idx";
  ALTER TABLE "customers" DROP COLUMN "reset_password_requested_at";
  ALTER TABLE "media" DROP COLUMN "_objectkey";
  ALTER TABLE "users" DROP COLUMN "reset_password_requested_at";`)
}
