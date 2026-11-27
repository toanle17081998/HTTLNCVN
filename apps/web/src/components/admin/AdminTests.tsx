"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { CourseTestPanel } from "@/components/course/CourseTestPanel";
import { PageLayout } from "@/components/layout";
import { Input, Dropdown, Label } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import { useCourseQuery, useCoursesQuery } from "@/hooks/course";

const courseLimit = 100;

export function AdminTests() {
  const { localize, t } = useTranslation();
  const [search, setSearch] = useState("");
  const coursesQuery = useCoursesQuery({ q: search.trim() || undefined, take: courseLimit });
  const [selectedSlug, setSelectedSlug] = useState("");
  const courses = (coursesQuery.data?.items || []).filter((c) => c.slug !== "isom-b-5");
  const coursesLoading = coursesQuery.isLoading || coursesQuery.isPlaceholderData;
  const showSearch = Boolean(search) || coursesQuery.isPlaceholderData || (coursesQuery.data?.total ?? 0) > courseLimit;
  const activeSlug = coursesLoading ? "" : selectedSlug || courses[0]?.slug || "";
  const courseQuery = useCourseQuery(activeSlug);
  const loadingTest = (
    <p className="flex items-center gap-2 py-3 text-sm text-[var(--text-secondary)]" role="status">
      <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
      {t("admin.tests.loading")}
    </p>
  );

  return (
    <PageLayout
      description={t("admin.tests.description")}
      eyebrow={t("admin.common.admin")}
      title={t("admin.tests.title")}
    >
      <div className="grid gap-5">
        <section className="grid gap-2">
          {showSearch ? (
            <Input
              aria-label={t("admin.tests.searchCourse")}
              onChange={(event) => {
                setSearch(event.target.value);
                setSelectedSlug("");
              }}
              placeholder={t("admin.tests.searchCourse")}
              type="search"
              value={search}
            />
          ) : null}
          <Label variant="field" htmlFor="test-course">
            {t("admin.tests.selectCourse")}
          </Label>
          <Dropdown
            aria-busy={coursesLoading}
            disabled={coursesLoading || !courses.length}
            id="test-course"
            onChange={(event) => setSelectedSlug(event.target.value)}
            value={activeSlug}
          >
            {!activeSlug ? (
              <option value="">{t(coursesLoading ? "admin.courses.loading" : coursesQuery.isError ? "admin.tests.courseLoadError" : "course.empty")}</option>
            ) : null}
            {courses.map((course) => (
              <option key={course.id} value={course.slug}>
                {localize(course, "title")}
              </option>
            ))}
          </Dropdown>
          {coursesLoading ? (
            <p className="flex items-center gap-2 text-sm text-[var(--text-secondary)]" role="status">
              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
              {t("admin.courses.loading")}
            </p>
          ) : null}
        </section>

        {activeSlug && courseQuery.isLoading ? loadingTest : null}
        {activeSlug && courseQuery.isError && !courseQuery.data ? (
          <p className="text-sm text-[var(--status-danger)]" role="alert">{t("admin.tests.courseLoadError")}</p>
        ) : null}
        {activeSlug && courseQuery.data ? (
          <CourseTestPanel
            className="border-0! shadow-none!"
            course={courseQuery.data}
            loadingFallback={loadingTest}
          />
        ) : null}
      </div>
    </PageLayout>
  );
}
