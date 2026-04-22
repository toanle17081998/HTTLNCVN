"use client";

import Link from "next/link";
import { PageLayout } from "@/components/layout";
import { Card } from "@/components/ui";
import { PERMISSIONS } from "@/lib/rbac";
import { useAuth } from "@/providers/AuthProvider";
import { useCoursesQuery } from "@services/course";

export function CoursePage() {
  const { can } = useAuth();
  const canManageCourses = can(PERMISSIONS.manageCourses);
  const coursesQuery = useCoursesQuery({
    take: 50,
    ...(canManageCourses ? {} : { status: "published" }),
  });

  return (
    <PageLayout
      description="Browse courses, lessons, and quizzes."
      eyebrow="Education"
      title="Courses"
    >
      {coursesQuery.isLoading ? (
        <Card className="p-6 text-sm text-[var(--text-secondary)]">Loading courses...</Card>
      ) : null}

      {coursesQuery.error ? (
        <Card className="p-6 text-sm font-medium text-[var(--status-danger)]">
          {coursesQuery.error instanceof Error
            ? coursesQuery.error.message
            : "Could not load courses."}
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
              ) : null}
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-[var(--brand-muted)] px-2.5 py-1 text-xs font-semibold uppercase text-[var(--brand-primary)]">
                    {course.level}
                  </span>
                  <span className="text-xs font-medium text-[var(--text-tertiary)]">
                    {course.lesson_count} lessons
                  </span>
                  {canManageCourses ? (
                    <span className="text-xs font-medium text-[var(--text-tertiary)]">
                      {course.status}
                    </span>
                  ) : null}
                </div>

                <h2 className="mt-4 text-xl font-semibold text-[var(--text-primary)]">
                  {course.title_vi || course.title_en}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  {course.summary ?? course.title_en}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {coursesQuery.data && coursesQuery.data.items.length === 0 ? (
        <Card className="p-6 text-sm text-[var(--text-secondary)]">No courses found.</Card>
      ) : null}
    </PageLayout>
  );
}
