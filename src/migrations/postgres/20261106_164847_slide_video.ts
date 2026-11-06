import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "slides" ALTER COLUMN "image_id" DROP NOT NULL;
  ALTER TABLE "slides" ADD COLUMN "video_id" integer;
  ALTER TABLE "slides" ADD CONSTRAINT "slides_video_id_media_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "slides_video_idx" ON "slides" USING btree ("video_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "slides" DROP CONSTRAINT "slides_video_id_media_id_fk";
  
  DROP INDEX "slides_video_idx";
  ALTER TABLE "slides" ALTER COLUMN "image_id" SET NOT NULL;
  ALTER TABLE "slides" DROP COLUMN "video_id";`)
}
