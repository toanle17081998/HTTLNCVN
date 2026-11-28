"use client";

import Link from "next/link";
import { SafeImage as Image } from "@/components/ui/SafeImage";
import { notFound, useRouter } from "next/navigation";
import { useState, useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PageLayout } from "@/components/layout";
import { Badge, Button, Card, Input, Pagination, Dropdown, Skeleton, Text, Title } from "@/components/ui";
import { CardActions } from "@/components/ui/CardActions";
import { matchesCategoryParam, toCategorySlug, useUrlPagination } from "@/hooks/useUrlPagination";
import { useTranslation } from "@/providers/I18nProvider";
import { PERMISSIONS } from "@/lib/rbac";
import { useAuth } from "@/providers/AuthProvider";
import { useFeedback } from "@/providers/FeedbackProvider";
import { courseApi, courseKeys, useCoursesQuery, useCourseCategoriesQuery, useDeleteCourseMutation } from "@/hooks/course";

const PAGE_SIZE_DEFAULT = 10;
const statusLabelKeys = {
  draft: "course.form.status.draft",
  published: "course.form.status.published",
} as const;

function getStatusLabelKey(status: string) {
  return status in statusLabelKeys ? statusLabelKeys[status as keyof typeof statusLabelKeys] : "course.form.status.draft";
}

export function CoursePage() {
  const { t, localize } = useTranslation();
  const router = useRouter();
  const { can, isLoading: authLoading } = useAuth();
  const { confirm } = useFeedback();
  const deleteCourse = useDeleteCourseMutation();
  const { isInvalidParams, isPageOutOfRange, page, pageSize, searchParams, setPage, setPageSize, updateParams } =
    useUrlPagination({
      defaultPageSize: PAGE_SIZE_DEFAULT,
    });
  const rawCategory = searchParams.get("category");
  const isInvalidCategoryParam = rawCategory !== null && rawCategory.trim() === "";
  const q = searchParams.get("q") ?? "";
  const [searchInput, setSearchInput] = useState(q);
  const [syncedQ, setSyncedQ] = useState(q);
  if (q !== syncedQ) {
    setSyncedQ(q);
    setSearchInput(q);
  }
  const listTopRef = useRef<HTMLDivElement>(null);

  const canManageCourses = can(PERMISSIONS.manageCourses);
  const categoriesQuery = useCourseCategoriesQuery();
  const categories = categoriesQuery.data ?? [];
  const matchedCategory =
    rawCategory && !isInvalidCategoryParam
      ? categories.find((cat) => matchesCategoryParam(rawCategory, [cat.name_vi, cat.name_en]))
      : undefined;
  const selectedCategoryId = matchedCategory?.id;

  const coursesQuery = useCoursesQuery(
    {
      take: pageSize,
      skip: page * pageSize,
      status: canManageCourses ? undefined : "published",
      category_id: selectedCategoryId,
      q: q || undefined,
    },
    { enabled: !authLoading && (rawCategory === null || selectedCategoryId !== undefined) },
  );

  const total = coursesQuery.data?.total ?? 0;
  const isUnknownCategory =
    rawCategory !== null && !isInvalidCategoryParam && categoriesQuery.isSuccess && !matchedCategory;
  const isNotFound =
    isInvalidParams ||
    isInvalidCategoryParam ||
    isUnknownCategory ||
    isPageOutOfRange(total, coursesQuery.isSuccess);
  const isListLoading = coursesQuery.isLoading || (coursesQuery.isFetching && coursesQuery.isPlaceholderData);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (authLoading || (page + 1) * pageSize >= total) return;
    const nextParams = {
      take: pageSize,
      skip: (page + 1) * pageSize,
      status: canManageCourses ? undefined : ("published" as const),
      category_id: selectedCategoryId,
      q: q || undefined,
    };
    void queryClient.prefetchQuery({
      queryFn: () => courseApi.list(nextParams),
      queryKey: courseKeys.list(nextParams),
    });
  }, [authLoading, canManageCourses, page, pageSize, q, queryClient, selectedCategoryId, total]);

  const scrollToList = useCallback(() => {
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handlePageChange = useCallback(
    (nextPage: number) => {
      setPage(nextPage);
      scrollToList();
    },
    [scrollToList, setPage],
  );

  const handlePageSizeChange = useCallback(
    (nextSize: number) => {
      setPageSize(nextSize);
      scrollToList();
    },
    [scrollToList, setPageSize],
  );

  useEffect(() => {
    const nextQuery = searchInput.trim();
    if (nextQuery === q) return;
    const timer = window.setTimeout(() => {
      updateParams({ page: null, q: nextQuery || null });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [q, searchInput, updateParams]);

  const handleCategoryChange = (id: string | undefined) => {
    const cat = id ? categories.find((item) => item.id === id) : undefined;
    const categoryParam = cat ? toCategorySlug(localize(cat, "name")) || localize(cat, "name") : null;
    updateParams({ category: categoryParam, page: null });
  };

  async function handleDelete(slug: string) {
    const ok = await confirm({ variant: "delete", title: t("course.action.deleteConfirm") });
    if (ok) await deleteCourse.mutateAsync(slug);
  }

  if (isNotFound) {
    notFound();
  }

  return (
    <PageLayout
      description={t("page.course.description")}
      eyebrow={t("page.course.eyebrow")}
      title={t("page.course.title")}
      actions={
        canManageCourses ? (
          <Button variant="primary" onClick={() => router.push("/admin/courses/create")}>
            {t("action.createCourse")}
          </Button>
        ) : null
      }
    >
      {/* Search bar */}
      <div className="mb-4 flex gap-2">
        <Input
          aria-label={t("course.searchPlaceholder")}
          className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-ring)]"
          placeholder={t("course.searchPlaceholder")}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          type="search"
        />
      </div>

      {/* Category filters */}
      <div className="mb-8 md:hidden">
        <Dropdown
          aria-label={t("course.form.category")}
          className="rounded-xl border-[var(--border-subtle)]"
          onChange={(e) => handleCategoryChange(e.target.value || undefined)}
          value={selectedCategoryId ?? ""}
        >
          <option value="">{t("prayer.filter.all")}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {localize(cat, "name")}
            </option>
          ))}
        </Dropdown>
      </div>
      <div className="mb-8 hidden flex-wrap gap-2 md:flex">
        <Button
          size="sm"
          variant={selectedCategoryId === undefined ? "primary" : "secondary"}
          onClick={() => handleCategoryChange(undefined)}
        >
          {t("prayer.filter.all")}
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            size="sm"
            variant={selectedCategoryId === cat.id ? "primary" : "secondary"}
            onClick={() => handleCategoryChange(cat.id)}
          >
            {localize(cat, "name")}
          </Button>
        ))}
      </div>

      <div ref={listTopRef} className="scroll-mt-24" />

      {isListLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-[16/9] w-full rounded-none" />
              <div className="space-y-4 p-6">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-6 w-4/5" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {coursesQuery.error ? (
        <Card className="p-6 text-sm font-medium text-[var(--status-danger)]">
          {coursesQuery.error instanceof Error
            ? coursesQuery.error.message
            : t("page.course.description")}
        </Card>
      ) : null}

      {!isListLoading ? (
      <div className="grid gap-4 md:grid-cols-2">
        {coursesQuery.data?.items.map((course) => (
          <Card className="relative h-full overflow-hidden transition hover:border-[var(--brand-primary)] focus-within:ring-4 focus-within:ring-[var(--input-focus-ring)]" key={course.id}>
            <Link className="block h-full focus:outline-none" href={`/course/${encodeURIComponent(course.slug)}`}>
              {course.cover_image_url ? (
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-[var(--bg-base)]">
                  <Image
                    alt=""
                    aria-hidden="true"
                    className="scale-110 object-cover blur-2xl brightness-75"
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    src={course.cover_image_url}
                  />
                  <Image
                    alt={localize(course, "title")}
                    className="object-contain object-center"
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    src={course.cover_image_url}
                  />
                </div>
              ) : (
                <div className="aspect-[16/9] bg-[var(--brand-muted)] flex items-center justify-center">
                  <span className="text-[var(--brand-primary)] font-bold text-3xl opacity-20">HTNC</span>
                </div>
              )}
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-2">
                  {course.category ? (
                    <Badge uppercase>
                      {localize(course.category, "name")}
                    </Badge>
                  ) : null}
                  <Text as="span" className="font-medium" tone="tertiary" variant="caption">
                    {course.lesson_count} {t("course.form.lessons")}
                  </Text>
                  {canManageCourses ? (
                    <Badge
                      size="xs"
                      variant={course.status === "published" ? "brand" : "outline"}
                    >
                      {t(getStatusLabelKey(course.status))}
                    </Badge>
                  ) : null}
                </div>

                <Title as="h2" className="mt-4" variant="cardSoft">
                  {localize(course, "title")}
                </Title>
                <Text className="mt-2 line-clamp-3" variant="prose">
                  {localize(course, "summary")}
                </Text>
              </div>
            </Link>
            {canManageCourses ? (
              <CardActions
                className="absolute right-3 top-3 z-10"
                deleting={deleteCourse.isPending}
                editHref={`/admin/courses/${encodeURIComponent(course.slug)}/edit`}
                onDelete={() => handleDelete(course.slug)}
                resource="course"
              />
            ) : null}
          </Card>

        ))}
      </div>
      ) : null}

      {!isListLoading && coursesQuery.data && coursesQuery.data.items.length === 0 ? (
        <Card className="p-12 text-center text-sm text-[var(--text-secondary)] border-dashed">
          <div className="text-4xl mb-4">Empty</div>
          {t("course.empty")}
        </Card>
      ) : null}

      {/* Pagination */}
      {total > 0 ? (
        <Pagination
          className="mt-6"
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      ) : null}
    </PageLayout>
  );
}

