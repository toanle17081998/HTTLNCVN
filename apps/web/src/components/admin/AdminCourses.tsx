"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, FileText, GraduationCap, Plus, Pencil, Trash2 } from "lucide-react";
import { PageLayout } from "@/components/layout";
import { Button, Card } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import { useFeedback } from "@/providers/FeedbackProvider";
import {
  useCourseQuery,
  useCoursesQuery,
  useDeleteCourseMutation,
  useDeleteLessonMutation,
  useCourseCategoriesQuery,
  useCreateCourseCategoryMutation,
  useUpdateCourseCategoryMutation,
  useDeleteCourseCategoryMutation,
  type CourseListItem,
  type CourseCategory,
} from "@/services/course";

export function AdminCourses() {
  const { locale, t } = useTranslation();
  const { confirm } = useFeedback();
  const coursesQuery = useCoursesQuery({ take: 100 });
  const deleteCourse = useDeleteCourseMutation();

  async function handleDelete(slug: string) {
    const ok = await confirm({
      variant: "delete",
      title: t("admin.courses.deleteConfirm"),
    });
    if (!ok) return;
    await deleteCourse.mutateAsync(slug);
  }

  return (
    <PageLayout
      actions={
        <Link
          className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--btn-primary-bg)] px-4 text-sm font-semibold text-[var(--btn-primary-text)] transition hover:brightness-95"
          href="/admin/courses/create"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          {t("admin.courses.create")}
        </Link>
      }
      description={t("admin.courses.description")}
      eyebrow={t("admin.common.admin")}
      title={t("admin.courses.title")}
    >
      {/* Category Manager */}
      <CategoryManager locale={locale} t={t} confirm={confirm} />

      <div className="grid gap-3">
        {coursesQuery.isLoading ? (
          <Card className="p-5 text-sm text-[var(--text-secondary)]">{t("admin.courses.loading")}</Card>
        ) : null}

        {coursesQuery.data?.items.map((course) => (
          <CoursePanel
            course={course}
            isDeletingCourse={deleteCourse.isPending}
            key={course.id}
            locale={locale}
            onDeleteCourse={handleDelete}
            t={t}
          />
        ))}

        {coursesQuery.data?.items.length === 0 ? (
          <Card className="border-dashed p-8 text-center text-sm text-[var(--text-secondary)]">
            {t("admin.courses.empty")}
          </Card>
        ) : null}
      </div>
    </PageLayout>
  );
}

function CategoryManager({
  locale,
  t,
  confirm,
}: {
  locale: string;
  t: ReturnType<typeof useTranslation>["t"];
  confirm: ReturnType<typeof useFeedback>["confirm"];
}) {
  const categoriesQuery = useCourseCategoriesQuery();
  const createCategory = useCreateCourseCategoryMutation();
  const deleteCategory = useDeleteCourseCategoryMutation();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameEn, setNameEn] = useState("");
  const [nameVi, setNameVi] = useState("");
  const updateCategory = useUpdateCourseCategoryMutation(editingId ?? "");

  const categories = categoriesQuery.data ?? [];

  function startEdit(cat: CourseCategory) {
    setEditingId(cat.id);
    setNameEn(cat.name_en);
    setNameVi(cat.name_vi);
    setIsOpen(true);
  }

  function startCreate() {
    setEditingId(null);
    setNameEn("");
    setNameVi("");
    setIsOpen(true);
  }

  async function handleSave() {
    if (!nameEn.trim() || !nameVi.trim()) return;
    if (editingId) {
      await updateCategory.mutateAsync({ name_en: nameEn.trim(), name_vi: nameVi.trim() });
    } else {
      await createCategory.mutateAsync({ name_en: nameEn.trim(), name_vi: nameVi.trim() });
    }
    setIsOpen(false);
  }

  async function handleDelete(id: string) {
    const ok = await confirm({ variant: "delete", title: t("admin.category.confirmDelete") });
    if (!ok) return;
    await deleteCategory.mutateAsync(id);
  }

  return (
    <Card className="mb-6 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">{t("admin.category.title")}</h3>
        <Button size="sm" variant="secondary" onClick={startCreate}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          {t("admin.category.add")}
        </Button>
      </div>

      {categories.length === 0 ? (
        <p className="mt-3 text-xs text-[var(--text-tertiary)]">{t("admin.category.empty")}</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1 text-xs font-medium text-[var(--text-primary)]"
            >
              <span>{locale === "vi" ? cat.name_vi : cat.name_en}</span>
              <button
                className="ml-1 rounded p-0.5 text-[var(--text-tertiary)] hover:text-[var(--brand-primary)]"
                onClick={() => startEdit(cat)}
                title="Edit"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                className="rounded p-0.5 text-[var(--text-tertiary)] hover:text-[var(--status-danger)]"
                onClick={() => handleDelete(cat.id)}
                title="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {isOpen ? (
        <div className="mt-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                {t("admin.category.nameEn")}
              </label>
              <input
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-ring)]"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">
                {t("admin.category.nameVi")}
              </label>
              <input
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-ring)]"
                value={nameVi}
                onChange={(e) => setNameVi(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={handleSave}
              disabled={createCategory.isPending || updateCategory.isPending}
            >
              {t("action.create")}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setIsOpen(false)}>
              {t("action.cancel")}
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function CoursePanel({
  course,
  isDeletingCourse,
  locale,
  onDeleteCourse,
  t,
}: {
  course: CourseListItem;
  isDeletingCourse: boolean;
  locale: string;
  onDeleteCourse: (slug: string) => void;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const courseQuery = useCourseQuery(course.slug);
  const deleteLesson = useDeleteLessonMutation(course.slug);
  const lessons = courseQuery.data?.lessons ?? [];
  const title =
    locale === "vi" ? course.title_vi || course.title_en : course.title_en || course.title_vi;

  const { confirm } = useFeedback();

  async function handleDeleteLesson(lessonId: string) {
    const ok = await confirm({
      variant: "delete",
      title: t("lesson.action.deleteConfirm"),
    });
    if (!ok) return;
    await deleteLesson.mutateAsync(lessonId);
  }

  return (
    <Card className="overflow-hidden rounded-xl shadow-sm transition-all duration-200 hover:shadow-md">
      <details className="group">
        <summary className="flex min-w-0 cursor-pointer list-none flex-col gap-4 p-4 transition-colors hover:bg-[var(--bg-surface)] sm:flex-row sm:items-center [&::-webkit-details-marker]:hidden">
          <div className="flex flex-1 items-center gap-4 min-w-0">
            <ChevronRight
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-[var(--text-tertiary)] transition-transform duration-200 group-open:rotate-90"
            />
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-muted)] text-[var(--brand-primary)]">
              <GraduationCap aria-hidden="true" className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-bold text-[var(--text-primary)]">{title}</h2>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                <span className="rounded bg-[var(--brand-muted)] px-1.5 py-0.5 text-[var(--brand-primary)]">
                  {course.status}
                </span>
                <span>•</span>
                <span>{course.lesson_count} {t("course.form.lessons")}</span>
                {course.category ? (
                  <>
                    <span>•</span>
                    <span>{locale === "vi" ? course.category.name_vi : course.category.name_en}</span>
                  </>
                ) : null}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <Link
              className="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-xs font-bold text-[var(--text-primary)] shadow-sm transition-all hover:bg-[var(--brand-muted)] hover:text-[var(--brand-primary)]"
              href={`/admin/lessons/create?course=${encodeURIComponent(course.slug)}`}
              onClick={(event) => event.stopPropagation()}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              {t("admin.courses.addLesson")}
            </Link>
            <Link
              className="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-xs font-bold text-[var(--text-primary)] shadow-sm transition-all hover:bg-[var(--brand-muted)] hover:text-[var(--brand-primary)]"
              href={`/admin/courses/${encodeURIComponent(course.slug)}/edit`}
              onClick={(event) => event.stopPropagation()}
            >
              {t("admin.common.edit")}
            </Link>
            <Button
              disabled={isDeletingCourse}
              onClick={(event) => {
                event.stopPropagation();
                onDeleteCourse(course.slug);
              }}
              size="sm"
              variant="danger"
              className="h-9 rounded-lg px-3 text-xs font-bold"
            >
              {t("admin.common.delete")}
            </Button>
          </div>
        </summary>

        <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-card)]/50 p-4">
          {courseQuery.isLoading ? (
            <div className="flex items-center gap-3 p-4">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
              <p className="text-sm text-[var(--text-secondary)]">{t("admin.courses.loadingLessons")}</p>
            </div>
          ) : null}

          <div className="grid gap-3">
            {lessons.map((lesson) => (
              <div
                className="group/lesson flex min-w-0 flex-col gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-sm transition-all hover:border-[var(--brand-primary)] sm:flex-row sm:items-center"
                key={lesson.id}
              >
                <div className="flex flex-1 items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-base)] text-[var(--text-tertiary)] group-hover/lesson:bg-[var(--brand-muted)] group-hover/lesson:text-[var(--brand-primary)]">
                    <FileText aria-hidden="true" className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[var(--text-primary)]">
                      {locale === "vi"
                        ? lesson.title_vi || lesson.title_en
                        : lesson.title_en || lesson.title_vi}
                    </p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] flex flex-wrap gap-2 items-center">
                      <span>
                        {t("admin.courses.quizMeta", {
                          count: String(lesson.quiz_count ?? 0),
                          order: String(lesson.order_index ?? "-"),
                        })}
                      </span>
                      <span>•</span>
                      <span>
                        Templates: {lesson.template_count ?? 0}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 sm:ml-auto">
                  <Link
                    href={`/admin/courses/${encodeURIComponent(course.slug)}/lessons/${encodeURIComponent(lesson.id)}/template`}
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 text-[10px] font-bold uppercase tracking-wider text-[var(--text-primary)] transition-all hover:bg-[var(--brand-muted)] hover:text-[var(--brand-primary)]"
                  >
                    Templates ({lesson.template_count ?? 0})
                  </Link>
                  <Link
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 text-[10px] font-bold uppercase tracking-wider text-[var(--text-primary)] transition-all hover:bg-[var(--brand-muted)] hover:text-[var(--brand-primary)]"
                    href={`/admin/courses/${encodeURIComponent(course.slug)}/lessons/${encodeURIComponent(lesson.id)}/edit`}
                  >
                    {t("admin.common.edit")}
                  </Link>
                  <Button
                    disabled={deleteLesson.isPending}
                    onClick={() => handleDeleteLesson(lesson.id)}
                    size="sm"
                    variant="danger"
                    className="h-8 rounded-lg px-3 text-[10px] font-bold uppercase tracking-wider"
                  >
                    {t("admin.common.delete")}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {lessons.length === 0 && !courseQuery.isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="mb-2 h-8 w-8 text-[var(--text-tertiary)] opacity-20" />
              <p className="text-sm text-[var(--text-secondary)]">{t("admin.courses.lessonsEmpty")}</p>
            </div>
          ) : null}
        </div>
      </details>
    </Card>
  );
}
