CREATE INDEX "users_status_deleted_at_idx" ON "users"("status", "deleted_at");
CREATE INDEX "courses_status_deleted_at_published_at_idx" ON "courses"("status", "deleted_at", "published_at");
CREATE INDEX "courses_category_id_status_idx" ON "courses"("category_id", "status");
CREATE INDEX "course_grades_status_idx" ON "course_grades"("status");
CREATE INDEX "course_attendance_user_id_idx" ON "course_attendance"("user_id");
CREATE INDEX "audit_logs_occurred_at_idx" ON "audit_logs"("occurred_at");
CREATE INDEX "audit_logs_user_id_occurred_at_idx" ON "audit_logs"("user_id", "occurred_at");
CREATE INDEX "events_status_deleted_at_starts_at_idx" ON "events"("status", "deleted_at", "starts_at");
CREATE INDEX "events_audience_status_idx" ON "events"("audience", "status");
CREATE INDEX "event_attendance_user_id_idx" ON "event_attendance"("user_id");
CREATE INDEX "prayers_created_at_idx" ON "prayers"("created_at");
CREATE INDEX "articles_status_deleted_at_published_at_idx" ON "articles"("status", "deleted_at", "published_at");
CREATE INDEX "pages_route_path_status_deleted_at_idx" ON "pages"("route_path", "status", "deleted_at");
CREATE INDEX "pages_slug_deleted_at_idx" ON "pages"("slug", "deleted_at");
CREATE INDEX "notification_recipients_user_id_is_read_idx" ON "notification_recipients"("user_id", "is_read");
CREATE INDEX "household_members_user_id_idx" ON "household_members"("user_id");
CREATE INDEX "user_lesson_progress_status_idx" ON "user_lesson_progress"("status");

