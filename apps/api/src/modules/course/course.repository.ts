import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import type {
  CourseDto,
  CourseListDto,
  CourseListResult,
  CreateCourseDto,
  UpdateCourseDto,
} from './course.types';

@Injectable()
export class CourseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(skip: number, take: number): Promise<CourseListResult> {
    const where = { deleted_at: null };

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

    return {
      items: items.map(
        (c): CourseListDto => ({
          cover_image_url: c.cover_image_url,
          creator: c.creator ? { id: c.creator.id, username: c.creator.username } : null,
          estimated_duration_minutes: c.estimated_duration_minutes,
          id: c.id,
          lesson_count: c._count.lessons,
          level: c.level,
          published_at: c.published_at?.toISOString() ?? null,
          slug: c.slug,
          status: c.status,
          summary: c.summary,
          title_en: c.title_en,
          title_vi: c.title_vi,
        }),
      ),
      total,
    };
  }

  async findBySlug(slug: string): Promise<CourseDto | null> {
    const c = await this.prisma.course.findUnique({
      include: {
        _count: { select: { lessons: true } },
        creator: true,
        lessons: { orderBy: { order_index: 'asc' } },
      },
      where: { slug, deleted_at: null },
    });

    if (!c) return null;

    return {
      cover_image_url: c.cover_image_url,
      created_at: c.created_at.toISOString(),
      creator: c.creator ? { id: c.creator.id, username: c.creator.username } : null,
      description: c.description,
      estimated_duration_minutes: c.estimated_duration_minutes,
      id: c.id,
      lesson_count: c._count.lessons,
      lessons: c.lessons.map((l) => ({
        id: l.id,
        order_index: l.order_index,
        title_vi: l.title_vi,
      })),
      level: c.level,
      published_at: c.published_at?.toISOString() ?? null,
      slug: c.slug,
      status: c.status,
      summary: c.summary,
      title_en: c.title_en,
      title_vi: c.title_vi,
    };
  }

  async create(dto: CreateCourseDto, creatorId: string): Promise<CourseDto> {
    const c = await this.prisma.course.create({
      data: {
        cover_image_url: dto.cover_image_url,
        created_by: creatorId,
        description: dto.description,
        estimated_duration_minutes: dto.estimated_duration_minutes ?? 0,
        level: dto.level ?? 'beginner',
        slug: dto.slug,
        summary: dto.summary,
        title_en: dto.title_en,
        title_vi: dto.title_vi,
      },
      include: {
        _count: { select: { lessons: true } },
        creator: true,
        lessons: true,
      },
    });

    return {
      cover_image_url: c.cover_image_url,
      created_at: c.created_at.toISOString(),
      creator: c.creator ? { id: c.creator.id, username: c.creator.username } : null,
      description: c.description,
      estimated_duration_minutes: c.estimated_duration_minutes,
      id: c.id,
      lesson_count: c._count.lessons,
      lessons: [],
      level: c.level,
      published_at: c.published_at?.toISOString() ?? null,
      slug: c.slug,
      status: c.status,
      summary: c.summary,
      title_en: c.title_en,
      title_vi: c.title_vi,
    };
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
        lessons: { orderBy: { order_index: 'asc' } },
      },
      where: { slug },
    });

    return {
      cover_image_url: c.cover_image_url,
      created_at: c.created_at.toISOString(),
      creator: c.creator ? { id: c.creator.id, username: c.creator.username } : null,
      description: c.description,
      estimated_duration_minutes: c.estimated_duration_minutes,
      id: c.id,
      lesson_count: c._count.lessons,
      lessons: c.lessons.map((l) => ({ id: l.id, order_index: l.order_index, title_vi: l.title_vi })),
      level: c.level,
      published_at: c.published_at?.toISOString() ?? null,
      slug: c.slug,
      status: c.status,
      summary: c.summary,
      title_en: c.title_en,
      title_vi: c.title_vi,
    };
  }

  async delete(slug: string): Promise<void> {
    await this.prisma.course.update({
      data: { deleted_at: new Date() },
      where: { slug },
    });
  }

  async enroll(courseId: string, userId: string): Promise<void> {
    try {
      await this.prisma.courseGrade.create({
        data: { course_id: courseId, status: 'enrolled', user_id: userId },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException({
          code: 'ALREADY_ENROLLED',
          message: 'Bạn đã đăng ký khóa học này rồi.',
        });
      }

      throw error;
    }
  }
}
