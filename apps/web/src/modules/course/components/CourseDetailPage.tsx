"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageLayout } from "@/components/layout";
import { Button, Card } from "@/components/ui";
import { PERMISSIONS } from "@/lib/rbac";
import { useAuth } from "@/providers/AuthProvider";
import {
  useCourseQuery,
  useCourseQuizzesQuery,
  useStartQuizMutation,
  type QuizListItem,
} from "@services/course";

type CourseDetailPageProps = {
  slug: string;
};

export function CourseDetailPage({ slug }: CourseDetailPageProps) {
  const router = useRouter();
  const { can, isAuthenticated } = useAuth();
  const canTakeQuiz = can(PERMISSIONS.takeAssessments);
  const courseQuery = useCourseQuery(slug);
  const quizzesQuery = useCourseQuizzesQuery(slug);
  const startQuiz = useStartQuizMutation();
  const course = courseQuery.data;

  async function handleStartQuiz(quiz: QuizListItem) {
    const attempt = await startQuiz.mutateAsync(quiz.id);
    router.push(`/course/quiz/${attempt.id}`);
  }

  return (
    <PageLayout
      description={course?.summary ?? "Course lessons and quizzes."}
      eyebrow="Course"
      title={course?.title_vi || course?.title_en || "Course"}
    >
      {courseQuery.isLoading ? (
        <Card className="p-6 text-sm text-[var(--text-secondary)]">Loading course...</Card>
      ) : null}

      {courseQuery.error ? (
        <Card className="p-6 text-sm font-medium text-[var(--status-danger)]">
          {courseQuery.error instanceof Error ? courseQuery.error.message : "Could not load course."}
        </Card>
      ) : null}

      {course ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <div className="grid min-w-0 gap-5">
            {course.cover_image_url ? (
              <img
                alt=""
                className="aspect-[16/9] w-full rounded-lg border border-[var(--border-subtle)] object-cover"
                src={course.cover_image_url}
              />
            ) : null}

            <Card className="p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-[var(--brand-muted)] px-2.5 py-1 text-xs font-semibold uppercase text-[var(--brand-primary)]">
                  {course.level}
                </span>
                <span className="text-xs font-medium text-[var(--text-tertiary)]">
                  {course.lesson_count} lessons
                </span>
                <span className="text-xs font-medium text-[var(--text-tertiary)]">
                  {course.estimated_duration_minutes} minutes
                </span>
              </div>
              {course.description ? (
                <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">
                  {course.description}
                </p>
              ) : null}
            </Card>

            <section className="grid gap-3">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Lessons</h2>
              {course.lessons.map((lesson) => (
                <Link
                  className="rounded-lg focus:outline-none focus:ring-4 focus:ring-[var(--input-focus-ring)]"
                  href={`/course/${encodeURIComponent(course.slug)}/lesson/${encodeURIComponent(lesson.id)}`}
                  key={lesson.id}
                >
                  <Card className="p-5 transition hover:border-[var(--brand-primary)]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase text-[var(--text-tertiary)]">
                          Lesson {lesson.order_index ?? "-"}
                        </p>
                        <h3 className="mt-1 text-base font-semibold text-[var(--text-primary)]">
                          {lesson.title_vi || lesson.title_en}
                        </h3>
                      </div>
                      {lesson.quiz_count ? (
                        <span className="rounded-md bg-[var(--bg-base)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)]">
                          {lesson.quiz_count} quizzes
                        </span>
                      ) : null}
                    </div>
                  </Card>
                </Link>
              ))}
            </section>
          </div>

          <aside className="grid gap-4 lg:sticky lg:top-24">
            <Card className="p-5">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Course quizzes</h2>
              <div className="mt-4 grid gap-3">
                {quizzesQuery.data?.map((quiz) => (
                  <div
                    className="rounded-md border border-[var(--border-subtle)] p-3"
                    key={quiz.id}
                  >
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                      {quiz.title_vi || quiz.title_en}
                    </h3>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      {quiz.question_count} questions · Passing {quiz.passing_score}%
                    </p>
                    <Button
                      className="mt-3 w-full"
                      disabled={!isAuthenticated || !canTakeQuiz || startQuiz.isPending}
                      onClick={() => handleStartQuiz(quiz)}
                      size="sm"
                    >
                      Start quiz
                    </Button>
                  </div>
                ))}
              </div>
              {quizzesQuery.data?.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--text-secondary)]">No quizzes yet.</p>
              ) : null}
              {!isAuthenticated ? (
                <p className="mt-3 text-xs leading-5 text-[var(--text-tertiary)]">
                  Sign in to start quizzes.
                </p>
              ) : null}
            </Card>
          </aside>
        </div>
      ) : null}
    </PageLayout>
  );
}
