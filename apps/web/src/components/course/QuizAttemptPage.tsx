"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PageLayout } from "@/components/layout";
import { Button, Card, Input, cn } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import {
  useFinishAttemptMutation,
  useQuizAttemptQuery,
  useSubmitAnswerMutation,
} from "@/services/course";

type QuizAttemptPageProps = {
  attemptId: string;
};

export function QuizAttemptPage({ attemptId }: QuizAttemptPageProps) {
  const { t, locale } = useTranslation();
  const attemptQuery = useQuizAttemptQuery(attemptId);
  const submitAnswer = useSubmitAnswerMutation(attemptId);
  const finishAttempt = useFinishAttemptMutation(attemptId);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const answersRef = useRef(answers);
  const timeoutSubmittedRef = useRef(false);
  const attempt = attemptQuery.data;

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    if (!attempt?.deadline_at || attempt.is_completed) {
      setRemainingSeconds(null);
      return;
    }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((new Date(attempt.deadline_at!).getTime() - Date.now()) / 1000));
      setRemainingSeconds(remaining);
      if (remaining === 0 && !timeoutSubmittedRef.current) {
        timeoutSubmittedRef.current = true;
        const batchAnswers = Object.fromEntries(
          attempt.snapshots.map((snapshot) => [
            snapshot.id,
            answersRef.current[snapshot.id] ?? snapshot.student_answer ?? "",
          ]),
        );
        finishAttempt.mutate(batchAnswers);
      }
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [attempt?.deadline_at, attempt?.id, attempt?.is_completed]);

  function saveAnswer(snapshotId: string, value: string) {
    setAnswers((current) => ({ ...current, [snapshotId]: value }));
    submitAnswer.mutate({ snapshot_id: snapshotId, student_answer: value });
  }

  async function handleFinish() {
    const batchAnswers: Record<string, string> = {};
    if (attempt) {
      for (const snapshot of attempt.snapshots) {
        const answer = answers[snapshot.id] !== undefined ? answers[snapshot.id] : (snapshot.student_answer || "");
        batchAnswers[snapshot.id] = answer;
      }
    }
    await finishAttempt.mutateAsync(batchAnswers);
  }

  function toggleMultipleChoice(snapshotId: string, choice: string, defaultValue: string) {
    const currentVal = answers[snapshotId] !== undefined ? answers[snapshotId] : defaultValue;
    const currentList = currentVal ? currentVal.split(",").map(s => s.trim()) : [];
    const nextList = currentList.includes(choice)
      ? currentList.filter(item => item !== choice)
      : [...currentList, choice];
    saveAnswer(snapshotId, nextList.sort().join(", "));
  }

  return (
    <PageLayout
      description={t("quiz.timeLimit")}
      eyebrow={t("quiz.title")}
      title={locale === "vi" ? (attempt?.quiz?.title_vi || attempt?.quiz?.title_en || "Làm bài trắc nghiệm") : (attempt?.quiz?.title_en || attempt?.quiz?.title_vi || "Quiz attempt")}
    >
      {attemptQuery.isLoading ? (
        <Card className="p-6 text-sm text-[var(--text-secondary)]">{t("common.ready")}...</Card>
      ) : null}

      {attemptQuery.error ? (
        <Card className="p-6 text-sm font-medium text-[var(--status-danger)]">
          {attemptQuery.error instanceof Error ? attemptQuery.error.message : t("page.course.description")}
        </Card>
      ) : null}

      {attempt ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <div className="grid min-w-0 gap-4">
            {attempt.snapshots.map((snapshot, index) => {
              const template = snapshot.template;
              const completed = attempt.is_completed;
              const showFeedback = completed && !attempt.is_test;
              const type = template?.template_type;

              // Get choices pre-calculated by the server
              const choices = template?.choices || [];
              const isMulti = type === "multiple_choices" && template?.allows_multiple;

              // Get current selection value
              const currentVal = answers[snapshot.id] !== undefined ? answers[snapshot.id] : (snapshot.student_answer || "");

              return (
                <Card className="p-5" key={snapshot.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase text-[var(--text-tertiary)]">
                      {t("quiz.question")} {index + 1}
                    </span>
                    {showFeedback ? (
                      <span
                        className={[
                          "rounded-md px-2.5 py-1 text-xs font-semibold",
                          snapshot.is_correct
                            ? "bg-[color-mix(in_srgb,var(--status-success)_14%,transparent)] text-[var(--status-success)]"
                            : "bg-[color-mix(in_srgb,var(--status-danger)_14%,transparent)] text-[var(--status-danger)]",
                        ].join(" ")}
                      >
                        {snapshot.is_correct ? t("common.ready") : t("common.cancel")}
                      </span>
                    ) : null}
                  </div>

                  <h2 className="mt-3 text-base font-semibold text-[var(--text-primary)]">
                    {locale === "vi" ? (template?.body_template_vi || template?.body_template_en || "Câu hỏi") : (template?.body_template_en || template?.body_template_vi || "Question")}
                  </h2>

                  {completed ? (
                    <div className="mt-4 rounded-md bg-[var(--bg-base)] p-4 text-sm leading-6 text-[var(--text-secondary)]">
                      <p className="font-semibold text-[var(--text-primary)]">
                        Your answer: <span className="font-mono bg-[var(--brand-muted)] px-2 py-0.5 rounded text-[var(--brand-primary)]">{snapshot.student_answer}</span>
                      </p>
                      {!attempt.is_test && snapshot.student_answer?.toLowerCase() !== template?.answer_formula?.toLowerCase() && (
                        <p className="mt-1 font-semibold text-[var(--status-success)]">
                          Correct answer: <span className="font-mono bg-[color-mix(in_srgb,var(--status-success)_10%,transparent)] px-2 py-0.5 rounded">{template?.answer_formula}</span>
                        </p>
                      )}
                      {!attempt.is_test && (template?.explanation_template_vi || template?.explanation_template_en) ? (
                        <div className="mt-3 border-t border-[var(--border-subtle)] pt-3 text-xs">
                          <p className="font-bold text-[var(--text-primary)]">Explanation:</p>
                          <p className="mt-1 italic">
                            {locale === "vi" ? (template.explanation_template_vi || template.explanation_template_en) : (template.explanation_template_en || template.explanation_template_vi)}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-4">
                      {type === "multiple_choices" || type === "theoretical_question" ? (
                        isMulti ? (
                          <div className="grid gap-2">
                            {choices.map((choice) => {
                              const isSelected = currentVal
                                .split(",")
                                .map((s: string) => s.trim())
                                .includes(choice);
                              return (
                                <button
                                  key={choice}
                                  type="button"
                                  onClick={() => toggleMultipleChoice(snapshot.id, choice, snapshot.student_answer || "")}
                                  className={cn(
                                    "w-full text-left p-3 rounded-xl border text-sm transition font-medium flex items-center gap-3",
                                    isSelected
                                      ? "border-[var(--brand-primary)] bg-[var(--brand-muted)] text-[var(--brand-primary)]"
                                      : "border-[var(--border-subtle)] hover:bg-[var(--bg-base)] text-[var(--text-primary)]"
                                  )}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    readOnly
                                    className="h-4 w-4 rounded text-[var(--brand-primary)] border-[var(--border-strong)]"
                                  />
                                  <span>{choice}</span>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="grid gap-2">
                            {choices.map((choice) => (
                              <button
                                key={choice}
                                type="button"
                                onClick={() => {
                                  saveAnswer(snapshot.id, choice);
                                }}
                                className={cn(
                                  "w-full text-left p-3 rounded-xl border text-sm transition font-medium",
                                  currentVal === choice
                                    ? "border-[var(--brand-primary)] bg-[var(--brand-muted)] text-[var(--brand-primary)]"
                                    : "border-[var(--border-subtle)] hover:bg-[var(--bg-base)] text-[var(--text-primary)]"
                                )}
                              >
                                {choice}
                              </button>
                            ))}
                          </div>
                        )
                      ) : type === "true_false" ? (
                        <div className="grid grid-cols-2 gap-3">
                          {(choices.length ? choices : ["true", "false"]).map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => {
                                saveAnswer(snapshot.id, val);
                              }}
                              className={cn(
                                "p-4 rounded-xl border text-center font-bold text-base transition capitalize",
                                currentVal === val
                                  ? "border-[var(--brand-primary)] bg-[var(--brand-muted)] text-[var(--brand-primary)]"
                                  : "border-[var(--border-subtle)] hover:bg-[var(--bg-base)] text-[var(--text-primary)]"
                              )}
                            >
                              {val === "true" ? (locale === "vi" ? "Đúng" : "True") : (locale === "vi" ? "Sai" : "False")}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <Input
                            aria-label={`Answer question ${index + 1}`}
                            onChange={(event) => saveAnswer(snapshot.id, event.target.value)}
                            placeholder="Type your answer"
                            value={currentVal}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          <aside className="lg:sticky lg:top-24">
            <Card className="p-5">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Progress</h2>
              {remainingSeconds !== null ? (
                <p className="mt-2 rounded-md bg-[var(--brand-muted)] p-3 text-center text-lg font-bold text-[var(--brand-primary)]">
                  {String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:{String(remainingSeconds % 60).padStart(2, "0")}
                </p>
              ) : null}
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {
                  attempt.snapshots.filter((snapshot) => {
                    if (snapshot.student_answer !== null) return true;
                    const val = answers[snapshot.id];
                    return val !== undefined && val.trim() !== "";
                  }).length
                } of{" "}
                {attempt.snapshots.length} answered
              </p>
              {attempt.is_completed ? (
                <div className="mt-4 rounded-md bg-[var(--brand-muted)] p-3">
                  <p className="text-sm font-semibold text-[var(--brand-primary)]">
                    Score: {Math.round(attempt.total_score ?? 0)}%
                  </p>
                </div>
              ) : (
                <Button
                  className="mt-4 w-full"
                  disabled={finishAttempt.isPending || submitAnswer.isPending || remainingSeconds === 0}
                  onClick={handleFinish}
                >
                  {t("quiz.status.completed")}
                </Button>
              )}
              <Link
                className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--brand-muted)] focus:outline-none focus:ring-4 focus:ring-[var(--input-focus-ring)]"
                href="/course"
              >
                {t("nav.course.label")}
              </Link>
            </Card>
          </aside>
        </div>
      ) : null}
    </PageLayout>
  );
}
