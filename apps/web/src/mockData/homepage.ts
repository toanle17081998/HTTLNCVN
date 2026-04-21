export type HomepageHero = {
  eyebrow: string;
  headline: string;
  subheadline: string;
  cta: {
    href: string;
    label: string;
  };
  secondaryCta: {
    href: string;
    label: string;
  };
  stats: Array<{
    label: string;
    value: string;
  }>;
};

export type HomepagePerson = {
  id: string;
  name: string;
};

export type HomepageLecture = {
  id: string;
  course_id: string;
  slug: string;
  title: string;
  short_description: string | null;
  video_url: string | null;
  resource_url: string | null;
  lesson_type: "video" | "article" | "live" | "quiz";
  position: number;
  duration_seconds: number;
  is_preview: boolean;
  published_at: string;
  course: {
    id: string;
    slug: string;
    title: string;
  };
  instructor: HomepagePerson;
};

export type HomepageEvent = {
  id: string;
  organizer_id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  description: string | null;
  cover_image_url: string | null;
  location_name: string | null;
  location_address: string | null;
  is_online: boolean;
  meeting_url: string | null;
  registration_url: string | null;
  starts_at: string;
  ends_at: string | null;
  status: "draft" | "published" | "cancelled" | "completed";
  visibility: "private" | "unlisted" | "public";
  published_at: string | null;
  organizer: HomepagePerson;
};

export type HomepageCourse = {
  id: string;
  instructor_id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  cover_image_url: string | null;
  level: "beginner" | "intermediate" | "advanced";
  status: "draft" | "published" | "archived";
  visibility: "private" | "unlisted" | "public";
  estimated_duration_minutes: number;
  published_at: string | null;
  lesson_count: number;
  instructor: HomepagePerson;
};

export type HomepageMockData = {
  hero: HomepageHero;
  newLectures: HomepageLecture[];
  events: HomepageEvent[];
  featuredCourses: HomepageCourse[];
};

export const homepageMockData: HomepageMockData = {
  hero: {
    eyebrow: "HTNC Learning Hub",
    headline: "Learn, gather, and grow with the HTNC community",
    subheadline:
      "Fresh lectures, practical courses, and upcoming gatherings for people building faith and service into everyday life.",
    cta: {
      href: "/course",
      label: "Explore courses",
    },
    secondaryCta: {
      href: "/event",
      label: "View events",
    },
    stats: [
      { label: "Published courses", value: "12" },
      { label: "New lectures", value: "28" },
      { label: "Monthly gatherings", value: "6" },
    ],
  },
  newLectures: [
    {
      id: "f8a0bd7d-5e88-4d11-a8c1-3b7d9621f301",
      course_id: "57e72f7d-4a8f-45d2-a6f2-7a6f08f36d01",
      slug: "prayer-rhythm-lesson-4",
      title: "Building a weekly rhythm of prayer",
      short_description:
        "A practical walkthrough for shaping personal and group prayer habits.",
      video_url: "https://example.com/videos/prayer-rhythm-lesson-4",
      resource_url: "https://example.com/resources/prayer-rhythm-guide.pdf",
      lesson_type: "video",
      position: 4,
      duration_seconds: 1260,
      is_preview: true,
      published_at: "2026-04-18T09:00:00.000Z",
      course: {
        id: "57e72f7d-4a8f-45d2-a6f2-7a6f08f36d01",
        slug: "foundations-of-prayer",
        title: "Foundations of Prayer",
      },
      instructor: {
        id: "3f77d5d3-6bb8-4f59-b7d1-31bd7e9bdf11",
        name: "Minh Tran",
      },
    },
    {
      id: "c7fcb60f-6fc4-4f5b-89b9-53ad92dc4c41",
      course_id: "0f66db54-ea80-4763-9c52-62262085a2b2",
      slug: "servant-leadership-lesson-2",
      title: "Leading small groups with care",
      short_description:
        "Core practices for listening well, preparing discussion, and following up.",
      video_url: null,
      resource_url: "https://example.com/resources/group-care-notes",
      lesson_type: "article",
      position: 2,
      duration_seconds: 900,
      is_preview: false,
      published_at: "2026-04-16T14:30:00.000Z",
      course: {
        id: "0f66db54-ea80-4763-9c52-62262085a2b2",
        slug: "servant-leadership",
        title: "Servant Leadership",
      },
      instructor: {
        id: "5209f0e3-b48a-4cb6-b1f4-c8c9388ff99f",
        name: "Linh Nguyen",
      },
    },
    {
      id: "c53fa056-d409-438a-83cd-8af0077f12d6",
      course_id: "a1ceac69-1a8c-4054-bc63-755e4790ed5d",
      slug: "community-care-lesson-6",
      title: "Visiting and follow-up after Sunday",
      short_description:
        "How to turn weekend conversations into thoughtful pastoral care.",
      video_url: "https://example.com/videos/community-care-lesson-6",
      resource_url: null,
      lesson_type: "live",
      position: 6,
      duration_seconds: 1800,
      is_preview: false,
      published_at: "2026-04-12T11:00:00.000Z",
      course: {
        id: "a1ceac69-1a8c-4054-bc63-755e4790ed5d",
        slug: "community-care",
        title: "Community Care",
      },
      instructor: {
        id: "8fb939c8-e0f1-4eb3-aea6-403d1735fca7",
        name: "Grace Pham",
      },
    },
  ],
  events: [
    {
      id: "39f687c5-9f6f-4469-9d70-d40f1d28734f",
      organizer_id: "5209f0e3-b48a-4cb6-b1f4-c8c9388ff99f",
      slug: "april-community-night",
      title: "April Community Night",
      excerpt: "Dinner, worship, and a guided conversation for newcomers.",
      description:
        "A relaxed evening to welcome new members, share stories, and pray together.",
      cover_image_url:
        "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80",
      location_name: "HTNC Main Hall",
      location_address: "123 Mission Street, San Jose, CA",
      is_online: false,
      meeting_url: null,
      registration_url: "https://example.com/register/community-night",
      starts_at: "2026-04-25T01:00:00.000Z",
      ends_at: "2026-04-25T03:00:00.000Z",
      status: "published",
      visibility: "public",
      published_at: "2026-04-01T08:00:00.000Z",
      organizer: {
        id: "5209f0e3-b48a-4cb6-b1f4-c8c9388ff99f",
        name: "Linh Nguyen",
      },
    },
    {
      id: "f0a3346b-a21a-4f75-b13a-d68034c7f10a",
      organizer_id: "8fb939c8-e0f1-4eb3-aea6-403d1735fca7",
      slug: "online-prayer-room",
      title: "Online Prayer Room",
      excerpt: "A focused midweek hour for shared prayer requests.",
      description:
        "Join online for scripture, silence, and guided intercession.",
      cover_image_url:
        "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?auto=format&fit=crop&w=1200&q=80",
      location_name: "Zoom",
      location_address: null,
      is_online: true,
      meeting_url: "https://example.com/meeting/prayer-room",
      registration_url: "https://example.com/register/prayer-room",
      starts_at: "2026-04-29T02:30:00.000Z",
      ends_at: "2026-04-29T03:30:00.000Z",
      status: "published",
      visibility: "public",
      published_at: "2026-04-03T08:00:00.000Z",
      organizer: {
        id: "8fb939c8-e0f1-4eb3-aea6-403d1735fca7",
        name: "Grace Pham",
      },
    },
  ],
  featuredCourses: [
    {
      id: "57e72f7d-4a8f-45d2-a6f2-7a6f08f36d01",
      instructor_id: "3f77d5d3-6bb8-4f59-b7d1-31bd7e9bdf11",
      slug: "foundations-of-prayer",
      title: "Foundations of Prayer",
      summary:
        "A beginner-friendly path for building a steady life of personal and communal prayer.",
      description:
        "Learn scripture-shaped prayer, journaling, group prayer, and sustainable weekly rhythms.",
      cover_image_url:
        "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=1200&q=80",
      level: "beginner",
      status: "published",
      visibility: "public",
      estimated_duration_minutes: 180,
      published_at: "2026-03-25T10:00:00.000Z",
      lesson_count: 8,
      instructor: {
        id: "3f77d5d3-6bb8-4f59-b7d1-31bd7e9bdf11",
        name: "Minh Tran",
      },
    },
    {
      id: "0f66db54-ea80-4763-9c52-62262085a2b2",
      instructor_id: "5209f0e3-b48a-4cb6-b1f4-c8c9388ff99f",
      slug: "servant-leadership",
      title: "Servant Leadership",
      summary:
        "Practical leadership formation for small-group hosts, team leads, and ministry volunteers.",
      description:
        "Explore healthy team rhythms, pastoral listening, conflict care, and volunteer development.",
      cover_image_url:
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
      level: "intermediate",
      status: "published",
      visibility: "public",
      estimated_duration_minutes: 240,
      published_at: "2026-03-10T10:00:00.000Z",
      lesson_count: 10,
      instructor: {
        id: "5209f0e3-b48a-4cb6-b1f4-c8c9388ff99f",
        name: "Linh Nguyen",
      },
    },
    {
      id: "a1ceac69-1a8c-4054-bc63-755e4790ed5d",
      instructor_id: "8fb939c8-e0f1-4eb3-aea6-403d1735fca7",
      slug: "community-care",
      title: "Community Care",
      summary:
        "A care-team course for follow-up, hospital visits, prayer requests, and member support.",
      description:
        "Build compassionate systems for noticing needs and coordinating care across the community.",
      cover_image_url:
        "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80",
      level: "advanced",
      status: "published",
      visibility: "public",
      estimated_duration_minutes: 300,
      published_at: "2026-02-22T10:00:00.000Z",
      lesson_count: 12,
      instructor: {
        id: "8fb939c8-e0f1-4eb3-aea6-403d1735fca7",
        name: "Grace Pham",
      },
    },
  ],
};
