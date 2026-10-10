import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "settings_locales" ADD COLUMN "bank_transfer_details" varchar;
  ALTER TABLE "settings_locales" ADD COLUMN "contact_address" varchar;
  INSERT INTO "settings_locales" ("_locale", "_parent_id") SELECT 'az', "id" FROM "settings" s WHERE NOT EXISTS (SELECT 1 FROM "settings_locales" l WHERE l."_parent_id" = s."id" AND l."_locale" = 'az');
  UPDATE "settings_locales" l SET "bank_transfer_details" = s."bank_transfer_details", "contact_address" = s."contact_address" FROM "settings" s WHERE s."id" = l."_parent_id" AND l."_locale" = 'az';
  ALTER TABLE "settings" DROP COLUMN "bank_transfer_details";
  ALTER TABLE "settings" DROP COLUMN "contact_address";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "settings" ADD COLUMN "bank_transfer_details" varchar;
  ALTER TABLE "settings" ADD COLUMN "contact_address" varchar;
  UPDATE "settings" s SET "bank_transfer_details" = l."bank_transfer_details", "contact_address" = l."contact_address" FROM "settings_locales" l WHERE l."_parent_id" = s."id" AND l."_locale" = 'az';
  ALTER TABLE "settings_locales" DROP COLUMN "bank_transfer_details";
  ALTER TABLE "settings_locales" DROP COLUMN "contact_address";`)
}
