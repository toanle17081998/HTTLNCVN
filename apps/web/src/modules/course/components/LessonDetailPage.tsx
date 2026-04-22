"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageLayout } from "@/components/layout";
import { Button, Card } from "@/components/ui";
import { PERMISSIONS } from "@/lib/rbac";
import { useAuth } from "@/providers/AuthProvider";
import { markdownToHtml } from "@/modules/article/components/articleEditorUtils";
import { useLessonQuery, useStartQuizMutation, type QuizListItem } from "@services/course";

type LessonDetailPageProps = {
  courseSlug: string;
  lessonId: string;
};

function isRichTextHtml(value: string) {
  return /<\/?(p|h[1-6]|ul|ol|li|blockquote|figure|img|video|iframe|table|thead|tbody|tr|td|th|a|strong|em|div|span)\b/i.test(
    value,
  );
}

function renderLessonBody(value: string) {
  return isRichTextHtml(value) ? value : markdownToHtml(value);
}

export function LessonDetailPage({ courseSlug, lessonId }: LessonDetailPageProps) {
  const router = useRouter();
  const { can, isAuthenticated } = useAuth();
  const canTakeQuiz = can(PERMISSIONS.takeAssessments);
  const lessonQuery = useLessonQuery(courseSlug, lessonId);
  const startQuiz = useStartQuizMutation();
  const lesson = lessonQuery.data;
  const body = lesson?.content_markdown_vi || lesson?.content_markdown_en || "";
  const html = useMemo(() => renderLessonBody(body), [body]);

  async function handleStartQuiz(quiz: QuizListItem) {
    const attempt = await startQuiz.mutateAsync(quiz.id);
    router.push(`/course/quiz/${attempt.id}`);
  }

  return (
    <PageLayout
      description={lesson?.course.title_vi ?? "Course lesson."}
      eyebrow={lesson?.course.title_vi ?? "Lesson"}
      title={lesson?.title_vi || lesson?.title_en || "Lesson"}
    >
      {lessonQuery.isLoading ? (
        <Card className="p-6 text-sm text-[var(--text-secondary)]">Loading lesson...</Card>
      ) : null}

      {lessonQuery.error ? (
        <Card className="p-6 text-sm font-medium text-[var(--status-danger)]">
          {lessonQuery.error instanceof Error ? lessonQuery.error.message : "Could not load lesson."}
        </Card>
      ) : null}

      {lesson ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <article className="grid min-w-0 gap-5">
            <Card className="p-6">
              <div className="text-xs font-semibold uppercase text-[var(--text-tertiary)]">
                Lesson {lesson.order_index ?? "-"}
              </div>
              <div
                className="mt-5 text-base leading-7 text-[var(--text-primary)] [&_a]:font-semibold [&_a]:text-[var(--brand-primary)] [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--brand-primary)] [&_blockquote]:pl-4 [&_code]:rounded [&_code]:bg-[var(--brand-muted)] [&_code]:px-1.5 [&_code]:py-0.5 [&_h1]:text-3xl [&_h1]:font-semibold [&_h2]:mt-7 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-5 [&_h3]:text-xl [&_h3]:font-semibold [&_li]:my-0.5 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_strong]:font-semibold [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </Card>

            <Link
              className="inline-flex h-10 w-max items-center justify-center rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--brand-muted)] focus:outline-none focus:ring-4 focus:ring-[var(--input-focus-ring)]"
              href={`/course/${encodeURIComponent(courseSlug)}`}
            >
              Back to course
            </Link>
          </article>

          <aside className="lg:sticky lg:top-24">
            <Card className="p-5">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Lesson quizzes</h2>
              <div className="mt-4 grid gap-3">
                {lesson.quizzes.map((quiz) => (
                  <div
                    className="rounded-md border border-[var(--border-subtle)] p-3"
                    key={quiz.id}
                  >
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                      {quiz.title_vi || quiz.title_en}
                    </h3>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      {quiz.question_count} questions
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
              {lesson.quizzes.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--text-secondary)]">No quizzes yet.</p>
              ) : null}
            </Card>
          </aside>
        </div>
      ) : null}
    </PageLayout>
  );
}
