import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categories" ADD COLUMN "image_wide_id" integer;
  ALTER TABLE "categories" ADD COLUMN "image_tablet_id" integer;
  ALTER TABLE "categories" ADD COLUMN "image_mobile_id" integer;
  ALTER TABLE "page_banners_series" ADD COLUMN "image_wide_id" integer;
  ALTER TABLE "page_banners_series" ADD COLUMN "image_tablet_id" integer;
  ALTER TABLE "page_banners_series" ADD COLUMN "image_mobile_id" integer;
  ALTER TABLE "page_banners" ADD COLUMN "all_products_wide_id" integer;
  ALTER TABLE "page_banners" ADD COLUMN "all_products_tablet_id" integer;
  ALTER TABLE "page_banners" ADD COLUMN "all_products_mobile_id" integer;
  ALTER TABLE "page_banners" ADD COLUMN "new_in_wide_id" integer;
  ALTER TABLE "page_banners" ADD COLUMN "new_in_tablet_id" integer;
  ALTER TABLE "page_banners" ADD COLUMN "new_in_mobile_id" integer;
  ALTER TABLE "page_banners" ADD COLUMN "blog_wide_id" integer;
  ALTER TABLE "page_banners" ADD COLUMN "blog_tablet_id" integer;
  ALTER TABLE "page_banners" ADD COLUMN "blog_mobile_id" integer;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_image_wide_id_media_id_fk" FOREIGN KEY ("image_wide_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_image_tablet_id_media_id_fk" FOREIGN KEY ("image_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_image_mobile_id_media_id_fk" FOREIGN KEY ("image_mobile_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_banners_series" ADD CONSTRAINT "page_banners_series_image_wide_id_media_id_fk" FOREIGN KEY ("image_wide_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_banners_series" ADD CONSTRAINT "page_banners_series_image_tablet_id_media_id_fk" FOREIGN KEY ("image_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_banners_series" ADD CONSTRAINT "page_banners_series_image_mobile_id_media_id_fk" FOREIGN KEY ("image_mobile_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_banners" ADD CONSTRAINT "page_banners_all_products_wide_id_media_id_fk" FOREIGN KEY ("all_products_wide_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_banners" ADD CONSTRAINT "page_banners_all_products_tablet_id_media_id_fk" FOREIGN KEY ("all_products_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_banners" ADD CONSTRAINT "page_banners_all_products_mobile_id_media_id_fk" FOREIGN KEY ("all_products_mobile_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_banners" ADD CONSTRAINT "page_banners_new_in_wide_id_media_id_fk" FOREIGN KEY ("new_in_wide_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_banners" ADD CONSTRAINT "page_banners_new_in_tablet_id_media_id_fk" FOREIGN KEY ("new_in_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_banners" ADD CONSTRAINT "page_banners_new_in_mobile_id_media_id_fk" FOREIGN KEY ("new_in_mobile_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_banners" ADD CONSTRAINT "page_banners_blog_wide_id_media_id_fk" FOREIGN KEY ("blog_wide_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_banners" ADD CONSTRAINT "page_banners_blog_tablet_id_media_id_fk" FOREIGN KEY ("blog_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_banners" ADD CONSTRAINT "page_banners_blog_mobile_id_media_id_fk" FOREIGN KEY ("blog_mobile_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "categories_image_wide_idx" ON "categories" USING btree ("image_wide_id");
  CREATE INDEX "categories_image_tablet_idx" ON "categories" USING btree ("image_tablet_id");
  CREATE INDEX "categories_image_mobile_idx" ON "categories" USING btree ("image_mobile_id");
  CREATE INDEX "page_banners_series_image_wide_idx" ON "page_banners_series" USING btree ("image_wide_id");
  CREATE INDEX "page_banners_series_image_tablet_idx" ON "page_banners_series" USING btree ("image_tablet_id");
  CREATE INDEX "page_banners_series_image_mobile_idx" ON "page_banners_series" USING btree ("image_mobile_id");
  CREATE INDEX "page_banners_all_products_wide_idx" ON "page_banners" USING btree ("all_products_wide_id");
  CREATE INDEX "page_banners_all_products_tablet_idx" ON "page_banners" USING btree ("all_products_tablet_id");
  CREATE INDEX "page_banners_all_products_mobile_idx" ON "page_banners" USING btree ("all_products_mobile_id");
  CREATE INDEX "page_banners_new_in_wide_idx" ON "page_banners" USING btree ("new_in_wide_id");
  CREATE INDEX "page_banners_new_in_tablet_idx" ON "page_banners" USING btree ("new_in_tablet_id");
  CREATE INDEX "page_banners_new_in_mobile_idx" ON "page_banners" USING btree ("new_in_mobile_id");
  CREATE INDEX "page_banners_blog_wide_idx" ON "page_banners" USING btree ("blog_wide_id");
  CREATE INDEX "page_banners_blog_tablet_idx" ON "page_banners" USING btree ("blog_tablet_id");
  CREATE INDEX "page_banners_blog_mobile_idx" ON "page_banners" USING btree ("blog_mobile_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categories" DROP CONSTRAINT "categories_image_wide_id_media_id_fk";
  
  ALTER TABLE "categories" DROP CONSTRAINT "categories_image_tablet_id_media_id_fk";
  
  ALTER TABLE "categories" DROP CONSTRAINT "categories_image_mobile_id_media_id_fk";
  
  ALTER TABLE "page_banners_series" DROP CONSTRAINT "page_banners_series_image_wide_id_media_id_fk";
  
  ALTER TABLE "page_banners_series" DROP CONSTRAINT "page_banners_series_image_tablet_id_media_id_fk";
  
  ALTER TABLE "page_banners_series" DROP CONSTRAINT "page_banners_series_image_mobile_id_media_id_fk";
  
  ALTER TABLE "page_banners" DROP CONSTRAINT "page_banners_all_products_wide_id_media_id_fk";
  
  ALTER TABLE "page_banners" DROP CONSTRAINT "page_banners_all_products_tablet_id_media_id_fk";
  
  ALTER TABLE "page_banners" DROP CONSTRAINT "page_banners_all_products_mobile_id_media_id_fk";
  
  ALTER TABLE "page_banners" DROP CONSTRAINT "page_banners_new_in_wide_id_media_id_fk";
  
  ALTER TABLE "page_banners" DROP CONSTRAINT "page_banners_new_in_tablet_id_media_id_fk";
  
  ALTER TABLE "page_banners" DROP CONSTRAINT "page_banners_new_in_mobile_id_media_id_fk";
  
  ALTER TABLE "page_banners" DROP CONSTRAINT "page_banners_blog_wide_id_media_id_fk";
  
  ALTER TABLE "page_banners" DROP CONSTRAINT "page_banners_blog_tablet_id_media_id_fk";
  
  ALTER TABLE "page_banners" DROP CONSTRAINT "page_banners_blog_mobile_id_media_id_fk";
  
  DROP INDEX "categories_image_wide_idx";
  DROP INDEX "categories_image_tablet_idx";
  DROP INDEX "categories_image_mobile_idx";
  DROP INDEX "page_banners_series_image_wide_idx";
  DROP INDEX "page_banners_series_image_tablet_idx";
  DROP INDEX "page_banners_series_image_mobile_idx";
  DROP INDEX "page_banners_all_products_wide_idx";
  DROP INDEX "page_banners_all_products_tablet_idx";
  DROP INDEX "page_banners_all_products_mobile_idx";
  DROP INDEX "page_banners_new_in_wide_idx";
  DROP INDEX "page_banners_new_in_tablet_idx";
  DROP INDEX "page_banners_new_in_mobile_idx";
  DROP INDEX "page_banners_blog_wide_idx";
  DROP INDEX "page_banners_blog_tablet_idx";
  DROP INDEX "page_banners_blog_mobile_idx";
  ALTER TABLE "categories" DROP COLUMN "image_wide_id";
  ALTER TABLE "categories" DROP COLUMN "image_tablet_id";
  ALTER TABLE "categories" DROP COLUMN "image_mobile_id";
  ALTER TABLE "page_banners_series" DROP COLUMN "image_wide_id";
  ALTER TABLE "page_banners_series" DROP COLUMN "image_tablet_id";
  ALTER TABLE "page_banners_series" DROP COLUMN "image_mobile_id";
  ALTER TABLE "page_banners" DROP COLUMN "all_products_wide_id";
  ALTER TABLE "page_banners" DROP COLUMN "all_products_tablet_id";
  ALTER TABLE "page_banners" DROP COLUMN "all_products_mobile_id";
  ALTER TABLE "page_banners" DROP COLUMN "new_in_wide_id";
  ALTER TABLE "page_banners" DROP COLUMN "new_in_tablet_id";
  ALTER TABLE "page_banners" DROP COLUMN "new_in_mobile_id";
  ALTER TABLE "page_banners" DROP COLUMN "blog_wide_id";
  ALTER TABLE "page_banners" DROP COLUMN "blog_tablet_id";
  ALTER TABLE "page_banners" DROP COLUMN "blog_mobile_id";`)
}
