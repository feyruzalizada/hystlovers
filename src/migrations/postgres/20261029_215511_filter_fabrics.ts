import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "fabrics" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"slug" varchar NOT NULL,
  	"show_in_filter" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "fabrics_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "fabrics_id" integer;
  ALTER TABLE "fabrics_locales" ADD CONSTRAINT "fabrics_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."fabrics"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "fabrics__order_idx" ON "fabrics" USING btree ("_order");
  CREATE UNIQUE INDEX "fabrics_slug_idx" ON "fabrics" USING btree ("slug");
  CREATE INDEX "fabrics_show_in_filter_idx" ON "fabrics" USING btree ("show_in_filter");
  CREATE INDEX "fabrics_updated_at_idx" ON "fabrics" USING btree ("updated_at");
  CREATE INDEX "fabrics_created_at_idx" ON "fabrics" USING btree ("created_at");
  CREATE UNIQUE INDEX "fabrics_locales_locale_parent_id_unique" ON "fabrics_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_fabrics_fk" FOREIGN KEY ("fabrics_id") REFERENCES "public"."fabrics"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_fabrics_id_idx" ON "payload_locked_documents_rels" USING btree ("fabrics_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "fabrics" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "fabrics_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "fabrics" CASCADE;
  DROP TABLE "fabrics_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_fabrics_fk";
  
  DROP INDEX "payload_locked_documents_rels_fabrics_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "fabrics_id";`)
}
