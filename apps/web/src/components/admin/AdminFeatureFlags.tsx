"use client";

import { Card, Skeleton, Switch, Text, Title } from "@/components/ui";
import { useFeedback } from "@/providers/FeedbackProvider";
import { PERMISSIONS, useAuth } from "@/providers/AuthProvider";
import {
  useFeatureFlagsQuery,
  useUpdateFeatureFlagMutation,
  type FeatureFlagKey,
} from "@/hooks/featureFlags";

const modules: Array<{ description: string; key: FeatureFlagKey; label: string }> = [
  { description: "Public events, event details, and event management APIs.", key: "event", label: "Events" },
  { description: "Personal prayer journal pages and prayer management APIs.", key: "prayer-journal", label: "Prayer journal" },
];

export function AdminFeatureFlags() {
  const flagsQuery = useFeatureFlagsQuery();
  const updateMutation = useUpdateFeatureFlagMutation();
  const { toast } = useFeedback();
  const { can } = useAuth();

  async function updateFlag(key: FeatureFlagKey, enabled: boolean) {
    try {
      await updateMutation.mutateAsync({ enabled, key });
      toast({ title: `${modules.find((item) => item.key === key)?.label} ${enabled ? "enabled" : "disabled"}.`, variant: "success" });
    } catch {
      toast({ title: "Feature flag could not be updated.", variant: "error" });
    }
  }

  if (!can(PERMISSIONS.manageSystemSettings)) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <Title as="h1" variant="pagePlain">Module settings</Title>
        <Text className="mt-2" variant="small">Enable or disable modules for all users.</Text>
      </div>

      <Card className="divide-y divide-[var(--border-subtle)]">
        {modules.map((module) => (
          <div className="flex items-center justify-between gap-6 p-5" key={module.key}>
            <div>
              <Title as="h2" variant="labelStrong">{module.label}</Title>
              <Text className="mt-1" variant="small">{module.description}</Text>
            </div>
            {flagsQuery.isLoading ? (
              <Skeleton className="h-5 w-9" />
            ) : (
              <Switch
                aria-label={`Toggle ${module.label}`}
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
