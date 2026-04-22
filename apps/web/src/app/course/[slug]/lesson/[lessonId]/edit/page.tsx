"use client";

import { useRouter, useParams } from "next/navigation";
import { PageLayout } from "@/components/layout";
import { LessonForm } from "@/modules/course/components/LessonForm";
import { useLessonQuery, useUpdateLessonMutation } from "@services/course";
import { useAuth } from "@/providers/AuthProvider";
import { PERMISSIONS } from "@/lib/rbac";
import { useEffect } from "react";
import { Card } from "@/components/ui";

export default function EditLessonPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const lessonId = params.lessonId as string;
  const { can } = useAuth();
  
  const lessonQuery = useLessonQuery(slug, lessonId);
  const updateLesson = useUpdateLessonMutation(lessonId, slug);

  useEffect(() => {
    if (!can(PERMISSIONS.manageCourses)) {
      router.push(`/course/${slug}/lesson/${lessonId}`);
    }
  }, [can, router, slug, lessonId]);

  const handleSubmit = async (data: any) => {
    try {
      await updateLesson.mutateAsync(data);
      router.push(`/course/${slug}/lesson/${lessonId}`);
    } catch (error) {
      console.error("Failed to update lesson:", error);
    }
  };

  if (!can(PERMISSIONS.manageCourses)) return null;

  if (lessonQuery.isLoading) {
    return (
      <PageLayout eyebrow="Admin" title="Edit Lesson">
        <Card className="p-6 text-sm text-[var(--text-secondary)]">Loading lesson...</Card>
      </PageLayout>
    );
  }

  if (!lessonQuery.data) {
    return (
      <PageLayout eyebrow="Admin" title="Edit Lesson">
        <Card className="p-6 text-sm font-medium text-[var(--status-danger)]">Lesson not found.</Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout eyebrow="Admin" title={`Edit: ${lessonQuery.data.title_vi || lessonQuery.data.title_en}`}>
      <div className="py-10">
        <LessonForm
          title="Edit Lesson"
          initialData={lessonQuery.data}
          onSubmit={handleSubmit}
          isLoading={updateLesson.isPending}
        />
      </div>
    </PageLayout>
  );
}
