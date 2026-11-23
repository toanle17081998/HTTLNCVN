"use client";

import type { ReactNode } from "react";

import { ErrorDisplay } from "@/components/ErrorDisplay";
import { SkeletonCard } from "@/components/ui";
import { useFeatureFlagsQuery, type FeatureFlagKey } from "@/hooks/featureFlags";

export function FeatureFlagGate({ children, feature }: { children: ReactNode; feature: FeatureFlagKey }) {
  const flagsQuery = useFeatureFlagsQuery();

  if (flagsQuery.isLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-24"><SkeletonCard /></div>;
  }

  if (flagsQuery.data?.[feature] === false) {
    return (
      <ErrorDisplay
        message="This module has been disabled by the system administrator."
        statusCode={404}
        title="Module unavailable"
      />
    );
  }

  return children;
}
