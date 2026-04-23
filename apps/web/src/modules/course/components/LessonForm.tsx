"use client";

import { useState, useRef } from "react";
import { Button, Card, FormField, Input, cn } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import { CreateLessonDto, Lesson } from "@services/course";
import { ModularEditor, type ModularEditorHandle } from "@/modules/article/components/ModularEditor";

type LessonFormProps = {
  initialData?: Lesson;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  title: string;
};

export function LessonForm({ initialData, onSubmit, isLoading, title }: LessonFormProps) {
  const { t } = useTranslation();
  const contentEnRef = useRef<ModularEditorHandle>(null);
  const contentViRef = useRef<ModularEditorHandle>(null);

  const [editLang, setEditLang] = useState<"en" | "vi">("vi");
  const [formData, setFormData] = useState({
    title_en: initialData?.title_en || "",
    title_vi: initialData?.title_vi || "",
    content_markdown_en: initialData?.content_markdown_en || "",
    content_markdown_vi: initialData?.content_markdown_vi || "",
    order_index: (initialData?.order_index as number | string) ?? 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "order_index" ? (value === "" ? "" : parseInt(value)) : value,
    }));
  };

  const handleEditorChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submissionData = {
      ...formData,
      content_markdown_en: contentEnRef.current?.getCleanedValue() ?? formData.content_markdown_en,
      content_markdown_vi: contentViRef.current?.getCleanedValue() ?? formData.content_markdown_vi,
      order_index: formData.order_index === "" ? 0 : Number(formData.order_index),
    };
    await onSubmit(submissionData);
  };

  return (
    <Card className="mx-auto w-full min-w-0 max-w-5xl overflow-hidden border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-sm sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">
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
        <div className="grid min-w-0 gap-6 md:grid-cols-[minmax(0,1fr)_10rem]">
          <div className="grid min-w-0 grid-cols-1 gap-6">
            <div className={cn(editLang !== "en" && "hidden")}>
              <FormField label={t("lesson.form.title_en")} htmlFor="title_en">
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
              <FormField label={t("lesson.form.title_vi")} htmlFor="title_vi">
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

          <FormField label={t("lesson.form.order")} htmlFor="order_index">
            <Input
              id="order_index"
              name="order_index"
              type="number"
              value={formData.order_index}
              onChange={handleChange}
              className="bg-[var(--bg-base)]"
            />
          </FormField>
        </div>

        <div className="grid min-w-0 gap-8">
          <div className={cn(editLang !== "en" && "hidden")}>
            <ModularEditor
              label={t("lesson.form.content_en")}
              initialValue={formData.content_markdown_en}
              onChange={(val) => handleEditorChange("content_markdown_en", val)}
              placeholder="Write lesson content in English..."
              ref={contentEnRef}
              className="min-w-0 max-w-full"
            />
          </div>

          <div className={cn(editLang !== "vi" && "hidden")}>
            <ModularEditor
              label={t("lesson.form.content_vi")}
              initialValue={formData.content_markdown_vi}
              onChange={(val) => handleEditorChange("content_markdown_vi", val)}
              placeholder="Viết nội dung bài học bằng tiếng Việt..."
              ref={contentViRef}
              className="min-w-0 max-w-full"
            />
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
            {initialData ? t("lesson.action.update") : t("lesson.action.create")}
          </Button>
        </div>
      </form>
    </Card>
  );
}


