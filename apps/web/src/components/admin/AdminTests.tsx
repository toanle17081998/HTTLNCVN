"use client";

import { useState } from "react";
import { CourseTestPanel } from "@/components/course/CourseTestPanel";
import { PageLayout } from "@/components/layout";
import { Button, Card, Input, Select, Label } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import { useCourseQuery, useCoursesQuery } from "@/hooks/course";

export function AdminTests() {
  const { localize, t } = useTranslation();
  const pageSize = 25;
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const coursesQuery = useCoursesQuery({ q: search.trim() || undefined, skip: page * pageSize, take: pageSize });
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
        <Input
          className="mb-3"
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(0);
            setSelectedSlug("");
          }}
          placeholder={t("admin.tests.searchCourse")}
          value={search}
        />
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
        <div className="mt-3 flex items-center justify-between gap-3">
          <Button
            disabled={page === 0 || coursesQuery.isFetching}
            onClick={() => {
              setPage((current) => Math.max(0, current - 1));
              setSelectedSlug("");
            }}
            size="sm"
            variant="secondary"
          >
            {t("admin.tests.previous")}
          </Button>
          <span className="text-sm text-[var(--text-secondary)]">
            {t("admin.tests.page", { page: String(page + 1) })}
          </span>
          <Button
            disabled={(page + 1) * pageSize >= (coursesQuery.data?.total ?? 0) || coursesQuery.isFetching}
            onClick={() => {
              setPage((current) => current + 1);
              setSelectedSlug("");
            }}
            size="sm"
            variant="secondary"
          >
            {t("admin.tests.next")}
          </Button>
        </div>
      </Card>

      {courseQuery.data ? <CourseTestPanel course={courseQuery.data} /> : null}
      {courseQuery.isLoading ? (
        <Card className="p-5 text-sm text-[var(--text-secondary)]">{t("admin.tests.loading")}</Card>
      ) : null}
    </PageLayout>
  );
}
