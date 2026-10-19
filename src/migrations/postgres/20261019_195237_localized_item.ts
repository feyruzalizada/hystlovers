import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "products_item_idx";
  ALTER TABLE "products_locales" ADD COLUMN "item" varchar;
  INSERT INTO "products_locales" ("_locale", "_parent_id", "color_name") SELECT 'az', "id", '' FROM "products" p WHERE NOT EXISTS (SELECT 1 FROM "products_locales" l WHERE l."_parent_id" = p."id" AND l."_locale" = 'az');
  UPDATE "products_locales" l SET "item" = p."item" FROM "products" p WHERE p."id" = l."_parent_id";
  ALTER TABLE "products_locales" ALTER COLUMN "item" SET NOT NULL;
  CREATE INDEX "products_item_idx" ON "products_locales" USING btree ("item","_locale");
  ALTER TABLE "products" DROP COLUMN "item";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "products_item_idx";
  ALTER TABLE "products" ADD COLUMN "item" varchar;
  UPDATE "products" p SET "item" = l."item" FROM "products_locales" l WHERE l."_parent_id" = p."id" AND l."_locale" = 'en';
  UPDATE "products" SET "item" = '' WHERE "item" IS NULL;
  ALTER TABLE "products" ALTER COLUMN "item" SET NOT NULL;
  CREATE INDEX "products_item_idx" ON "products" USING btree ("item");
  ALTER TABLE "products_locales" DROP COLUMN "item";`)
}
