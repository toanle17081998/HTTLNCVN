"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageLayout } from "@/components/layout";
import { Card, FormField, Select } from "@/components/ui";
import { LessonForm } from "@/modules/course/components/LessonForm";
import { PERMISSIONS } from "@/lib/rbac";
import { useAuth } from "@/providers/AuthProvider";
import { useTranslation } from "@/providers/I18nProvider";
import { useCoursesQuery, useCreateLessonMutation } from "@services/course";

export default function AdminCreateLessonRoute() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { can } = useAuth();
  const { t } = useTranslation();
  const coursesQuery = useCoursesQuery({ take: 100 });
  const requestedCourseSlug = searchParams.get("course") ?? "";
  const [courseSlug, setCourseSlug] = useState(requestedCourseSlug);
  const createLesson = useCreateLessonMutation(courseSlug);

  const courses = useMemo(() => coursesQuery.data?.items ?? [], [coursesQuery.data?.items]);

  useEffect(() => {
    if (!can(PERMISSIONS.manageCourses)) {
      router.push("/admin");
    }
  }, [can, router]);

  useEffect(() => {
    if (!courseSlug && courses.length > 0) {
      setCourseSlug(
        courses.some((course) => course.slug === requestedCourseSlug)
          ? requestedCourseSlug
          : courses[0].slug,
      );
    }
  }, [courseSlug, courses, requestedCourseSlug]);

  async function handleSubmit(data: any) {
    if (!courseSlug) return;
    const lesson = await createLesson.mutateAsync(data);
    router.push(`/admin/courses/${courseSlug}/lessons/${lesson.id}/edit`);
  }

  if (!can(PERMISSIONS.manageCourses)) return null;

  return (
    <PageLayout
      description={t("admin.lessons.createDescription")}
      eyebrow={t("admin.common.admin")}
      title={t("lesson.action.create")}
    >
      <div className="grid gap-5 py-6">
        <Card className="p-5">
          <FormField label={t("nav.course.label")} htmlFor="courseSlug">
            <Select
              className="max-w-xl bg-[var(--bg-base)]"
              disabled={coursesQuery.isLoading || courses.length === 0}
              id="courseSlug"
              name="courseSlug"
              onChange={(event) => setCourseSlug(event.target.value)}
              value={courseSlug}
            >
              {courses.map((course) => (
                <option key={course.id} value={course.slug}>
                  {course.title_vi || course.title_en || course.slug}
                </option>
              ))}
            </Select>
          </FormField>
          {courses.length === 0 && !coursesQuery.isLoading ? (
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              {t("admin.lessons.createCourseFirst")}
            </p>
          ) : null}
        </Card>

        {courseSlug ? (
          <LessonForm
            isLoading={createLesson.isPending}
            onSubmit={handleSubmit}
            title={t("lesson.action.create")}
          />
        ) : null}
      </div>
    </PageLayout>
  );
}
