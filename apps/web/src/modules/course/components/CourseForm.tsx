"use client";

import { useState } from "react";
import { Button, Card, FormField, Input, Textarea, Select } from "@/components/ui";
import { CreateCourseDto, Course } from "@services/course";

type CourseFormProps = {
  initialData?: Course;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  title: string;
};

export function CourseForm({ initialData, onSubmit, isLoading, title }: CourseFormProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submissionData = {
      ...formData,
      estimated_duration_minutes: formData.estimated_duration_minutes === "" ? 0 : Number(formData.estimated_duration_minutes),
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
          <FormField label="Slug" htmlFor="slug" hint="URL-friendly name (e.g., introduction-to-faith)">
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

          <FormField label="Level" htmlFor="level">
            <Select
              id="level"
              name="level"
              value={formData.level}
              onChange={handleChange}
              className="bg-[var(--bg-base)] w-full"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </Select>
          </FormField>
        </div>

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

        <FormField label="Summary" htmlFor="summary" hint="A short teaser for the course list.">
          <Textarea
            id="summary"
            name="summary"
            value={formData.summary}
            onChange={handleChange}
            placeholder="A brief summary of the course..."
            rows={2}
            className="bg-[var(--bg-base)]"
          />
        </FormField>

        <FormField label="Description" htmlFor="description">
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Full course description..."
            rows={4}
            className="bg-[var(--bg-base)]"
          />
        </FormField>

        <FormField label="Cover Image URL" htmlFor="cover_image_url">
          <Input
            id="cover_image_url"
            name="cover_image_url"
            value={formData.cover_image_url}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
            className="bg-[var(--bg-base)]"
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Estimated Duration (minutes)" htmlFor="estimated_duration_minutes">
            <Input
              id="estimated_duration_minutes"
              name="estimated_duration_minutes"
              type="number"
              value={formData.estimated_duration_minutes}
              onChange={handleChange}
              className="bg-[var(--bg-base)]"
            />
          </FormField>

          <FormField label="Status" htmlFor="status">
            <Select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="bg-[var(--bg-base)] w-full"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </Select>
          </FormField>
        </div>

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
            {initialData ? "Update Course" : "Create Course"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
