"use client";

import { PageLayout } from "@/components/layout";
import { Button, Card } from "@/components/ui";
import type { TranslationKey } from "@/lib/i18n";
import { useTranslation } from "@/providers/I18nProvider";
import type { ReactNode } from "react";

type RoutePlaceholderProps = {
  eyebrowKey: TranslationKey;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  actions?: ReactNode;
};

const placeholderStages = [
  "placeholder.planning",
  "placeholder.content",
  "placeholder.review",
] satisfies TranslationKey[];

export function RoutePlaceholder({
  actions,
  eyebrowKey,
  titleKey,
  descriptionKey,
}: RoutePlaceholderProps) {
  const { t } = useTranslation();

  return (
    <PageLayout
      actions={
        actions ?? (
          <>
            <Button variant="secondary">{t("action.viewDraft")}</Button>
            <Button>{t("action.create")}</Button>
          </>
        )
      }
      description={t(descriptionKey)}
      eyebrow={t(eyebrowKey)}
      title={t(titleKey)}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {t("placeholder.workspace")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            {t("placeholder.workspaceDescription")}
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {placeholderStages.map((item) => (
              <div
                className="rounded-md border border-[var(--border-subtle)] px-4 py-3"
                key={item}
              >
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {t(item)}
                </p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {t("common.ready")}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {t("placeholder.quickActions")}
          </h2>
          <div className="mt-4 grid gap-2">
            <Button className="w-full" variant="secondary">
              {t("action.importData")}
            </Button>
            <Button className="w-full" variant="ghost">
              {t("action.manageSettings")}
            </Button>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
