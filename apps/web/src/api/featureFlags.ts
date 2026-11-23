import { apiRequest } from "./client";

export type FeatureFlagKey = "event" | "prayer-journal";
export type FeatureFlags = Record<FeatureFlagKey, boolean>;

export const featureFlagsApi = {
  findAll: () => apiRequest<FeatureFlags>("/feature-flags"),
  update: (key: FeatureFlagKey, enabled: boolean) =>
    apiRequest<FeatureFlags>(`/feature-flags/${key}`, {
      body: JSON.stringify({ enabled }),
      method: "PATCH",
    }),
};
