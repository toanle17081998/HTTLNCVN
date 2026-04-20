export type HomepageIncludeKey = 'courses' | 'events' | 'posts';

export type HomepageQuery = {
  featuredCoursesLimit: number;
  include: HomepageIncludeKey[];
  latestPostsLimit: number;
  upcomingEventsLimit: number;
};

export type HomepagePayload = {
  data: {
    featured_courses: Array<{
      cover_image_url: string | null;
      estimated_duration_minutes: number;
      id: string;
      instructor: {
        id: string;
        name: string;
      };
      lesson_count: number;
      level: string;
      slug: string;
      summary: string | null;
      title: string;
    }>;
    hero: {
      cta: {
        href: string;
        label: string;
      };
      headline: string;
      subheadline: string;
    };
    latest_posts: Array<{
      author: {
        id: string;
        name: string;
      };
      cover_image_url: string | null;
      excerpt: string | null;
      id: string;
      published_at: string;
      slug: string;
      title: string;
    }>;
    upcoming_events: Array<{
      cover_image_url: string | null;
      ends_at: string | null;
      excerpt: string | null;
      id: string;
      location_name: string | null;
      slug: string;
      starts_at: string;
      title: string;
    }>;
  };
  meta: {
    generated_at: string;
    included: HomepageIncludeKey[];
  };
  success: true;
};
