"use client";

import { Text, Title, Button, Card } from "@/components/ui";
import { PageLayout } from "@/components/layout";
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
            <Button variant="primary">{t("action.create")}</Button>
          </>
        )
      }
      description={t(descriptionKey)}
      eyebrow={t(eyebrowKey)}
      title={t(titleKey)}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <Card className="p-6">
          <Title as="h2" variant="subsection">
            {t("placeholder.workspace")}
          </Title>
          <Text as="p" tone="inherit" variant="inherit" className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            {t("placeholder.workspaceDescription")}
          </Text>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {placeholderStages.map((item) => (
              <div
                className="rounded-md border border-[var(--border-subtle)] px-4 py-3"
                key={item}
              >
                <Text as="p" tone="inherit" variant="inherit" className="text-sm font-semibold text-[var(--text-primary)]">
                  {t(item)}
                </Text>
                <Text className="mt-1" variant="small">
                  {t("common.ready")}
                </Text>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <Title as="h2" variant="subsection">
            {t("placeholder.quickActions")}
          </Title>
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
