"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageLayout } from "@/components/layout";
import { CourseForm } from "@/modules/course/components/CourseForm";
import { PERMISSIONS } from "@/lib/rbac";
import { useAuth } from "@/providers/AuthProvider";
import { useTranslation } from "@/providers/I18nProvider";
import { useCreateCourseMutation } from "@services/course";

export default function AdminCreateCourseRoute() {
  const router = useRouter();
  const { can } = useAuth();
  const { t } = useTranslation();
  const createCourse = useCreateCourseMutation();

  useEffect(() => {
    if (!can(PERMISSIONS.manageCourses)) {
      router.push("/admin");
    }
  }, [can, router]);

  async function handleSubmit(data: any) {
    const course = await createCourse.mutateAsync(data);
    router.push(`/admin/courses/${course.slug}/edit`);
  }

  if (!can(PERMISSIONS.manageCourses)) return null;

  return (
    <PageLayout eyebrow={t("admin.common.admin")} title={t("admin.courses.create")}>
      <div className="pt-6">
        <CourseForm
          isLoading={createCourse.isPending}
          onSubmit={handleSubmit}
          title={t("course.action.create")}
        />
      </div>
    </PageLayout>
  );
}
