import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "brand" ADD COLUMN "background_audio_id" integer;
  ALTER TABLE "brand" ADD CONSTRAINT "brand_background_audio_id_media_id_fk" FOREIGN KEY ("background_audio_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "brand_background_audio_idx" ON "brand" USING btree ("background_audio_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "brand" DROP CONSTRAINT "brand_background_audio_id_media_id_fk";
  
  DROP INDEX "brand_background_audio_idx";
  ALTER TABLE "brand" DROP COLUMN "background_audio_id";`)
}
