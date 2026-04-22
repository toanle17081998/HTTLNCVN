"use client";

import { useRouter, useParams } from "next/navigation";
import { PageLayout } from "@/components/layout";
import { LessonForm } from "@/modules/course/components/LessonForm";
import { useCreateLessonMutation } from "@services/course";
import { useAuth } from "@/providers/AuthProvider";
import { PERMISSIONS } from "@/lib/rbac";
import { useEffect } from "react";

export default function CreateLessonPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { can } = useAuth();
  const createLesson = useCreateLessonMutation(slug);

  useEffect(() => {
    if (!can(PERMISSIONS.manageCourses)) {
      router.push(`/course/${slug}`);
    }
  }, [can, router, slug]);

  const handleSubmit = async (data: any) => {
    try {
      await createLesson.mutateAsync(data);
      router.push(`/course/${slug}`);
    } catch (error) {
      console.error("Failed to create lesson:", error);
    }
  };

  if (!can(PERMISSIONS.manageCourses)) return null;

  return (
    <PageLayout eyebrow="Admin" title="New Lesson">
      <div className="py-10">
        <LessonForm
          title="Create New Lesson"
          onSubmit={handleSubmit}
          isLoading={createLesson.isPending}
        />
      </div>
    </PageLayout>
  );
}
