"use client";

import { useState } from "react";
import { CourseTestPanel } from "@/components/course/CourseTestPanel";
import { PageLayout } from "@/components/layout";
import { Card, Select } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import { useCourseQuery, useCoursesQuery } from "@/services/course";

export function AdminTests() {
  const { locale, t } = useTranslation();
  const coursesQuery = useCoursesQuery({ take: 100 });
  const [selectedSlug, setSelectedSlug] = useState("");
  const activeSlug = selectedSlug || (coursesQuery.data?.items || []).filter((c) => c.slug !== "isom-b-5")[0]?.slug || "";
  const courseQuery = useCourseQuery(activeSlug);

  return (
    <PageLayout
      description={t("admin.tests.description")}
      eyebrow={t("admin.common.admin")}
      title={t("admin.tests.title")}
    >
      <Card className="p-5">
        <label className="mb-2 block text-sm font-semibold text-[var(--text-primary)]" htmlFor="test-course">
          {t("admin.tests.selectCourse")}
        </label>
        <Select
          disabled={coursesQuery.isLoading || !coursesQuery.data?.items.length}
          id="test-course"
          onChange={(event) => setSelectedSlug(event.target.value)}
          value={activeSlug}
        >
          {(coursesQuery.data?.items || []).filter((c) => c.slug !== "isom-b-5").map((course) => (
            <option key={course.id} value={course.slug}>
              {locale === "vi" ? course.title_vi : course.title_en}
            </option>
          ))}
        </Select>
      </Card>

      {courseQuery.data ? <CourseTestPanel course={courseQuery.data} /> : null}
      {courseQuery.isLoading ? (
        <Card className="p-5 text-sm text-[var(--text-secondary)]">{t("admin.tests.loading")}</Card>
      ) : null}
    </PageLayout>
  );
}
