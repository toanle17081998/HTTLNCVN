"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./client";
import { getStoredTokens } from "./auth";

export type CourseStatus = "draft" | "published";

export type LessonSummary = {
  content_markdown_en?: string;
  content_markdown_vi?: string;
  id: string;
  order_index: number | null;
  quiz_count?: number;
  title_en?: string;
  title_vi: string;
};

export type CourseListItem = {
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

export type Course = CourseListItem & {
  created_at: string;
  description: string | null;
  lessons: LessonSummary[];
};

export type CourseListResult = {
  items: CourseListItem[];
  total: number;
};

export type CourseListParams = {
  level?: string;
  skip?: number;
  status?: CourseStatus;
  take?: number;
  q?: string;
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
  status?: CourseStatus;
};

function courseListSearch(params: CourseListParams = {}) {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.level) search.set("level", params.level);
  if (params.skip !== undefined) search.set("skip", String(params.skip));
  if (params.take !== undefined) search.set("take", String(params.take));
  if (params.q) search.set("q", params.q);
  const query = search.toString();
  return query ? `?${query}` : "";
}

export type QuizListItem = {
  id: string;
  is_active: boolean;
  passing_score: number;
  question_count: number;
  time_limit_seconds: number | null;
  title_en: string;
  title_vi: string;
};

export type Lesson = {
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
  quizzes: QuizListItem[];
  templates: QuestionTemplate[];
  title_en: string;
  title_vi: string;
  updated_at: string;
};

export type CreateLessonDto = {
  content_markdown_en: string;
  content_markdown_vi: string;
  order_index?: number;
  title_en: string;
  title_vi: string;
};

export type UpdateLessonDto = Partial<CreateLessonDto>;

export type QuestionTemplate = {
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
  logic_config?: unknown;
  template_type?: string;
};

export type UpdateQuestionTemplateDto = Partial<CreateQuestionTemplateDto>;

export type Quiz = QuizListItem & {
  templates: QuestionTemplate[];
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

export type QuestionSnapshot = {
  id: string;
  is_correct: boolean | null;
  points_earned: number | null;
  responded_at: string | null;
  student_answer: string | null;
  template: QuestionTemplate | null;
};

export type QuizAttempt = {
  completed_at: string | null;
  id: string;
  is_completed: boolean;
  quiz: QuizListItem | null;
  quiz_id: string | null;
  snapshots: QuestionSnapshot[];
  started_at: string;
  total_score: number | null;
};

export type SubmitAnswerDto = {
  snapshot_id: string;
  student_answer: string;
};

export type SubmitAnswerResult = {
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

export const courseKeys = {
  all: ["courses"] as const,
  attempt: (id: string) => [...courseKeys.all, "attempt", id] as const,
  detail: (slug: string) => [...courseKeys.all, "detail", slug] as const,
  lesson: (id: string) => [...courseKeys.all, "lesson", id] as const,
  lists: () => [...courseKeys.all, "list"] as const,
  list: (params: CourseListParams = {}) => [...courseKeys.lists(), params] as const,
  quiz: (id: string) => [...courseKeys.all, "quiz", id] as const,
  quizzes: (slug?: string) => [...courseKeys.all, "quizzes", slug ?? "all"] as const,
};

export const courseApi = {
  list(params: CourseListParams = {}) {
    return apiRequest<CourseListResult>(`/courses${courseListSearch(params)}`, {
      token: getStoredTokens()?.accessToken,
    });
  },
  detail(slug: string) {
    return apiRequest<Course>(`/courses/${encodeURIComponent(slug)}`, {
      token: getStoredTokens()?.accessToken,
    });
  },
  create(dto: CreateCourseDto) {
    return apiRequest<Course>("/courses", {
      body: JSON.stringify(dto),
      method: "POST",
      token: getStoredTokens()?.accessToken,
    });
  },
  update(slug: string, dto: UpdateCourseDto) {
    return apiRequest<Course>(`/courses/${encodeURIComponent(slug)}`, {
      body: JSON.stringify(dto),
      method: "PATCH",
      token: getStoredTokens()?.accessToken,
    });
  },
  delete(slug: string) {
    return apiRequest<void>(`/courses/${encodeURIComponent(slug)}`, {
      method: "DELETE",
      token: getStoredTokens()?.accessToken,
    });
  },
  lesson(courseSlug: string, lessonId: string) {
    return apiRequest<Lesson>(
      `/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(lessonId)}`,
    );
  },
  createLesson(courseSlug: string, dto: CreateLessonDto) {
    return apiRequest<Lesson>(`/courses/${encodeURIComponent(courseSlug)}/lessons`, {
      body: JSON.stringify(dto),
      method: "POST",
      token: getStoredTokens()?.accessToken,
    });
  },
  updateLesson(lessonId: string, dto: UpdateLessonDto) {
    return apiRequest<Lesson>(`/courses/lessons/${encodeURIComponent(lessonId)}`, {
      body: JSON.stringify(dto),
      method: "PATCH",
      token: getStoredTokens()?.accessToken,
    });
  },
  deleteLesson(lessonId: string) {
    return apiRequest<void>(`/courses/lessons/${encodeURIComponent(lessonId)}`, {
      method: "DELETE",
      token: getStoredTokens()?.accessToken,
    });
  },
  createTemplate(lessonId: string, dto: CreateQuestionTemplateDto) {
    return apiRequest<QuestionTemplate>(
      `/courses/lessons/${encodeURIComponent(lessonId)}/templates`,
      {
        body: JSON.stringify(dto),
        method: "POST",
        token: getStoredTokens()?.accessToken,
      },
    );
  },
  updateTemplate(templateId: string, dto: UpdateQuestionTemplateDto) {
    return apiRequest<QuestionTemplate>(`/courses/templates/${encodeURIComponent(templateId)}`, {
      body: JSON.stringify(dto),
      method: "PATCH",
      token: getStoredTokens()?.accessToken,
    });
  },
  deleteTemplate(templateId: string) {
    return apiRequest<void>(`/courses/templates/${encodeURIComponent(templateId)}`, {
      method: "DELETE",
      token: getStoredTokens()?.accessToken,
    });
  },
  quizzes(courseSlug?: string) {
    return apiRequest<QuizListItem[]>(
      courseSlug ? `/courses/${encodeURIComponent(courseSlug)}/quizzes` : "/courses/quizzes",
      {
        token: getStoredTokens()?.accessToken,
      },
    );
  },
  quiz(quizId: string) {
    return apiRequest<Quiz>(`/courses/quizzes/${encodeURIComponent(quizId)}`, {
      token: getStoredTokens()?.accessToken,
    });
  },
  createQuiz(dto: CreateQuizDto) {
    return apiRequest<Quiz>("/courses/quizzes", {
      body: JSON.stringify(dto),
      method: "POST",
      token: getStoredTokens()?.accessToken,
    });
  },
  updateQuiz(quizId: string, dto: UpdateQuizDto) {
    return apiRequest<Quiz>(`/courses/quizzes/${encodeURIComponent(quizId)}`, {
      body: JSON.stringify(dto),
      method: "PATCH",
      token: getStoredTokens()?.accessToken,
    });
  },
  deleteQuiz(quizId: string) {
    return apiRequest<void>(`/courses/quizzes/${encodeURIComponent(quizId)}`, {
      method: "DELETE",
      token: getStoredTokens()?.accessToken,
    });
  },
  startQuiz(quizId: string) {
    return apiRequest<QuizAttempt>(`/courses/quizzes/${encodeURIComponent(quizId)}/start`, {
      method: "POST",
      token: getStoredTokens()?.accessToken,
    });
  },
  attempt(attemptId: string) {
    return apiRequest<QuizAttempt>(`/courses/quiz-attempts/${encodeURIComponent(attemptId)}`, {
      token: getStoredTokens()?.accessToken,
    });
  },
  submitAnswer(dto: SubmitAnswerDto) {
    return apiRequest<SubmitAnswerResult>("/courses/quiz-attempts/answers", {
      body: JSON.stringify(dto),
      method: "POST",
      token: getStoredTokens()?.accessToken,
    });
  },
  finishAttempt(attemptId: string) {
    return apiRequest<QuizAttempt>(
      `/courses/quiz-attempts/${encodeURIComponent(attemptId)}/finish`,
      {
        method: "POST",
        token: getStoredTokens()?.accessToken,
      },
    );
  },
  enrollOthers(courseId: string, dto: EnrollOthersDto) {
    return apiRequest<void>(`/courses/${encodeURIComponent(courseId)}/enroll-others`, {
      body: JSON.stringify(dto),
      method: "POST",
      token: getStoredTokens()?.accessToken,
    });
  },
  enrollPreview(courseId: string, dto: EnrollOthersDto) {
    return apiRequest<EnrollPreviewDto>(`/courses/${encodeURIComponent(courseId)}/enroll-preview`, {
      body: JSON.stringify(dto),
      method: "POST",
      token: getStoredTokens()?.accessToken,
    });
  },
};

export function useCoursesQuery(params: CourseListParams = {}) {
  return useQuery({
    queryFn: () => courseApi.list(params),
    queryKey: courseKeys.list(params),
  });
}

export function useCourseQuery(slug?: string) {
  return useQuery({
    enabled: Boolean(slug),
    queryFn: () => courseApi.detail(slug ?? ""),
    queryKey: courseKeys.detail(slug ?? ""),
  });
}

export function useLessonQuery(courseSlug?: string, lessonId?: string) {
  return useQuery({
    enabled: Boolean(courseSlug && lessonId),
    queryFn: () => courseApi.lesson(courseSlug ?? "", lessonId ?? ""),
    queryKey: courseKeys.lesson(lessonId ?? ""),
  });
}

export function useCourseQuizzesQuery(courseSlug?: string) {
  return useQuery({
    enabled: Boolean(courseSlug),
    queryFn: () => courseApi.quizzes(courseSlug),
    queryKey: courseKeys.quizzes(courseSlug),
  });
}

export function useQuizQuery(quizId?: string) {
  return useQuery({
    enabled: Boolean(quizId),
    queryFn: () => courseApi.quiz(quizId ?? ""),
    queryKey: courseKeys.quiz(quizId ?? ""),
  });
}

export function useQuizAttemptQuery(attemptId?: string) {
  return useQuery({
    enabled: Boolean(attemptId && getStoredTokens()?.accessToken),
    queryFn: () => courseApi.attempt(attemptId ?? ""),
    queryKey: courseKeys.attempt(attemptId ?? ""),
  });
}

export function useCreateCourseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: courseApi.create,
    onSuccess(course) {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
      queryClient.setQueryData(courseKeys.detail(course.slug), course);
    },
  });
}

export function useUpdateCourseMutation(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateCourseDto) => courseApi.update(slug, dto),
    onSuccess(course) {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
      queryClient.setQueryData(courseKeys.detail(course.slug), course);
    },
  });
}

export function useDeleteCourseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: courseApi.delete,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
    },
  });
}

export function useCreateLessonMutation(courseSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateLessonDto) => courseApi.createLesson(courseSlug, dto),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseSlug) });
    },
  });
}

export function useUpdateLessonMutation(lessonId: string, courseSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateLessonDto) => courseApi.updateLesson(lessonId, dto),
    onSuccess(lesson) {
      queryClient.setQueryData(courseKeys.lesson(lessonId), lesson);
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseSlug) });
    },
  });
}

export function useDeleteLessonMutation(courseSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: courseApi.deleteLesson,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseSlug) });
    },
  });
}

export function useCreateTemplateMutation(lessonId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateQuestionTemplateDto) => courseApi.createTemplate(lessonId, dto),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: courseKeys.lesson(lessonId) });
      queryClient.invalidateQueries({ queryKey: courseKeys.all });
    },
  });
}

export function useUpdateTemplateMutation(templateId: string, lessonId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateQuestionTemplateDto) => courseApi.updateTemplate(templateId, dto),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: courseKeys.lesson(lessonId) });
      queryClient.invalidateQueries({ queryKey: courseKeys.all });
    },
  });
}

export function useDeleteTemplateMutation(lessonId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: courseApi.deleteTemplate,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: courseKeys.lesson(lessonId) });
      queryClient.invalidateQueries({ queryKey: courseKeys.all });
    },
  });
}

export function useCreateQuizMutation(courseSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: courseApi.createQuiz,
    onSuccess(quiz) {
      queryClient.setQueryData(courseKeys.quiz(quiz.id), quiz);
      queryClient.invalidateQueries({ queryKey: courseKeys.quizzes(courseSlug) });
      queryClient.invalidateQueries({ queryKey: courseKeys.all });
    },
  });
}

export function useUpdateQuizMutation(quizId: string, courseSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateQuizDto) => courseApi.updateQuiz(quizId, dto),
    onSuccess(quiz) {
      queryClient.setQueryData(courseKeys.quiz(quiz.id), quiz);
      queryClient.invalidateQueries({ queryKey: courseKeys.quizzes(courseSlug) });
      queryClient.invalidateQueries({ queryKey: courseKeys.all });
    },
  });
}

export function useDeleteQuizMutation(courseSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: courseApi.deleteQuiz,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: courseKeys.quizzes(courseSlug) });
      queryClient.invalidateQueries({ queryKey: courseKeys.all });
    },
  });
}

export function useStartQuizMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: courseApi.startQuiz,
    onSuccess(attempt) {
      queryClient.setQueryData(courseKeys.attempt(attempt.id), attempt);
    },
  });
}

export function useSubmitAnswerMutation(attemptId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: courseApi.submitAnswer,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: courseKeys.attempt(attemptId) });
    },
  });
}

export function useFinishAttemptMutation(attemptId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => courseApi.finishAttempt(attemptId),
    onSuccess(attempt) {
      queryClient.setQueryData(courseKeys.attempt(attempt.id), attempt);
    },
  });
}

export function useEnrollOthersMutation(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: EnrollOthersDto) => courseApi.enrollOthers(courseId, dto),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: courseKeys.all });
    },
  });
}

export function useEnrollPreviewMutation(courseId: string) {
  return useMutation({
    mutationFn: (dto: EnrollOthersDto) => courseApi.enrollPreview(courseId, dto),
  });
}
