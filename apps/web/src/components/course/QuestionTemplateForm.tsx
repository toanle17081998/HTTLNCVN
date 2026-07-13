"use client";

import { useState } from "react";
import { Button, Card, FormField, Input, Textarea, Select, cn } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import { QuestionTemplate } from "@/services/course";

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
    template_type: initialData?.template_type || "multiple_choices",
    difficulty: initialData?.difficulty || "medium",
    body_template_en: initialData?.body_template_en || "",
    body_template_vi: initialData?.body_template_vi || "",
    explanation_template_en: initialData?.explanation_template_en || "",
    explanation_template_vi: initialData?.explanation_template_vi || "",
    answer_formula: initialData?.answer_formula || "",
    logic_config: initialData ? (initialData as any).logic_config : {},
  });

  const oldFalseAnswers = (initialData as any)?.logic_config?.false_answers || [];
  const [falseAnswer1, setFalseAnswer1] = useState(oldFalseAnswers[0] || "");
  const [falseAnswer2, setFalseAnswer2] = useState(oldFalseAnswers[1] || "");
  const [falseAnswer3, setFalseAnswer3] = useState(oldFalseAnswers[2] || "");

  // Dynamic correct and incorrect answers lists for multiple_choices
  const [correctAnswers, setCorrectAnswers] = useState<string[]>(() => {
    if (initialData?.answer_formula) {
      return initialData.answer_formula.split(",").map(s => s.trim()).filter(Boolean);
    }
    return [""];
  });
  const [incorrectAnswers, setIncorrectAnswers] = useState<string[]>(() => {
    if (oldFalseAnswers.length > 0) {
      return oldFalseAnswers;
    }
    return [""];
  });

  const addCorrectAnswer = () => setCorrectAnswers([...correctAnswers, ""]);
  const updateCorrectAnswer = (index: number, val: string) => {
    const copy = [...correctAnswers];
    copy[index] = val;
    setCorrectAnswers(copy);
  };
  const removeCorrectAnswer = (index: number) => {
    if (correctAnswers.length > 1) {
      setCorrectAnswers(correctAnswers.filter((_, i) => i !== index));
    }
  };

  const addIncorrectAnswer = () => setIncorrectAnswers([...incorrectAnswers, ""]);
  const updateIncorrectAnswer = (index: number, val: string) => {
    const copy = [...incorrectAnswers];
    copy[index] = val;
    setIncorrectAnswers(copy);
  };
  const removeIncorrectAnswer = (index: number) => {
    if (incorrectAnswers.length > 1) {
      setIncorrectAnswers(incorrectAnswers.filter((_, i) => i !== index));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalLogicConfig = {};
    let finalAnswerFormula = formData.answer_formula;

    if (formData.template_type === "theoretical_question") {
      finalLogicConfig = {
        false_answers: [falseAnswer1.trim(), falseAnswer2.trim(), falseAnswer3.trim()].filter(Boolean)
      };
    } else if (formData.template_type === "true_false") {
      finalLogicConfig = { false_answers: [] };
      finalAnswerFormula = finalAnswerFormula.toLowerCase() === "true" || !finalAnswerFormula ? "true" : "false";
    } else if (formData.template_type === "multiple_choices") {
      finalLogicConfig = {
        false_answers: incorrectAnswers.map(s => s.trim()).filter(Boolean)
      };
      finalAnswerFormula = correctAnswers.map(s => s.trim()).filter(Boolean).join(", ");
    }

    await onSubmit({
      ...formData,
      answer_formula: finalAnswerFormula,
      logic_config: finalLogicConfig
    });
  };

  return (
    <Card className="w-full border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 shadow-xl">
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
              <option value="multiple_choices">{t("questionTemplate.type.multiple_choices")}</option>
              <option value="true_false">{t("questionTemplate.type.true_false")}</option>
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

        {formData.template_type === "true_false" ? (
          <FormField
            label={t("questionTemplate.answerFormula")}
            htmlFor="answer_formula"
          >
            <Select
              id="answer_formula"
              name="answer_formula"
              value={formData.answer_formula || "true"}
              onChange={handleChange}
              className="w-full bg-[var(--bg-base)]"
            >
              <option value="true">True / Đúng</option>
              <option value="false">False / Sai</option>
            </Select>
          </FormField>
        ) : formData.template_type === "multiple_choices" ? (
          <div className="space-y-6 border-t border-[var(--border-subtle)] pt-6">
            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                Correct Answers
              </label>
              <div className="space-y-3">
                {correctAnswers.map((ans, idx) => (
                  <div key={idx} className="flex gap-3 items-center">
                    <Input
                      value={ans}
                      onChange={(e) => updateCorrectAnswer(idx, e.target.value)}
                      placeholder={`Correct choice ${idx + 1}`}
                      className="bg-[var(--bg-base)] flex-1"
                      required
                    />
                    {correctAnswers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCorrectAnswer(idx)}
                        className="p-2 text-[var(--status-danger)] hover:bg-[color-mix(in_srgb,var(--status-danger)_10%,transparent)] rounded-md transition text-sm font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addCorrectAnswer}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--brand-primary)] hover:underline"
              >
                + Add Correct Answer
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                Incorrect Answers
              </label>
              <div className="space-y-3">
                {incorrectAnswers.map((ans, idx) => (
                  <div key={idx} className="flex gap-3 items-center">
                    <Input
                      value={ans}
                      onChange={(e) => updateIncorrectAnswer(idx, e.target.value)}
                      placeholder={`Incorrect choice ${idx + 1}`}
                      className="bg-[var(--bg-base)] flex-1"
                      required
                    />
                    {incorrectAnswers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeIncorrectAnswer(idx)}
                        className="p-2 text-[var(--status-danger)] hover:bg-[color-mix(in_srgb,var(--status-danger)_10%,transparent)] rounded-md transition text-sm font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addIncorrectAnswer}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--brand-primary)] hover:underline"
              >
                + Add Incorrect Answer
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <FormField
              label="Correct Answer"
              htmlFor="answer_formula"
              hint="The single correct answer for this question."
            >
              <Input
                id="answer_formula"
                name="answer_formula"
                value={formData.answer_formula}
                onChange={handleChange}
                placeholder="Enter correct answer..."
                className="bg-[var(--bg-base)]"
                required
              />
            </FormField>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <FormField label="Incorrect Answer 1" htmlFor="false_answer_1">
                <Input
                  id="false_answer_1"
                  value={falseAnswer1}
                  onChange={(e) => setFalseAnswer1(e.target.value)}
                  placeholder="Incorrect option 1..."
                  className="bg-[var(--bg-base)]"
                  required
                />
              </FormField>
              <FormField label="Incorrect Answer 2" htmlFor="false_answer_2">
                <Input
                  id="false_answer_2"
                  value={falseAnswer2}
                  onChange={(e) => setFalseAnswer2(e.target.value)}
                  placeholder="Incorrect option 2..."
                  className="bg-[var(--bg-base)]"
                  required
                />
              </FormField>
              <FormField label="Incorrect Answer 3" htmlFor="false_answer_3">
                <Input
                  id="false_answer_3"
                  value={falseAnswer3}
                  onChange={(e) => setFalseAnswer3(e.target.value)}
                  placeholder="Incorrect option 3..."
                  className="bg-[var(--bg-base)]"
                  required
                />
              </FormField>
            </div>
          </div>
        )}

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
