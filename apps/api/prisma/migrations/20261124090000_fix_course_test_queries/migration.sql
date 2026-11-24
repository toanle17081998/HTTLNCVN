ALTER TABLE "course_test_availabilities"
ADD COLUMN "target_user_id" UUID;

CREATE INDEX "lessons_course_id_idx" ON "lessons"("course_id");
CREATE INDEX "question_templates_lesson_id_idx" ON "question_templates"("lesson_id");

DROP INDEX "course_test_availabilities_course_id_church_unit_id_is_active_idx";
CREATE INDEX "course_test_availabilities_course_id_church_unit_id_is_active_created_at_idx"
ON "course_test_availabilities"("course_id", "church_unit_id", "is_active", "created_at");
CREATE INDEX "course_test_availabilities_course_id_is_active_created_at_idx"
ON "course_test_availabilities"("course_id", "is_active", "created_at");
CREATE INDEX "course_test_availabilities_target_user_id_idx"
ON "course_test_availabilities"("target_user_id");

ALTER TABLE "course_test_availabilities"
ADD CONSTRAINT "course_test_availabilities_target_user_id_fkey"
FOREIGN KEY ("target_user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
