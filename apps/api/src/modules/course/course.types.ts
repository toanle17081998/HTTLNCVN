export type LessonSummary = {
  id: string;
  order_index: number | null;
  title_vi: string;
};

export type CourseDto = {
  cover_image_url: string | null;
  created_at: string;
  creator: { id: string; username: string } | null;
  description: string | null;
  estimated_duration_minutes: number;
  id: string;
  lesson_count: number;
  lessons: LessonSummary[];
  level: string;
  published_at: string | null;
  slug: string;
  status: string;
  summary: string | null;
  title_en: string;
  title_vi: string;
};

export type CourseListDto = {
  cover_image_url: string | null;
  creator: { id: string; username: string } | null;
  estimated_duration_minutes: number;
  id: string;
  lesson_count: number;
  level: string;
  published_at: string | null;
  slug: string;
  status: string;
  summary: string | null;
  title_en: string;
  title_vi: string;
};

export type CourseListResult = {
  items: CourseListDto[];
  total: number;
};

export type CreateCourseDto = {
  cover_image_url?: string;
  description?: string;
  estimated_duration_minutes?: number;
  level?: string;
  slug: string;
  summary?: string;
  title_en: string;
  title_vi: string;
};

export type UpdateCourseDto = Partial<CreateCourseDto> & {
  status?: 'draft' | 'published';
};
