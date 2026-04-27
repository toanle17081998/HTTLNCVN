export type LessonSummary = {
  content_markdown_en?: string;
  content_markdown_vi?: string;
  id: string;
  order_index: number | null;
  quiz_count?: number;
  title_en?: string;
  title_vi: string;
};

export type CourseDto = {
  cover_image_url: string | null;
  created_at: string;
  creator: { id: string; username: string } | null;
  description: string | null;
  estimated_duration_minutes: number;
  id: string;
  is_enrolled?: boolean;
  is_allowed?: boolean;
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

export type LessonDto = {
  content_markdown_en: string;
  content_markdown_vi: string;
  course: {
    id: string;
    slug: string;
    title_en: string;
    title_vi: string;
  };
  course_id: string;
  created_by: string | null;
  id: string;
  order_index: number | null;
  quiz_count: number;
  quizzes: QuizListDto[];
  title_en: string;
  title_vi: string;
  updated_at: string;
};

export type CreateLessonDto = {
  content_markdown_en: string;
  content_markdown_vi: string;
  course_id?: string;
  order_index?: number;
  title_en: string;
  title_vi: string;
};

export type UpdateLessonDto = Partial<CreateLessonDto>;

export type QuestionTemplateDto = {
  answer_formula: string | null;
  body_template_en: string;
  body_template_vi: string;
  created_at: string;
  difficulty: string;
  explanation_template_en: string | null;
  explanation_template_vi: string | null;
  id: string;
  lesson: LessonSummary | null;
  lesson_id: string | null;
  template_type: string;
};

export type CreateQuestionTemplateDto = {
  answer_formula?: string;
  body_template_en: string;
  body_template_vi: string;
  difficulty?: string;
  explanation_template_en?: string;
  explanation_template_vi?: string;
  lesson_id?: string | null;
  logic_config?: unknown;
  template_type?: string;
};

export type UpdateQuestionTemplateDto = Partial<CreateQuestionTemplateDto>;

export type QuizListDto = {
  id: string;
  is_active: boolean;
  passing_score: number;
  question_count: number;
  time_limit_seconds: number | null;
  title_en: string;
  title_vi: string;
};

export type QuizDto = QuizListDto & {
  templates: QuestionTemplateDto[];
};

export type CreateQuizDto = {
  is_active?: boolean;
  passing_score?: number;
  template_ids?: string[];
  time_limit_seconds?: number;
  title_en: string;
  title_vi: string;
};

export type UpdateQuizDto = Partial<CreateQuizDto>;

export type QuestionSnapshotDto = {
  id: string;
  is_correct: boolean | null;
  points_earned: number | null;
  responded_at: string | null;
  student_answer: string | null;
  template: QuestionTemplateDto | null;
};

export type QuizAttemptDto = {
  completed_at: string | null;
  id: string;
  is_completed: boolean;
  quiz: QuizListDto | null;
  quiz_id: string | null;
  snapshots: QuestionSnapshotDto[];
  started_at: string;
  total_score: number | null;
};

export type SubmitAnswerDto = {
  snapshot_id: string;
  student_answer: string;
};

export type SubmitAnswerResultDto = {
  explanation: string | null;
  is_correct: boolean;
  right_answer: string | null;
};

export type EnrollOthersDto = {
  emails?: string[];
  church_unit_id?: string;
  member_ids?: string[];
};

export type EnrollPreviewMemberDto = {
  id: string;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  is_enrolled: boolean;
  is_authorized: boolean;
};

export type EnrollPreviewDto = {
  members: EnrollPreviewMemberDto[];
  invalid_emails: string[];
  enrolled_count: number;
  authorized_count: number;
};
