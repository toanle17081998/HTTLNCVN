"use client";

import { useState } from "react";
import { Button, Card, FormField, Input, Textarea } from "@/components/ui";
import { CreateLessonDto, Lesson } from "@services/course";

type LessonFormProps = {
  initialData?: Lesson;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  title: string;
};

export function LessonForm({ initialData, onSubmit, isLoading, title }: LessonFormProps) {
  const [formData, setFormData] = useState({
    title_en: initialData?.title_en || "",
    title_vi: initialData?.title_vi || "",
    content_markdown_en: initialData?.content_markdown_en || "",
    content_markdown_vi: initialData?.content_markdown_vi || "",
    order_index: (initialData?.order_index as number | string) ?? 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "order_index" ? (value === "" ? "" : parseInt(value)) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submissionData = {
      ...formData,
      order_index: formData.order_index === "" ? 0 : Number(formData.order_index),
    };
    await onSubmit(submissionData);
  };

  return (
    <Card className="max-w-2xl mx-auto p-8 shadow-xl border-[var(--border-subtle)] bg-[var(--bg-card)]">
      <h1 className="text-3xl font-extrabold mb-8 text-[var(--text-primary)] tracking-tight">
        {title}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Title (English)" htmlFor="title_en">
            <Input
              id="title_en"
              name="title_en"
              value={formData.title_en}
              onChange={handleChange}
              placeholder="English Title"
              required
              className="bg-[var(--bg-base)]"
            />
          </FormField>

          <FormField label="Title (Vietnamese)" htmlFor="title_vi">
            <Input
              id="title_vi"
              name="title_vi"
              value={formData.title_vi}
              onChange={handleChange}
              placeholder="Vietnamese Title"
              required
              className="bg-[var(--bg-base)]"
            />
          </FormField>
        </div>

        <FormField label="Order Index" htmlFor="order_index">
          <Input
            id="order_index"
            name="order_index"
            type="number"
            value={formData.order_index}
            onChange={handleChange}
            className="bg-[var(--bg-base)]"
          />
        </FormField>

        <FormField label="Content (English)" htmlFor="content_markdown_en">
          <Textarea
            id="content_markdown_en"
            name="content_markdown_en"
            value={formData.content_markdown_en}
            onChange={handleChange}
            placeholder="Markdown content in English..."
            rows={8}
            className="bg-[var(--bg-base)]"
          />
        </FormField>

        <FormField label="Content (Vietnamese)" htmlFor="content_markdown_vi">
          <Textarea
            id="content_markdown_vi"
            name="content_markdown_vi"
            value={formData.content_markdown_vi}
            onChange={handleChange}
            placeholder="Markdown content in Vietnamese..."
            rows={8}
            className="bg-[var(--bg-base)]"
          />
        </FormField>

        <div className="flex justify-end gap-4 pt-6 border-t border-[var(--border-subtle)]">
          <Button
            type="button"
            variant="ghost"
            onClick={() => window.history.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} className="px-8 shadow-lg shadow-[var(--brand-primary-muted)]">
            {initialData ? "Update Lesson" : "Create Lesson"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
