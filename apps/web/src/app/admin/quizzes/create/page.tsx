"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageLayout } from "@/components/layout";
import { Button, Card, FormField, Input, Select } from "@/components/ui";
import { PERMISSIONS } from "@/lib/rbac";
import { useAuth } from "@/providers/AuthProvider";
import { useTranslation } from "@/providers/I18nProvider";
import {
  useCourseQuery,
  useCoursesQuery,
  useCreateQuizMutation,
  useLessonQuery,
} from "@services/course";

export default function AdminCreateQuizRoute() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { can } = useAuth();
  const { t } = useTranslation();
  const coursesQuery = useCoursesQuery({ take: 100 });
  const requestedCourseSlug = searchParams.get("course") ?? "";
  const requestedLessonId = searchParams.get("lesson") ?? "";
  const [courseSlug, setCourseSlug] = useState(requestedCourseSlug);
  const courseQuery = useCourseQuery(courseSlug);
  const lessons = courseQuery.data?.lessons ?? [];
  const [lessonId, setLessonId] = useState(requestedLessonId);
  const lessonQuery = useLessonQuery(courseSlug, lessonId);
  const createQuiz = useCreateQuizMutation(courseSlug);
  const [titleEn, setTitleEn] = useState("");
  const [titleVi, setTitleVi] = useState("");
  const [passingScore, setPassingScore] = useState(70);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(0);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);

  const courses = useMemo(() => coursesQuery.data?.items ?? [], [coursesQuery.data?.items]);
  const templates = lessonQuery.data?.templates ?? [];

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

  useEffect(() => {
    if (lessons.length > 0 && !lessons.some((lesson) => lesson.id === lessonId)) {
      setLessonId(
        lessons.some((lesson) => lesson.id === requestedLessonId)
          ? requestedLessonId
          : lessons[0].id,
      );
      setSelectedTemplateIds([]);
    }
  }, [lessonId, lessons, requestedLessonId]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const quiz = await createQuiz.mutateAsync({
      passing_score: passingScore,
      template_ids: selectedTemplateIds,
      time_limit_seconds: timeLimitMinutes > 0 ? timeLimitMinutes * 60 : undefined,
      title_en: titleEn.trim() || titleVi.trim(),
      title_vi: titleVi.trim() || titleEn.trim(),
    });

    router.push(`/course/${courseSlug}`);
    router.refresh();
    return quiz;
  }

  if (!can(PERMISSIONS.manageCourses)) return null;

  return (
    <PageLayout
      description={t("admin.quizzes.createDescription")}
      eyebrow={t("admin.common.admin")}
      title={t("admin.quizzes.create")}
    >
      <form className="grid gap-5 py-6" onSubmit={handleSubmit}>
        <Card className="grid gap-5 p-5 lg:grid-cols-2">
          <FormField label={t("nav.course.label")} htmlFor="courseSlug">
            <Select
              disabled={coursesQuery.isLoading || courses.length === 0}
              id="courseSlug"
              name="courseSlug"
              onChange={(event) => {
                setCourseSlug(event.target.value);
                setLessonId("");
                setSelectedTemplateIds([]);
              }}
              value={courseSlug}
            >
              {courses.map((course) => (
                <option key={course.id} value={course.slug}>
                  {course.title_vi || course.title_en || course.slug}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label={t("lesson.label")} htmlFor="lessonId">
            <Select
              disabled={courseQuery.isLoading || lessons.length === 0}
              id="lessonId"
              name="lessonId"
              onChange={(event) => {
                setLessonId(event.target.value);
                setSelectedTemplateIds([]);
              }}
              value={lessonId}
            >
              {lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.title_vi || lesson.title_en || lesson.id}
                </option>
              ))}
            </Select>
          </FormField>
        </Card>

        <Card className="grid gap-5 p-5 lg:grid-cols-2">
          <FormField label={t("course.form.title_en")} htmlFor="titleEn">
            <Input
              id="titleEn"
              name="titleEn"
              onChange={(event) => setTitleEn(event.target.value)}
              required={!titleVi}
              value={titleEn}
            />
          </FormField>
          <FormField label={t("course.form.title_vi")} htmlFor="titleVi">
            <Input
              id="titleVi"
              name="titleVi"
              onChange={(event) => setTitleVi(event.target.value)}
              required={!titleEn}
              value={titleVi}
            />
          </FormField>
          <FormField label={t("quiz.passingScore")} htmlFor="passingScore">
            <Input
              id="passingScore"
              max={100}
              min={0}
              name="passingScore"
              onChange={(event) => setPassingScore(Number(event.target.value))}
              type="number"
              value={passingScore}
            />
          </FormField>
          <FormField label={t("admin.quizzes.timeLimitMinutes")} htmlFor="timeLimitMinutes">
            <Input
              id="timeLimitMinutes"
              min={0}
              name="timeLimitMinutes"
              onChange={(event) => setTimeLimitMinutes(Number(event.target.value))}
              type="number"
              value={timeLimitMinutes}
            />
          </FormField>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            {t("admin.quizzes.questionTemplates")}
          </h2>
          <div className="mt-4 grid gap-3">
            {templates.map((template) => (
              <label
                className="flex items-start gap-3 rounded-md border border-[var(--border-subtle)] p-3 text-sm"
                key={template.id}
              >
                <input
                  checked={selectedTemplateIds.includes(template.id)}
                  className="mt-1 h-4 w-4"
                  onChange={(event) => {
                    setSelectedTemplateIds((current) =>
                      event.target.checked
                        ? [...current, template.id]
                        : current.filter((id) => id !== template.id),
                    );
                  }}
                  type="checkbox"
                />
                <span>
                  <span className="block font-semibold text-[var(--text-primary)]">
                    {template.body_template_vi || template.body_template_en}
                  </span>
                  <span className="mt-1 block text-xs text-[var(--text-secondary)]">
                    {template.template_type} / {template.difficulty}
                  </span>
                </span>
              </label>
            ))}
          </div>
          {templates.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              {t("admin.quizzes.templatesEmpty")}
            </p>
          ) : null}
        </Card>

        <div className="flex justify-end gap-3">
          <Button disabled={createQuiz.isPending} onClick={() => router.back()} type="button" variant="ghost">
            {t("common.cancel")}
          </Button>
          <Button isLoading={createQuiz.isPending} type="submit">
            {t("admin.quizzes.create")}
          </Button>
        </div>
      </form>
    </PageLayout>
  );
}
