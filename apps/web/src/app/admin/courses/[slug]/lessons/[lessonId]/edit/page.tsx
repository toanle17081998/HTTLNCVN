"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageLayout } from "@/components/layout";
import { Card } from "@/components/ui";
import { LessonForm } from "@/modules/course/components/LessonForm";
import { PERMISSIONS } from "@/lib/rbac";
import { useAuth } from "@/providers/AuthProvider";
import { useTranslation } from "@/providers/I18nProvider";
import { useLessonQuery, useUpdateLessonMutation } from "@services/course";

export default function AdminEditLessonRoute() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const lessonId = params.lessonId as string;
  const { can } = useAuth();
  const { t } = useTranslation();
  const lessonQuery = useLessonQuery(slug, lessonId);
  const updateLesson = useUpdateLessonMutation(lessonId, slug);

  useEffect(() => {
    if (!can(PERMISSIONS.manageCourses)) {
      router.push("/admin/courses");
    }
  }, [can, router]);

  async function handleSubmit(data: any) {
    await updateLesson.mutateAsync(data);
    router.push(`/admin/courses/${slug}/lessons/${lessonId}/edit`);
  }

  if (!can(PERMISSIONS.manageCourses)) return null;

  if (lessonQuery.isLoading) {
    return (
      <PageLayout eyebrow={t("admin.common.admin")} title={t("admin.lessons.edit")}>
        <Card className="p-6 text-sm text-[var(--text-secondary)]">{t("admin.lessons.loadingOne")}</Card>
      </PageLayout>
    );
  }

  if (!lessonQuery.data) {
    return (
      <PageLayout eyebrow={t("admin.common.admin")} title={t("admin.lessons.edit")}>
        <Card className="p-6 text-sm font-medium text-[var(--status-danger)]">{t("admin.lessons.notFound")}</Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      eyebrow={t("admin.common.admin")}
      title={t("admin.common.editNamed", { name: lessonQuery.data.title_vi || lessonQuery.data.title_en })}
    >
      <LessonForm
        initialData={lessonQuery.data}
        isLoading={updateLesson.isPending}
        onSubmit={handleSubmit}
        title={t("admin.lessons.edit")}
      />
    </PageLayout>
  );
}
