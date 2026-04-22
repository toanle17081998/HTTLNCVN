"use client";

import { useState } from "react";
import { Button, Card, FormField, Input, Textarea, Select } from "@/components/ui";
import { CreateQuestionTemplateDto, QuestionTemplate } from "@services/course";

type QuestionTemplateFormProps = {
  initialData?: QuestionTemplate;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  title: string;
};

export function QuestionTemplateForm({ initialData, onSubmit, isLoading, title }: QuestionTemplateFormProps) {
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
      <h1 className="text-3xl font-extrabold mb-8 text-[var(--text-primary)] tracking-tight">
        {title}
      </h1>
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

        <FormField label="Question (English)" htmlFor="body_template_en">
          <Textarea
            id="body_template_en"
            name="body_template_en"
            value={formData.body_template_en}
            onChange={handleChange}
            placeholder="Question template in English..."
            required
            rows={4}
            className="bg-[var(--bg-base)]"
          />
        </FormField>

        <FormField label="Question (Vietnamese)" htmlFor="body_template_vi">
          <Textarea
            id="body_template_vi"
            name="body_template_vi"
            value={formData.body_template_vi}
            onChange={handleChange}
            placeholder="Question template in Vietnamese..."
            required
            rows={4}
            className="bg-[var(--bg-base)]"
          />
        </FormField>

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

        <FormField label="Explanation (Vietnamese)" htmlFor="explanation_template_vi">
          <Textarea
            id="explanation_template_vi"
            name="explanation_template_vi"
            value={formData.explanation_template_vi}
            onChange={handleChange}
            placeholder="Explanation in Vietnamese..."
            rows={3}
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
            {initialData ? "Update Template" : "Create Template"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
