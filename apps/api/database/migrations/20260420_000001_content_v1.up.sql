BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email varchar(255) NOT NULL,
    password_hash varchar(255) NOT NULL,
    full_name varchar(160) NOT NULL,
    display_name varchar(120),
    role varchar(32) NOT NULL DEFAULT 'member',
    status varchar(32) NOT NULL DEFAULT 'active',
    avatar_url text,
    bio text,
    email_verified_at timestamptz,
    last_login_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    CONSTRAINT chk_users_role
        CHECK (role IN ('member', 'editor', 'instructor', 'admin')),
    CONSTRAINT chk_users_status
        CHECK (status IN ('pending', 'active', 'suspended'))
);

CREATE UNIQUE INDEX uq_users_email_lower ON users (lower(email));
CREATE INDEX idx_users_role_status ON users (role, status);

CREATE TABLE posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id uuid NOT NULL,
    slug varchar(180) NOT NULL,
    title varchar(255) NOT NULL,
    excerpt text,
    content text NOT NULL,
    cover_image_url text,
    status varchar(32) NOT NULL DEFAULT 'draft',
    published_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    CONSTRAINT fk_posts_author
        FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT chk_posts_status
        CHECK (status IN ('draft', 'review', 'published', 'archived'))
);

CREATE UNIQUE INDEX uq_posts_slug_lower ON posts (lower(slug));
CREATE INDEX idx_posts_author_id ON posts (author_id);
CREATE INDEX idx_posts_status_published_at ON posts (status, published_at DESC);

CREATE TABLE courses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id uuid NOT NULL,
    slug varchar(180) NOT NULL,
    title varchar(255) NOT NULL,
    summary text,
    description text,
    cover_image_url text,
    level varchar(32) NOT NULL DEFAULT 'beginner',
    status varchar(32) NOT NULL DEFAULT 'draft',
    visibility varchar(32) NOT NULL DEFAULT 'private',
    estimated_duration_minutes integer NOT NULL DEFAULT 0,
    published_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    CONSTRAINT fk_courses_instructor
        FOREIGN KEY (instructor_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT chk_courses_level
        CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    CONSTRAINT chk_courses_status
        CHECK (status IN ('draft', 'published', 'archived')),
    CONSTRAINT chk_courses_visibility
        CHECK (visibility IN ('private', 'unlisted', 'public')),
    CONSTRAINT chk_courses_estimated_duration
        CHECK (estimated_duration_minutes >= 0)
);

CREATE UNIQUE INDEX uq_courses_slug_lower ON courses (lower(slug));
CREATE INDEX idx_courses_instructor_id ON courses (instructor_id);
CREATE INDEX idx_courses_status_visibility ON courses (status, visibility);

CREATE TABLE lessons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id uuid NOT NULL,
    slug varchar(180) NOT NULL,
    title varchar(255) NOT NULL,
    short_description text,
    content text,
    video_url text,
    resource_url text,
    lesson_type varchar(32) NOT NULL DEFAULT 'article',
    position integer NOT NULL,
    duration_seconds integer NOT NULL DEFAULT 0,
    is_preview boolean NOT NULL DEFAULT false,
    status varchar(32) NOT NULL DEFAULT 'draft',
    published_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    CONSTRAINT fk_lessons_course
        FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
    CONSTRAINT chk_lessons_type
        CHECK (lesson_type IN ('video', 'article', 'live', 'quiz')),
    CONSTRAINT chk_lessons_position
        CHECK (position > 0),
    CONSTRAINT chk_lessons_duration
        CHECK (duration_seconds >= 0),
    CONSTRAINT chk_lessons_status
        CHECK (status IN ('draft', 'published', 'archived'))
);

CREATE UNIQUE INDEX uq_lessons_course_slug_lower ON lessons (course_id, lower(slug));
CREATE UNIQUE INDEX uq_lessons_course_position ON lessons (course_id, position);
CREATE UNIQUE INDEX uq_lessons_id_course_id ON lessons (id, course_id);
CREATE INDEX idx_lessons_course_status ON lessons (course_id, status);

CREATE TABLE course_enrollments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id uuid NOT NULL,
    user_id uuid NOT NULL,
    status varchar(32) NOT NULL DEFAULT 'active',
    enrolled_at timestamptz NOT NULL DEFAULT now(),
    last_accessed_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_course_enrollments_course
        FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
    CONSTRAINT fk_course_enrollments_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT chk_course_enrollments_status
        CHECK (status IN ('active', 'completed', 'dropped'))
);

CREATE UNIQUE INDEX uq_course_enrollments_course_user ON course_enrollments (course_id, user_id);
CREATE UNIQUE INDEX uq_course_enrollments_id_course_id ON course_enrollments (id, course_id);
CREATE INDEX idx_course_enrollments_user_status ON course_enrollments (user_id, status);
CREATE INDEX idx_course_enrollments_course_status ON course_enrollments (course_id, status);

CREATE TABLE course_progresses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id uuid NOT NULL,
    lessons_completed_count integer NOT NULL DEFAULT 0,
    lessons_total_count integer NOT NULL DEFAULT 0,
    percent_complete numeric(5,2) NOT NULL DEFAULT 0,
    started_at timestamptz,
    completed_at timestamptz,
    last_lesson_id uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_course_progresses_enrollment
        FOREIGN KEY (enrollment_id) REFERENCES course_enrollments (id) ON DELETE CASCADE,
    CONSTRAINT fk_course_progresses_last_lesson
        FOREIGN KEY (last_lesson_id) REFERENCES lessons (id) ON DELETE SET NULL,
    CONSTRAINT chk_course_progresses_completed_count
        CHECK (lessons_completed_count >= 0),
    CONSTRAINT chk_course_progresses_total_count
        CHECK (lessons_total_count >= 0),
    CONSTRAINT chk_course_progresses_count_order
        CHECK (lessons_completed_count <= lessons_total_count),
    CONSTRAINT chk_course_progresses_percent
        CHECK (percent_complete >= 0 AND percent_complete <= 100)
);

CREATE UNIQUE INDEX uq_course_progresses_enrollment_id ON course_progresses (enrollment_id);
CREATE INDEX idx_course_progresses_completed_at ON course_progresses (completed_at);

CREATE TABLE lesson_progresses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id uuid NOT NULL,
    enrollment_id uuid NOT NULL,
    lesson_id uuid NOT NULL,
    status varchar(32) NOT NULL DEFAULT 'not_started',
    progress_percent numeric(5,2) NOT NULL DEFAULT 0,
    first_viewed_at timestamptz,
    last_viewed_at timestamptz,
    completed_at timestamptz,
    time_spent_seconds integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_lesson_progresses_enrollment_course
        FOREIGN KEY (enrollment_id, course_id)
        REFERENCES course_enrollments (id, course_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_lesson_progresses_lesson_course
        FOREIGN KEY (lesson_id, course_id)
        REFERENCES lessons (id, course_id)
        ON DELETE CASCADE,
    CONSTRAINT chk_lesson_progresses_status
        CHECK (status IN ('not_started', 'in_progress', 'completed')),
    CONSTRAINT chk_lesson_progresses_percent
        CHECK (progress_percent >= 0 AND progress_percent <= 100),
    CONSTRAINT chk_lesson_progresses_time_spent
        CHECK (time_spent_seconds >= 0)
);

CREATE UNIQUE INDEX uq_lesson_progresses_enrollment_lesson
    ON lesson_progresses (enrollment_id, lesson_id);
CREATE INDEX idx_lesson_progresses_lesson_status
    ON lesson_progresses (lesson_id, status);
CREATE INDEX idx_lesson_progresses_enrollment_status
    ON lesson_progresses (enrollment_id, status);

COMMIT;
