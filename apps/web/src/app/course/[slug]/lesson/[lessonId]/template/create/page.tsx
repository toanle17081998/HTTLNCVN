"use client";

import { useRouter, useParams } from "next/navigation";
import { PageLayout } from "@/components/layout";
import { QuestionTemplateForm } from "@/modules/course/components/QuestionTemplateForm";
import { useCreateTemplateMutation } from "@services/course";
import { useAuth } from "@/providers/AuthProvider";
import { PERMISSIONS } from "@/lib/rbac";
import { useEffect } from "react";

export default function CreateTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const lessonId = params.lessonId as string;
  const { can } = useAuth();
  const createTemplate = useCreateTemplateMutation(lessonId);

  useEffect(() => {
    if (!can(PERMISSIONS.manageCourses)) {
      router.push(`/course/${slug}/lesson/${lessonId}`);
    }
  }, [can, router, slug, lessonId]);

  const handleSubmit = async (data: any) => {
    try {
      await createTemplate.mutateAsync(data);
      router.push(`/course/${slug}/lesson/${lessonId}`);
    } catch (error) {
      console.error("Failed to create template:", error);
    }
  };

  if (!can(PERMISSIONS.manageCourses)) return null;

  return (
    <PageLayout eyebrow="Admin" title="New Template">
      <div className="py-10">
        <QuestionTemplateForm
          title="Create Question Template"
          onSubmit={handleSubmit}
          isLoading={createTemplate.isPending}
        />
      </div>
    </PageLayout>
  );
}
