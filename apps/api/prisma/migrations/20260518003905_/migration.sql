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
CREATE TABLE "serving_profiles" (
    "church_unit_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "serving_profiles_pkey" PRIMARY KEY ("church_unit_id","user_id")
);

-- CreateTable
CREATE TABLE "serving_schedules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "church_unit_id" UUID NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "service_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "serving_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "serving_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schedule_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" VARCHAR(30) NOT NULL,
    "slot_index" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "serving_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "serving_profiles_user_id_idx" ON "serving_profiles"("user_id");

-- CreateIndex
CREATE INDEX "serving_schedules_type_service_date_idx" ON "serving_schedules"("type", "service_date");

-- CreateIndex
CREATE UNIQUE INDEX "serving_schedules_church_unit_id_type_service_date_key" ON "serving_schedules"("church_unit_id", "type", "service_date");

-- CreateIndex
CREATE INDEX "serving_assignments_user_id_idx" ON "serving_assignments"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "serving_assignments_schedule_id_role_slot_index_key" ON "serving_assignments"("schedule_id", "role", "slot_index");

-- AddForeignKey
ALTER TABLE "course_attendance" ADD CONSTRAINT "course_attendance_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_attendance" ADD CONSTRAINT "course_attendance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serving_profiles" ADD CONSTRAINT "serving_profiles_church_unit_id_fkey" FOREIGN KEY ("church_unit_id") REFERENCES "church_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serving_profiles" ADD CONSTRAINT "serving_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serving_schedules" ADD CONSTRAINT "serving_schedules_church_unit_id_fkey" FOREIGN KEY ("church_unit_id") REFERENCES "church_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serving_assignments" ADD CONSTRAINT "serving_assignments_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "serving_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serving_assignments" ADD CONSTRAINT "serving_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
