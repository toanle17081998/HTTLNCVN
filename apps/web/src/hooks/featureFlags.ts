import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { featureFlagsApi, type FeatureFlagKey } from "@/api/featureFlags";

const featureFlagsKey = ["feature-flags"] as const;

export type { FeatureFlagKey } from "@/api/featureFlags";

export function useFeatureFlagsQuery() {
  return useQuery({
    queryFn: featureFlagsApi.findAll,
    queryKey: featureFlagsKey,
    staleTime: 30_000,
  });
}

export function useUpdateFeatureFlagMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ enabled, key }: { enabled: boolean; key: FeatureFlagKey }) =>
      featureFlagsApi.update(key, enabled),
    onSuccess: (flags) => queryClient.setQueryData(featureFlagsKey, flags),
  });
}
