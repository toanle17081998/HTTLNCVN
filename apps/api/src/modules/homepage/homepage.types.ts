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
    eyebrow: {
      en: string;
      vi: string;
    };
    cta: {
      href: string;
      label: {
        en: string;
        vi: string;
      };
    };
    headline: {
      en: string;
      vi: string;
    };
    image_urls: string[];
    secondary_cta: {
      href: string;
      label: {
        en: string;
        vi: string;
      };
    };
    stats: {
      label: {
        en: string;
        vi: string;
      };
      value: string;
    }[];
    subheadline: {
      en: string;
      vi: string;
    };
  };
  latest_posts: HomepagePost[];
  section_headers: {
    articles: HomepageSectionHeader;
    courses: HomepageSectionHeader;
    events: HomepageSectionHeader;
  };
  upcoming_events: HomepageEvent[];
};

export type HomepageSectionHeader = {
  eyebrow: {
    en: string;
    vi: string;
  };
  title: {
    en: string;
    vi: string;
  };
};

export type HomepageContentDto = HomepageData['hero'] & {
  section_headers: HomepageData['section_headers'];
  updated_at: string;
};

export type UpdateHomepageContentDto = {
  articles_eyebrow_en?: string;
  articles_eyebrow_vi?: string;
  articles_title_en?: string;
  articles_title_vi?: string;
  courses_eyebrow_en?: string;
  courses_eyebrow_vi?: string;
  courses_title_en?: string;
  courses_title_vi?: string;
  events_eyebrow_en?: string;
  events_eyebrow_vi?: string;
  events_title_en?: string;
  events_title_vi?: string;
  hero_eyebrow_en?: string;
  hero_eyebrow_vi?: string;
  hero_headline_en?: string;
  hero_headline_vi?: string;
  hero_image_urls?: string[];
  hero_subheadline_en?: string;
  hero_subheadline_vi?: string;
  primary_cta_href?: string;
  primary_cta_label_en?: string;
  primary_cta_label_vi?: string;
  secondary_cta_href?: string;
  secondary_cta_label_en?: string;
  secondary_cta_label_vi?: string;
  stat_1_label_en?: string;
  stat_1_label_vi?: string;
  stat_1_value?: string;
  stat_2_label_en?: string;
  stat_2_label_vi?: string;
  stat_2_value?: string;
  stat_3_label_en?: string;
  stat_3_label_vi?: string;
  stat_3_value?: string;
};

export type HomepageMeta = {
  generated_at: string;
  included: HomepageIncludeKey[];
};

export type HomepageResult = {
  data: HomepageData;
  meta: HomepageMeta;
};
