"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PageLayout } from "@/components/layout";
import { Button, Card, Input, cn } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import { useFeedback } from "@/providers/FeedbackProvider";
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
  const { confirm } = useFeedback();
  const attemptQuery = useQuizAttemptQuery(attemptId);
  const submitAnswer = useSubmitAnswerMutation(attemptId);
  const finishAttempt = useFinishAttemptMutation(attemptId);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
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
        finishAttempt.mutate(batchAnswers, {
          onSuccess: () => setShowResultModal(true),
        });
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
    if (!attempt) return;

    let unansweredCount = 0;
    const batchAnswers: Record<string, string> = {};

    for (const snapshot of attempt.snapshots) {
      const answer = answers[snapshot.id] !== undefined ? answers[snapshot.id] : (snapshot.student_answer || "");
      batchAnswers[snapshot.id] = answer;
      if (!answer || !answer.trim()) {
        unansweredCount++;
      }
    }

    if (unansweredCount > 0) {
      const ok = await confirm({
        variant: "warning",
        title: t("quiz.confirmSubmitTitle"),
        description: t("quiz.confirmSubmitUnansweredDesc", { count: String(unansweredCount) }),
        confirmLabel: t("quiz.status.completed"),
        cancelLabel: t("common.cancel"),
      });
      if (!ok) return;
    } else {
      const ok = await confirm({
        variant: "info",
        title: t("quiz.confirmSubmitTitle"),
        description: t("quiz.confirmSubmitDesc"),
        confirmLabel: t("quiz.status.completed"),
        cancelLabel: t("common.cancel"),
      });
      if (!ok) return;
    }

    await finishAttempt.mutateAsync(batchAnswers);
    setShowResultModal(true);
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
      eyebrow={attempt?.is_test ? t("quiz.title") : t("quiz.practiceTitle")}
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
              const type = template?.template_type;

              // Get choices pre-calculated by the server
              const choices = template?.choices || [];
              const isMulti = (type === "multiple_choices" || type === "multi_choice") && template?.allows_multiple;
              const isChoiceQuestion = choices.length > 0 || type === "multiple_choices" || type === "multi_choice" || type === "single_choice" || type === "theoretical_question";
              const isTrueFalse = !isChoiceQuestion && (type === "true_false" || type === "true_or_false");

              // Get current selection value
              const currentVal = answers[snapshot.id] !== undefined ? answers[snapshot.id] : (snapshot.student_answer || "");
              const showFeedback = completed;

              return (
                <Card
                  className={cn(
                    "p-5 transition-all",
                    completed && snapshot.is_correct === false && "border-2 border-[var(--status-danger)] bg-[color-mix(in_srgb,var(--status-danger)_3%,transparent)]",
                    completed && snapshot.is_correct === true && "border-2 border-[var(--status-success)] bg-[color-mix(in_srgb,var(--status-success)_3%,transparent)]"
                  )}
                  key={snapshot.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase text-[var(--text-tertiary)]">
                      {t("quiz.question")} {index + 1}
                    </span>
                    {showFeedback ? (
                      <span
                        className={cn(
                          "rounded-lg px-3 py-1 text-xs font-bold flex items-center gap-1.5",
                          snapshot.is_correct
                            ? "bg-[color-mix(in_srgb,var(--status-success)_15%,transparent)] text-[var(--status-success)]"
                            : "bg-[color-mix(in_srgb,var(--status-danger)_15%,transparent)] text-[var(--status-danger)]"
                        )}
                      >
                        {snapshot.is_correct ? `✓ ${t("quiz.correct")}` : `✕ ${t("quiz.incorrect")}`}
                      </span>
                    ) : null}
                  </div>

                  <h2 className="mt-3 text-base font-semibold text-[var(--text-primary)]">
                    {locale === "vi" ? (template?.body_template_vi || template?.body_template_en || t("quiz.question")) : (template?.body_template_en || template?.body_template_vi || t("quiz.question"))}
                  </h2>

                  {completed ? (
                    <div className="mt-4 space-y-3 text-sm">
                      <div
                        className={cn(
                          "p-3.5 rounded-xl border text-sm font-medium flex items-start justify-between gap-3",
                          snapshot.is_correct
                            ? "border-[var(--status-success)] bg-[color-mix(in_srgb,var(--status-success)_10%,transparent)] text-[var(--status-success)]"
                            : "border-[var(--status-danger)] bg-[color-mix(in_srgb,var(--status-danger)_10%,transparent)] text-[var(--status-danger)]"
                        )}
                      >
                        <div>
                          <span className="text-xs uppercase tracking-wider font-bold block opacity-80">{t("quiz.yourAnswer")}:</span>
                          <span className="font-semibold text-base mt-0.5 block">
                            {(() => {
                              const ans = snapshot.student_answer;
                              if (!ans || !ans.trim()) return t("quiz.noAnswer");
                              const config = template?.logic_config as { answers?: Array<{ text?: string; value?: string }> };
                              if (Array.isArray(config?.answers)) {
                                const matched = config.answers.find((a) => a.value === ans);
                                if (matched?.text) return matched.text;
                              }
                              return ans;
                            })()}
                          </span>
                        </div>
                        <span className="text-lg font-extrabold">{snapshot.is_correct ? "✓" : "✕"}</span>
                      </div>

                      {!snapshot.is_correct && template?.answer_formula && (
                        <div className="p-3.5 rounded-xl border border-[var(--status-success)] bg-[color-mix(in_srgb,var(--status-success)_10%,transparent)] text-[var(--status-success)] font-medium">
                          <span className="text-xs uppercase tracking-wider font-bold block opacity-80">{t("quiz.correctAnswer")}:</span>
                          <span className="font-semibold text-base mt-0.5 block">
                            {(() => {
                              const ans = template.answer_formula;
                              const config = template?.logic_config as { answers?: Array<{ text?: string; value?: string }> };
                              if (Array.isArray(config?.answers)) {
                                const matched = config.answers.find((a) => a.value === ans);
                                if (matched?.text) return matched.text;
                              }
                              return ans;
                            })()}
                          </span>
                        </div>
                      )}

                      {(template?.explanation_template_vi || template?.explanation_template_en) ? (
                        <div className="mt-3 border-t border-[var(--border-subtle)] pt-3 text-xs text-[var(--text-secondary)]">
                          <span className="font-bold text-[var(--text-primary)] block">{t("quiz.explanation")}:</span>
                          <p className="mt-1 italic leading-relaxed">
                            {locale === "vi" ? (template.explanation_template_vi || template.explanation_template_en) : (template.explanation_template_en || template.explanation_template_vi)}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-4">
                      {isChoiceQuestion ? (
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
                      ) : isTrueFalse ? (
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
                }{" "}
                of {attempt.snapshots.length} answered
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

      {showResultModal && attempt ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-[var(--bg-surface)] p-6 shadow-2xl border border-[var(--border-subtle)] text-center space-y-5">
            {attempt.total_score !== null && attempt.total_score >= (attempt.quiz?.passing_score ?? 70) ? (
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--status-success)_15%,transparent)] text-4xl text-[var(--status-success)]">
                🎉
              </div>
            ) : (
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--status-danger)_15%,transparent)] text-4xl text-[var(--status-danger)]">
                ❌
              </div>
            )}

            <div>
              <span
                className={cn(
                  "inline-block rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider mb-2",
                  attempt.total_score !== null && attempt.total_score >= (attempt.quiz?.passing_score ?? 70)
                    ? "bg-[color-mix(in_srgb,var(--status-success)_15%,transparent)] text-[var(--status-success)]"
                    : "bg-[color-mix(in_srgb,var(--status-danger)_15%,transparent)] text-[var(--status-danger)]"
                )}
              >
                {attempt.total_score !== null && attempt.total_score >= (attempt.quiz?.passing_score ?? 70)
                  ? t("quiz.modal.passed")
                  : t("quiz.modal.failed")}
              </span>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">
                {locale === "vi" ? (attempt.quiz?.title_vi || attempt.quiz?.title_en || t("quiz.title")) : (attempt.quiz?.title_en || attempt.quiz?.title_vi || t("quiz.title"))}
              </h3>
            </div>

            <div className="rounded-xl bg-[var(--bg-base)] p-4 space-y-1">
              <p className="text-4xl font-black text-[var(--brand-primary)]">
                {Math.round(attempt.total_score ?? 0)}%
              </p>
              <p className="text-xs font-semibold text-[var(--text-tertiary)]">
                ({attempt.snapshots.filter((s) => s.is_correct).length}/{attempt.snapshots.length}) {t("quiz.modal.correctCount")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                className="flex items-center justify-center rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--brand-muted)]"
                href="/course"
              >
                {t("quiz.modal.backToCourse")}
              </Link>
              <Button
                className="w-full rounded-xl"
                onClick={() => setShowResultModal(false)}
              >
                {t("quiz.modal.seeResult")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </PageLayout>
  );
}
