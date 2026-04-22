"use client";

import { useRouter } from "next/navigation";
import { PageLayout } from "@/components/layout";
import { CourseForm } from "@/modules/course/components/CourseForm";
import { useCreateCourseMutation } from "@services/course";
import { useAuth } from "@/providers/AuthProvider";
import { PERMISSIONS } from "@/lib/rbac";
import { useEffect } from "react";

export default function CreateCoursePage() {
  const router = useRouter();
  const { can } = useAuth();
  const createCourse = useCreateCourseMutation();

  useEffect(() => {
    if (!can(PERMISSIONS.manageCourses)) {
      router.push("/course");
    }
  }, [can, router]);

  const handleSubmit = async (data: any) => {
    try {
      const course = await createCourse.mutateAsync(data);
      router.push(`/course/${course.slug}`);
    } catch (error) {
      console.error("Failed to create course:", error);
    }
  };

  if (!can(PERMISSIONS.manageCourses)) return null;

  return (
    <PageLayout eyebrow="Admin" title="New Course">
      <div className="py-10">
        <CourseForm
          title="Create New Course"
          onSubmit={handleSubmit}
          isLoading={createCourse.isPending}
        />
      </div>
    </PageLayout>
  );
}
