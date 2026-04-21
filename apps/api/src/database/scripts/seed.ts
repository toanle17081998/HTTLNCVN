import { Client } from 'pg';

import { getEnv } from '../../config/env';

function createClient(): Client {
  const env = getEnv();

  return env.databaseUrl
    ? new Client({ connectionString: env.databaseUrl })
    : new Client({
        database: env.postgres.database,
        host: env.postgres.host,
        password: env.postgres.password,
        port: env.postgres.port,
        user: env.postgres.user,
      });
}

async function upsertUser(
  client: Client,
  email: string,
  payload: {
    displayName?: string;
    fullName: string;
    role: 'editor' | 'instructor' | 'admin' | 'member';
  },
): Promise<string> {
  const result = await client.query<{ id: string }>(
    `
      INSERT INTO users (
        email,
        password_hash,
        full_name,
        display_name,
        role,
        status
      )
      VALUES ($1, $2, $3, $4, $5, 'active')
      ON CONFLICT ((lower(email)))
      DO UPDATE SET
        full_name = EXCLUDED.full_name,
        display_name = EXCLUDED.display_name,
        role = EXCLUDED.role,
        updated_at = now()
      RETURNING id;
    `,
    [email, 'seed-password-hash', payload.fullName, payload.displayName ?? null, payload.role],
  );

  return result.rows[0].id;
}

async function main(): Promise<void> {
  const client = createClient();

  await client.connect();

  try {
    await client.query('BEGIN');

    const editorId = await upsertUser(client, 'editor@htnc.local', {
      displayName: 'HTNC Editorial',
      fullName: 'HTNC Editorial Team',
      role: 'editor',
    });

    const instructorId = await upsertUser(client, 'instructor@htnc.local', {
      displayName: 'Muc su An',
      fullName: 'Nguyen Van An',
      role: 'instructor',
    });

    const organizerId = await upsertUser(client, 'events@htnc.local', {
      displayName: 'HTNC Events',
      fullName: 'HTNC Events Team',
      role: 'admin',
    });

    await client.query(
      `
        INSERT INTO posts (
          author_id,
          slug,
          title,
          excerpt,
          content,
          cover_image_url,
          status,
          published_at
        )
        VALUES
          ($1, 'song-hy-vong-moi-ngay', 'Song hy vong moi ngay', 'Tom tat ngan cho card homepage.', 'Noi dung bai viet mau 1', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb', 'published', now() - interval '2 day'),
          ($1, 'xay-dung-thoi-quen-cau-nguyen', 'Xay dung thoi quen cau nguyen', 'Noi dung ngan cho homepage block.', 'Noi dung bai viet mau 2', 'https://images.unsplash.com/photo-1490750967868-88aa4486c946', 'published', now() - interval '1 day')
        ON CONFLICT ((lower(slug)))
        DO UPDATE SET
          title = EXCLUDED.title,
          excerpt = EXCLUDED.excerpt,
          content = EXCLUDED.content,
          cover_image_url = EXCLUDED.cover_image_url,
          status = EXCLUDED.status,
          published_at = EXCLUDED.published_at,
          updated_at = now();
      `,
      [editorId],
    );

    await client.query(
      `
        INSERT INTO courses (
          instructor_id,
          slug,
          title,
          summary,
          description,
          cover_image_url,
          level,
          status,
          visibility,
          estimated_duration_minutes,
          published_at
        )
        VALUES
          ($1, 'foundations-of-faith', 'Foundations Of Faith', 'Khoa hoc nen tang cho nguoi moi.', 'Mo ta khoa hoc mau.', 'https://images.unsplash.com/photo-1513258496099-48168024aec0', 'beginner', 'published', 'public', 180, now() - interval '3 day'),
          ($1, 'gospel-living-basics', 'Gospel Living Basics', 'Nhap mon cho thanh vien moi.', 'Mo ta khoa hoc mau 2.', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b', 'intermediate', 'published', 'public', 240, now() - interval '4 day')
        ON CONFLICT ((lower(slug)))
        DO UPDATE SET
          title = EXCLUDED.title,
          summary = EXCLUDED.summary,
          description = EXCLUDED.description,
          cover_image_url = EXCLUDED.cover_image_url,
          level = EXCLUDED.level,
          status = EXCLUDED.status,
          visibility = EXCLUDED.visibility,
          estimated_duration_minutes = EXCLUDED.estimated_duration_minutes,
          published_at = EXCLUDED.published_at,
          updated_at = now();
      `,
      [instructorId],
    );

    const courseRows = await client.query<{ id: string; slug: string }>(
      `
        SELECT id, slug
        FROM courses
        WHERE lower(slug) IN ('foundations-of-faith', 'gospel-living-basics');
      `,
    );

    for (const course of courseRows.rows) {
      await client.query(
        `
          INSERT INTO lessons (
            course_id,
            slug,
            title,
            short_description,
            content,
            lesson_type,
            position,
            duration_seconds,
            is_preview,
            status,
            published_at
          )
          VALUES
            ($1, $2, $3, 'Bai hoc mo dau', 'Noi dung lesson mau', 'article', 1, 600, true, 'published', now() - interval '2 day'),
            ($1, $4, $5, 'Bai hoc tiep theo', 'Noi dung lesson mau tiep', 'video', 2, 900, false, 'published', now() - interval '1 day')
          ON CONFLICT (course_id, position)
          DO UPDATE SET
            slug = EXCLUDED.slug,
            title = EXCLUDED.title,
            short_description = EXCLUDED.short_description,
            content = EXCLUDED.content,
            lesson_type = EXCLUDED.lesson_type,
            duration_seconds = EXCLUDED.duration_seconds,
            is_preview = EXCLUDED.is_preview,
            status = EXCLUDED.status,
            published_at = EXCLUDED.published_at,
            updated_at = now();
        `,
        [
          course.id,
          `${course.slug}-lesson-1`,
          `${course.slug} Lesson 1`,
          `${course.slug}-lesson-2`,
          `${course.slug} Lesson 2`,
        ],
      );
    }

    await client.query(
      `
        INSERT INTO events (
          organizer_id,
          slug,
          title,
          excerpt,
          description,
          cover_image_url,
          location_name,
          location_address,
          starts_at,
          ends_at,
          status,
          visibility,
          published_at
        )
        VALUES
          ($1, 'worship-night-apr-2026', 'Worship Night April 2026', 'Dem nhom va tho phuong hang thang.', 'Noi dung su kien mau.', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee', 'HTNC Main Hall', '123 Example Street', now() + interval '5 day', now() + interval '5 day 2 hour', 'published', 'public', now() - interval '1 day'),
          ($1, 'community-breakfast-may-2026', 'Community Breakfast May 2026', 'Buoi gap go va ket noi cong dong.', 'Noi dung su kien mau 2.', 'https://images.unsplash.com/photo-1528605248644-14dd04022da1', 'HTNC Cafe', '456 Example Street', now() + interval '10 day', now() + interval '10 day 90 minute', 'published', 'public', now() - interval '12 hour')
        ON CONFLICT ((lower(slug)))
        DO UPDATE SET
          title = EXCLUDED.title,
          excerpt = EXCLUDED.excerpt,
          description = EXCLUDED.description,
          cover_image_url = EXCLUDED.cover_image_url,
          location_name = EXCLUDED.location_name,
          location_address = EXCLUDED.location_address,
          starts_at = EXCLUDED.starts_at,
          ends_at = EXCLUDED.ends_at,
          status = EXCLUDED.status,
          visibility = EXCLUDED.visibility,
          published_at = EXCLUDED.published_at,
          updated_at = now();
      `,
      [organizerId],
    );

    await client.query('COMMIT');
    console.log('Seed completed');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

void main();
