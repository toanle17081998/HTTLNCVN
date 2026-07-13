"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageLayout } from "@/components/layout";
import { Button, Card } from "@/components/ui";
import { QuestionTemplateForm } from "@/components/course/QuestionTemplateForm";
import { useTranslation } from "@/providers/I18nProvider";
import { useFeedback } from "@/providers/FeedbackProvider";
import { useAuth } from "@/providers/AuthProvider";
import { PERMISSIONS } from "@/lib/rbac";
import {
  useLessonQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  useDeleteTemplateMutation,
} from "@/services/course";

export default function TemplatesPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const lessonId = params.lessonId as string;
  const { can } = useAuth();
  const { t, locale } = useTranslation();
  const { confirm } = useFeedback();

  const lessonQuery = useLessonQuery(slug, lessonId);
  const lesson = lessonQuery.data;

  const createTemplate = useCreateTemplateMutation(lessonId);
  const deleteTemplate = useDeleteTemplateMutation(lessonId);

  // Modal control states
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);

  // Update mutation helper needs dynamic template ID
  const updateTemplate = useUpdateTemplateMutation(editingTemplate?.id || "", lessonId);

  useEffect(() => {
    if (!can(PERMISSIONS.manageCourses)) {
      router.push(`/course/${slug}/lesson/${lessonId}`);
    }
  }, [can, router, slug, lessonId]);

  if (!can(PERMISSIONS.manageCourses)) return null;

  const handleOpenAdd = () => {
    setEditingTemplate(null);
    setShowModal(true);
  };

  const handleOpenEdit = (template: any) => {
    setEditingTemplate(template);
    setShowModal(true);
  };

  const handleSubmit = async (data: any) => {
    try {
      if (editingTemplate) {
        await updateTemplate.mutateAsync(data);
      } else {
        await createTemplate.mutateAsync(data);
      }
      setShowModal(false);
      setEditingTemplate(null);
      lessonQuery.refetch();
    } catch (error) {
      console.error("Failed to save template:", error);
    }
  };

  const handleDelete = async (templateId: string) => {
    const ok = await confirm({
      variant: "delete",
      title: "Are you sure you want to delete this template?",
    });
    if (ok) {
      try {
        await deleteTemplate.mutateAsync(templateId);
        lessonQuery.refetch();
      } catch (error) {
        console.error("Failed to delete template:", error);
      }
    }
  };

  return (
    <PageLayout
      eyebrow="Admin"
      title={
        locale === "vi"
          ? `Danh sách câu hỏi: ${lesson?.title_vi || lesson?.title_en || ""}`
          : `Templates for: ${lesson?.title_en || lesson?.title_vi || ""}`
      }
      actions={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.push(`/course/${slug}/lesson/${lessonId}`)}>
            Back to Lesson
          </Button>
          <Button onClick={handleOpenAdd}>
            + Add Template
          </Button>
        </div>
      }
    >
      <div className="py-6 space-y-4">
        {lessonQuery.isLoading && (
          <Card className="p-6 text-sm text-[var(--text-secondary)]">Loading templates...</Card>
        )}

        {lesson && (
          <div className="grid gap-4">
            {lesson.templates?.map((template) => (
              <Card
                key={template.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-sm hover:shadow-md transition"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <span className="inline-flex items-center rounded-md bg-[var(--brand-muted)] px-2 py-1 text-xs font-medium text-[var(--brand-primary)] uppercase">
                    {template.template_type.replace("_", " ")}
                  </span>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    {template.body_template_vi || template.body_template_en}
                  </h3>
                  {template.body_template_en && template.body_template_vi && (
                    <p className="text-sm text-[var(--text-secondary)] italic">
                      EN: {template.body_template_en}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="secondary" size="sm" onClick={() => handleOpenEdit(template)}>
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={deleteTemplate.isPending}
                    onClick={() => handleDelete(template.id)}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}

            {(!lesson.templates || lesson.templates.length === 0) && (
              <Card className="p-12 text-center border-dashed border-2 text-[var(--text-secondary)]">
                No templates configured for this lesson. Click &quot;+ Add Template&quot; to create one.
              </Card>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4 mb-4">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                {editingTemplate ? "Edit Question Template" : "Create Question Template"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingTemplate(null);
                }}
                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-base)] transition text-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              <QuestionTemplateForm
                title={editingTemplate ? "Update Template" : "New Template"}
                initialData={editingTemplate}
                onSubmit={handleSubmit}
                isLoading={createTemplate.isPending || updateTemplate.isPending}
              />
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
