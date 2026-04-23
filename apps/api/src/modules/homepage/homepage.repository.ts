import { Injectable, ServiceUnavailableException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import type {
  HomepageContentDto,
  HomepageCourse,
  HomepageData,
  HomepageEvent,
  HomepagePost,
  HomepageQuery,
  UpdateHomepageContentDto,
} from './homepage.types';

const DEFAULT_HERO_IMAGE =
  'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1400&q=80';

@Injectable()
export class HomepageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getHomepageData(query: HomepageQuery): Promise<HomepageData> {
    try {
      const [content, articles, courses, events] = await Promise.all([
        this.findOrCreateContent(),
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
        hero: this.toHeroDto(content),
        latest_posts: articles,
        section_headers: this.toSectionHeadersDto(content),
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

  async getContent(): Promise<HomepageContentDto> {
    const content = await this.findOrCreateContent();
    return {
      ...this.toHeroDto(content),
      section_headers: this.toSectionHeadersDto(content),
      updated_at: content.updated_at.toISOString(),
    };
  }

  async updateContent(dto: UpdateHomepageContentDto): Promise<HomepageContentDto> {
    const data = Object.fromEntries(
      Object.entries(dto)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [
          key,
          Array.isArray(value)
            ? value.map((item) => item.trim()).filter(Boolean)
            : typeof value === 'string'
              ? value.trim()
              : value,
        ]),
    );

    await this.prisma.homepageContent.upsert({
      create: { id: 1, ...data },
      update: data,
      where: { id: 1 },
    });

    return this.getContent();
  }

  private findOrCreateContent() {
    return this.prisma.homepageContent.upsert({
      create: { id: 1 },
      update: {},
      where: { id: 1 },
    });
  }

  private toHeroDto(content: Awaited<ReturnType<HomepageRepository['findOrCreateContent']>>) {
    return {
      cta: {
        href: content.primary_cta_href,
        label: { en: content.primary_cta_label_en, vi: content.primary_cta_label_vi },
      },
      eyebrow: { en: content.hero_eyebrow_en, vi: content.hero_eyebrow_vi },
      headline: { en: content.hero_headline_en, vi: content.hero_headline_vi },
      image_urls: this.normalizeImageUrls(content.hero_image_urls),
      secondary_cta: {
        href: content.secondary_cta_href,
        label: { en: content.secondary_cta_label_en, vi: content.secondary_cta_label_vi },
      },
      stats: [
        {
          label: { en: content.stat_1_label_en, vi: content.stat_1_label_vi },
          value: content.stat_1_value,
        },
        {
          label: { en: content.stat_2_label_en, vi: content.stat_2_label_vi },
          value: content.stat_2_value,
        },
        {
          label: { en: content.stat_3_label_en, vi: content.stat_3_label_vi },
          value: content.stat_3_value,
        },
      ],
      subheadline: { en: content.hero_subheadline_en, vi: content.hero_subheadline_vi },
    };
  }

  private toSectionHeadersDto(
    content: Awaited<ReturnType<HomepageRepository['findOrCreateContent']>>,
  ) {
    return {
      articles: {
        eyebrow: { en: content.articles_eyebrow_en, vi: content.articles_eyebrow_vi },
        title: { en: content.articles_title_en, vi: content.articles_title_vi },
      },
      courses: {
        eyebrow: { en: content.courses_eyebrow_en, vi: content.courses_eyebrow_vi },
        title: { en: content.courses_title_en, vi: content.courses_title_vi },
      },
      events: {
        eyebrow: { en: content.events_eyebrow_en, vi: content.events_eyebrow_vi },
        title: { en: content.events_title_en, vi: content.events_title_vi },
      },
    };
  }

  private normalizeImageUrls(value: unknown): string[] {
    if (!Array.isArray(value)) return [DEFAULT_HERO_IMAGE];
    const urls = value.filter((item): item is string => typeof item === 'string' && Boolean(item));
    return urls.length > 0 ? urls : [DEFAULT_HERO_IMAGE];
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
