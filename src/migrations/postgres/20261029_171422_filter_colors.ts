import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "colors" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"hex" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"show_in_filter" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "colors_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "colors_id" integer;
  ALTER TABLE "colors_locales" ADD CONSTRAINT "colors_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."colors"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "colors__order_idx" ON "colors" USING btree ("_order");
  CREATE UNIQUE INDEX "colors_slug_idx" ON "colors" USING btree ("slug");
  CREATE INDEX "colors_show_in_filter_idx" ON "colors" USING btree ("show_in_filter");
  CREATE INDEX "colors_updated_at_idx" ON "colors" USING btree ("updated_at");
  CREATE INDEX "colors_created_at_idx" ON "colors" USING btree ("created_at");
  CREATE UNIQUE INDEX "colors_locales_locale_parent_id_unique" ON "colors_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_colors_fk" FOREIGN KEY ("colors_id") REFERENCES "public"."colors"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_colors_id_idx" ON "payload_locked_documents_rels" USING btree ("colors_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "colors" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "colors_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "colors" CASCADE;
  DROP TABLE "colors_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_colors_fk";
  
  DROP INDEX "payload_locked_documents_rels_colors_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "colors_id";`)
}
