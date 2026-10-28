import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "customers" ADD COLUMN "panel_access" boolean DEFAULT false;
  ALTER TABLE "customers" ADD COLUMN "orders_count" numeric DEFAULT 0;
  CREATE INDEX "customers_panel_access_idx" ON "customers" USING btree ("panel_access");
  CREATE INDEX "customers_orders_count_idx" ON "customers" USING btree ("orders_count");`)
  // Existing customers start with their real order count and any admin account they already have.
  await db.execute(sql`
   UPDATE "customers" SET "orders_count" = (SELECT count(*) FROM "orders" WHERE "orders"."customer_id" = "customers"."id");
  UPDATE "customers" SET "panel_access" = EXISTS (SELECT 1 FROM "users" WHERE "users"."email" = "customers"."email");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "customers_panel_access_idx";
  DROP INDEX "customers_orders_count_idx";
  ALTER TABLE "customers" DROP COLUMN "panel_access";
  ALTER TABLE "customers" DROP COLUMN "orders_count";`)
}
