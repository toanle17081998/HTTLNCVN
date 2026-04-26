"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { PageLayout } from "@/components/layout";
import { Button, Card, Pagination, cn } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import { PERMISSIONS } from "@/lib/rbac";
import { useAuth } from "@/providers/AuthProvider";
import { useCoursesQuery } from "@services/course";

const PAGE_SIZE_DEFAULT = 12;
const levels = ["beginner", "intermediate", "advanced"] as const;
const levelLabelKeys = {
  advanced: "course.form.level.advanced",
  beginner: "course.form.level.beginner",
  intermediate: "course.form.level.intermediate",
} as const;
const statusLabelKeys = {
  draft: "course.form.status.draft",
  published: "course.form.status.published",
} as const;

function getLevelLabelKey(level: string) {
  return level in levelLabelKeys ? levelLabelKeys[level as keyof typeof levelLabelKeys] : "course.form.level.beginner";
}

function getStatusLabelKey(status: string) {
  return status in statusLabelKeys ? statusLabelKeys[status as keyof typeof statusLabelKeys] : "course.form.status.draft";
}

export function CoursePage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { can } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<string | undefined>();
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);

  const canManageCourses = can(PERMISSIONS.manageCourses);
  const coursesQuery = useCoursesQuery({
    take: pageSize,
    skip: page * pageSize,
    status: canManageCourses ? undefined : "published",
    level: selectedLevel,
    q: q || undefined,
  });

  const total = coursesQuery.data?.total ?? 0;

  const handleSearch = useCallback(() => {
    setQ(searchInput.trim());
    setPage(0);
  }, [searchInput]);

  const handleLevelChange = (lvl: string | undefined) => {
    setSelectedLevel(lvl);
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
        <input
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

      {/* Level filters */}
      <div className="mb-8 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={selectedLevel === undefined ? "primary" : "secondary"}
          onClick={() => handleLevelChange(undefined)}
        >
          {t("prayer.filter.all")}
        </Button>
        {levels.map((lvl) => (
          <Button
            key={lvl}
            size="sm"
            variant={selectedLevel === lvl ? "primary" : "secondary"}
            onClick={() => handleLevelChange(lvl)}
          >
            {t(levelLabelKeys[lvl])}
          </Button>
        ))}
      </div>

      {coursesQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
           {[1, 2, 3, 4].map(i => <Card key={i} className="h-64 animate-pulse bg-[var(--bg-surface)]" />)}
        </div>
      ) : null}

      {coursesQuery.error ? (
        <Card className="p-6 text-sm font-medium text-[var(--status-danger)]">
          {coursesQuery.error instanceof Error
            ? coursesQuery.error.message
            : t("page.course.description")}
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {coursesQuery.data?.items.map((course) => (
          <Link
            className="rounded-lg focus:outline-none focus:ring-4 focus:ring-[var(--input-focus-ring)]"
            href={`/course/${encodeURIComponent(course.slug)}`}
            key={course.id}
          >
            <Card className="h-full overflow-hidden transition hover:border-[var(--brand-primary)]">
              {course.cover_image_url ? (
                <img
                  alt=""
                  className="aspect-[16/9] w-full object-cover"
                  src={course.cover_image_url}
                />
              ) : (
                <div className="aspect-[16/9] bg-[var(--brand-muted)] flex items-center justify-center">
                  <span className="text-[var(--brand-primary)] font-bold text-3xl opacity-20">HTNC</span>
                </div>
              )}
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-[var(--brand-muted)] px-2.5 py-1 text-xs font-semibold uppercase text-[var(--brand-primary)]">
                    {t(getLevelLabelKey(course.level))}
                  </span>
                  <span className="text-xs font-medium text-[var(--text-tertiary)]">
                    {course.lesson_count} {t("course.form.lessons")}
                  </span>
                  {canManageCourses ? (
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded border",
                      course.status === 'published' ? "border-[var(--brand-primary)] text-[var(--brand-primary)]" : "border-[var(--border-subtle)] text-[var(--text-tertiary)]"
                    )}>
                      {t(getStatusLabelKey(course.status))}
                    </span>
                  ) : null}
                </div>

                <h2 className="mt-4 text-xl font-semibold text-[var(--text-primary)]">
                  {locale === "vi" ? (course.title_vi || course.title_en) : (course.title_en || course.title_vi)}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] line-clamp-3">
                  {course.summary || (locale === "vi" ? course.title_vi : course.title_en)}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {coursesQuery.data && coursesQuery.data.items.length === 0 ? (
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
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(0); }}
        />
      ) : null}
    </PageLayout>
  );
}

