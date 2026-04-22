"use client";

import { useState } from "react";
import { Button, Card, FormField, Input, Textarea, Select, cn } from "@/components/ui";
import { CreateQuestionTemplateDto, QuestionTemplate } from "@services/course";

type QuestionTemplateFormProps = {
  initialData?: QuestionTemplate;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  title: string;
};

export function QuestionTemplateForm({ initialData, onSubmit, isLoading, title }: QuestionTemplateFormProps) {
  const [editLang, setEditLang] = useState<"en" | "vi">("vi");
  const [formData, setFormData] = useState({
    template_type: initialData?.template_type || "short_answer",
    difficulty: initialData?.difficulty || "medium",
    body_template_en: initialData?.body_template_en || "",
    body_template_vi: initialData?.body_template_vi || "",
    explanation_template_en: initialData?.explanation_template_en || "",
    explanation_template_vi: initialData?.explanation_template_vi || "",
    answer_formula: initialData?.answer_formula || "",
    logic_config: initialData ? (initialData as any).logic_config : {},
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Card className="max-w-2xl mx-auto p-8 shadow-xl border-[var(--border-subtle)] bg-[var(--bg-card)]">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Type" htmlFor="template_type">
            <Select
              id="template_type"
              name="template_type"
              value={formData.template_type}
              onChange={handleChange}
              className="bg-[var(--bg-base)] w-full"
            >
              <option value="short_answer">Short Answer</option>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="true_false">True/False</option>
            </Select>
          </FormField>

          <FormField label="Difficulty" htmlFor="difficulty">
            <Select
              id="difficulty"
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              className="bg-[var(--bg-base)] w-full"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className={cn(editLang !== "en" && "hidden")}>
            <FormField label="Question (English)" htmlFor="body_template_en">
              <Textarea
                id="body_template_en"
                name="body_template_en"
                value={formData.body_template_en}
                onChange={handleChange}
                placeholder="Question template in English..."
                required={editLang === "en"}
                rows={4}
                className="bg-[var(--bg-base)]"
              />
            </FormField>
          </div>

          <div className={cn(editLang !== "vi" && "hidden")}>
            <FormField label="Câu hỏi (Tiếng Việt)" htmlFor="body_template_vi">
              <Textarea
                id="body_template_vi"
                name="body_template_vi"
                value={formData.body_template_vi}
                onChange={handleChange}
                placeholder="Nhập nội dung câu hỏi bằng tiếng Việt..."
                required={editLang === "vi"}
                rows={4}
                className="bg-[var(--bg-base)]"
              />
            </FormField>
          </div>
        </div>

        <FormField label="Answer Formula" htmlFor="answer_formula" hint="Formula or value to calculate the correct answer.">
          <Input
            id="answer_formula"
            name="answer_formula"
            value={formData.answer_formula}
            onChange={handleChange}
            placeholder="Answer formula"
            className="bg-[var(--bg-base)]"
          />
        </FormField>

        <div className="grid grid-cols-1 gap-6">
          <div className={cn(editLang !== "en" && "hidden")}>
            <FormField label="Explanation (English)" htmlFor="explanation_template_en">
              <Textarea
                id="explanation_template_en"
                name="explanation_template_en"
                value={formData.explanation_template_en}
                onChange={handleChange}
                placeholder="Explanation in English..."
                rows={3}
                className="bg-[var(--bg-base)]"
              />
            </FormField>
          </div>

          <div className={cn(editLang !== "vi" && "hidden")}>
            <FormField label="Giải thích (Tiếng Việt)" htmlFor="explanation_template_vi">
              <Textarea
                id="explanation_template_vi"
                name="explanation_template_vi"
                value={formData.explanation_template_vi}
                onChange={handleChange}
                placeholder="Giải thích bằng tiếng Việt..."
                rows={3}
                className="bg-[var(--bg-base)]"
              />
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
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} className="px-8 shadow-lg shadow-[var(--brand-primary-muted)]">
            {initialData ? "Update Template" : "Create Template"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
