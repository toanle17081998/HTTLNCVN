"use client";

import { Badge, Text, Title, Button, Card, Input, Label, Pagination } from "@/components/ui";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import type { Course, PublishCourseTestDto } from "@/hooks/course";
import {
  useCloseCourseTestMutation,
  useCourseTestQuery,
  useCourseTestQuestionsQuery,
  usePublishCourseTestMutation,
  useStartCourseTestMutation,
} from "@/hooks/course";
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
  const { t, locale, localize } = useTranslation();
  const [selectedClassId, setSelectedClassId] = useState("");
  const testQuery = useCourseTestQuery(course.slug, selectedClassId || undefined);
  const publishTest = usePublishCourseTestMutation(course.slug);
  const closeTest = useCloseCourseTestMutation(course.slug);
  const startTest = useStartCourseTestMutation();
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [targetUserId, setTargetUserId] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [draftQuestions, setDraftQuestions] = useState<DraftQuestion[]>([]);
  const [isQuestionsModalOpen, setIsQuestionsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [recordPage, setRecordPage] = useState(0);
  const [recordPageSize, setRecordPageSize] = useState(10);
  const questionsQuery = useCourseTestQuestionsQuery(course.slug, isQuestionsModalOpen);

  const status = testQuery.data;
  const firstLessonId = course.lessons[0]?.id;
  const activeClassId = selectedClassId || status?.managed_classes[0]?.id || "";
  const activeClass = status?.managed_classes.find(({ id }) => id === activeClassId);

  const filteredQuestions = (questionsQuery.data || []).filter((question) => {
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

  if (testQuery.isLoading) return null;
  if (testQuery.error) {
    return <Card className="p-6 text-sm text-[var(--status-danger)]">{t("courseTest.loadError")}</Card>;
  }
  if (!status) return null;
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
      church_unit_id: activeClassId,
      duration_seconds: Math.max(1, durationMinutes) * 60,
      new_questions: newQuestions,
      template_ids: selectedIds,
      target_user_id: targetUserId || undefined,
    });
    setSelectedIds([]);
    setDraftQuestions([]);
  }

  function updateDraft(id: string, values: Partial<DraftQuestion>) {
    setDraftQuestions((current) => current.map((question) => question.id === id ? { ...question, ...values } : question));
  }

  const attempt = status.attempt;
  const title = t("courseTest.title");

  return (
    <Card className="flex flex-col p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Title as="h2" variant="subsection">{title}</Title>
          <Text className="mt-1" variant="small">
            {t("courseTest.passingDescription")}
          </Text>
        </div>
        {status.availability ? (
          <Badge>
            {status.can_manage
              ? status.availability.target_user?.name || status.availability.church_unit.name
              : status.availability.church_unit.name}
          </Badge>
        ) : null}
      </div>

      {status.availability && status.can_attempt ? (
        <div className="mt-5 rounded-lg border border-[var(--border-subtle)] p-4">
          {attempt?.is_completed ? (
            <div>
              <Text as="p" tone="inherit" variant="inherit" className="font-semibold text-[var(--text-primary)]">
                {t("courseTest.completed")}
              </Text>
              <Text className="mt-1" variant="small">
                {t("quiz.score")}: {Math.round(attempt.total_score ?? 0)}% · {(attempt.total_score ?? 0) >= 70 ? t("courseTest.passed") : t("courseTest.failed")}
              </Text>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Text variant="small">
                {attempt
                  ? t("courseTest.inProgress")
                  : `${Math.ceil(status.availability.duration_seconds / 60)} min`}
              </Text>
              <Button disabled={startTest.isPending} onClick={handleStart}>
                {attempt ? t("courseTest.resume") : t("courseTest.start")}
              </Button>
            </div>
          )}
        </div>
      ) : null}

      {status.can_manage && status.availability ? (
        <div className="order-last mt-5">
          <div className="overflow-hidden rounded-lg border border-[var(--border-subtle)]">
          <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-base)] px-4 py-3">
            <Title as="h3" className="font-semibold" variant="inherit">
              {status.availability.is_active
                ? t("courseTest.assignedStatus")
                : t("courseTest.latestResults")}
            </Title>
            <Text as="p" tone="inherit" variant="inherit" className="mt-1 text-xs text-[var(--text-secondary)]">
              {t("courseTest.assignedCount", { count: String(status.assigned_users.length) })}
            </Text>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--bg-base)] text-xs uppercase text-[var(--text-tertiary)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">{t("courseTest.testTaker")}</th>
                  <th className="px-4 py-3 font-semibold">{t("courseTest.status")}</th>
                  <th className="px-4 py-3 font-semibold">{t("quiz.score")}</th>
                  <th className="px-4 py-3 font-semibold">{t("courseTest.updated")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {(() => {
                  const totalRecords = status.assigned_users.length;
                  const maxPage = Math.max(0, Math.ceil(totalRecords / recordPageSize) - 1);
                  const safePage = Math.min(recordPage, maxPage);
                  const pagedUsers = status.assigned_users.slice(
                    safePage * recordPageSize,
                    safePage * recordPageSize + recordPageSize,
                  );
                  return pagedUsers.map((assignedUser) => {
                  const timestamp = assignedUser.completed_at ?? assignedUser.started_at ?? status.availability!.created_at;
                  const statusLabel = assignedUser.status === "done"
                    ? t("quiz.status.completed")
                    : assignedUser.status === "in_progress"
                      ? t("courseTest.inProgress")
                      : t("quiz.status.notStarted");
                  return (
                    <tr key={assignedUser.id}>
                      <td className="px-4 py-3">
                        <Text as="p" tone="inherit" variant="inherit" className="font-medium text-[var(--text-primary)]">{assignedUser.name}</Text>
                        <Text as="p" tone="inherit" variant="inherit" className="text-xs text-[var(--text-tertiary)]">{assignedUser.email}</Text>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{statusLabel}</td>
                      <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">
                        {assignedUser.status === "done" && assignedUser.score !== null
                          ? `${Math.round(assignedUser.score)}%`
                          : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--text-tertiary)]">
                        {new Date(timestamp).toLocaleString(locale)}
                      </td>
                    </tr>
                  );
                  });
                })()}
              </tbody>
            </table>
          </div>
          </div>
          {status.assigned_users.length > 0 ? (
            <Pagination
              className="mt-3"
              onPageChange={setRecordPage}
              onPageSizeChange={(nextSize) => {
                setRecordPageSize(nextSize);
                setRecordPage(0);
              }}
              page={Math.min(
                recordPage,
                Math.max(0, Math.ceil(status.assigned_users.length / recordPageSize) - 1),
              )}
              pageSize={recordPageSize}
              pageSizeOptions={[10, 20, 50]}
              total={status.assigned_users.length}
            />
          ) : null}
        </div>
      ) : null}

      {status.can_manage ? (
        <div className="mt-6 border-t border-[var(--border-subtle)] pt-5">
          <Title as="h3" className="font-semibold" variant="inherit">{t("courseTest.publishTitle")}</Title>
          <Text as="p" tone="inherit" variant="inherit" className="mt-2 text-sm text-[var(--text-secondary)]">
            {t("courseTest.publishDescription")}
          </Text>
          <div className="mt-4 grid gap-4 sm:max-w-sm">
            <Label variant="control" className="grid gap-1">
              {t("courseTest.class")}
              <select
                className="h-10 rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3"
                value={activeClassId}
                onChange={(event) => {
                  setSelectedClassId(event.target.value);
                  setTargetUserId("");
                }}
              >
                {status.managed_classes.map((managedClass) => (
                  <option key={managedClass.id} value={managedClass.id}>{managedClass.name}</option>
                ))}
              </select>
            </Label>
            <Label variant="control" className="grid gap-1">
              {t("courseTest.testTaker")}
              <select
                className="h-10 rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3"
                value={targetUserId}
                onChange={(event) => setTargetUserId(event.target.value)}
              >
                <option value="">{t("courseTest.everyone")}</option>
                {activeClass?.members.map((member) => (
                  <option key={member.id} value={member.id}>{member.name} ({member.email})</option>
                ))}
              </select>
            </Label>
            <Label variant="control" className="grid gap-1">
              {t("courseTest.duration")}
              <Input min={1} type="number" value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} />
            </Label>
          </div>

          <div className="mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleOpenModal}
            >
              {t("courseTest.selectQuestions")}
              {selectedIds.length > 0 && ` (${selectedIds.length})`}
            </Button>
          </div>

          <Button className="mt-4" onClick={() => setDraftQuestions((current) => [...current, createDraftQuestion()])} size="sm" variant="secondary">
            {t("courseTest.addQuestion")}
          </Button>
          <div className="mt-4 grid gap-4">
            {draftQuestions.map((question, index) => (
              <div className="grid gap-3 rounded-lg border border-[var(--border-subtle)] p-4" key={question.id}>
                <div className="flex items-center justify-between gap-3">
                  <Text as="p" tone="inherit" variant="inherit" className="text-sm font-semibold">{t("courseTest.newQuestion", { number: String(index + 1) })}</Text>
                  <Button onClick={() => setDraftQuestions((current) => current.filter((item) => item.id !== question.id))} size="sm" variant="secondary">
                    {t("courseTest.remove")}
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
                Boolean(status.availability?.is_active) ||
                !activeClassId ||
                (draftQuestions.length > 0 && !draftQuestions.every(isDraftComplete))
              }
              onClick={handlePublish}
            >
              {t("courseTest.open")}
            </Button>
            {status.availability?.is_active ? (
              <Button disabled={closeTest.isPending} onClick={() => closeTest.mutate(status.availability!.id)} variant="secondary">
                {t("courseTest.close")}
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
              <Title as="h3" variant="subsection">
                {t("courseTest.selectQuestions")}
              </Title>
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
                  placeholder={t("courseTest.searchPlaceholder")}
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
                  {t("courseTest.clear")}
                </Button>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {questionsQuery.isLoading ? (
                <Text as="p" tone="inherit" variant="inherit" className="p-8 text-center text-sm text-[var(--text-tertiary)]">
                  {t("courseTest.loadingQuestions")}
                </Text>
              ) : questionsQuery.error ? (
                <Text as="p" tone="inherit" variant="inherit" className="p-8 text-center text-sm text-[var(--status-danger)]">
                  {t("courseTest.loadError")}
                </Text>
              ) : filteredQuestions.length > 0 ? (
                filteredQuestions.map((question) => {
                  const isChecked = selectedIds.includes(question.id);
                  return (
                    <Label variant="inherit"
                      key={question.id}
                      className={`flex gap-3 rounded-lg border p-4 text-sm cursor-pointer transition ${
                        isChecked
                          ? "border-[var(--brand-primary)] bg-[var(--brand-muted)] text-[var(--brand-primary)]"
                          : "border-[var(--border-subtle)] hover:bg-[var(--bg-soft)] text-[var(--text-primary)]"
                      }`}
                    >
                      <Input
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
                        <Text as="p" tone="inherit" variant="inherit" className="font-medium">
                          {localize(question, "body_template")}
                        </Text>
                        <Text as="p" tone="inherit" variant="inherit" className="mt-1 text-xs text-[var(--text-tertiary)]">
                          {localize(question.lesson, "title")}
                        </Text>
                      </div>
                    </Label>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center text-[var(--text-tertiary)]">
                  <Text as="p" tone="inherit" variant="inherit" className="text-sm">
                    {t("courseTest.empty")}
                  </Text>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-[var(--border-subtle)] bg-[var(--bg-soft)] p-5">
              <div className="text-xs text-[var(--text-secondary)]">
                {t("courseTest.selectedCount", { count: String(selectedIds.length) })}
              </div>
              <Button onClick={handleCloseModal}>
                {t("courseTest.done")}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
}
