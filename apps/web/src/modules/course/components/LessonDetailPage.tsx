"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageLayout } from "@/components/layout";
import { Button, Card } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import { PERMISSIONS } from "@/lib/rbac";
import { useAuth } from "@/providers/AuthProvider";
import { useFeedback } from "@/providers/FeedbackProvider";
import { markdownToHtml, isRichTextHtml } from "@/modules/article/components/articleEditorUtils";
import {
  useLessonQuery,
  useStartQuizMutation,
  useDeleteTemplateMutation,
  useDeleteLessonMutation,
  type QuizListItem,
} from "@services/course";

type LessonDetailPageProps = {
  courseSlug: string;
  lessonId: string;
};

function renderLessonBody(value: string) {
  return isRichTextHtml(value) ? value : markdownToHtml(value);
}

export function LessonDetailPage({ courseSlug, lessonId }: LessonDetailPageProps) {
  const { t, locale, setLocale } = useTranslation();
  const { confirm } = useFeedback();
  const router = useRouter();
  const { can, isAuthenticated } = useAuth();
  const canTakeQuiz = can(PERMISSIONS.takeAssessments);
  const lessonQuery = useLessonQuery(courseSlug, lessonId);
  const startQuiz = useStartQuizMutation();
  const deleteTemplate = useDeleteTemplateMutation(lessonId);
  const deleteLesson = useDeleteLessonMutation(courseSlug);
  const lesson = lessonQuery.data;
  const readerLang = locale === "vi" ? "vi" : "en";
  const body = readerLang === "vi"
    ? (lesson?.content_markdown_vi || lesson?.content_markdown_en || "")
    : (lesson?.content_markdown_en || lesson?.content_markdown_vi || "");
  const html = useMemo(() => renderLessonBody(body), [body]);

  async function handleStartQuiz(quiz: QuizListItem) {
    const attempt = await startQuiz.mutateAsync(quiz.id);
    router.push(`/course/quiz/${attempt.id}`);
  }

  return (
    <PageLayout
      description={locale === "vi" ? (lesson?.course.title_vi ?? "Bài học khóa học.") : (lesson?.course.title_en ?? "Course lesson.")}
      eyebrow={locale === "vi" ? (lesson?.course.title_vi ?? "Bài học") : (lesson?.course.title_en ?? "Lesson")}
      title={locale === "vi" ? (lesson?.title_vi || lesson?.title_en || "Bài học") : (lesson?.title_en || lesson?.title_vi || "Lesson")}
    >
      {lessonQuery.isLoading ? (
        <Card className="p-6 text-sm text-[var(--text-secondary)]">{t("common.ready")}...</Card>
      ) : null}

      {lessonQuery.error ? (
        <Card className="p-6 text-sm font-medium text-[var(--status-danger)]">
          {lessonQuery.error instanceof Error ? lessonQuery.error.message : t("page.article.description")}
        </Card>
      ) : null}

      {lesson ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <article className="grid min-w-0 gap-5">
            <Card className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-semibold uppercase text-[var(--text-tertiary)]">
                  {t("lesson.label")} {lesson.order_index ?? "-"}
                </div>
                <div className="flex items-center gap-2">
                  {can(PERMISSIONS.manageCourses) && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/admin/courses/${courseSlug}/lessons/${lessonId}/edit`)}
                      >
                        {t("lesson.action.edit")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-[var(--status-danger)] hover:bg-[var(--status-danger-muted)]"
                        onClick={async () => {
                          const ok = await confirm({
                            variant: "delete",
                            title: t("lesson.action.deleteConfirm"),
                          });
                          if (ok) {
                            await deleteLesson.mutateAsync(lessonId);
                            router.push(`/course/${courseSlug}`);
                          }
                        }}
                      >
                        {t("lesson.action.delete")}
                      </Button>
                    </>
                  )}
                </div>
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
              {t("nav.course.label")}
            </Link>
          </article>

          <aside className="lg:sticky lg:top-24 grid gap-5">
            <Card className="p-5">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">{t("quiz.title")}</h2>
              <div className="mt-4 grid gap-3">
                {lesson.quizzes.map((quiz) => (
                  <div
                    className="rounded-md border border-[var(--border-subtle)] p-3"
                    key={quiz.id}
                  >
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                      {locale === "vi" ? (quiz.title_vi || quiz.title_en) : (quiz.title_en || quiz.title_vi)}
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
                      {t("quiz.action.start")}
                    </Button>
                  </div>
                ))}
              </div>
              {lesson.quizzes.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--text-secondary)]">No quizzes yet.</p>
              ) : null}
            </Card>

            {can(PERMISSIONS.manageCourses) && (
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-[var(--text-primary)]">Templates</h2>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => router.push(`/course/${courseSlug}/lesson/${lessonId}/template/create`)}
                  >
                    Add
                  </Button>
                </div>
                <div className="mt-4 grid gap-2">
                  {lesson.templates?.map((template) => (
                    <div key={template.id} className="text-xs p-2 rounded border border-[var(--border-subtle)] flex justify-between items-center">
                      <span className="truncate mr-2">{template.body_template_vi || template.body_template_en}</span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => router.push(`/course/${courseSlug}/lesson/${lessonId}/template/${template.id}/edit`)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[var(--status-danger)] hover:bg-[var(--status-danger-muted)]"
                          onClick={async () => {
                            const ok = await confirm({
                              variant: "delete",
                              title: "Are you sure you want to delete this template?",
                            });
                            if (ok) {
                              await deleteTemplate.mutateAsync(template.id);
                            }
                          }}
                        >
                          Del
                        </Button>
                      </div>
                    </div>
                  ))}
                  {!lesson.templates?.length && (
                    <p className="text-sm text-[var(--text-secondary)]">No templates yet.</p>
                  )}
                </div>
              </Card>
            )}
          </aside>
        </div>
      ) : null}
    </PageLayout>
  );
}
