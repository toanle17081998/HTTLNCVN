"use client";

import Link from "next/link";
import { useState } from "react";
import { PageLayout } from "@/components/layout";
import { Button, Card, Input } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import {
  useFinishAttemptMutation,
  useQuizAttemptQuery,
  useSubmitAnswerMutation,
} from "@services/course";

type QuizAttemptPageProps = {
  attemptId: string;
};

export function QuizAttemptPage({ attemptId }: QuizAttemptPageProps) {
  const { t, locale } = useTranslation();
  const attemptQuery = useQuizAttemptQuery(attemptId);
  const submitAnswer = useSubmitAnswerMutation(attemptId);
  const finishAttempt = useFinishAttemptMutation(attemptId);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const attempt = attemptQuery.data;

  async function handleSubmitAnswer(snapshotId: string) {
    await submitAnswer.mutateAsync({
      snapshot_id: snapshotId,
      student_answer: answers[snapshotId] ?? "",
    });
  }

  async function handleFinish() {
    await finishAttempt.mutateAsync();
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
              const answered = snapshot.student_answer !== null;
              return (
                <Card className="p-5" key={snapshot.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase text-[var(--text-tertiary)]">
                      {t("quiz.question")} {index + 1}
                    </span>
                    {answered ? (
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

                  {answered ? (
                    <div className="mt-4 rounded-md bg-[var(--bg-base)] p-3 text-sm leading-6 text-[var(--text-secondary)]">
                      <p>Your answer: {snapshot.student_answer}</p>
                      {template?.explanation_template_vi || template?.explanation_template_en ? (
                        <p className="mt-2">
                          {template.explanation_template_vi || template.explanation_template_en}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <Input
                        aria-label={`Answer question ${index + 1}`}
                        onChange={(event) =>
                          setAnswers((current) => ({
                            ...current,
                            [snapshot.id]: event.target.value,
                          }))
                        }
                        placeholder="Type your answer"
                        value={answers[snapshot.id] ?? ""}
                      />
                      <Button
                        disabled={submitAnswer.isPending || !(answers[snapshot.id] ?? "").trim()}
                        onClick={() => handleSubmitAnswer(snapshot.id)}
                      >
                        Submit
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          <aside className="lg:sticky lg:top-24">
            <Card className="p-5">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Progress</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {attempt.snapshots.filter((snapshot) => snapshot.student_answer !== null).length} of{" "}
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
                  disabled={finishAttempt.isPending}
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
