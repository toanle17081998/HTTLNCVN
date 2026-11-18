"use client";

import { useState } from "react";
import { CourseTestPanel } from "@/components/course/CourseTestPanel";
import { PageLayout } from "@/components/layout";
import { Card, Select, Label } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import { useCourseQuery, useCoursesQuery } from "@/hooks/course";

export function AdminTests() {
  const { localize, t } = useTranslation();
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
        <Label variant="field" className="mb-2 block" htmlFor="test-course">
          {t("admin.tests.selectCourse")}
        </Label>
        <Select
          disabled={coursesQuery.isLoading || !coursesQuery.data?.items.length}
          id="test-course"
          onChange={(event) => setSelectedSlug(event.target.value)}
          value={activeSlug}
        >
          {(coursesQuery.data?.items || []).filter((c) => c.slug !== "isom-b-5").map((course) => (
            <option key={course.id} value={course.slug}>
              {localize(course, "title")}
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
