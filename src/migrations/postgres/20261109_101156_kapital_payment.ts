import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_orders_payment_method" ADD VALUE 'card';
  ALTER TYPE "public"."enum_orders_payment_status" ADD VALUE 'failed';
  ALTER TYPE "public"."enum_orders_payment_status" ADD VALUE 'refunded';
  ALTER TABLE "orders" ADD COLUMN "bank_order_id" numeric;
  ALTER TABLE "orders" ADD COLUMN "bank_status" varchar;
  CREATE INDEX "orders_bank_order_id_idx" ON "orders" USING btree ("bank_order_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders" ALTER COLUMN "payment_method" SET DATA TYPE text;
  DROP TYPE "public"."enum_orders_payment_method";
  CREATE TYPE "public"."enum_orders_payment_method" AS ENUM('cod', 'bank_transfer');
  ALTER TABLE "orders" ALTER COLUMN "payment_method" SET DATA TYPE "public"."enum_orders_payment_method" USING "payment_method"::"public"."enum_orders_payment_method";
  ALTER TABLE "orders" ALTER COLUMN "payment_status" SET DATA TYPE text;
  ALTER TABLE "orders" ALTER COLUMN "payment_status" SET DEFAULT 'pending'::text;
  DROP TYPE "public"."enum_orders_payment_status";
  CREATE TYPE "public"."enum_orders_payment_status" AS ENUM('pending', 'paid');
  ALTER TABLE "orders" ALTER COLUMN "payment_status" SET DEFAULT 'pending'::"public"."enum_orders_payment_status";
  ALTER TABLE "orders" ALTER COLUMN "payment_status" SET DATA TYPE "public"."enum_orders_payment_status" USING "payment_status"::"public"."enum_orders_payment_status";
  DROP INDEX "orders_bank_order_id_idx";
  ALTER TABLE "orders" DROP COLUMN "bank_order_id";
  ALTER TABLE "orders" DROP COLUMN "bank_status";`)
}
