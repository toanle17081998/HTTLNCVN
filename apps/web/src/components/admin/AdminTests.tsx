"use client";

import { useState } from "react";
import { CourseTestPanel } from "@/components/course/CourseTestPanel";
import { PageLayout } from "@/components/layout";
import { Card, Input, Select, Label } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import { useCourseQuery, useCoursesQuery } from "@/hooks/course";

export function AdminTests() {
  const { localize, t } = useTranslation();
  const [search, setSearch] = useState("");
  const coursesQuery = useCoursesQuery({ q: search.trim() || undefined, take: 100 });
  const [selectedSlug, setSelectedSlug] = useState("");
  const courses = (coursesQuery.data?.items || []).filter((c) => c.slug !== "isom-b-5");
  const activeSlug = selectedSlug || courses[0]?.slug || "";
  const courseQuery = useCourseQuery(activeSlug);

  return (
    <PageLayout
      description={t("admin.tests.description")}
      eyebrow={t("admin.common.admin")}
      title={t("admin.tests.title")}
    >
      <div className="grid gap-5">
      <Card className="p-5">
        <Input
          className="mb-3"
          onChange={(event) => {
            setSearch(event.target.value);
            setSelectedSlug("");
          }}
          placeholder={t("admin.tests.searchCourse")}
          value={search}
        />
        <Label variant="field" className="mb-2 block" htmlFor="test-course">
          {t("admin.tests.selectCourse")}
        </Label>
        <Select
          disabled={coursesQuery.isLoading || !courses.length}
          id="test-course"
          onChange={(event) => setSelectedSlug(event.target.value)}
          value={activeSlug}
        >
          {courses.map((course) => (
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
      </div>
    </PageLayout>
  );
}
