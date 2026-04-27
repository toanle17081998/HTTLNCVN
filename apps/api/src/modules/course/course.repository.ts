import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import type {
  CourseDto,
  CourseListDto,
  CourseListResult,
  CreateCourseDto,
  CreateLessonDto,
  CreateQuestionTemplateDto,
  CreateQuizDto,
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
  include: { _count: { select: { lessons: true } }; creator: true };
}>;

type CourseWithDetailRelations = Prisma.CourseGetPayload<{
  include: {
    _count: { select: { lessons: true } };
    creator: true;
    lessons: {
      include: {
        templates: {
          select: {
            quiz_maps: {
              select: { quiz_id: true };
            };
          };
        };
      };
    };
  };
}>;

type LessonWithRelations = Prisma.LessonGetPayload<{
  include: {
    course: true;
    templates: {
      select: {
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
      level: c.level,
      published_at: c.published_at?.toISOString() ?? null,
      slug: c.slug,
      status: c.status,
      summary_en: c.summary_en,
      summary_vi: c.summary_vi,
      title_en: c.title_en,
      title_vi: c.title_vi,
    };
  }

  private mapCourseDetail(c: CourseWithDetailRelations, isEnrolled = false, isAllowed = true): CourseDto {
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
      })) : [],
      level: c.level,
      published_at: c.published_at?.toISOString() ?? null,
      slug: c.slug,
      status: c.status,
      summary_en: c.summary_en,
      summary_vi: c.summary_vi,
      title_en: c.title_en,
      title_vi: c.title_vi,
    };
  }

  private mapTemplate(template: TemplateWithLesson): QuestionTemplateDto {
    return {
      answer_formula: template.answer_formula,
      body_template_en: template.body_template_en,
      body_template_vi: template.body_template_vi,
      created_at: template.created_at.toISOString(),
      difficulty: template.difficulty,
      explanation_template_en: template.explanation_template_en,
      explanation_template_vi: template.explanation_template_vi,
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
    };
  }

  private mapQuizList(quiz: Prisma.QuizGetPayload<{ include: { _count: { select: { quiz_maps: true } } } }>): QuizListDto {
    return {
      id: quiz.id,
      is_active: quiz.is_active ?? true,
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
      templates: quiz.quiz_maps.map((map) => this.mapTemplate(map.template)),
    };
  }

  private mapSnapshot(snapshot: AttemptWithRelations['snapshots'][number]): QuestionSnapshotDto {
    return {
      id: snapshot.id,
      is_correct: snapshot.is_correct,
      points_earned: snapshot.points_earned,
      responded_at: snapshot.responded_at?.toISOString() ?? null,
      student_answer: snapshot.student_answer,
      template: snapshot.template ? this.mapTemplate(snapshot.template) : null,
    };
  }

  private mapAttempt(attempt: AttemptWithRelations): QuizAttemptDto {
    return {
      completed_at: attempt.completed_at?.toISOString() ?? null,
      id: attempt.id,
      is_completed: attempt.is_completed ?? false,
      quiz: attempt.quiz ? this.mapQuizList(attempt.quiz) : null,
      quiz_id: attempt.quiz_id,
      snapshots: attempt.snapshots.map((snapshot) => this.mapSnapshot(snapshot)),
      started_at: attempt.started_at.toISOString(),
      total_score: toNumber(attempt.total_score),
    };
  }

  async findAll(skip: number, take: number, status?: string, level?: string, q?: string): Promise<CourseListResult> {
    const where: Prisma.CourseWhereInput = {
      deleted_at: null,
      ...(status !== undefined && { status }),
      ...(level !== undefined && { level }),
      ...(q && {
        OR: [
          { title_en: { contains: q, mode: 'insensitive' } },
          { title_vi: { contains: q, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        include: { _count: { select: { lessons: true } }, creator: true },
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
        grades: viewerId ? { where: { user_id: viewerId } } : false,
        lessons: {
          include: {
            templates: { select: { quiz_maps: { select: { quiz_id: true } } } },
          },
          orderBy: { order_index: 'asc' },
        },
      },
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
          const isAttendee = c.attendees.some((a) => a.user_id === viewerId);
          isAllowed = isAttendee && isEnrolled;
        } else {
          isAllowed = isEnrolled;
        }
      }
    } else {
      isAllowed = false;
    }

    // Cast needed because attendees and grades are dynamically added to the payload
    return this.mapCourseDetail(c as unknown as CourseWithDetailRelations, isEnrolled, isAllowed);
  }

  async create(dto: CreateCourseDto, creatorId: string): Promise<CourseDto> {
    const c = await this.prisma.course.create({
      data: {
        cover_image_url: dto.cover_image_url,
        created_by: creatorId,
        description_en: dto.description_en,
        description_vi: dto.description_vi,
        estimated_duration_minutes: dto.estimated_duration_minutes ?? 0,
        level: dto.level ?? 'beginner',
        slug: dto.slug,
        summary_en: dto.summary_en,
        summary_vi: dto.summary_vi,
        title_en: dto.title_en,
        title_vi: dto.title_vi,
      },
      include: {
        _count: { select: { lessons: true } },
        creator: true,
        lessons: { include: { templates: { select: { quiz_maps: { select: { quiz_id: true } } } } } },
      },
    });

    return this.mapCourseDetail(c as unknown as CourseWithDetailRelations, true, true);
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
        lessons: {
          include: { templates: { select: { quiz_maps: { select: { quiz_id: true } } } } },
          orderBy: { order_index: 'asc' },
        },
      },
      where: { slug },
    });

    return this.mapCourseDetail(c as unknown as CourseWithDetailRelations, true, true);
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

    if (allUserIds.length === 0) return;

    await this.prisma.$transaction([
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
    ]);
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
          select: {
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
        return this.mapLesson(lesson);
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
          select: {
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
          select: {
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

  private mapLesson(lesson: LessonWithRelations): LessonDto {
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
      where: courseSlug
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
        : undefined,
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

  async startQuiz(quizId: string, userId: string): Promise<QuizAttemptDto | null> {
    const quiz = await this.findQuiz(quizId);
    if (!quiz || !quiz.is_active || quiz.templates.length === 0) return null;

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
        snapshots: {
          include: { template: { include: { lesson: true } } },
          orderBy: { id: 'asc' },
        },
      },
      where: { id, user_id: userId },
    });

    return attempt ? this.mapAttempt(attempt) : null;
  }

  async submitAnswer(snapshotId: string, userId: string, studentAnswer: string): Promise<SubmitAnswerResultDto | null> {
    const snapshot = await this.prisma.questionSnapshot.findFirst({
      include: {
        attempt: true,
        template: true,
      },
      where: {
        id: snapshotId,
        attempt: { user_id: userId },
      },
    });

    if (!snapshot || !snapshot.template) return null;

    const rightAnswer = snapshot.template.answer_formula;
    const isCorrect = normalizeAnswer(studentAnswer) === normalizeAnswer(rightAnswer);

    await this.prisma.questionSnapshot.update({
      data: {
        is_correct: isCorrect,
        points_earned: isCorrect ? 1 : 0,
        responded_at: new Date(),
        student_answer: studentAnswer,
      },
      where: { id: snapshotId },
    });

    return {
      explanation: snapshot.template.explanation_template_vi ?? snapshot.template.explanation_template_en,
      is_correct: isCorrect,
      right_answer: rightAnswer,
    };
  }

  async finishAttempt(id: string, userId: string): Promise<QuizAttemptDto | null> {
    const attempt = await this.prisma.quizAttempt.findFirst({
      include: { snapshots: true },
      where: { id, user_id: userId },
    });
    if (!attempt) return null;

    const total = attempt.snapshots.length;
    const correct = attempt.snapshots.filter((snapshot) => snapshot.is_correct).length;
    const totalScore = total > 0 ? (correct / total) * 100 : 0;

    const updated = await this.prisma.quizAttempt.update({
      data: {
        completed_at: new Date(),
        is_completed: true,
        total_score: totalScore,
      },
      include: {
        quiz: { include: { _count: { select: { quiz_maps: true } } } },
        snapshots: {
          include: { template: { include: { lesson: true } } },
          orderBy: { id: 'asc' },
        },
      },
      where: { id },
    });

    return this.mapAttempt(updated);
  }
}
