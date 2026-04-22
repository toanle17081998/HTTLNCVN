"use client";

import { useState, useRef } from "react";
import { Button, Card, FormField, Input, Textarea, Select, cn } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import { CreateCourseDto, Course } from "@services/course";
import { ModularEditor, type ModularEditorHandle } from "@/modules/article/components/ModularEditor";

type CourseFormProps = {
  initialData?: Course;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  title: string;
};

export function CourseForm({ initialData, onSubmit, isLoading, title }: CourseFormProps) {
  const { t } = useTranslation();
  const descriptionRef = useRef<ModularEditorHandle>(null);
  const [editLang, setEditLang] = useState<"en" | "vi">("vi");

  const [formData, setFormData] = useState({
    slug: initialData?.slug || "",
    title_en: initialData?.title_en || "",
    title_vi: initialData?.title_vi || "",
    summary: initialData?.summary || "",
    description: initialData?.description || "",
    cover_image_url: initialData?.cover_image_url || "",
    level: initialData?.level || "beginner",
    estimated_duration_minutes: (initialData?.estimated_duration_minutes as number | string) ?? 0,
    status: initialData?.status || "draft",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : parseInt(value)) : value,
    }));
  };

  const handleEditorChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submissionData = {
      ...formData,
      description: descriptionRef.current?.getCleanedValue() ?? formData.description,
      estimated_duration_minutes: formData.estimated_duration_minutes === "" ? 0 : Number(formData.estimated_duration_minutes),
    };
    await onSubmit(submissionData);
  };

  return (
    <Card className="max-w-4xl mx-auto p-8 shadow-xl border-[var(--border-subtle)] bg-[var(--bg-card)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
          {title}
        </h1>
        <div className="inline-flex rounded-md border border-[var(--border-subtle)] bg-[var(--bg-base)] p-1">
          {(["en", "vi"] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setEditLang(lang)}
              className={cn(
                "h-8 rounded px-4 text-sm font-semibold transition",
                editLang === lang
                  ? "bg-[var(--bg-surface)] text-[var(--brand-primary)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:bg-[var(--brand-muted)] hover:text-[var(--text-primary)]",
              )}
            >
              {lang === "en" ? "English" : "Tiếng Việt"}
            </button>
          ))}
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_20rem] gap-8">
          {/* Left Column: Core Info */}
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6">
              <div className={cn(editLang !== "en" && "hidden")}>
                <FormField label={t("course.form.title_en")} htmlFor="title_en">
                  <Input
                    id="title_en"
                    name="title_en"
                    value={formData.title_en}
                    onChange={handleChange}
                    placeholder="English Title"
                    required={editLang === "en"}
                    className="bg-[var(--bg-base)]"
                  />
                </FormField>
              </div>

              <div className={cn(editLang !== "vi" && "hidden")}>
                <FormField label={t("course.form.title_vi")} htmlFor="title_vi">
                  <Input
                    id="title_vi"
                    name="title_vi"
                    value={formData.title_vi}
                    onChange={handleChange}
                    placeholder="Tiêu đề tiếng Việt"
                    required={editLang === "vi"}
                    className="bg-[var(--bg-base)]"
                  />
                </FormField>
              </div>
            </div>

            <FormField label={t("course.form.summary")} htmlFor="summary" hint={t("course.form.summaryHint")}>
              <Textarea
                id="summary"
                name="summary"
                value={formData.summary}
                onChange={handleChange}
                placeholder="A brief summary of the course..."
                rows={3}
                className="bg-[var(--bg-base)]"
              />
            </FormField>

            <ModularEditor
              label={t("course.form.description")}
              initialValue={formData.description}
              onChange={(val) => handleEditorChange("description", val)}
              placeholder="Full course description..."
              ref={descriptionRef}
            />
          </div>

          {/* Right Column: Metadata */}
          <div className="space-y-6">
            <FormField label={t("course.form.slug")} htmlFor="slug" hint={t("course.form.slugHint")}>
              <Input
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="course-slug"
                required
                disabled={!!initialData}
                className="bg-[var(--bg-base)]"
              />
            </FormField>

            <FormField label={t("course.form.level")} htmlFor="level">
              <Select
                id="level"
                name="level"
                value={formData.level}
                onChange={handleChange}
                className="bg-[var(--bg-base)] w-full"
              >
                <option value="beginner">{t("course.form.level.beginner")}</option>
                <option value="intermediate">{t("course.form.level.intermediate")}</option>
                <option value="advanced">{t("course.form.level.advanced")}</option>
              </Select>
            </FormField>

            <FormField label={t("course.form.coverImage")} htmlFor="cover_image_url">
              <Input
                id="cover_image_url"
                name="cover_image_url"
                value={formData.cover_image_url}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className="bg-[var(--bg-base)]"
              />
            </FormField>

            <FormField label={t("course.form.duration")} htmlFor="estimated_duration_minutes">
              <Input
                id="estimated_duration_minutes"
                name="estimated_duration_minutes"
                type="number"
                value={formData.estimated_duration_minutes}
                onChange={handleChange}
                className="bg-[var(--bg-base)]"
              />
            </FormField>

            <FormField label={t("course.form.status")} htmlFor="status">
              <Select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="bg-[var(--bg-base)] w-full"
              >
                <option value="draft">{t("course.form.status.draft")}</option>
                <option value="published">{t("course.form.status.published")}</option>
              </Select>
            </FormField>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t border-[var(--border-subtle)]">
          <Button
            type="button"
            variant="ghost"
            onClick={() => window.history.back()}
            disabled={isLoading}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" isLoading={isLoading} className="px-8 shadow-lg shadow-[var(--brand-primary-muted)]">
            {initialData ? t("course.action.update") : t("course.action.create")}
          </Button>
        </div>
      </form>
    </Card>
  );
}
