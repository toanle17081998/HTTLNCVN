import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomInt } from 'node:crypto';

import { PrismaService } from '../../database/prisma.service';
import type {
  CourseDto,
  CourseListDto,
  CourseListResult,
  CourseTestAvailabilityDto,
  CourseTestStatusDto,
  CreateCourseDto,
  CreateLessonDto,
  CreateQuestionTemplateDto,
  CreateQuizDto,
  PublishCourseTestDto,
  LessonDto,
  QuestionSnapshotDto,
  QuestionTemplateDto,
  QuizAttemptDto,
  QuizDto,
  QuizListDto,
  SubmitAnswerResultDto,
  UpdateCourseDto,
  UpdateLessonDto,
  UpdateQuestionTemplateDto,
  UpdateQuizDto,
} from './course.types';

type CourseWithListRelations = Prisma.CourseGetPayload<{
  include: { _count: { select: { lessons: true } }; creator: true; category: true };
}>;

type CourseWithDetailRelations = Prisma.CourseGetPayload<{
  include: {
    _count: { select: { lessons: true } };
    creator: true;
    category: true;
    lessons: {
      include: {
        templates: {
          include: {
            lesson: true,
            quiz_maps: {
              include: { quiz: { include: { _count: { select: { quiz_maps: true } } } } },
            },
          },
        },
      },
    };
  };
}>;

type LessonWithRelations = Prisma.LessonGetPayload<{
  include: {
    course: true;
    templates: {
      include: {
        lesson: true;
        quiz_maps: {
          include: { quiz: { include: { _count: { select: { quiz_maps: true } } } } };
        };
      };
    };
  };
}>;

type TemplateWithLesson = Prisma.QuestionTemplateGetPayload<{
  include: { lesson: true };
}>;

type QuizWithRelations = Prisma.QuizGetPayload<{
  include: {
    _count: { select: { quiz_maps: true } };
    quiz_maps: {
      include: { template: { include: { lesson: true } } };
      orderBy: { position: 'asc' };
    };
  };
}>;

type AttemptWithRelations = Prisma.QuizAttemptGetPayload<{
  include: {
    quiz: { include: { _count: { select: { quiz_maps: true } } } };
    test_availability: true;
    snapshots: {
      include: { template: { include: { lesson: true } } };
      orderBy: { id: 'asc' };
    };
  };
}>;

function toNumber(value: Prisma.Decimal | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return Number(value);
}

function normalizeAnswer(value: string | null | undefined): string {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function isAnswerCorrect(
  studentAnswer: string,
  rightAnswer: string | null,
  type: string,
  logicConfig?: Prisma.JsonValue,
): boolean {
  if (!studentAnswer || !studentAnswer.trim()) return false;

  const normalizedStudent = normalizeAnswer(studentAnswer);

  const config = logicConfig as {
    answers?: Array<{ text?: string; value?: string; is_correct?: boolean }>;
  };
  if (Array.isArray(config?.answers) && config.answers.length > 0) {
    const correctChoices = config.answers.filter((a) => a.is_correct);
    return correctChoices.some(
      (a) =>
        (a.value && normalizeAnswer(a.value) === normalizedStudent) ||
        (a.text && normalizeAnswer(a.text) === normalizedStudent),
    );
  }

  if (!rightAnswer || !rightAnswer.trim()) return false;

  if (type !== 'multiple_choices') return normalizedStudent === normalizeAnswer(rightAnswer);
  const normalizeList = (value: string | null) =>
    String(value ?? '').split(',').map(normalizeAnswer).filter(Boolean).sort().join('|');
  return normalizeList(studentAnswer) === normalizeList(rightAnswer);
}

function shuffle<T>(values: readonly T[]): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function getCorrectAnswerDisplay(template: {
  answer_formula: string | null;
  logic_config: Prisma.JsonValue;
}): string | null {
  if (!template.answer_formula && !template.logic_config) return null;

  const config = template.logic_config as {
    answers?: Array<{ text?: string; value?: string; is_correct?: boolean }>;
  };

  if (Array.isArray(config?.answers) && config.answers.length > 0) {
    const correctChoices = config.answers.filter(
      (a) =>
        a.is_correct ||
        (a.value && template.answer_formula?.split(',').map((s) => s.trim()).includes(a.value.trim())),
    );
    if (correctChoices.length > 0) {
      return correctChoices
        .map((a) => (a.text && a.text.trim() ? a.text.trim() : a.value?.trim() ?? ''))
        .filter(Boolean)
        .join(', ');
    }
  }

  return template.answer_formula;
}

function getQuestionChoices(template: {
  answer_formula: string | null;
  logic_config: Prisma.JsonValue;
  template_type: string;
}): string[] {
  const config = template.logic_config as {
    false_answers?: unknown;
    answers?: Array<{ text?: string; value?: string }>;
  };

  if (Array.isArray(config?.answers) && config.answers.length > 0) {
    return config.answers
      .map((a) => (a.text && a.text.trim() ? a.text.trim() : a.value?.trim() ?? ''))
      .filter(Boolean);
  }

  const falseAnswers = Array.isArray(config?.false_answers)
    ? config.false_answers.filter((answer): answer is string => typeof answer === 'string' && Boolean(answer.trim()))
    : [];
  let correctAnswers: string[] = [];

  if (template.template_type === 'theoretical_question') {
    correctAnswers = template.answer_formula ? [template.answer_formula] : [];
  } else if (template.template_type === 'multiple_choices') {
    correctAnswers = template.answer_formula?.split(',').map((answer) => answer.trim()).filter(Boolean) ?? [];
  } else if (template.template_type === 'true_false') {
    return ['true', 'false'];
  }

  return [...new Set([...falseAnswers, ...correctAnswers])];
}

function getSnapshotPosition(snapshot: AttemptWithRelations['snapshots'][number]): number {
  const variables = snapshot.generated_variables as { position?: unknown };
  return typeof variables?.position === 'number' ? variables.position : Number.MAX_SAFE_INTEGER;
}

@Injectable()
export class CourseRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapCourseList(c: CourseWithListRelations): CourseListDto {
    return {
      cover_image_url: c.cover_image_url,
      creator: c.creator ? { id: c.creator.id, username: c.creator.username } : null,
      estimated_duration_minutes: c.estimated_duration_minutes,
      id: c.id,
      lesson_count: c._count.lessons,
      category_id: c.category_id,
      category: c.category ? {
        id: c.category.id,
        name_en: c.category.name_en,
        name_vi: c.category.name_vi,
        created_at: c.category.created_at.toISOString(),
      } : null,
      published_at: c.published_at?.toISOString() ?? null,
      slug: c.slug,
      status: c.status,
      summary_en: c.summary_en,
      summary_vi: c.summary_vi,
      title_en: c.title_en,
      title_vi: c.title_vi,
    };
  }

  private mapCourseDetail(
    c: CourseWithDetailRelations,
    isEnrolled = false,
    isAllowed = true,
    showAnswers = false,
  ): CourseDto {
    return {
      cover_image_url: c.cover_image_url,
      created_at: c.created_at.toISOString(),
      creator: c.creator ? { id: c.creator.id, username: c.creator.username } : null,
      description_en: c.description_en,
      description_vi: c.description_vi,
      estimated_duration_minutes: c.estimated_duration_minutes,
      id: c.id,
      is_enrolled: isEnrolled,
      is_allowed: isAllowed,
      lesson_count: c._count.lessons,
      lessons: isAllowed ? c.lessons.map((l) => ({
        content_markdown_en: l.content_markdown_en,
        content_markdown_vi: l.content_markdown_vi,
        id: l.id,
        order_index: l.order_index,
        quiz_count: new Set(l.templates.flatMap((t) => t.quiz_maps.map((m) => m.quiz_id))).size,
        title_en: l.title_en,
        title_vi: l.title_vi,
        template_count: l.templates.length,
        templates: showAnswers ? l.templates.map((t) => this.mapTemplate(t as any, true)) : [],
      })) : [],
      category_id: c.category_id,
      category: c.category ? {
        id: c.category.id,
        name_en: c.category.name_en,
        name_vi: c.category.name_vi,
        created_at: c.category.created_at.toISOString(),
      } : null,
      published_at: c.published_at?.toISOString() ?? null,
      slug: c.slug,
      status: c.status,
      summary_en: c.summary_en,
      summary_vi: c.summary_vi,
      title_en: c.title_en,
      title_vi: c.title_vi,
    };
  }

  private mapTemplate(template: TemplateWithLesson, showAnswers = true): QuestionTemplateDto {
    const type = template.template_type;
    const choices = getQuestionChoices(template).sort();

    return {
      allows_multiple:
        type === 'multiple_choices' &&
        String(template.answer_formula ?? '').split(',').filter((answer) => answer.trim()).length > 1,
      answer_formula: showAnswers ? getCorrectAnswerDisplay(template) : null,
      body_template_en: template.body_template_en,
      body_template_vi: template.body_template_vi,
      created_at: template.created_at.toISOString(),
      difficulty: template.difficulty,
      explanation_template_en: showAnswers ? template.explanation_template_en : null,
      explanation_template_vi: showAnswers ? template.explanation_template_vi : null,
      id: template.id,
      lesson: template.lesson
        ? {
            id: template.lesson.id,
            order_index: template.lesson.order_index,
            title_en: template.lesson.title_en,
            title_vi: template.lesson.title_vi,
          }
        : null,
      lesson_id: template.lesson_id,
      template_type: template.template_type,
      logic_config: showAnswers ? template.logic_config : null,
      choices,
    };
  }

  private mapQuizList(quiz: Prisma.QuizGetPayload<{ include: { _count: { select: { quiz_maps: true } } } }>): QuizListDto {
    return {
      id: quiz.id,
      is_active: quiz.is_active ?? true,
      is_test: quiz.is_test,
      passing_score: toNumber(quiz.passing_score) ?? 50,
      question_count: quiz._count.quiz_maps,
      time_limit_seconds: quiz.time_limit_seconds,
      title_en: quiz.title_en,
      title_vi: quiz.title_vi,
    };
  }

  private mapQuiz(quiz: QuizWithRelations): QuizDto {
    return {
      ...this.mapQuizList(quiz),
      templates: quiz.quiz_maps.map((map) => this.mapTemplate(map.template, false)),
    };
  }

  private mapSnapshot(snapshot: AttemptWithRelations['snapshots'][number], showAnswers = false): QuestionSnapshotDto {
    const template = snapshot.template ? this.mapTemplate(snapshot.template, showAnswers) : null;
    const variables = snapshot.generated_variables as { choices?: unknown };
    if (
      template &&
      Array.isArray(variables?.choices) &&
      variables.choices.length > 0 &&
      variables.choices.every((choice) => typeof choice === 'string')
    ) {
      template.choices = variables.choices as string[];
    }
    return {
      id: snapshot.id,
      is_correct: showAnswers ? snapshot.is_correct : null,
      points_earned: showAnswers ? snapshot.points_earned : null,
      responded_at: snapshot.responded_at?.toISOString() ?? null,
      student_answer: snapshot.student_answer,
      template,
    };
  }

  private mapAttempt(attempt: AttemptWithRelations): QuizAttemptDto {
    const showAnswers = attempt.is_completed ?? false;
    return {
      completed_at: attempt.completed_at?.toISOString() ?? null,
      deadline_at: attempt.deadline_at?.toISOString() ?? null,
      id: attempt.id,
      is_completed: attempt.is_completed ?? false,
      is_test: Boolean(attempt.test_availability_id),
      quiz: attempt.quiz ? this.mapQuizList(attempt.quiz) : null,
      quiz_id: attempt.quiz_id,
      snapshots: [...attempt.snapshots]
        .sort((left, right) => getSnapshotPosition(left) - getSnapshotPosition(right) || left.id.localeCompare(right.id))
        .map((snapshot) => this.mapSnapshot(snapshot, showAnswers)),
      started_at: attempt.started_at.toISOString(),
      total_score: toNumber(attempt.total_score),
    };
  }

  private mapTestAvailability(availability: Prisma.CourseTestAvailabilityGetPayload<{
    include: {
      church_unit: true;
      quiz: { include: { _count: { select: { quiz_maps: true } } } };
    };
  }>): CourseTestAvailabilityDto {
    return {
      church_unit: { id: availability.church_unit.id, name: availability.church_unit.name },
      course_id: availability.course_id,
      created_at: availability.created_at.toISOString(),
      duration_seconds: availability.duration_seconds,
      id: availability.id,
      is_active: availability.is_active,
      quiz: this.mapQuizList(availability.quiz),
    };
  }

  async findAll(skip: number, take: number, status?: string, categoryId?: string, q?: string): Promise<CourseListResult> {
    const where: Prisma.CourseWhereInput = {
      deleted_at: null,
      ...(status !== undefined && { status }),
      ...(categoryId !== undefined && { category_id: categoryId }),
      ...(q && {
        OR: [
          { title_en: { contains: q, mode: 'insensitive' } },
          { title_vi: { contains: q, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        include: { _count: { select: { lessons: true } }, creator: true, category: true },
        orderBy: { published_at: 'desc' },
        skip,
        take,
        where,
      }),
      this.prisma.course.count({ where }),
    ]);

    return { items: items.map((c) => this.mapCourseList(c)), total };
  }

  async findBySlug(slug: string, viewerId?: string, viewerRole?: string): Promise<CourseDto | null> {
    const c = await this.prisma.course.findFirst({
      include: {
        _count: { select: { lessons: true } },
        attendees: true,
        creator: true,
        category: true,
        grades: viewerId ? { where: { user_id: viewerId } } : false,
        lessons: {
          include: {
            templates: {
              include: {
                lesson: true,
                quiz_maps: {
                  include: { quiz: { include: { _count: { select: { quiz_maps: true } } } } },
                },
              },
            },
          },
          orderBy: { order_index: 'asc' },
        },
      } as any,
      where: { slug, deleted_at: null },
    });

    if (!c) return null;

    let isEnrolled = false;
    let isAllowed = true;

    if (viewerId) {
      if (viewerRole === 'church_admin' || viewerRole === 'system_admin') {
        isEnrolled = true;
        isAllowed = true;
      } else {
        isEnrolled = c.grades && c.grades.length > 0;
        if (c.attendees.length > 0) {
          const isAttendee = c.attendees.some((a: any) => a.user_id === viewerId);
          isAllowed = isAttendee && isEnrolled;
        } else {
          isAllowed = isEnrolled;
        }
      }
    } else {
      isAllowed = false;
    }

    // Cast needed because attendees and grades are dynamically added to the payload
    return this.mapCourseDetail(
      c as unknown as CourseWithDetailRelations,
      isEnrolled,
      isAllowed,
      viewerRole === 'church_admin' || viewerRole === 'system_admin',
    );
  }

  async create(dto: CreateCourseDto, creatorId: string): Promise<CourseDto> {
    const c = await this.prisma.course.create({
      data: {
        cover_image_url: dto.cover_image_url,
        created_by: creatorId,
        description_en: dto.description_en,
        description_vi: dto.description_vi,
        estimated_duration_minutes: dto.estimated_duration_minutes ?? 0,
        category_id: dto.category_id,
        slug: dto.slug,
        summary_en: dto.summary_en,
        summary_vi: dto.summary_vi,
        title_en: dto.title_en,
        title_vi: dto.title_vi,
      },
      include: {
        _count: { select: { lessons: true } },
        creator: true,
        category: true,
        lessons: {
          include: {
            templates: {
              include: {
                lesson: true,
                quiz_maps: {
                  include: { quiz: { include: { _count: { select: { quiz_maps: true } } } } },
                },
              },
            },
          },
        },
      },
    });

    return this.mapCourseDetail(c as unknown as CourseWithDetailRelations, true, true, true);
  }

  async update(slug: string, dto: UpdateCourseDto): Promise<CourseDto | null> {
    const c = await this.prisma.course.update({
      data: {
        ...dto,
        ...(dto.status === 'published' && { published_at: new Date() }),
      },
      include: {
        _count: { select: { lessons: true } },
        creator: true,
        category: true,
        lessons: {
          include: {
            templates: {
              include: {
                lesson: true,
                quiz_maps: {
                  include: { quiz: { include: { _count: { select: { quiz_maps: true } } } } },
                },
              },
            },
          },
          orderBy: { order_index: 'asc' },
        },
      } as any,
      where: { slug },
    });

    return this.mapCourseDetail(c as unknown as CourseWithDetailRelations, true, true, true);
  }

  async delete(slug: string): Promise<void> {
    await this.prisma.course.update({
      data: { deleted_at: new Date() },
      where: { slug },
    });
  }

  private async resolveCourseId(idOrSlug: string): Promise<string> {
    // Check if it's already a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(idOrSlug)) return idOrSlug;

    const course = await this.prisma.course.findFirst({
      select: { id: true },
      where: { slug: idOrSlug, deleted_at: null },
    });

    if (!course) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Course not found.' });
    }

    return course.id;
  }

  async enroll(courseId: string, userId: string): Promise<void> {
    const realId = await this.resolveCourseId(courseId);
    try {
      await this.prisma.courseGrade.create({
        data: { course_id: realId, status: 'enrolled', user_id: userId },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException({
          code: 'ALREADY_ENROLLED',
          message: 'You are already enrolled in this course.',
        });
      }

      throw error;
    }
  }

  async enrollOthers(courseId: string, dto: import('./course.types').EnrollOthersDto): Promise<void> {
    const realId = await this.resolveCourseId(courseId);
    let allUserIds: string[] = [];

    if (dto.member_ids && dto.member_ids.length > 0) {
      allUserIds = dto.member_ids;
    } else {
      const { userIds } = await this.getUserIdsFromEmails(dto.emails ?? []);
      allUserIds = [...userIds];

      if (dto.church_unit_id) {
        const unitIds = await this.getChurchUnitMemberIds(dto.church_unit_id);
        allUserIds = [...new Set([...allUserIds, ...unitIds])];
      }
    }

    const operations: any[] = [];

    if (allUserIds.length > 0) {
      operations.push(
        ...allUserIds.map((userId) =>
          this.prisma.courseGrade.upsert({
            where: { user_id_course_id: { user_id: userId, course_id: realId } },
            create: { course_id: realId, status: 'enrolled', user_id: userId },
            update: { status: 'enrolled' },
          }),
        ),
        ...allUserIds.map((userId) =>
          this.prisma.courseAttendance.upsert({
            where: { course_id_user_id: { course_id: realId, user_id: userId } },
            create: { course_id: realId, user_id: userId },
            update: {},
          }),
        ),
      );
    }

    if (dto.remove_member_ids && dto.remove_member_ids.length > 0) {
      operations.push(
        this.prisma.courseGrade.deleteMany({
          where: { course_id: realId, user_id: { in: dto.remove_member_ids } },
        }),
        this.prisma.courseAttendance.deleteMany({
          where: { course_id: realId, user_id: { in: dto.remove_member_ids } },
        }),
      );
    }

    if (operations.length > 0) {
      await this.prisma.$transaction(operations);
    }
  }

  async previewEnrollment(courseId: string, dto: import('./course.types').EnrollOthersDto): Promise<import('./course.types').EnrollPreviewDto> {
    const realId = await this.resolveCourseId(courseId);

    const [enrolledTotal, authorizedTotal] = await Promise.all([
      this.prisma.courseGrade.count({ where: { course_id: realId } }),
      this.prisma.courseAttendance.count({ where: { course_id: realId } }),
    ]);

    const { userIds, invalidEmails } = await this.getUserIdsFromEmails(dto.emails ?? []);
    let allTargetIds = [...userIds];

    if (dto.church_unit_id) {
      const unitIds = await this.getChurchUnitMemberIds(dto.church_unit_id);
      allTargetIds = [...new Set([...allTargetIds, ...unitIds])];
    }

    // Always include already enrolled members so they can be removed
    const existingMembers = await this.prisma.user.findMany({
      where: {
        OR: [
          { course_grades: { some: { course_id: realId } } },
          { course_attendances: { some: { course_id: realId } } },
        ],
        deleted_at: null,
      },
      select: { id: true },
    });
    const existingIds = existingMembers.map((m) => m.id);
    allTargetIds = [...new Set([...allTargetIds, ...existingIds])];

    if (allTargetIds.length === 0) {
      return {
        members: [],
        invalid_emails: invalidEmails,
        enrolled_count: enrolledTotal,
        authorized_count: authorizedTotal,
      };
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: allTargetIds } },
      include: {
        profile: { select: { first_name: true, last_name: true } },
        course_grades: {
          where: { course_id: realId },
          select: { id: true },
        },
        course_attendances: {
          where: { course_id: realId },
          select: { course_id: true },
        },
      },
    });

    const members: import('./course.types').EnrollPreviewMemberDto[] = users.map((u) => ({
      id: u.id,
      email: u.email,
      username: u.username,
      first_name: u.profile?.first_name,
      last_name: u.profile?.last_name,
      is_enrolled: u.course_grades.length > 0,
      is_authorized: u.course_attendances.length > 0,
    }));

    return {
      members,
      invalid_emails: invalidEmails,
      enrolled_count: enrolledTotal,
      authorized_count: authorizedTotal,
    };
  }

  private async getUserIdsFromEmails(emails: string[]): Promise<{ userIds: string[]; invalidEmails: string[] }> {
    if (!emails.length) return { userIds: [], invalidEmails: [] };

    const users = await this.prisma.user.findMany({
      where: {
        email: { in: emails, mode: 'insensitive' },
        deleted_at: null,
      },
      select: { id: true, email: true },
    });

    const userIds = users.map((u) => u.id);
    const foundEmails = new Set(users.map((u) => u.email.toLowerCase()));
    const invalidEmails = emails.filter((e) => !foundEmails.has(e.toLowerCase()));

    return { userIds, invalidEmails };
  }

  private async getChurchUnitMemberIds(unitId: string): Promise<string[]> {
    const unit = await this.prisma.churchUnit.findUnique({
      where: { id: unitId },
      include: {
        members: { select: { user_id: true } },
      },
    });

    if (!unit) return [];

    const ids = unit.members.map((m) => m.user_id);
    if (unit.leader_id) {
      ids.push(unit.leader_id);
    }

    return [...new Set(ids)];
  }

  async findLessonById(id: string, viewerId?: string, viewerRole?: string): Promise<LessonDto | null> {
    const lesson = await this.prisma.lesson.findUnique({
      include: {
        course: {
          include: {
            attendees: true,
            grades: viewerId ? { where: { user_id: viewerId } } : false,
          },
        },
        templates: {
          include: {
            lesson: true,
            quiz_maps: {
              include: { quiz: { include: { _count: { select: { quiz_maps: true } } } } },
            },
          },
        },
      },
      where: { id },
    });

    if (!lesson) return null;

    if (viewerId) {
      // Admins can see all lessons
      if (viewerRole === 'church_admin' || viewerRole === 'system_admin') {
        return this.mapLesson(lesson, true);
      }

      // Check access
      const isEnrolled = lesson.course.grades && lesson.course.grades.length > 0;
      let isAllowed = false;

      if (lesson.course.attendees.length > 0) {
        const isAttendee = lesson.course.attendees.some((a) => a.user_id === viewerId);
        isAllowed = isAttendee && isEnrolled;
      } else {
        isAllowed = isEnrolled;
      }

      if (!isAllowed) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'You must be enrolled and authorized to view this lesson.',
        });
      }
    }

    return this.mapLesson(lesson);
  }

  async createLesson(courseSlug: string, dto: CreateLessonDto, creatorId: string): Promise<LessonDto | null> {
    const course = await this.prisma.course.findFirst({
      select: { id: true },
      where: { slug: courseSlug, deleted_at: null },
    });
    if (!course) return null;

    const lesson = await this.prisma.lesson.create({
      data: {
        content_markdown_en: dto.content_markdown_en,
        content_markdown_vi: dto.content_markdown_vi,
        course_id: course.id,
        created_by: creatorId,
        order_index: dto.order_index,
        title_en: dto.title_en,
        title_vi: dto.title_vi,
      },
      include: {
        course: true,
        templates: {
          include: {
            lesson: true,
            quiz_maps: {
              include: { quiz: { include: { _count: { select: { quiz_maps: true } } } } },
            },
          },
        },
      },
    });

    return this.mapLesson(lesson);
  }

  async updateLesson(id: string, dto: UpdateLessonDto): Promise<LessonDto | null> {
    const lesson = await this.prisma.lesson.update({
      data: dto,
      include: {
        course: true,
        templates: {
          include: {
            lesson: true,
            quiz_maps: {
              include: { quiz: { include: { _count: { select: { quiz_maps: true } } } } },
            },
          },
        },
      },
      where: { id },
    });

    return this.mapLesson(lesson);
  }

  async deleteLesson(id: string): Promise<void> {
    await this.prisma.lesson.delete({ where: { id } });
  }

  private mapLesson(lesson: LessonWithRelations, showAnswers = false): LessonDto {
    const quizMap = new Map<string, QuizListDto>();
    lesson.templates.forEach((template) => {
      template.quiz_maps.forEach((map) => {
        quizMap.set(map.quiz.id, this.mapQuizList(map.quiz));
      });
    });

    return {
      content_markdown_en: lesson.content_markdown_en,
      content_markdown_vi: lesson.content_markdown_vi,
      course: {
        id: lesson.course.id,
        slug: lesson.course.slug,
        title_en: lesson.course.title_en,
        title_vi: lesson.course.title_vi,
      },
      course_id: lesson.course_id,
      created_by: lesson.created_by,
      id: lesson.id,
      order_index: lesson.order_index,
      quiz_count: quizMap.size,
      quizzes: Array.from(quizMap.values()),
      title_en: lesson.title_en,
      title_vi: lesson.title_vi,
      updated_at: lesson.updated_at.toISOString(),
      templates: showAnswers ? lesson.templates.map((t) => this.mapTemplate(t as any, true)) : [],
    };
  }

  async createTemplate(lessonId: string, dto: CreateQuestionTemplateDto): Promise<QuestionTemplateDto> {
    const template = await this.prisma.questionTemplate.create({
      data: {
        answer_formula: dto.answer_formula,
        body_template_en: dto.body_template_en,
        body_template_vi: dto.body_template_vi,
        difficulty: dto.difficulty ?? 'medium',
        explanation_template_en: dto.explanation_template_en,
        explanation_template_vi: dto.explanation_template_vi,
        lesson_id: lessonId,
        logic_config: (dto.logic_config ?? {}) as Prisma.InputJsonValue,
        template_type: dto.template_type ?? 'short_answer',
      },
      include: { lesson: true },
    });

    return this.mapTemplate(template);
  }

  async updateTemplate(templateId: string, dto: UpdateQuestionTemplateDto): Promise<QuestionTemplateDto> {
    const template = await this.prisma.questionTemplate.update({
      where: { id: templateId },
      data: {
        ...(dto.answer_formula !== undefined && { answer_formula: dto.answer_formula }),
        ...(dto.body_template_en !== undefined && { body_template_en: dto.body_template_en }),
        ...(dto.body_template_vi !== undefined && { body_template_vi: dto.body_template_vi }),
        ...(dto.difficulty !== undefined && { difficulty: dto.difficulty }),
        ...(dto.explanation_template_en !== undefined && { explanation_template_en: dto.explanation_template_en }),
        ...(dto.explanation_template_vi !== undefined && { explanation_template_vi: dto.explanation_template_vi }),
        ...(dto.logic_config !== undefined && { logic_config: dto.logic_config as Prisma.InputJsonValue }),
        ...(dto.template_type !== undefined && { template_type: dto.template_type }),
      },
      include: { lesson: true },
    });

    return this.mapTemplate(template);
  }

  async deleteTemplate(templateId: string): Promise<void> {
    await this.prisma.questionTemplate.delete({
      where: { id: templateId },
    });
  }

  async listQuizzes(courseSlug?: string): Promise<QuizListDto[]> {
    const quizzes = await this.prisma.quiz.findMany({
      include: { _count: { select: { quiz_maps: true } } },
      orderBy: { title_vi: 'asc' },
      where: {
        is_test: false,
        ...(courseSlug
          ? {
            quiz_maps: {
              some: {
                template: {
                  lesson: {
                    course: { slug: courseSlug },
                  },
                },
              },
            },
            }
          : {}),
      },
    });

    return quizzes.map((quiz) => this.mapQuizList(quiz));
  }

  async findQuiz(id: string): Promise<QuizDto | null> {
    const quiz = await this.prisma.quiz.findUnique({
      include: {
        _count: { select: { quiz_maps: true } },
        quiz_maps: {
          include: { template: { include: { lesson: true } } },
          orderBy: { position: 'asc' },
        },
      },
      where: { id },
    });

    return quiz ? this.mapQuiz(quiz) : null;
  }

  async createQuiz(dto: CreateQuizDto): Promise<QuizDto> {
    const quiz = await this.prisma.quiz.create({
      data: {
        is_active: dto.is_active ?? true,
        passing_score: dto.passing_score,
        time_limit_seconds: dto.time_limit_seconds,
        title_en: dto.title_en,
        title_vi: dto.title_vi,
        quiz_maps: {
          create: (dto.template_ids ?? []).map((templateId, index) => ({
            position: index + 1,
            template_id: templateId,
          })),
        },
      },
      include: {
        _count: { select: { quiz_maps: true } },
        quiz_maps: {
          include: { template: { include: { lesson: true } } },
          orderBy: { position: 'asc' },
        },
      },
    });

    return this.mapQuiz(quiz);
  }

  async updateQuiz(id: string, dto: UpdateQuizDto): Promise<QuizDto> {
    const quiz = await this.prisma.$transaction(async (tx) => {
      await tx.quiz.update({
        data: {
          is_active: dto.is_active,
          passing_score: dto.passing_score,
          time_limit_seconds: dto.time_limit_seconds,
          title_en: dto.title_en,
          title_vi: dto.title_vi,
        },
        where: { id },
      });

      if (dto.template_ids) {
        await tx.quizTemplateMap.deleteMany({ where: { quiz_id: id } });
        await tx.quizTemplateMap.createMany({
          data: dto.template_ids.map((templateId, index) => ({
            position: index + 1,
            quiz_id: id,
            template_id: templateId,
          })),
        });
      }

      return tx.quiz.findUniqueOrThrow({
        include: {
          _count: { select: { quiz_maps: true } },
          quiz_maps: {
            include: { template: { include: { lesson: true } } },
            orderBy: { position: 'asc' },
          },
        },
        where: { id },
      });
    });

    return this.mapQuiz(quiz);
  }

  async deleteQuiz(id: string): Promise<void> {
    await this.prisma.quiz.delete({ where: { id } });
  }

  async getCourseTestStatus(slug: string, userId: string, userRole?: string): Promise<CourseTestStatusDto | null> {
    if (slug === 'isom-b-5') return null;
    const course = await this.prisma.course.findFirst({ where: { deleted_at: null, slug } });
    if (!course) return null;

    const privileged = userRole === 'system_admin' || userRole === 'church_admin';
    const managedClasses = await this.prisma.churchUnit.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
      where: {
        courses: { some: { id: course.id } },
        type: 'class',
        ...(privileged
          ? {}
          : {
              members: {
                some: { role: { in: ['admin', 'admin_member'] }, user_id: userId },
              },
            }),
      },
    });
    const canManage = privileged || managedClasses.length > 0;

    const availability = await this.prisma.courseTestAvailability.findFirst({
      include: {
        church_unit: true,
        quiz: { include: { _count: { select: { quiz_maps: true } } } },
      },
      orderBy: { created_at: 'desc' },
      where: {
        course_id: course.id,
        is_active: true,
        church_unit: privileged
          ? { id: { in: managedClasses.map(({ id }) => id) } }
          : { members: { some: { user_id: userId } } },
      },
    });

    let attempt: QuizAttemptDto | null = null;
    if (availability) {
      const existing = await this.prisma.quizAttempt.findFirst({
        select: { id: true },
        where: { test_availability_id: availability.id, user_id: userId },
      });
      if (existing) attempt = await this.findAttempt(existing.id, userId);
    }

    const questionBank = canManage
      ? await this.prisma.questionTemplate.findMany({
          include: { lesson: true },
          orderBy: { created_at: 'asc' },
          where: { lesson: { course_id: course.id } },
        })
      : [];

    return {
      attempt,
      availability: availability ? this.mapTestAvailability(availability) : null,
      can_manage: canManage,
      managed_classes: managedClasses,
      question_bank: questionBank.map((template) => this.mapTemplate(template, true)),
    };
  }

  async publishCourseTest(
    slug: string,
    dto: PublishCourseTestDto,
    userId: string,
    userRole?: string,
  ): Promise<CourseTestAvailabilityDto> {
    if (slug === 'isom-b-5') {
      throw new ForbiddenException('Tests are not allowed for this course.');
    }
    const course = await this.prisma.course.findFirst({ where: { deleted_at: null, slug } });
    if (!course) throw new NotFoundException('Course not found.');
    if (!Number.isInteger(dto.duration_seconds) || dto.duration_seconds < 60) {
      throw new ConflictException('Test duration must be at least 60 seconds.');
    }

    const privileged = userRole === 'system_admin' || userRole === 'church_admin';
    const churchUnits = await this.prisma.churchUnit.findMany({
      select: { id: true },
      where: {
        courses: { some: { id: course.id } },
        type: 'class',
        ...(privileged
          ? {}
          : { members: { some: { role: { in: ['admin', 'admin_member'] }, user_id: userId } } }),
      },
    });
    if (!churchUnits.length) {
      throw new ForbiddenException('No classes assigned to this course can be managed by this administrator.');
    }
    const churchUnitIds = churchUnits.map(({ id }) => id);

    const requestedIds = [...new Set(dto.template_ids ?? [])];
    if (requestedIds.length) {
      const validCount = await this.prisma.questionTemplate.count({
        where: { id: { in: requestedIds }, lesson: { course_id: course.id } },
      });
      if (validCount !== requestedIds.length) throw new ForbiddenException('Invalid test question selection.');
    }

    const availabilityId = await this.prisma.$transaction(async (tx) => {
      const newTemplateIds: string[] = [];
      for (const question of dto.new_questions ?? []) {
        const lesson = await tx.lesson.findFirst({
          select: { id: true },
          where: { course_id: course.id, id: question.lesson_id },
        });
        if (!lesson) throw new ForbiddenException('New test questions must belong to this course.');
        const template = await tx.questionTemplate.create({
          data: {
            answer_formula: question.answer_formula,
            body_template_en: question.body_template_en,
            body_template_vi: question.body_template_vi,
            difficulty: question.difficulty ?? 'medium',
            explanation_template_en: question.explanation_template_en,
            explanation_template_vi: question.explanation_template_vi,
            lesson_id: lesson.id,
            logic_config: (question.logic_config ?? {}) as Prisma.InputJsonValue,
            template_type: question.template_type ?? 'short_answer',
          },
        });
        newTemplateIds.push(template.id);
      }

      const templateIds = [...requestedIds, ...newTemplateIds];
      if (!templateIds.length) throw new ConflictException('Select or create at least one test question.');

      await tx.courseTestAvailability.updateMany({
        data: { closed_at: new Date(), is_active: false },
        where: { church_unit_id: { in: churchUnitIds }, course_id: course.id, is_active: true },
      });
      const quiz = await tx.quiz.create({
        data: {
          is_active: true,
          is_test: true,
          passing_score: 70,
          quiz_maps: {
            create: templateIds.map((templateId, index) => ({ position: index + 1, template_id: templateId })),
          },
          time_limit_seconds: dto.duration_seconds,
          title_en: dto.title_en?.trim() || `${course.title_en} Final Test`,
          title_vi: dto.title_vi?.trim() || `${course.title_vi} - Bài kiểm tra cuối khóa`,
        },
      });
      let firstAvailabilityId = '';
      for (const churchUnitId of churchUnitIds) {
        const created = await tx.courseTestAvailability.create({
          data: {
            church_unit_id: churchUnitId,
            course_id: course.id,
            created_by: userId,
            duration_seconds: dto.duration_seconds,
            quiz_id: quiz.id,
          },
        });
        firstAvailabilityId ||= created.id;
      }
      return firstAvailabilityId;
    });

    const availability = await this.prisma.courseTestAvailability.findUniqueOrThrow({
      include: { church_unit: true, quiz: { include: { _count: { select: { quiz_maps: true } } } } },
      where: { id: availabilityId },
    });
    return this.mapTestAvailability(availability);
  }

  async closeCourseTest(id: string, userId: string, userRole?: string): Promise<void> {
    const availability = await this.prisma.courseTestAvailability.findFirst({
      where: {
        id,
        ...(userRole === 'system_admin' || userRole === 'church_admin'
          ? {}
          : {
              church_unit: {
                members: { some: { role: { in: ['admin', 'admin_member'] }, user_id: userId } },
              },
            }),
      },
    });
    if (!availability) throw new ForbiddenException('You cannot close this test.');
    await this.prisma.courseTestAvailability.updateMany({
      data: { closed_at: new Date(), is_active: false },
      where: {
        quiz_id: availability.quiz_id,
        ...(userRole === 'system_admin' || userRole === 'church_admin'
          ? {}
          : {
              church_unit: {
                members: { some: { role: { in: ['admin', 'admin_member'] }, user_id: userId } },
              },
            }),
      },
    });
  }

  async startCourseTest(availabilityId: string, userId: string): Promise<QuizAttemptDto | null> {
    const availability = await this.prisma.courseTestAvailability.findFirst({
      include: {
        church_unit: { include: { members: { where: { user_id: userId } } } },
        quiz: {
          include: {
            _count: { select: { quiz_maps: true } },
            quiz_maps: { include: { template: { include: { lesson: true } } }, orderBy: { position: 'asc' } },
          },
        },
      },
      where: { id: availabilityId, is_active: true },
    });
    if (!availability || !availability.church_unit.members.length || !availability.quiz.quiz_maps.length) return null;

    const existing = await this.prisma.quizAttempt.findFirst({
      select: { id: true },
      where: { test_availability_id: availability.id, user_id: userId },
    });
    if (existing) return this.findAttempt(existing.id, userId);

    const deadline = new Date(Date.now() + availability.duration_seconds * 1000);
    const attempt = await this.prisma.quizAttempt.create({
      data: {
        deadline_at: deadline,
        quiz_id: availability.quiz_id,
        test_availability_id: availability.id,
        user_id: userId,
        snapshots: {
          create: shuffle(availability.quiz.quiz_maps).map(({ template, template_id }, position) => ({
            generated_variables: {
              choices: shuffle(getQuestionChoices(template)),
              position,
            },
            template_id,
          })),
        },
      },
      include: {
        quiz: { include: { _count: { select: { quiz_maps: true } } } },
        snapshots: {
          include: { template: { include: { lesson: true } } },
          orderBy: { id: 'asc' },
        },
        test_availability: true,
      },
    });
    return this.mapAttempt(attempt);
  }

  async startQuiz(quizId: string, userId: string): Promise<QuizAttemptDto | null> {
    const quiz = await this.findQuiz(quizId);
    if (!quiz || quiz.is_test || !quiz.is_active || quiz.templates.length === 0) return null;

    const attempt = await this.prisma.quizAttempt.create({
      data: {
        quiz_id: quizId,
        user_id: userId,
        snapshots: {
          create: quiz.templates.map((template) => ({
            generated_variables: {},
            template_id: template.id,
          })),
        },
      },
      include: {
        quiz: { include: { _count: { select: { quiz_maps: true } } } },
        test_availability: true,
        snapshots: {
          include: { template: { include: { lesson: true } } },
          orderBy: { id: 'asc' },
        },
      },
    });

    return this.mapAttempt(attempt);
  }

  async findAttempt(id: string, userId: string): Promise<QuizAttemptDto | null> {
    const attempt = await this.prisma.quizAttempt.findFirst({
      include: {
        quiz: { include: { _count: { select: { quiz_maps: true } } } },
        test_availability: true,
        snapshots: {
          include: { template: { include: { lesson: true } } },
          orderBy: { id: 'asc' },
        },
      },
      where: { id, user_id: userId },
    });

    if (
      attempt?.test_availability_id &&
      !attempt.is_completed &&
      (!attempt.test_availability?.is_active ||
        (attempt.deadline_at && attempt.deadline_at.getTime() <= Date.now()))
    ) {
      return this.finishAttempt(attempt.id, userId);
    }

    return attempt ? this.mapAttempt(attempt) : null;
  }

  async submitAnswer(snapshotId: string, userId: string, studentAnswer: string): Promise<SubmitAnswerResultDto | null> {
    const snapshot = await this.prisma.questionSnapshot.findFirst({
      include: {
        attempt: { include: { test_availability: true } },
        template: true,
      },
      where: {
        id: snapshotId,
        attempt: { user_id: userId },
      },
    });

    if (!snapshot || !snapshot.template || !snapshot.attempt) return null;
    if (
      snapshot.attempt.is_completed ||
      (snapshot.attempt.test_availability_id && !snapshot.attempt.test_availability?.is_active) ||
      (snapshot.attempt.deadline_at && snapshot.attempt.deadline_at.getTime() <= Date.now())
    ) {
      return null;
    }

    const rightAnswer = snapshot.template.answer_formula;
    const isCorrect = isAnswerCorrect(studentAnswer, rightAnswer, snapshot.template.template_type, snapshot.template.logic_config);

    await this.prisma.questionSnapshot.update({
      data: {
        is_correct: isCorrect,
        points_earned: isCorrect ? 1 : 0,
        responded_at: new Date(),
        student_answer: studentAnswer,
      },
      where: { id: snapshotId },
    });

    const isTest = Boolean(snapshot.attempt.test_availability_id);
    return isTest
      ? { explanation: null, is_correct: false, right_answer: null }
      : {
          explanation: snapshot.template.explanation_template_vi ?? snapshot.template.explanation_template_en,
          is_correct: isCorrect,
          right_answer: rightAnswer,
        };
  }

  async finishAttempt(id: string, userId: string, answers?: Record<string, string>): Promise<QuizAttemptDto | null> {
    const attempt = await this.prisma.quizAttempt.findFirst({
      include: { snapshots: { include: { template: true } }, test_availability: true },
      where: { id, user_id: userId },
    });
    if (!attempt) return null;
    if (attempt.is_completed) return this.findAttempt(id, userId);

    const hasTime =
      (!attempt.deadline_at || attempt.deadline_at.getTime() > Date.now()) &&
      (!attempt.test_availability_id || Boolean(attempt.test_availability?.is_active));
    if (answers && hasTime) {
      for (const snapshot of attempt.snapshots) {
        const studentAnswer = answers[snapshot.id];
        if (studentAnswer !== undefined && studentAnswer !== null) {
          const rightAnswer = snapshot.template?.answer_formula;
          const isCorrect = isAnswerCorrect(
            studentAnswer,
            rightAnswer ?? null,
            snapshot.template?.template_type ?? 'short_answer',
            snapshot.template?.logic_config,
          );

          await this.prisma.questionSnapshot.update({
            data: {
              is_correct: isCorrect,
              points_earned: isCorrect ? 1 : 0,
              responded_at: new Date(),
              student_answer: studentAnswer,
            },
            where: { id: snapshot.id },
          });
        }
      }
    }

    const updatedAttempt = await this.prisma.quizAttempt.findFirst({
      include: { snapshots: true },
      where: { id },
    });
    const total = updatedAttempt?.snapshots.length || 0;
    const correct = updatedAttempt?.snapshots.filter((snapshot) => snapshot.is_correct).length || 0;
    const totalScore = total > 0 ? (correct / total) * 100 : 0;

    const updated = await this.prisma.quizAttempt.update({
      data: {
        completed_at: new Date(),
        is_completed: true,
        total_score: totalScore,
      },
      include: {
        quiz: { include: { _count: { select: { quiz_maps: true } } } },
        test_availability: true,
        snapshots: {
          include: { template: { include: { lesson: true } } },
          orderBy: { id: 'asc' },
        },
      },
      where: { id },
    });

    if (attempt.test_availability) {
      const passed = totalScore >= 70;
      await this.prisma.courseGrade.upsert({
        create: {
          completed_at: passed ? new Date() : null,
          course_id: attempt.test_availability.course_id,
          overall_score: totalScore,
          status: passed ? 'passed' : 'failed',
          user_id: userId,
        },
        update: {
          completed_at: passed ? new Date() : null,
          overall_score: totalScore,
          status: passed ? 'passed' : 'failed',
        },
        where: { user_id_course_id: { course_id: attempt.test_availability.course_id, user_id: userId } },
      });
    }

    return this.mapAttempt(updated);
  }
}
