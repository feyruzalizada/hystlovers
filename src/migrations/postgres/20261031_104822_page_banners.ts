import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "page_banners_series" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"image_id" integer NOT NULL
  );
  
  CREATE TABLE "page_banners" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"all_products_id" integer,
  	"new_in_id" integer,
  	"blog_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "page_banners_series" ADD CONSTRAINT "page_banners_series_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_banners_series" ADD CONSTRAINT "page_banners_series_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_banners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_banners" ADD CONSTRAINT "page_banners_all_products_id_media_id_fk" FOREIGN KEY ("all_products_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_banners" ADD CONSTRAINT "page_banners_new_in_id_media_id_fk" FOREIGN KEY ("new_in_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "page_banners" ADD CONSTRAINT "page_banners_blog_id_media_id_fk" FOREIGN KEY ("blog_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "page_banners_series_order_idx" ON "page_banners_series" USING btree ("_order");
  CREATE INDEX "page_banners_series_parent_id_idx" ON "page_banners_series" USING btree ("_parent_id");
  CREATE INDEX "page_banners_series_image_idx" ON "page_banners_series" USING btree ("image_id");
  CREATE INDEX "page_banners_all_products_idx" ON "page_banners" USING btree ("all_products_id");
  CREATE INDEX "page_banners_new_in_idx" ON "page_banners" USING btree ("new_in_id");
  CREATE INDEX "page_banners_blog_idx" ON "page_banners" USING btree ("blog_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "page_banners_series" CASCADE;
  DROP TABLE "page_banners" CASCADE;`)
}
