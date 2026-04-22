"use client";

import { useRouter, useParams } from "next/navigation";
import { PageLayout } from "@/components/layout";
import { QuestionTemplateForm } from "@/modules/course/components/QuestionTemplateForm";
import { useLessonQuery, useUpdateTemplateMutation } from "@services/course";
import { useAuth } from "@/providers/AuthProvider";
import { PERMISSIONS } from "@/lib/rbac";
import { useEffect } from "react";
import { Card } from "@/components/ui";

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const lessonId = params.lessonId as string;
  const templateId = params.templateId as string;
  const { can } = useAuth();
  
  const lessonQuery = useLessonQuery(slug, lessonId);
  const updateTemplate = useUpdateTemplateMutation(templateId, lessonId);

  useEffect(() => {
    if (!can(PERMISSIONS.manageCourses)) {
      router.push(`/course/${slug}/lesson/${lessonId}`);
    }
  }, [can, router, slug, lessonId]);

  const template = lessonQuery.data?.templates.find(t => t.id === templateId);

  const handleSubmit = async (data: any) => {
    try {
      await updateTemplate.mutateAsync(data);
      router.push(`/course/${slug}/lesson/${lessonId}`);
    } catch (error) {
      console.error("Failed to update template:", error);
    }
  };

  if (!can(PERMISSIONS.manageCourses)) return null;

  if (lessonQuery.isLoading) {
    return (
      <PageLayout eyebrow="Admin" title="Edit Template">
        <Card className="p-6 text-sm text-[var(--text-secondary)]">Loading lesson data...</Card>
      </PageLayout>
    );
  }

  if (!template) {
    return (
      <PageLayout eyebrow="Admin" title="Edit Template">
        <Card className="p-6 text-sm font-medium text-[var(--status-danger)]">Template not found.</Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout eyebrow="Admin" title="Edit Question Template">
      <div className="py-10">
        <QuestionTemplateForm
          title="Edit Question Template"
          initialData={template}
          onSubmit={handleSubmit}
          isLoading={updateTemplate.isPending}
        />
      </div>
    </PageLayout>
  );
}
