export type HomepageIncludeKey = 'courses' | 'events' | 'posts';

export type HomepageQuery = {
  featuredCoursesLimit: number;
  include: HomepageIncludeKey[];
  latestPostsLimit: number;
  upcomingEventsLimit: number;
};

export type HomepageAuthor = {
  id: string;
  name: string;
};

export type HomepagePost = {
  author: HomepageAuthor;
  cover_image_url: string | null;
  excerpt: string | null;
  id: string;
  published_at: string;
  slug: string;
  title: string;
};

export type HomepageCourse = {
  cover_image_url: string | null;
  estimated_duration_minutes: number;
  id: string;
  instructor: HomepageAuthor;
  lesson_count: number;
  level: string;
  slug: string;
  summary: string | null;
  title: string;
};

export type HomepageEvent = {
  cover_image_url: string | null;
  ends_at: string;
  id: string;
  location: string | null;
  slug: string;
  starts_at: string;
  title: string;
};

export type HomepageData = {
  featured_courses: HomepageCourse[];
  hero: {
    cta: {
      href: string;
      label: string;
    };
    headline: string;
    subheadline: string;
  };
  latest_posts: HomepagePost[];
  upcoming_events: HomepageEvent[];
};

export type HomepageMeta = {
  generated_at: string;
  included: HomepageIncludeKey[];
};

export type HomepageResult = {
  data: HomepageData;
  meta: HomepageMeta;
};
