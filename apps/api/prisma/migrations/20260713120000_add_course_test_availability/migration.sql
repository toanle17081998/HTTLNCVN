ALTER TABLE "quiz_attempts"
ADD COLUMN "deadline_at" TIMESTAMPTZ,
ADD COLUMN "test_availability_id" UUID;

ALTER TABLE "quizzes" ADD COLUMN "is_test" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "course_test_availabilities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "course_id" UUID NOT NULL,
    "church_unit_id" UUID NOT NULL,
    "quiz_id" UUID NOT NULL,
    "duration_seconds" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMPTZ,
    CONSTRAINT "course_test_availabilities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "quiz_attempts_user_id_test_availability_id_key"
ON "quiz_attempts"("user_id", "test_availability_id");

CREATE INDEX "quiz_attempts_test_availability_id_idx"
ON "quiz_attempts"("test_availability_id");

CREATE INDEX "course_test_availabilities_course_id_church_unit_id_is_active_idx"
ON "course_test_availabilities"("course_id", "church_unit_id", "is_active");

ALTER TABLE "quiz_attempts"
ADD CONSTRAINT "quiz_attempts_test_availability_id_fkey"
FOREIGN KEY ("test_availability_id") REFERENCES "course_test_availabilities"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "course_test_availabilities"
ADD CONSTRAINT "course_test_availabilities_course_id_fkey"
FOREIGN KEY ("course_id") REFERENCES "courses"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "course_test_availabilities"
ADD CONSTRAINT "course_test_availabilities_church_unit_id_fkey"
FOREIGN KEY ("church_unit_id") REFERENCES "church_units"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "course_test_availabilities"
ADD CONSTRAINT "course_test_availabilities_quiz_id_fkey"
FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "course_test_availabilities"
ADD CONSTRAINT "course_test_availabilities_created_by_fkey"
FOREIGN KEY ("created_by") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
