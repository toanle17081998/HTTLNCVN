/*
  Warnings:

  - You are about to drop the column `description` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `summary` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `content_json` on the `pages` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "courses" DROP COLUMN "description",
DROP COLUMN "summary",
ADD COLUMN     "description_en" TEXT,
ADD COLUMN     "description_vi" TEXT,
ADD COLUMN     "summary_en" TEXT,
ADD COLUMN     "summary_vi" TEXT;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "is_all_day" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "series_id" UUID;

-- AlterTable
ALTER TABLE "pages" DROP COLUMN "content_json",
ADD COLUMN     "content_json_en" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "content_json_vi" JSONB NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE "course_attendance" (
    "course_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "check_in_time" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_attendance_pkey" PRIMARY KEY ("course_id","user_id")
);

-- CreateTable
CREATE TABLE "event_series" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" VARCHAR(150) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "starts_at" TIMESTAMPTZ NOT NULL,
    "ends_at" TIMESTAMPTZ NOT NULL,
    "is_all_day" BOOLEAN NOT NULL DEFAULT false,
    "location" VARCHAR(255),
    "cover_image_url" TEXT,
    "color" VARCHAR(50),
    "repeat" VARCHAR(50) NOT NULL DEFAULT 'none',
    "category_id" INTEGER,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "event_series_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_series_slug_key" ON "event_series"("slug");

-- CreateIndex
CREATE INDEX "event_series_category_id_idx" ON "event_series"("category_id");

-- CreateIndex
CREATE INDEX "event_series_created_by_idx" ON "event_series"("created_by");

-- CreateIndex
CREATE INDEX "events_series_id_idx" ON "events"("series_id");

-- AddForeignKey
ALTER TABLE "course_attendance" ADD CONSTRAINT "course_attendance_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_attendance" ADD CONSTRAINT "course_attendance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_series" ADD CONSTRAINT "event_series_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "event_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_series" ADD CONSTRAINT "event_series_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "event_series"("id") ON DELETE SET NULL ON UPDATE CASCADE;
