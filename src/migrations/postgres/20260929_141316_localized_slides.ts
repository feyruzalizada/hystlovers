import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "slides_locales" (
  	"title" varchar NOT NULL,
  	"subtitle" varchar,
  	"cta_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "home_sections_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "slides_locales" ADD CONSTRAINT "slides_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."slides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_sections_locales" ADD CONSTRAINT "home_sections_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_sections"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "slides_locales_locale_parent_id_unique" ON "slides_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "home_sections_locales_locale_parent_id_unique" ON "home_sections_locales" USING btree ("_locale","_parent_id");
  INSERT INTO "slides_locales" ("title", "subtitle", "cta_label", "_locale", "_parent_id") SELECT "title", "subtitle", "cta_label", 'az', "id" FROM "slides";
  INSERT INTO "home_sections_locales" ("title", "_locale", "_parent_id") SELECT "title", 'az', "id" FROM "home_sections";
  ALTER TABLE "slides" DROP COLUMN "title";
  ALTER TABLE "slides" DROP COLUMN "subtitle";
  ALTER TABLE "slides" DROP COLUMN "cta_label";
  ALTER TABLE "home_sections" DROP COLUMN "title";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "slides" ADD COLUMN "title" varchar;
  ALTER TABLE "slides" ADD COLUMN "subtitle" varchar;
  ALTER TABLE "slides" ADD COLUMN "cta_label" varchar;
  ALTER TABLE "home_sections" ADD COLUMN "title" varchar;
  UPDATE "slides" SET "title" = l."title", "subtitle" = l."subtitle", "cta_label" = l."cta_label" FROM "slides_locales" l WHERE l."_parent_id" = "slides"."id" AND l."_locale" = 'az';
  UPDATE "home_sections" SET "title" = l."title" FROM "home_sections_locales" l WHERE l."_parent_id" = "home_sections"."id" AND l."_locale" = 'az';
  UPDATE "slides" SET "title" = '' WHERE "title" IS NULL;
  ALTER TABLE "slides" ALTER COLUMN "title" SET NOT NULL;
  DROP TABLE "slides_locales" CASCADE;
  DROP TABLE "home_sections_locales" CASCADE;`)
}
