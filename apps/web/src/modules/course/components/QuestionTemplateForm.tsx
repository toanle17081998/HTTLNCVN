"use client";

import { useState } from "react";
import { Button, Card, FormField, Input, Textarea, Select, cn } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import { QuestionTemplate } from "@services/course";

type QuestionTemplateFormProps = {
  initialData?: QuestionTemplate;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  title: string;
};

export function QuestionTemplateForm({ initialData, onSubmit, isLoading, title }: QuestionTemplateFormProps) {
  const { t } = useTranslation();
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
    <Card className="mx-auto max-w-2xl border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 shadow-xl">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
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
              {lang === "en" ? t("common.language.english") : t("common.language.vietnamese")}
            </button>
          ))}
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField label={t("questionTemplate.type")} htmlFor="template_type">
            <Select
              id="template_type"
              name="template_type"
              value={formData.template_type}
              onChange={handleChange}
              className="w-full bg-[var(--bg-base)]"
            >
              <option value="short_answer">{t("questionTemplate.type.shortAnswer")}</option>
              <option value="multiple_choice">{t("questionTemplate.type.multipleChoice")}</option>
              <option value="true_false">{t("questionTemplate.type.trueFalse")}</option>
            </Select>
          </FormField>

          <FormField label={t("questionTemplate.difficulty")} htmlFor="difficulty">
            <Select
              id="difficulty"
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              className="w-full bg-[var(--bg-base)]"
            >
              <option value="easy">{t("questionTemplate.difficulty.easy")}</option>
              <option value="medium">{t("questionTemplate.difficulty.medium")}</option>
              <option value="hard">{t("questionTemplate.difficulty.hard")}</option>
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className={cn(editLang !== "en" && "hidden")}>
            <FormField label={t("questionTemplate.questionEnglish")} htmlFor="body_template_en">
              <Textarea
                id="body_template_en"
                name="body_template_en"
                value={formData.body_template_en}
                onChange={handleChange}
                placeholder={t("questionTemplate.questionEnglishPlaceholder")}
                required={editLang === "en"}
                rows={4}
                className="bg-[var(--bg-base)]"
              />
            </FormField>
          </div>

          <div className={cn(editLang !== "vi" && "hidden")}>
            <FormField label={t("questionTemplate.questionVietnamese")} htmlFor="body_template_vi">
              <Textarea
                id="body_template_vi"
                name="body_template_vi"
                value={formData.body_template_vi}
                onChange={handleChange}
                placeholder={t("questionTemplate.questionVietnamesePlaceholder")}
                required={editLang === "vi"}
                rows={4}
                className="bg-[var(--bg-base)]"
              />
            </FormField>
          </div>
        </div>

        <FormField
          label={t("questionTemplate.answerFormula")}
          htmlFor="answer_formula"
          hint={t("questionTemplate.answerFormulaHint")}
        >
          <Input
            id="answer_formula"
            name="answer_formula"
            value={formData.answer_formula}
            onChange={handleChange}
            placeholder={t("questionTemplate.answerFormulaPlaceholder")}
            className="bg-[var(--bg-base)]"
          />
        </FormField>

        <div className="grid grid-cols-1 gap-6">
          <div className={cn(editLang !== "en" && "hidden")}>
            <FormField label={t("questionTemplate.explanationEnglish")} htmlFor="explanation_template_en">
              <Textarea
                id="explanation_template_en"
                name="explanation_template_en"
                value={formData.explanation_template_en}
                onChange={handleChange}
                placeholder={t("questionTemplate.explanationEnglishPlaceholder")}
                rows={3}
                className="bg-[var(--bg-base)]"
              />
            </FormField>
          </div>

          <div className={cn(editLang !== "vi" && "hidden")}>
            <FormField label={t("questionTemplate.explanationVietnamese")} htmlFor="explanation_template_vi">
              <Textarea
                id="explanation_template_vi"
                name="explanation_template_vi"
                value={formData.explanation_template_vi}
                onChange={handleChange}
                placeholder={t("questionTemplate.explanationVietnamesePlaceholder")}
                rows={3}
                className="bg-[var(--bg-base)]"
              />
            </FormField>
          </div>
        </div>

        <div className="flex justify-end gap-4 border-t border-[var(--border-subtle)] pt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => window.history.back()}
            disabled={isLoading}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" isLoading={isLoading} className="px-8">
            {initialData ? t("course.action.update") : t("course.action.create")}
          </Button>
        </div>
      </form>
    </Card>
  );
}
