"use client";

import { Text, Button, Card, Title, Label, Input, Pagination } from "@/components/ui";
import { useState } from "react";
import Link from "next/link";
import { ChevronRight, FileText, GraduationCap, Plus, Pencil, Trash2 } from "lucide-react";
import { PageLayout } from "@/components/layout";
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
} from "@/hooks/course";

export function AdminCourses() {
  const { localize, t } = useTranslation();
  const { confirm } = useFeedback();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const coursesQuery = useCoursesQuery({ skip: page * pageSize, take: pageSize });
  const total = coursesQuery.data?.total ?? 0;
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
      <CategoryManager localize={localize} t={t} confirm={confirm} />

      <div className="grid gap-3">
        {coursesQuery.isLoading ? (
          <Card className="p-5 text-sm text-[var(--text-secondary)]">{t("admin.courses.loading")}</Card>
        ) : null}

        {coursesQuery.data?.items.map((course) => (
          <CoursePanel
            course={course}
            isDeletingCourse={deleteCourse.isPending}
            key={course.id}
            localize={localize}
            onDeleteCourse={handleDelete}
            t={t}
          />
        ))}

        {coursesQuery.data?.items.length === 0 ? (
          <Card className="border-dashed p-8 text-center text-sm text-[var(--text-secondary)]">
            {t("admin.courses.empty")}
          </Card>
        ) : null}

        {total > 0 ? (
          <Pagination
            className="mt-2"
            onPageChange={(nextPage) => {
              setPage(nextPage);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onPageSizeChange={(nextSize) => {
              setPageSize(nextSize);
              setPage(0);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            page={page}
            pageSize={pageSize}
            total={total}
          />
        ) : null}
      </div>
    </PageLayout>
  );
}

function CategoryManager({
  localize,
  t,
  confirm,
}: {
  localize: ReturnType<typeof useTranslation>["localize"];
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
        <Title as="h3" variant="micro">{t("admin.category.title")}</Title>
        <Button size="sm" variant="secondary" onClick={startCreate}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          {t("admin.category.add")}
        </Button>
      </div>

      {categories.length === 0 ? (
        <Text as="p" tone="inherit" variant="inherit" className="mt-3 text-xs text-[var(--text-tertiary)]">{t("admin.category.empty")}</Text>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1 text-xs font-medium text-[var(--text-primary)]"
            >
              <span>{localize(cat, "name")}</span>
              <Button
                variant="unstyled"
                type="submit"
                className="ml-1 rounded p-0.5 text-[var(--text-tertiary)] hover:text-[var(--brand-primary)]"
                onClick={() => startEdit(cat)}
                title="Edit"
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="unstyled"
                type="submit"
                className="rounded p-0.5 text-[var(--text-tertiary)] hover:text-[var(--status-danger)]"
                onClick={() => handleDelete(cat.id)}
                title="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {isOpen ? (
        <div className="mt-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label variant="caption" className="mb-1 block">
                {t("admin.category.nameEn")}
              </Label>
              <Input
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-ring)]"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
              />
            </div>
            <div>
              <Label variant="caption" className="mb-1 block">
                {t("admin.category.nameVi")}
              </Label>
              <Input
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
  localize,
  onDeleteCourse,
  t,
}: {
  course: CourseListItem;
  isDeletingCourse: boolean;
  localize: ReturnType<typeof useTranslation>["localize"];
  onDeleteCourse: (slug: string) => void;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const courseQuery = useCourseQuery(isOpen ? course.slug : undefined);
  const deleteLesson = useDeleteLessonMutation(course.slug);
  const lessons = courseQuery.data?.lessons ?? [];
  const title = localize(course, "title");

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
      <details
        className="group"
        open={isOpen}
        onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)}
      >
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
              <Title as="h2" className="truncate" variant="labelStrong">{title}</Title>
              <Text as="p" tone="inherit" variant="inherit" className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                <span className="rounded bg-[var(--brand-muted)] px-1.5 py-0.5 text-[var(--brand-primary)]">
                  {course.status}
                </span>
                <span>•</span>
                <span>Order: {course.sort_order ?? 0}</span>
                <span>•</span>
                <span>{course.lesson_count} {t("course.form.lessons")}</span>
                {course.category ? (
                  <>
                    <span>•</span>
                    <span>{localize(course.category, "name")}</span>
                  </>
                ) : null}
              </Text>
            </div>
          </div>
          
          <div className="flex shrink-0 items-center gap-1.5 sm:ml-auto">
            <Link
              aria-label={t("admin.courses.addLesson")}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] shadow-sm transition-all hover:bg-[var(--brand-muted)] hover:text-[var(--brand-primary)] sm:w-auto sm:px-3"
              href={`/admin/lessons/create?course=${encodeURIComponent(course.slug)}`}
              onClick={(event) => event.stopPropagation()}
              title={t("admin.courses.addLesson")}
            >
              <Plus className="h-4 w-4 sm:mr-1.5 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">{t("admin.courses.addLesson")}</span>
            </Link>
            <Link
              aria-label={t("admin.common.edit")}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm transition-all hover:bg-[var(--brand-muted)] hover:text-[var(--brand-primary)]"
              href={`/admin/courses/${encodeURIComponent(course.slug)}/edit`}
              onClick={(event) => event.stopPropagation()}
              title={t("admin.common.edit")}
            >
              <Pencil className="h-4 w-4" />
            </Link>
            <Button
              aria-label={t("admin.common.delete")}
              disabled={isDeletingCourse}
              onClick={(event) => {
                event.stopPropagation();
                onDeleteCourse(course.slug);
              }}
              size="icon"
              title={t("admin.common.delete")}
              variant="danger"
              className="rounded-lg"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </summary>

        <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-card)]/50 p-4">
          {courseQuery.isLoading ? (
            <div className="flex items-center gap-3 p-4">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
              <Text variant="small">{t("admin.courses.loadingLessons")}</Text>
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
                    <Text as="p" tone="inherit" variant="inherit" className="truncate text-sm font-bold text-[var(--text-primary)]">
                      {localize(lesson, "title")}
                    </Text>
                    <Text as="p" tone="inherit" variant="inherit" className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] flex flex-wrap gap-2 items-center">
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
                    </Text>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 sm:ml-auto">
                  <Link
                    aria-label={`Templates (${lesson.template_count ?? 0})`}
                    href={`/admin/courses/${encodeURIComponent(course.slug)}/lessons/${encodeURIComponent(lesson.id)}/template`}
                    className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-primary)] transition-all hover:bg-[var(--brand-muted)] hover:text-[var(--brand-primary)] sm:px-3"
                    title={`Templates (${lesson.template_count ?? 0})`}
                  >
                    <FileText className="h-3.5 w-3.5 sm:hidden" />
                    <span className="hidden sm:inline">Templates</span>
                    <span>({lesson.template_count ?? 0})</span>
                  </Link>
                  <Link
                    aria-label={t("admin.common.edit")}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] transition-all hover:bg-[var(--brand-muted)] hover:text-[var(--brand-primary)]"
                    href={`/admin/courses/${encodeURIComponent(course.slug)}/lessons/${encodeURIComponent(lesson.id)}/edit`}
                    title={t("admin.common.edit")}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                  <Button
                    aria-label={t("admin.common.delete")}
                    disabled={deleteLesson.isPending}
                    onClick={() => handleDeleteLesson(lesson.id)}
                    size="iconSm"
                    title={t("admin.common.delete")}
                    variant="danger"
                    className="rounded-lg"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {lessons.length === 0 && !courseQuery.isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="mb-2 h-8 w-8 text-[var(--text-tertiary)] opacity-20" />
              <Text variant="small">{t("admin.courses.lessonsEmpty")}</Text>
            </div>
          ) : null}
        </div>
      </details>
    </Card>
  );
}
