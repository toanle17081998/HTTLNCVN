"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import type { Course, PublishCourseTestDto } from "@/services/course";
import {
  useCloseCourseTestMutation,
  useCourseTestQuery,
  usePublishCourseTestMutation,
  useStartCourseTestMutation,
} from "@/services/course";
import { useTranslation } from "@/providers/I18nProvider";

type DraftQuestion = {
  correctAnswer: string;
  id: string;
  incorrectAnswers: string;
  questionEn: string;
  questionVi: string;
  type: string;
};

function createDraftQuestion(): DraftQuestion {
  return {
    correctAnswer: "",
    id: crypto.randomUUID(),
    incorrectAnswers: "",
    questionEn: "",
    questionVi: "",
    type: "short_answer",
  };
}

function isDraftComplete(question: DraftQuestion) {
  const correctAnswer = question.type === "true_false" ? (question.correctAnswer || "true") : question.correctAnswer;
  const needsIncorrectAnswers = question.type === "multiple_choices" || question.type === "theoretical_question";
  return Boolean(
    question.questionEn.trim() &&
    question.questionVi.trim() &&
    correctAnswer.trim() &&
    (!needsIncorrectAnswers || question.incorrectAnswers.trim()),
  );
}

export function CourseTestPanel({ course }: { course: Course }) {
  const router = useRouter();
  const { locale } = useTranslation();
  const testQuery = useCourseTestQuery(course.slug);
  const publishTest = usePublishCourseTestMutation(course.slug);
  const closeTest = useCloseCourseTestMutation(course.slug);
  const startTest = useStartCourseTestMutation();
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [draftQuestions, setDraftQuestions] = useState<DraftQuestion[]>([]);
  const [isQuestionsModalOpen, setIsQuestionsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const status = testQuery.data;
  const firstLessonId = course.lessons[0]?.id;

  const filteredQuestions = (status?.question_bank || []).filter((question) => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return (
      question.body_template_vi.toLowerCase().includes(term) ||
      question.body_template_en.toLowerCase().includes(term) ||
      question.lesson?.title_vi?.toLowerCase().includes(term) ||
      question.lesson?.title_en?.toLowerCase().includes(term)
    );
  });

  const handleCloseModal = () => {
    setSearchQuery("");
    setIsQuestionsModalOpen(false);
  };

  const handleOpenModal = () => {
    setSearchQuery("");
    setIsQuestionsModalOpen(true);
  };

  if (testQuery.isLoading || testQuery.error || !status) return null;
  if (!status.can_manage && !status.availability) return null;

  async function handleStart() {
    if (!status?.availability) return;
    const attempt = status.attempt ?? await startTest.mutateAsync(status.availability.id);
    router.push(`/course/quiz/${attempt.id}`);
  }

  async function handlePublish() {
    if (!firstLessonId || !draftQuestions.every(isDraftComplete)) return;
    const newQuestions: PublishCourseTestDto["new_questions"] = draftQuestions.map((question) => ({
        answer_formula: question.type === "true_false" ? (question.correctAnswer || "true") : question.correctAnswer.trim(),
        body_template_en: question.questionEn.trim(),
        body_template_vi: question.questionVi.trim(),
        lesson_id: firstLessonId,
        logic_config: {
          false_answers: question.incorrectAnswers.split(",").map((value) => value.trim()).filter(Boolean),
        },
        template_type: question.type,
      }));
    await publishTest.mutateAsync({
      duration_seconds: Math.max(1, durationMinutes) * 60,
      new_questions: newQuestions,
      template_ids: selectedIds,
    });
    setSelectedIds([]);
    setDraftQuestions([]);
  }

  function updateDraft(id: string, values: Partial<DraftQuestion>) {
    setDraftQuestions((current) => current.map((question) => question.id === id ? { ...question, ...values } : question));
  }

  const attempt = status.attempt;
  const title = locale === "vi" ? "Bài kiểm tra cuối khóa" : "Final course test";

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {locale === "vi" ? "Điểm đạt: 70%. Mỗi đợt mở chỉ có một lượt làm bài." : "Passing grade: 70%. One attempt per availability."}
          </p>
        </div>
        {status.availability ? (
          <span className="rounded-md bg-[var(--brand-muted)] px-3 py-1 text-xs font-semibold text-[var(--brand-primary)]">
            {status.can_manage
              ? `${status.managed_classes.length} ${locale === "vi" ? "lớp" : "classes"}`
              : status.availability.church_unit.name}
          </span>
        ) : null}
      </div>

      {status.availability ? (
        <div className="mt-5 rounded-lg border border-[var(--border-subtle)] p-4">
          {attempt?.is_completed ? (
            <div>
              <p className="font-semibold text-[var(--text-primary)]">
                {locale === "vi" ? "Bài kiểm tra đã kết thúc" : "Test completed"}
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {locale === "vi" ? "Điểm" : "Score"}: {Math.round(attempt.total_score ?? 0)}% · {(attempt.total_score ?? 0) >= 70 ? (locale === "vi" ? "Đạt" : "Passed") : (locale === "vi" ? "Không đạt" : "Not passed")}
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[var(--text-secondary)]">
                {attempt
                  ? (locale === "vi" ? "Đang làm" : "In progress")
                  : `${Math.ceil(status.availability.duration_seconds / 60)} min`}
              </p>
              <Button disabled={startTest.isPending} onClick={handleStart}>
                {attempt ? (locale === "vi" ? "Tiếp tục" : "Resume test") : (locale === "vi" ? "Bắt đầu" : "Start test")}
              </Button>
            </div>
          )}
        </div>
      ) : null}

      {status.can_manage ? (
        <div className="mt-6 border-t border-[var(--border-subtle)] pt-5">
          <h3 className="font-semibold text-[var(--text-primary)]">{locale === "vi" ? "Mở đợt kiểm tra" : "Publish test availability"}</h3>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {locale === "vi"
              ? `Bài kiểm tra này sẽ được mở cho tất cả ${status.managed_classes.length} lớp đang học khóa này.`
              : `This test will be published to all ${status.managed_classes.length} classes assigned to this course.`}
          </p>
          <div className="mt-4 grid gap-4 sm:max-w-sm">
            <label className="grid gap-1 text-sm font-medium">
              {locale === "vi" ? "Thời gian (phút)" : "Duration (minutes)"}
              <Input min={1} type="number" value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} />
            </label>
          </div>

          <div className="mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleOpenModal}
            >
              {locale === "vi" ? "Chọn câu hỏi có sẵn" : "Select existing questions"}
              {selectedIds.length > 0 && ` (${selectedIds.length})`}
            </Button>
          </div>

          <Button className="mt-4" onClick={() => setDraftQuestions((current) => [...current, createDraftQuestion()])} size="sm" variant="secondary">
            {locale === "vi" ? "Thêm câu hỏi" : "Add question"}
          </Button>
          <div className="mt-4 grid gap-4">
            {draftQuestions.map((question, index) => (
              <div className="grid gap-3 rounded-lg border border-[var(--border-subtle)] p-4" key={question.id}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{locale === "vi" ? `Câu hỏi mới ${index + 1}` : `New question ${index + 1}`}</p>
                  <Button onClick={() => setDraftQuestions((current) => current.filter((item) => item.id !== question.id))} size="sm" variant="secondary">
                    {locale === "vi" ? "Xóa" : "Remove"}
                  </Button>
                </div>
                <select className="h-10 rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3" value={question.type} onChange={(event) => updateDraft(question.id, { correctAnswer: "", incorrectAnswers: "", type: event.target.value })}>
                  <option value="theoretical_question">Theoretical question</option>
                  <option value="true_false">True / False</option>
                  <option value="multiple_choices">Multiple choice</option>
                  <option value="short_answer">Text input</option>
                </select>
                <Input placeholder="Question (English)" value={question.questionEn} onChange={(event) => updateDraft(question.id, { questionEn: event.target.value })} />
                <Input placeholder="Câu hỏi (Tiếng Việt)" value={question.questionVi} onChange={(event) => updateDraft(question.id, { questionVi: event.target.value })} />
                {question.type === "true_false" ? (
                  <select className="h-10 rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3" value={question.correctAnswer || "true"} onChange={(event) => updateDraft(question.id, { correctAnswer: event.target.value })}>
                    <option value="true">True</option><option value="false">False</option>
                  </select>
                ) : (
                  <Input placeholder={question.type === "multiple_choices" ? "Correct answers, separated by commas" : "Correct answer"} value={question.correctAnswer} onChange={(event) => updateDraft(question.id, { correctAnswer: event.target.value })} />
                )}
                {(question.type === "multiple_choices" || question.type === "theoretical_question") ? (
                  <Input placeholder="Incorrect choices, separated by commas" value={question.incorrectAnswers} onChange={(event) => updateDraft(question.id, { incorrectAnswers: event.target.value })} />
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              disabled={
                publishTest.isPending ||
                Boolean(status.availability) ||
                !status.managed_classes.length ||
                (draftQuestions.length > 0 && !draftQuestions.every(isDraftComplete))
              }
              onClick={handlePublish}
            >
              {locale === "vi" ? "Mở đợt kiểm tra" : "Open test round"}
            </Button>
            {status.availability ? (
              <Button disabled={closeTest.isPending} onClick={() => closeTest.mutate(status.availability!.id)} variant="secondary">
                {locale === "vi" ? "Đóng bài kiểm tra" : "Close test"}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
      {isQuestionsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] p-5">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                {locale === "vi" ? "Chọn câu hỏi có sẵn" : "Select existing questions"}
              </h3>
              <button
                className="rounded-md p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--bg-soft)] hover:text-[var(--text-primary)] cursor-pointer"
                onClick={handleCloseModal}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="border-b border-[var(--border-subtle)] px-5 py-3 bg-[var(--bg-soft)] flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <Input
                  className="pl-9"
                  placeholder={locale === "vi" ? "Tìm kiếm câu hỏi hoặc bài học..." : "Search questions or lessons..."}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {searchQuery && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSearchQuery("")}
                >
                  {locale === "vi" ? "Xóa" : "Clear"}
                </Button>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {filteredQuestions.length > 0 ? (
                filteredQuestions.map((question) => {
                  const isChecked = selectedIds.includes(question.id);
                  return (
                    <label
                      key={question.id}
                      className={`flex gap-3 rounded-lg border p-4 text-sm cursor-pointer transition ${
                        isChecked
                          ? "border-[var(--brand-primary)] bg-[var(--brand-muted)] text-[var(--brand-primary)]"
                          : "border-[var(--border-subtle)] hover:bg-[var(--bg-soft)] text-[var(--text-primary)]"
                      }`}
                    >
                      <input
                        checked={isChecked}
                        onChange={() =>
                          setSelectedIds((current) =>
                            current.includes(question.id)
                              ? current.filter((id) => id !== question.id)
                              : [...current, question.id]
                          )
                        }
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 rounded border-[var(--border-strong)] text-[var(--brand-primary)] focus:ring-[var(--brand-primary)] cursor-pointer"
                      />
                      <div className="flex-1">
                        <p className="font-medium">
                          {locale === "vi" ? question.body_template_vi : question.body_template_en}
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                          {locale === "vi"
                            ? `Bài học: ${question.lesson?.title_vi || question.lesson?.title_en || ""}`
                            : `Lesson: ${question.lesson?.title_en || question.lesson?.title_vi || ""}`}
                        </p>
                      </div>
                    </label>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center text-[var(--text-tertiary)]">
                  <p className="text-sm">
                    {locale === "vi" ? "Không tìm thấy câu hỏi nào" : "No questions found"}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-[var(--border-subtle)] bg-[var(--bg-soft)] p-5">
              <div className="text-xs text-[var(--text-secondary)]">
                {locale === "vi"
                  ? `Đã chọn ${selectedIds.length} câu hỏi`
                  : `Selected ${selectedIds.length} question(s)`}
              </div>
              <Button onClick={handleCloseModal}>
                {locale === "vi" ? "Xong" : "Done"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
}
