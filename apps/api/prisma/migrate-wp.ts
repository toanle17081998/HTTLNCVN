/**
 * WordPress/LearnPress → App DB Migration Script
 * Run: npx tsx prisma/migrate-wp.ts
 *
 * Structure mapping:
 * - Parent WP lp_course posts (e.g. "ISOM 1 - Cấp 1") → CourseCategory
 * - WP LearnPress Sections (e.g. "ISOM KHÓA 1: A1 – NỀN TẢNG CỦA ĐỨC TIN") → Course
 * - WP LearnPress Lessons (e.g. "NỀN TẢNG CỦA ĐỨC TIN 1-6") → Lesson
 * - WP LearnPress Quizzes → Quiz (is_test = true for the whole course)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SQL_FILE = path.resolve(__dirname, '../../../hoithanhnh_2015.sql');

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 2000): Promise<T> {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      if (attempt >= retries) throw err;
      console.log(`   ⚠️ DB glitch: ${err.message}. Retrying ${attempt}/${retries}...`);
      await new Promise((r) => setTimeout(r, delayMs));
      try {
        await prisma.$connect();
      } catch {
        /* ignore */
      }
    }
  }
  throw new Error('Retry limit reached');
}

// ─────────────────────────────────────────────
// SQL PARSER & LEXER
// ─────────────────────────────────────────────

function extractTuples(valuesBlock: string): string[] {
  const tuples: string[] = [];
  let inTuple = false;
  let inString = false;
  let tupleStart = 0;
  let i = 0;

  while (i < valuesBlock.length) {
    const char = valuesBlock[i];
    if (inString) {
      if (char === '\\' && i + 1 < valuesBlock.length) {
        i += 2;
        continue;
      }
      if (char === "'") {
        if (i + 1 < valuesBlock.length && valuesBlock[i + 1] === "'") {
          i += 2;
          continue;
        }
        inString = false;
      }
      i++;
    } else {
      if (char === "'") {
        inString = true;
      } else if (char === '(' && !inTuple) {
        inTuple = true;
        tupleStart = i + 1;
      } else if (char === ')' && inTuple) {
        tuples.push(valuesBlock.substring(tupleStart, i));
        inTuple = false;
      }
      i++;
    }
  }
  return tuples;
}

function splitSqlRow(row: string): string[] {
  const values: string[] = [];
  let current = '';
  let inString = false;
  let i = 0;

  while (i < row.length) {
    const char = row[i];
    if (inString) {
      if (char === '\\' && i + 1 < row.length) {
        current += char + row[i + 1];
        i += 2;
        continue;
      }
      if (char === "'") {
        if (i + 1 < row.length && row[i + 1] === "'") {
          current += "''";
          i += 2;
          continue;
        } else {
          inString = false;
          current += char;
          i++;
          continue;
        }
      }
      current += char;
      i++;
    } else {
      if (char === "'") {
        inString = true;
        current += char;
      } else if (char === ',') {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
      i++;
    }
  }
  values.push(current.trim());
  return values;
}

function unescapeSqlValue(val: string): string {
  if (val === 'NULL' || val === 'null' || !val) return '';
  if (val.startsWith("'") && val.endsWith("'")) {
    return val
      .slice(1, -1)
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\\\/g, '\\')
      .replace(/''/g, "'");
  }
  return val;
}

function parseSqlInserts(sql: string, tableName: string): Record<string, string>[] {
  const tablePattern = new RegExp(
    `INSERT INTO \`${tableName}\`\\s*\\(([^)]+)\\)\\s*VALUES\\s*([\\s\\S]*?);\\s*(?=--|INSERT|CREATE|ALTER|DROP|COMMIT|$)`,
    'gi',
  );

  const results: Record<string, string>[] = [];

  for (const match of sql.matchAll(tablePattern)) {
    const columns = match[1].split(',').map((c) => c.trim().replace(/`/g, ''));
    const valuesBlock = match[2];
    const tuples = extractTuples(valuesBlock);

    for (const rowStr of tuples) {
      const rawValues = splitSqlRow(rowStr);
      if (rawValues.length !== columns.length) continue;
      const row: Record<string, string> = {};
      columns.forEach((col, i) => {
        row[col] = unescapeSqlValue(rawValues[i]);
      });
      results.push(row);
    }
  }

  return results;
}

function parseWpCapabilities(serialized: string): string[] {
  const caps: string[] = [];
  for (const m of serialized.matchAll(/s:\d+:"([^"]+)";b:1/g)) caps.push(m[1]);
  return caps;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.startsWith('0000')) return null;
  const d = new Date(dateStr.replace(' ', 'T') + 'Z');
  return isNaN(d.getTime()) ? null : d;
}

function htmlToMarkdown(html: string): string {
  if (!html) return '';
  return html
    .replace(/<h([1-4])[^>]*>(.*?)<\/h\1>/gi, (_, n, t) => '#'.repeat(parseInt(n)) + ' ' + t + '\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    .replace(/<[uo]l[^>]*>|<\/[uo]l>/gi, '\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─────────────────────────────────────────────
// MAIN MIGRATION
// ─────────────────────────────────────────────

async function main() {
  console.log('📖 Reading SQL dump...');
  const sql = fs.readFileSync(SQL_FILE, 'utf-8');
  console.log(`   Size: ${(sql.length / 1024 / 1024).toFixed(1)} MB`);

  console.log('\n🧹 Cleaning old educational & publishing data...');
  await withRetry(() =>
    prisma.$executeRawUnsafe(
      `TRUNCATE TABLE user_lesson_progress, quiz_attempts, quiz_template_maps, question_snapshots, question_templates, quizzes, lesson_grades, learning_sessions, lessons, course_attendance, course_grades, courses, course_categories, articles, pages RESTART IDENTITY CASCADE;`,
    ),
  );

  const defaultPasswordHash = await bcrypt.hash('123456', 10);

  // Lookup roles
  const roles = await withRetry(() => prisma.role.findMany({ select: { id: true, name: true } }));
  const roleMap: Record<string, number> = {};
  for (const r of roles) roleMap[r.name] = r.id;
  const adminRoleId = roleMap['system_admin'] ?? roleMap['church_admin'] ?? Object.values(roleMap)[0];
  const memberRoleId = roleMap['church_member'] ?? Object.values(roleMap)[0];

  // Lookup or create fallback admin author ID
  let defaultAdminUser = await withRetry(() =>
    prisma.user.findFirst({
      where: { role: { name: 'system_admin' } },
      select: { id: true },
    }),
  );
  if (!defaultAdminUser) {
    defaultAdminUser = await withRetry(() => prisma.user.findFirst({ select: { id: true } }));
  }
  let fallbackAuthorId = defaultAdminUser?.id;
  if (!fallbackAuthorId) {
    const createdAdmin = await withRetry(() =>
      prisma.user.create({
        data: {
          username: 'admin',
          email: 'admin@htnc.local',
          password_hash: defaultPasswordHash,
          role_id: adminRoleId,
          status: 'active',
          profile: {
            create: { first_name: 'System', last_name: 'Admin' },
          },
        },
      }),
    );
    fallbackAuthorId = createdAdmin.id;
  }
  console.log(`   Fallback author ID: ${fallbackAuthorId}`);

  // Root church unit for test availabilities (if present)
  const defaultUnit = await withRetry(() => prisma.churchUnit.findFirst({ select: { id: true } }));

  // ── PHASE 1: Course Categories (from WP lp_course posts) ─────
  console.log('\n📚 Phase 1: Course categories (from ISOM parent courses)...');
  const wpPosts = parseSqlInserts(sql, 'wp_posts');
  const wpPostmeta = parseSqlInserts(sql, 'wp_postmeta');

  const lpCourses = wpPosts.filter(
    (p) => p.post_type === 'lp_course' && p.post_status !== 'trash',
  );

  const courseCategoryIdMap = new Map<string, string>(); // WP lp_course post_id → CourseCategory UUID

  for (const post of lpCourses) {
    const name = post.post_title?.trim();
    if (!name) continue;
    const catId = `cc000000-0000-0000-0000-${post.ID.padStart(12, '0')}`;
    const cat = await withRetry(() =>
      prisma.courseCategory.upsert({
        where: { id: catId },
        create: { id: catId, name_vi: name, name_en: name },
        update: { name_vi: name, name_en: name },
      }),
    );
    courseCategoryIdMap.set(post.ID, cat.id);
    console.log(`   ✓ Category: ${name}`);
  }

  // ── PHASE 2: Users ──────────────────────────
  console.log('\n👤 Phase 2: Users...');
  const wpUsers = parseSqlInserts(sql, 'wp_users');
  const wpUsermeta = parseSqlInserts(sql, 'wp_usermeta');

  const usermetaMap = new Map<string, Record<string, string>>();
  for (const meta of wpUsermeta) {
    if (!usermetaMap.has(meta.user_id)) usermetaMap.set(meta.user_id, {});
    usermetaMap.get(meta.user_id)![meta.meta_key] = meta.meta_value;
  }

  const userIdMap = new Map<string, string>();

  for (const wpUser of wpUsers) {
    const meta = usermetaMap.get(wpUser.ID) ?? {};
    const caps = parseWpCapabilities(meta.wp_capabilities ?? '');
    const isAdmin = caps.some((c) => c.includes('administrator') || c === 'system_admin' || c === 'church_admin');
    const roleId = isAdmin ? adminRoleId : memberRoleId;

    const firstName = meta.first_name?.trim() || wpUser.display_name?.split(' ')[0] || wpUser.user_nicename;
    const lastName = meta.last_name?.trim() ||
      (wpUser.display_name?.includes(' ') ? wpUser.display_name.split(' ').slice(1).join(' ') : '');

    let username = (wpUser.user_login || wpUser.user_nicename)
      .toLowerCase().replace(/[^a-z0-9._@-]/g, '_').substring(0, 50);
    const email = wpUser.user_email?.toLowerCase().trim();

    if (!email || !email.includes('@')) {
      continue;
    }

    const existing = await withRetry(() =>
      prisma.user.findFirst({
        where: { OR: [{ email }, { username }] },
        select: { id: true, email: true },
      }),
    );

    if (existing) {
      userIdMap.set(wpUser.ID, existing.id);
      continue;
    }

    try {
      const user = await withRetry(() =>
        prisma.user.create({
          data: {
            username,
            email,
            password_hash: defaultPasswordHash,
            role_id: roleId,
            status: 'active',
            created_at: parseDate(wpUser.user_registered) ?? new Date(),
            profile: {
              create: {
                first_name: firstName || username,
                last_name: lastName || '',
              },
            },
          },
        }),
      );
      userIdMap.set(wpUser.ID, user.id);

      if (meta.you_avatar || meta.description) {
        await withRetry(() =>
          prisma.$executeRawUnsafe(
            `UPDATE profiles SET avatar_url = $1, bio = $2 WHERE user_id = $3::uuid`,
            meta.you_avatar || null,
            meta.description?.trim() || null,
            user.id,
          ),
        );
      }
    } catch {
      /* ignore */
    }
  }
  console.log(`   Mapped users: ${userIdMap.size}`);

  // ── PHASE 3: Courses (from WP Sections) ─────
  console.log('\n📘 Phase 3: Courses (from WP Sections like A1, A2, A3, B1...)...');
  const wpSections = parseSqlInserts(sql, 'wp_learnpress_sections');
  const wpSectionItems = parseSqlInserts(sql, 'wp_learnpress_section_items');

  const courseIdMap = new Map<string, string>(); // section_id → app Course UUID
  const sectionLessonCountMap = new Map<string, number>();

  for (const si of wpSectionItems) {
    if (si.item_type === 'lp_lesson') {
      const count = sectionLessonCountMap.get(si.section_id) ?? 0;
      sectionLessonCountMap.set(si.section_id, count + 1);
    }
  }

  for (const section of wpSections) {
    const title = section.section_name?.trim();
    if (!title) continue;

    const parentCoursePostId = section.section_course_id;
    const categoryId = courseCategoryIdMap.get(parentCoursePostId) ?? null;

    const lessonCount = sectionLessonCountMap.get(section.section_id) ?? 5;
    const estimatedMinutes = lessonCount * 45;

    let baseSlug = slugify(title);
    if (!baseSlug) baseSlug = `course-section-${section.section_id}`;
    const slug = `${baseSlug.substring(0, 85)}-s${section.section_id}`;
    const courseId = `c0000000-0000-0000-0000-${section.section_id.padStart(12, '0')}`;

    try {
      const course = await withRetry(() =>
        prisma.course.upsert({
          where: { id: courseId },
          create: {
            id: courseId,
            slug,
            title_vi: title,
            title_en: title,
            category_id: categoryId,
            status: 'published',
            estimated_duration_minutes: estimatedMinutes,
            created_by: fallbackAuthorId,
          },
          update: {
            title_vi: title,
            title_en: title,
            category_id: categoryId,
          },
        }),
      );
      courseIdMap.set(section.section_id, course.id);
      console.log(`   ✓ Course: ${title}`);
    } catch (err: any) {
      console.log(`   ✗ Course ${title}: ${err.message}`);
    }
  }

  // Fallback: If any lp_course post has NO sections, create a Course for the post itself
  for (const post of lpCourses) {
    const hasSections = wpSections.some((s) => s.section_course_id === post.ID);
    if (hasSections) continue;

    const title = post.post_title?.trim();
    if (!title) continue;

    const baseSlug = post.post_name || slugify(title);
    const slug = `${baseSlug.substring(0, 85)}-c${post.ID}`;
    const courseId = `c0000000-0000-0000-0000-${post.ID.padStart(12, '0')}`;
    const categoryId = courseCategoryIdMap.get(post.ID) ?? null;

    try {
      const course = await withRetry(() =>
        prisma.course.upsert({
          where: { id: courseId },
          create: {
            id: courseId,
            slug,
            title_vi: title,
            title_en: title,
            category_id: categoryId,
            status: 'published',
            estimated_duration_minutes: 180,
            created_by: fallbackAuthorId,
          },
          update: { title_vi: title, title_en: title },
        }),
      );
      courseIdMap.set(`post_${post.ID}`, course.id);
      console.log(`   ✓ Standalone Course: ${title}`);
    } catch {
      /* ignore */
    }
  }

  // ── PHASE 4: Lessons ────────────────────────
  console.log('\n📝 Phase 4: Lessons (linked to Section Courses)...');
  const postMap = new Map(wpPosts.map((p) => [p.ID, p]));
  const lessonIdMap = new Map<string, string>();

  // Map: section_item -> Course
  const sectionItemsByLesson = wpSectionItems
    .filter((si) => si.item_type === 'lp_lesson')
    .sort((a, b) => parseInt(a.item_order) - parseInt(b.item_order));

  for (const si of sectionItemsByLesson) {
    const courseAppId = courseIdMap.get(si.section_id);
    if (!courseAppId) continue;

    const post = postMap.get(si.item_id);
    if (!post || post.post_status === 'trash') continue;

    const contentMd = htmlToMarkdown(post.post_content);
    const orderIndex = parseInt(si.item_order) || 1;
    const createdById = userIdMap.get(post.post_author) || fallbackAuthorId;

    try {
      const lesson = await withRetry(() =>
        prisma.lesson.create({
          data: {
            course_id: courseAppId,
            title_vi: post.post_title,
            title_en: post.post_title,
            content_markdown_vi: contentMd || '',
            content_markdown_en: contentMd || '',
            order_index: orderIndex,
            created_by: createdById ?? null,
            updated_at: parseDate(post.post_modified) ?? new Date(),
          },
        }),
      );
      lessonIdMap.set(post.ID, lesson.id);
    } catch (err: any) {
      console.log(`   ✗ Lesson ${post.post_title}: ${err.message}`);
    }
  }
  console.log(`   ✓ ${lessonIdMap.size} lessons created`);

  // ── PHASE 5: Quizzes & Course Tests ─────────
  const postmetaMap = new Map<string, Record<string, string>>();
  for (const meta of wpPostmeta) {
    if (!postmetaMap.has(meta.post_id)) postmetaMap.set(meta.post_id, {});
    postmetaMap.get(meta.post_id)![meta.meta_key] = meta.meta_value;
  }

  const quizIdMap = new Map<string, string>();
  const questionIdMap = new Map<string, string>();

  // Find quizzes in sections to associate them with the whole course
  const quizSectionMap = new Map<string, string>(); // quiz post_id → section_id
  for (const si of wpSectionItems) {
    if (si.item_type === 'lp_quiz') {
      quizSectionMap.set(si.item_id, si.section_id);
    }
  }

  const lpQuizzes = wpPosts.filter((p) => p.post_type === 'lp_quiz' && p.post_status !== 'trash');
  for (const post of lpQuizzes) {
    const meta = postmetaMap.get(post.ID) ?? {};
    let timeLimitSec: number | null = null;
    const durMatch = (meta._lp_duration ?? '').match(/(\d+)\s*(minute|hour|second)/i);
    if (durMatch) {
      const n = parseInt(durMatch[1]);
      const u = durMatch[2].toLowerCase();
      timeLimitSec = u === 'hour' ? n * 3600 : u === 'second' ? n : n * 60;
    }
    const sectionId = quizSectionMap.get(post.ID);
    const courseAppId = sectionId ? courseIdMap.get(sectionId) : undefined;

    try {
      const quiz = await withRetry(() =>
        prisma.quiz.create({
          data: {
            title_vi: post.post_title,
            title_en: post.post_title,
            time_limit_seconds: timeLimitSec,
            passing_score: parseFloat(meta._lp_passing_grade ?? '50') || 50,
            is_active: true,
            is_test: true, // Each quiz is a course test for the whole course
          },
        }),
      );
      quizIdMap.set(post.ID, quiz.id);

      // Create CourseTestAvailability for the course if unit exists
      if (courseAppId && defaultUnit) {
        const ctaId = `ca000000-0000-0000-${post.ID.padStart(4, '0')}-${post.ID.padStart(12, '0')}`;
        await withRetry(() =>
          prisma.$executeRawUnsafe(
            `INSERT INTO "_ChurchUnitCourses" ("A", "B") VALUES ($1::uuid, $2::uuid) ON CONFLICT DO NOTHING`,
            defaultUnit.id,
            courseAppId,
          ),
        );
        await withRetry(() =>
          prisma.courseTestAvailability.upsert({
            where: { id: ctaId },
            create: {
              id: ctaId,
              course_id: courseAppId,
              church_unit_id: defaultUnit.id,
              quiz_id: quiz.id,
              duration_seconds: timeLimitSec || 3600,
              created_by: fallbackAuthorId,
            },
            update: {
              quiz_id: quiz.id,
              duration_seconds: timeLimitSec || 3600,
            },
          }),
        );
      }
    } catch {
      /* ignore */
    }
  }
  console.log(`   ✓ ${quizIdMap.size} course test quizzes created & linked to courses`);

  const wpAnswers = parseSqlInserts(sql, 'wp_learnpress_question_answers');
  const answersByQuestion = new Map<string, typeof wpAnswers>();
  for (const ans of wpAnswers) {
    if (!answersByQuestion.has(ans.question_id)) answersByQuestion.set(ans.question_id, []);
    answersByQuestion.get(ans.question_id)!.push(ans);
  }

  const lpQuestions = wpPosts.filter((p) => p.post_type === 'lp_question' && p.post_status !== 'trash');
  for (const post of lpQuestions) {
    const meta = postmetaMap.get(post.ID) ?? {};
    const answers = (answersByQuestion.get(post.ID) ?? [])
      .sort((a, b) => parseInt(a.order) - parseInt(b.order))
      .map((a) => ({ text: a.title, value: a.value, is_correct: a.is_true === 'yes' || a.is_true === '1' }));

    const logicConfig: any = { answers };
    const hint = meta._lp_hint?.trim();
    if (hint) logicConfig.hint_vi = hint;
    if (meta._lp_negative_marking) logicConfig.negative_marking = meta._lp_negative_marking === 'yes';
    if (meta._lp_instant_check) logicConfig.instant_check = meta._lp_instant_check === 'yes';

    try {
      const qt = await withRetry(() =>
        prisma.questionTemplate.create({
          data: {
            template_type: meta._lp_question_type ?? 'multi_choice',
            difficulty: 'medium',
            body_template_vi: post.post_title,
            body_template_en: post.post_title,
            explanation_template_vi: htmlToMarkdown(post.post_content) || null,
            explanation_template_en: htmlToMarkdown(post.post_content) || null,
            logic_config: logicConfig,
          },
        }),
      );
      questionIdMap.set(post.ID, qt.id);
    } catch {
      /* ignore */
    }
  }
  console.log(`   ✓ ${questionIdMap.size} questions`);

  // Quiz ↔ Question maps
  const wpQuizQuestions = parseSqlInserts(sql, 'wp_learnpress_quiz_questions');
  for (const mapping of wpQuizQuestions) {
    const quizAppId = quizIdMap.get(mapping.quiz_id);
    const qtAppId = questionIdMap.get(mapping.question_id);
    if (!quizAppId || !qtAppId) continue;
    try {
      await withRetry(() =>
        prisma.quizTemplateMap.upsert({
          where: { quiz_id_template_id: { quiz_id: quizAppId, template_id: qtAppId } },
          create: { quiz_id: quizAppId, template_id: qtAppId, position: parseInt(mapping.question_order) || 0, weight: 1 },
          update: { position: parseInt(mapping.question_order) || 0 },
        }),
      );
    } catch {
      /* ignore */
    }
  }
  console.log(`   ✓ Quiz-question mappings linked`);

  // ── PHASE 6: Enrollments (Cancelled per user request) ──
  console.log('\n📊 Phase 6: Enrollments skipped per user request.');

  // ── PHASE 7: Articles ───────────────────────
  console.log('\n📰 Phase 7: Articles...');
  const wpTermRelationships = parseSqlInserts(sql, 'wp_term_relationships');
  const wpTermTaxonomy = parseSqlInserts(sql, 'wp_term_taxonomy');
  const wpTerms = parseSqlInserts(sql, 'wp_terms');

  const postTermMap = new Map<string, string[]>();
  for (const rel of wpTermRelationships) {
    if (!postTermMap.has(rel.object_id)) postTermMap.set(rel.object_id, []);
    postTermMap.get(rel.object_id)!.push(rel.term_taxonomy_id);
  }
  const ttIdToTermId = new Map(wpTermTaxonomy.map((t) => [t.term_taxonomy_id, t.term_id]));

  const articleTaxTermIds = new Set(
    wpTermTaxonomy.filter((t) => t.taxonomy === 'category').map((t) => t.term_id),
  );
  const articleCategoryMap = new Map<string, number>();
  const existingArticleCats = await withRetry(() => prisma.articleCategory.findMany());
  const articleCatByName = new Map(existingArticleCats.map((c) => [c.name, c.id]));

  for (const term of wpTerms) {
    if (!articleTaxTermIds.has(term.term_id) || term.slug === 'uncategorized') continue;
    if (!articleCatByName.has(term.name)) {
      const cat = await withRetry(() =>
        prisma.articleCategory.create({ data: { name: term.name, description: term.name } }),
      );
      articleCatByName.set(term.name, cat.id);
    }
    articleCategoryMap.set(term.term_id, articleCatByName.get(term.name)!);
  }

  const wpArticlePosts = wpPosts.filter((p) => p.post_type === 'post' && p.post_status === 'publish');
  let articleCount = 0;

  for (const post of wpArticlePosts) {
    const contentMd = htmlToMarkdown(post.post_content);
    const authorId = userIdMap.get(post.post_author) || fallbackAuthorId;
    if (!authorId) continue;

    const publishedAt = parseDate(post.post_date);
    const postTermIds = (postTermMap.get(post.ID) ?? []).map((ttId) => ttIdToTermId.get(ttId));
    const catTermId = postTermIds.find((tid) => tid && articleCategoryMap.has(tid!));
    const categoryId = catTermId ? articleCategoryMap.get(catTermId) : undefined;

    let slug = post.post_name || slugify(post.post_title);
    if (!slug) slug = `article-${post.ID}`;
    const existingSlug = await withRetry(() => prisma.article.findFirst({ where: { slug }, select: { id: true } }));
    if (existingSlug) slug = `${slug.substring(0, 90)}-${post.ID}`;

    try {
      await withRetry(() =>
        prisma.article.create({
          data: {
            slug,
            title_vi: post.post_title,
            title_en: post.post_title,
            content_markdown_vi: contentMd || '',
            content_markdown_en: contentMd || '',
            status: 'published',
            published_at: publishedAt ?? new Date(),
            created_at: publishedAt ?? new Date(),
            category_id: categoryId ?? null,
            created_by: authorId,
          },
        }),
      );
      articleCount++;
      console.log(`   ✓ Article: ${post.post_title}`);
    } catch (err: any) {
      console.log(`   ✗ Article ${post.post_title}: ${err.message}`);
    }
  }

  // ── PHASE 8: Pages ──────────────────────────
  console.log('\n📄 Phase 8: Pages...');
  const wpPagePosts = wpPosts.filter((p) => p.post_type === 'page' && p.post_status === 'publish');
  let pageCount = 0;

  for (const post of wpPagePosts) {
    const contentMd = htmlToMarkdown(post.post_content);
    const authorId = userIdMap.get(post.post_author) || fallbackAuthorId;
    let slug = post.post_name || slugify(post.post_title);
    if (!slug) slug = `page-${post.ID}`;

    const existingPage = await withRetry(() => prisma.page.findFirst({ where: { slug } }));
    if (existingPage) slug = `${slug.substring(0, 90)}-${post.ID}`;

    try {
      await withRetry(() =>
        prisma.page.create({
          data: {
            slug,
            route_path: `/${slug}`,
            title_vi: post.post_title,
            title_en: post.post_title,
            content_json_vi: { markdown: contentMd || '' },
            content_json_en: { markdown: contentMd || '' },
            status: 'published',
            created_at: parseDate(post.post_date) ?? new Date(),
            created_by: authorId ?? null,
          },
        }),
      );
      pageCount++;
      console.log(`   ✓ Page: ${post.post_title}`);
    } catch (err: any) {
      console.log(`   ✗ Page ${post.post_title}: ${err.message}`);
    }
  }

  // ── SUMMARY ─────────────────────────────────
  console.log('\n✅ Migration complete!');
  console.log(`   Categories:  ${courseCategoryIdMap.size}`);
  console.log(`   Courses:     ${courseIdMap.size}`);
  console.log(`   Lessons:     ${lessonIdMap.size}`);
  console.log(`   Quizzes:     ${quizIdMap.size}`);
  console.log(`   Questions:   ${questionIdMap.size}`);
  console.log(`   Articles:    ${articleCount}`);
  console.log(`   Pages:       ${pageCount}`);
}

main()
  .catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
