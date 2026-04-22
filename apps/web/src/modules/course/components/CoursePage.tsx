"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageLayout } from "@/components/layout";
import { Button, Card, cn } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import { PERMISSIONS } from "@/lib/rbac";
import { useAuth } from "@/providers/AuthProvider";
import { useCoursesQuery } from "@services/course";

const levels = ["beginner", "intermediate", "advanced"] as const;

export function CoursePage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { can } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<string | undefined>();
  
  const canManageCourses = can(PERMISSIONS.manageCourses);
  const coursesQuery = useCoursesQuery({
    take: 50,
    status: canManageCourses ? undefined : "published",
    level: selectedLevel,
  });

  return (
    <PageLayout
      description={t("page.course.description")}
      eyebrow={t("page.course.eyebrow")}
      title={t("page.course.title")}
      actions={
        canManageCourses ? (
          <Button onClick={() => router.push("/course/create")}>
            {t("action.createCourse")}
          </Button>
        ) : null
      }
    >
      <div className="mb-8 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={selectedLevel === undefined ? "primary" : "secondary"}
          onClick={() => setSelectedLevel(undefined)}
        >
          {t("prayer.filter.all")}
        </Button>
        {levels.map((lvl) => (
          <Button
            key={lvl}
            size="sm"
            variant={selectedLevel === lvl ? "primary" : "secondary"}
            onClick={() => setSelectedLevel(lvl)}
          >
            {t(`course.form.level.${lvl}`)}
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
                    {t(`course.form.level.${course.level as any}`)}
                  </span>
                  <span className="text-xs font-medium text-[var(--text-tertiary)]">
                    {course.lesson_count} {t("course.form.lessons")}
                  </span>
                  {canManageCourses ? (
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded border",
                      course.status === 'published' ? "border-[var(--brand-primary)] text-[var(--brand-primary)]" : "border-[var(--border-subtle)] text-[var(--text-tertiary)]"
                    )}>
                      {t(`course.form.status.${course.status as any}`)}
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
    </PageLayout>
  );
}
