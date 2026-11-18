"use client";

import { useRouter, useParams } from "next/navigation";
import { PageLayout } from "@/components/layout";
import { CourseForm } from "@/components/course/CourseForm";
import { useCourseQuery, useUpdateCourseMutation } from "@/hooks/course";
import { useAuth } from "@/providers/AuthProvider";
import { PERMISSIONS } from "@/lib/rbac";
import { useEffect } from "react";
import { Card } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { can } = useAuth();
  const { localize } = useTranslation();
  
  const courseQuery = useCourseQuery(slug);
  const updateCourse = useUpdateCourseMutation(slug);

  useEffect(() => {
    if (!can(PERMISSIONS.manageCourses)) {
      router.push("/course");
    }
  }, [can, router]);

  const handleSubmit = async (data: any) => {
    try {
      await updateCourse.mutateAsync(data);
      router.push(`/course/${slug}`);
    } catch (error) {
      console.error("Failed to update course:", error);
    }
  };

  if (!can(PERMISSIONS.manageCourses)) return null;

  if (courseQuery.isLoading) {
    return (
      <PageLayout eyebrow="Admin" title="Edit Course">
        <Card className="p-6 text-sm text-[var(--text-secondary)]">Loading course...</Card>
      </PageLayout>
    );
  }

  if (!courseQuery.data) {
    return (
      <PageLayout eyebrow="Admin" title="Edit Course">
        <Card className="p-6 text-sm font-medium text-[var(--status-danger)]">Course not found.</Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout eyebrow="Admin" title={`Edit: ${localize(courseQuery.data, "title")}`}>
      <div className="py-10">
        <CourseForm
          title="Edit Course"
          initialData={courseQuery.data}
          onSubmit={handleSubmit}
          isLoading={updateCourse.isPending}
        />
      </div>
    </PageLayout>
  );
}
