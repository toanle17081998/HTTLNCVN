"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageLayout } from "@/components/layout";
import { Button, Card } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import { PERMISSIONS } from "@/lib/rbac";
import { useAuth } from "@/providers/AuthProvider";
import { useFeedback } from "@/providers/FeedbackProvider";
import { markdownToHtml, isRichTextHtml } from "@/components/article/articleEditorUtils";
import { CourseTestPanel } from "@/components/course/CourseTestPanel";
import {
  useCourseQuery,
  useDeleteCourseMutation,
  useDeleteLessonMutation,
} from "@/services/course";
import { useState } from "react";

type CourseDetailPageProps = {
  slug: string;
};


export function CourseDetailPage({ slug }: CourseDetailPageProps) {
  const { t, locale } = useTranslation();
  const { confirm } = useFeedback();
  const router = useRouter();
  const { can } = useAuth();
  const courseQuery = useCourseQuery(slug);
  const deleteCourse = useDeleteCourseMutation();
  const deleteLesson = useDeleteLessonMutation(slug);

  const course = courseQuery.data;

  const rawDescription = locale === "vi"
    ? (course?.description_vi || course?.description_en)
    : (course?.description_en || course?.description_vi);
  const descriptionHtml = rawDescription
    ? isRichTextHtml(rawDescription)
      ? rawDescription
      : markdownToHtml(rawDescription)
    : "";

  return (
    <PageLayout
      description={(locale === "vi" ? (course?.summary_vi || course?.summary_en) : (course?.summary_en || course?.summary_vi)) ?? (locale === "vi" ? "Bài học và câu hỏi trắc nghiệm của khóa học." : "Course lessons and quizzes.")}
      eyebrow={t("nav.course.label")}
      title={locale === "vi" ? (course?.title_vi || course?.title_en || "Khóa học") : (course?.title_en || course?.title_vi || "Course")}
    >
      {courseQuery.isLoading ? (
        <Card className="p-6 text-sm text-[var(--text-secondary)]">{t("common.ready")}...</Card>
      ) : null}

      {courseQuery.error ? (
        <Card className="p-6 text-sm font-medium text-[var(--status-danger)]">
          {courseQuery.error instanceof Error ? courseQuery.error.message : t("page.course.description")}
        </Card>
      ) : null}

      {course ? (
        <div className="grid gap-5">
          <div className="grid min-w-0 gap-5">
            {course.cover_image_url ? (
              <img
                alt=""
                className="aspect-[16/9] w-full rounded-lg border border-[var(--border-subtle)] object-cover"
                src={course.cover_image_url}
              />
            ) : null}

            {can(PERMISSIONS.manageCourses) && (
              <div className="flex justify-end gap-2">

                <Button variant="ghost" onClick={() => router.push(`/admin/courses/${slug}/edit`)}>
                  {t("course.action.edit")}
                </Button>
                <Button
                  variant="ghost"
                  className="text-[var(--status-danger)] hover:bg-[var(--status-danger-muted)]"
                  onClick={async () => {
                    const ok = await confirm({
                      variant: "delete",
                      title: t("course.action.deleteConfirm"),
                    });
                    if (ok) {
                      await deleteCourse.mutateAsync(slug);
                      router.push("/course");
                    }
                  }}
                >
                  {t("prayer.action.delete")}
                </Button>
              </div>
            )}

            <Card className="p-6">
              <div className="flex flex-wrap items-center gap-2">
                {course.category ? (
                  <span className="rounded-md bg-[var(--brand-muted)] px-2.5 py-1 text-xs font-semibold uppercase text-[var(--brand-primary)]">
                    {locale === "vi" ? course.category.name_vi : course.category.name_en}
                  </span>
                ) : null}
                <span className="text-xs font-medium text-[var(--text-tertiary)]">
                  {course.lesson_count} {t("lesson.label").toLowerCase()}s
                </span>
                <span className="text-xs font-medium text-[var(--text-tertiary)]">
                  {course.estimated_duration_minutes} {t("quiz.minutes")}
                </span>
              </div>
              {descriptionHtml ? (
                <div
                  className="mt-4 text-sm leading-6 text-[var(--text-secondary)] [&_a]:font-semibold [&_a]:text-[var(--brand-primary)] [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--brand-primary)] [&_blockquote]:pl-4 [&_code]:rounded [&_code]:bg-[var(--brand-muted)] [&_code]:px-1.5 [&_code]:py-0.5 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:my-0.5 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-1 [&_strong]:font-semibold [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6"
                  dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                />
              ) : null}
            </Card>

            <section className="grid gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">{t("lesson.label")}</h2>
                {can(PERMISSIONS.manageCourses) && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => router.push(`/admin/lessons/create?course=${encodeURIComponent(slug)}`)}
                  >
                    {t("lesson.action.add")}
                  </Button>
                )}
              </div>
              {course.is_allowed === false ? (
                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-5 text-center text-sm font-medium text-[var(--text-secondary)]">
                  Ask church admin to enroll your self in this course
                </div>
              ) : (
                course.lessons.map((lesson) => (
                  <div key={lesson.id} className="group relative">
                    <Link
                      className="block rounded-lg focus:outline-none focus:ring-4 focus:ring-[var(--input-focus-ring)]"
                      href={`/course/${encodeURIComponent(course.slug)}/lesson/${encodeURIComponent(lesson.id)}`}
                    >
                      <Card className="p-5 transition hover:border-[var(--brand-primary)]">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold uppercase text-[var(--text-tertiary)]">
                              {t("lesson.label")} {lesson.order_index ?? "-"}
                            </p>
                            <h3 className="mt-1 text-base font-semibold text-[var(--text-primary)]">
                              {locale === "vi" ? (lesson.title_vi || lesson.title_en) : (lesson.title_en || lesson.title_vi)}
                            </h3>
                          </div>
                          <div className="flex items-center gap-3">
                            {lesson.quiz_count ? (
                              <span className="rounded-md bg-[var(--bg-base)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)]">
                                {lesson.quiz_count} {t("quiz.title").toLowerCase()}s
                              </span>
                            ) : null}
                            {can(PERMISSIONS.manageCourses) && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    router.push(`/admin/courses/${course.slug}/lessons/${lesson.id}/edit`);
                                  }}
                                >
                                  {t("lesson.action.edit")}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-[var(--status-danger)] hover:bg-[var(--status-danger-muted)]"
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    const ok = await confirm({
                                      variant: "delete",
                                      title: t("lesson.action.deleteConfirm"),
                                    });
                                    if (ok) {
                                      await deleteLesson.mutateAsync(lesson.id);
                                    }
                                  }}
                                >
                                  {t("lesson.action.delete")}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </div>
                ))
              )}
            </section>
            {course.slug !== "isom-b-5" && <CourseTestPanel course={course} />}
          </div>

        </div>
      ) : null}


    </PageLayout>
  );
}
