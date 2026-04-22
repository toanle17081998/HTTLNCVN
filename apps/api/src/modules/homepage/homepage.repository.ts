import { Injectable, ServiceUnavailableException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import type {
  HomepageCourse,
  HomepageData,
  HomepageEvent,
  HomepagePost,
  HomepageQuery,
} from './homepage.types';

@Injectable()
export class HomepageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getHomepageData(query: HomepageQuery): Promise<HomepageData> {
    try {
      const [articles, courses, events] = await Promise.all([
        query.include.includes('posts') ? this.fetchLatestPosts(query.latestPostsLimit) : [],
        query.include.includes('courses')
          ? this.fetchFeaturedCourses(query.featuredCoursesLimit)
          : [],
        query.include.includes('events')
          ? this.fetchUpcomingEvents(query.upcomingEventsLimit)
          : [],
      ]);

      return {
        featured_courses: courses,
        hero: {
          cta: { href: '/courses', label: 'Khám phá ngay' },
          headline: 'Học, kết nối và tăng trưởng cùng HTNC',
          subheadline:
            'Nội dung mới, sự kiện sắp tới và khóa học được đề xuất cho cộng đồng',
        },
        latest_posts: articles,
        upcoming_events: events,
      };
    } catch (error) {
      const prismaError = error as { code?: string };

      if (prismaError.code === 'P1001' || prismaError.code === 'P1002') {
        throw new ServiceUnavailableException({
          code: 'DATABASE_UNAVAILABLE',
          message: 'PostgreSQL is not reachable. Start the local database first.',
        });
      }

      throw error;
    }
  }

  private async fetchLatestPosts(limit: number): Promise<HomepagePost[]> {
    const rows = await this.prisma.article.findMany({
      include: { creator: { include: { profile: true } } },
      orderBy: { published_at: 'desc' },
      take: limit,
      where: { deleted_at: null, status: 'published' },
    });

    return rows.map((a) => ({
      author: {
        id: a.creator.id,
        name: a.creator.profile
          ? `${a.creator.profile.first_name} ${a.creator.profile.last_name}`.trim()
          : a.creator.username,
      },
      cover_image_url: a.cover_image_url,
      excerpt: null,
      id: a.id,
      published_at: (a.published_at ?? a.created_at).toISOString(),
      slug: a.slug,
      title: a.title_vi,
    }));
  }

  private async fetchFeaturedCourses(limit: number): Promise<HomepageCourse[]> {
    const rows = await this.prisma.course.findMany({
      include: {
        _count: { select: { lessons: true } },
        creator: { include: { profile: true } },
      },
      orderBy: { published_at: 'desc' },
      take: limit,
      where: { deleted_at: null, status: 'published' },
    });

    return rows.map((c) => ({
      cover_image_url: c.cover_image_url,
      estimated_duration_minutes: c.estimated_duration_minutes,
      id: c.id,
      instructor: {
        id: c.creator?.id ?? '',
        name: c.creator?.profile
          ? `${c.creator.profile.first_name} ${c.creator.profile.last_name}`.trim()
          : (c.creator?.username ?? ''),
      },
      lesson_count: c._count.lessons,
      level: c.level,
      slug: c.slug,
      summary: c.summary,
      title: c.title_vi,
    }));
  }

  private async fetchUpcomingEvents(limit: number): Promise<HomepageEvent[]> {
    const rows = await this.prisma.event.findMany({
      orderBy: { starts_at: 'asc' },
      take: limit,
      where: {
        deleted_at: null,
        starts_at: { gte: new Date() },
        status: 'published',
      },
    });

    return rows.map((e) => ({
      cover_image_url: e.cover_image_url,
      ends_at: e.ends_at.toISOString(),
      id: e.id,
      location: e.location,
      slug: e.slug,
      starts_at: e.starts_at.toISOString(),
      title: e.title,
    }));
  }
}
