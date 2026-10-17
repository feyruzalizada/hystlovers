import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "brand" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"home_button_url" varchar DEFAULT '/pages/about-us',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "brand_locales" (
  	"home_label" varchar,
  	"home_text" varchar,
  	"home_button" varchar,
  	"footer_title" varchar,
  	"footer_text" varchar,
  	"newsletter_title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "brand_locales" ADD CONSTRAINT "brand_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."brand"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "brand_locales_locale_parent_id_unique" ON "brand_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "brand" CASCADE;
  DROP TABLE "brand_locales" CASCADE;`)
}
