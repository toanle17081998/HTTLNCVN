"use client";

import { Card, Skeleton, Switch, Text, Title } from "@/components/ui";
import { useFeedback } from "@/providers/FeedbackProvider";
import { PERMISSIONS, useAuth } from "@/providers/AuthProvider";
import { useTranslation } from "@/providers/I18nProvider";
import type { TranslationKey } from "@/lib/i18n";
import {
  useFeatureFlagsQuery,
  useUpdateFeatureFlagMutation,
  type FeatureFlagKey,
} from "@/hooks/featureFlags";

const modules: Array<{ descKey: TranslationKey; key: FeatureFlagKey; labelKey: TranslationKey }> = [
  { descKey: "admin.flags.eventDesc", key: "event", labelKey: "admin.flags.eventLabel" },
  { descKey: "admin.flags.prayerDesc", key: "prayer-journal", labelKey: "admin.flags.prayerLabel" },
];

export function AdminFeatureFlags() {
  const { t } = useTranslation();
  const flagsQuery = useFeatureFlagsQuery();
  const updateMutation = useUpdateFeatureFlagMutation();
  const { toast } = useFeedback();
  const { can } = useAuth();

  async function updateFlag(key: FeatureFlagKey, enabled: boolean) {
    const mod = modules.find((item) => item.key === key);
    const label = mod ? t(mod.labelKey) : key;
    try {
      await updateMutation.mutateAsync({ enabled, key });
      toast({
        title: t(enabled ? "admin.flags.enabledToast" : "admin.flags.disabledToast", { label }),
        variant: "success",
      });
    } catch {
      toast({ title: t("admin.flags.updateError"), variant: "error" });
    }
  }

  if (!can(PERMISSIONS.manageSystemSettings)) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <Title as="h1" variant="pagePlain">{t("admin.flags.title")}</Title>
        <Text className="mt-2" variant="small">{t("admin.flags.description")}</Text>
      </div>

      <Card className="divide-y divide-[var(--border-subtle)]">
        {modules.map((module) => (
          <div className="flex items-center justify-between gap-6 p-5" key={module.key}>
            <div>
              <Title as="h2" variant="labelStrong">{t(module.labelKey)}</Title>
              <Text className="mt-1" variant="small">{t(module.descKey)}</Text>
            </div>
            {flagsQuery.isLoading ? (
              <Skeleton className="h-5 w-9" />
            ) : (
              <Switch
                aria-label={t(module.labelKey)}
                checked={flagsQuery.data?.[module.key] ?? true}
                disabled={updateMutation.isPending}
                onCheckedChange={(enabled) => void updateFlag(module.key, enabled)}
              />
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}
