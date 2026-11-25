"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PageLayout } from "@/components/layout";
import { Badge, Button, Card, Pagination, Skeleton, Text, Title, Input } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import { PERMISSIONS } from "@/lib/rbac";
import { useAuth } from "@/providers/AuthProvider";
import { courseApi, courseKeys, useCoursesQuery, useCourseCategoriesQuery } from "@/hooks/course";

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
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);
  const listTopRef = useRef<HTMLDivElement>(null);

  const canManageCourses = can(PERMISSIONS.manageCourses);
  const categoriesQuery = useCourseCategoriesQuery();
  const categories = categoriesQuery.data ?? [];

  const coursesQuery = useCoursesQuery(
    {
      take: pageSize,
      skip: page * pageSize,
      status: canManageCourses ? undefined : "published",
      category_id: selectedCategoryId,
      q: q || undefined,
    },
    { enabled: !authLoading },
  );

  const total = coursesQuery.data?.total ?? 0;
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
    [scrollToList],
  );

  const handlePageSizeChange = useCallback(
    (nextSize: number) => {
      setPageSize(nextSize);
      setPage(0);
      scrollToList();
    },
    [scrollToList],
  );

  const handleSearch = useCallback(() => {
    setQ(searchInput.trim());
    setPage(0);
  }, [searchInput]);

  const handleCategoryChange = (id: string | undefined) => {
    setSelectedCategoryId(id);
    setPage(0);
  };

  return (
    <PageLayout
      description={t("page.course.description")}
      eyebrow={t("page.course.eyebrow")}
      title={t("page.course.title")}
      actions={
        canManageCourses ? (
          <Button onClick={() => router.push("/admin/courses/create")}>
            {t("action.createCourse")}
          </Button>
        ) : null
      }
    >
      {/* Search bar */}
      <div className="mb-4 flex gap-2">
        <Input
          className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-ring)]"
          placeholder="Search courses…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button size="sm" variant="primary" onClick={handleSearch}>
          Search
        </Button>
      </div>

      {/* Category filters */}
      <div className="mb-8 flex flex-wrap gap-2">
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
          <Link
            className="rounded-lg focus:outline-none focus:ring-4 focus:ring-[var(--input-focus-ring)]"
            href={`/course/${encodeURIComponent(course.slug)}`}
            key={course.id}
          >
            <Card className="h-full overflow-hidden transition hover:border-[var(--brand-primary)]">
              {course.cover_image_url ? (
                <div className="relative aspect-[16/9] w-full overflow-hidden">
                  <Image
                    alt={localize(course, "title")}
                    className="object-cover"
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
            </Card>
          </Link>

        ))}
      </div>
      ) : null}

      {!isListLoading && coursesQuery.data && coursesQuery.data.items.length === 0 ? (
        <Card className="p-12 text-center text-sm text-[var(--text-secondary)] border-dashed">
          <div className="text-4xl mb-4">Empty</div>
          No courses found matching your criteria.
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

