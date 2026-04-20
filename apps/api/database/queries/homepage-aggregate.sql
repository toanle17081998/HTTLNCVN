WITH requested_sections AS (
    SELECT COALESCE($4::text[], ARRAY['posts', 'courses', 'events']::text[]) AS included
),
latest_posts AS (
    SELECT
        p.id,
        p.slug,
        p.title,
        p.excerpt,
        p.cover_image_url,
        p.published_at,
        u.id AS author_id,
        COALESCE(u.display_name, u.full_name) AS author_name
    FROM posts AS p
    INNER JOIN users AS u
        ON u.id = p.author_id
    WHERE p.status = 'published'
      AND p.deleted_at IS NULL
      AND p.published_at IS NOT NULL
    ORDER BY p.published_at DESC
    LIMIT $1
),
featured_courses AS (
    SELECT
        c.id,
        c.slug,
        c.title,
        c.summary,
        c.cover_image_url,
        c.level,
        c.published_at,
        c.estimated_duration_minutes,
        u.id AS instructor_id,
        COALESCE(u.display_name, u.full_name) AS instructor_name,
        COUNT(l.id) FILTER (
            WHERE l.status = 'published'
              AND l.deleted_at IS NULL
        )::integer AS lesson_count
    FROM courses AS c
    INNER JOIN users AS u
        ON u.id = c.instructor_id
    LEFT JOIN lessons AS l
        ON l.course_id = c.id
    WHERE c.status = 'published'
      AND c.visibility = 'public'
      AND c.deleted_at IS NULL
      AND c.published_at IS NOT NULL
    GROUP BY c.id, u.id
    ORDER BY c.published_at DESC
    LIMIT $2
),
upcoming_events AS (
    SELECT
        e.id,
        e.slug,
        e.title,
        e.excerpt,
        e.starts_at,
        e.ends_at,
        e.location_name,
        e.cover_image_url
    FROM events AS e
    WHERE e.status = 'published'
      AND e.visibility = 'public'
      AND e.deleted_at IS NULL
      AND e.starts_at >= now()
    ORDER BY e.starts_at ASC
    LIMIT $3
)
SELECT jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
        'hero', jsonb_build_object(
            'headline', 'Hoc, ket noi va tang truong cung HTNC',
            'subheadline', 'Noi dung moi, su kien sap toi va khoa hoc duoc de xuat cho cong dong',
            'cta', jsonb_build_object(
                'label', 'Kham pha ngay',
                'href', '/courses'
            )
        ),
        'latest_posts', CASE
            WHEN EXISTS (
                SELECT 1
                FROM requested_sections
                WHERE 'posts' = ANY(included)
            )
                THEN COALESCE(
                    (
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'id', lp.id,
                                'slug', lp.slug,
                                'title', lp.title,
                                'excerpt', lp.excerpt,
                                'cover_image_url', lp.cover_image_url,
                                'published_at', to_char(
                                    lp.published_at AT TIME ZONE 'UTC',
                                    'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                                ),
                                'author', jsonb_build_object(
                                    'id', lp.author_id,
                                    'name', lp.author_name
                                )
                            )
                            ORDER BY lp.published_at DESC
                        )
                        FROM latest_posts AS lp
                    ),
                    '[]'::jsonb
                )
            ELSE '[]'::jsonb
        END,
        'featured_courses', CASE
            WHEN EXISTS (
                SELECT 1
                FROM requested_sections
                WHERE 'courses' = ANY(included)
            )
                THEN COALESCE(
                    (
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'id', fc.id,
                                'slug', fc.slug,
                                'title', fc.title,
                                'summary', fc.summary,
                                'cover_image_url', fc.cover_image_url,
                                'level', fc.level,
                                'estimated_duration_minutes', fc.estimated_duration_minutes,
                                'lesson_count', fc.lesson_count,
                                'instructor', jsonb_build_object(
                                    'id', fc.instructor_id,
                                    'name', fc.instructor_name
                                )
                            )
                            ORDER BY fc.published_at DESC
                        )
                        FROM featured_courses AS fc
                    ),
                    '[]'::jsonb
                )
            ELSE '[]'::jsonb
        END,
        'upcoming_events', CASE
            WHEN EXISTS (
                SELECT 1
                FROM requested_sections
                WHERE 'events' = ANY(included)
            )
                THEN COALESCE(
                    (
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'id', ue.id,
                                'slug', ue.slug,
                                'title', ue.title,
                                'excerpt', ue.excerpt,
                                'starts_at', to_char(
                                    ue.starts_at AT TIME ZONE 'UTC',
                                    'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                                ),
                                'ends_at', CASE
                                    WHEN ue.ends_at IS NULL THEN NULL
                                    ELSE to_char(
                                        ue.ends_at AT TIME ZONE 'UTC',
                                        'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                                    )
                                END,
                                'location_name', ue.location_name,
                                'cover_image_url', ue.cover_image_url
                            )
                            ORDER BY ue.starts_at ASC
                        )
                        FROM upcoming_events AS ue
                    ),
                    '[]'::jsonb
                )
            ELSE '[]'::jsonb
        END
    ),
    'meta', jsonb_build_object(
        'generated_at', to_char(
            now() AT TIME ZONE 'UTC',
            'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
        ),
        'included', to_jsonb((SELECT included FROM requested_sections))
    )
) AS homepage_payload;
