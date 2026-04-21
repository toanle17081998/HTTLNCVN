BEGIN;

CREATE TABLE events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id uuid NOT NULL,
    slug varchar(180) NOT NULL,
    title varchar(255) NOT NULL,
    excerpt text,
    description text,
    cover_image_url text,
    location_name varchar(180),
    location_address text,
    is_online boolean NOT NULL DEFAULT false,
    meeting_url text,
    registration_url text,
    starts_at timestamptz NOT NULL,
    ends_at timestamptz,
    status varchar(32) NOT NULL DEFAULT 'draft',
    visibility varchar(32) NOT NULL DEFAULT 'private',
    published_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    CONSTRAINT fk_events_organizer
        FOREIGN KEY (organizer_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT chk_events_status
        CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
    CONSTRAINT chk_events_visibility
        CHECK (visibility IN ('private', 'unlisted', 'public')),
    CONSTRAINT chk_events_time_order
        CHECK (ends_at IS NULL OR ends_at >= starts_at)
);

CREATE UNIQUE INDEX uq_events_slug_lower ON events (lower(slug));
CREATE INDEX idx_events_organizer_id ON events (organizer_id);
CREATE INDEX idx_events_status_visibility_starts_at
    ON events (status, visibility, starts_at ASC);
CREATE INDEX idx_events_published_at ON events (published_at DESC);

COMMIT;
