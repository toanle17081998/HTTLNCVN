"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageLayout } from "@/components/layout";
import { Card } from "@/components/ui";
import { CourseForm } from "@/modules/course/components/CourseForm";
import { PERMISSIONS } from "@/lib/rbac";
import { useAuth } from "@/providers/AuthProvider";
import { useTranslation } from "@/providers/I18nProvider";
import { useCourseQuery, useUpdateCourseMutation } from "@services/course";

export default function AdminEditCourseRoute() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { can } = useAuth();
  const { t } = useTranslation();
  const courseQuery = useCourseQuery(slug);
  const updateCourse = useUpdateCourseMutation(slug);

  useEffect(() => {
    if (!can(PERMISSIONS.manageCourses)) {
      router.push("/admin/courses");
    }
  }, [can, router]);

  async function handleSubmit(data: any) {
    const course = await updateCourse.mutateAsync(data);
    router.push(`/admin/courses/${course.slug}/edit`);
  }

  if (!can(PERMISSIONS.manageCourses)) return null;

  if (courseQuery.isLoading) {
    return (
      <PageLayout eyebrow={t("admin.common.admin")} title={t("admin.courses.edit")}>
        <Card className="p-6 text-sm text-[var(--text-secondary)]">{t("admin.courses.loadingOne")}</Card>
      </PageLayout>
    );
  }

  if (!courseQuery.data) {
    return (
      <PageLayout eyebrow={t("admin.common.admin")} title={t("admin.courses.edit")}>
        <Card className="p-6 text-sm font-medium text-[var(--status-danger)]">{t("admin.courses.notFound")}</Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      eyebrow={t("admin.common.admin")}
      title={t("admin.common.editNamed", { name: courseQuery.data.title_vi || courseQuery.data.title_en })}
    >
      <CourseForm
        initialData={courseQuery.data}
        isLoading={updateCourse.isPending}
        onSubmit={handleSubmit}
        title={t("admin.courses.edit")}
      />
    </PageLayout>
  );
}
