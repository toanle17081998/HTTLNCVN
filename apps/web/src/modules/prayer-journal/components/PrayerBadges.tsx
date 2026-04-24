"use client";

import { BookOpen, CheckCircle2, Globe, Lock, Users } from "lucide-react";
import { cn } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import type { PrayerStatus, PrayerVisibility } from "@services/prayer-journal";

// ─── VisibilityIcon ───────────────────────────────────────────────────────────

type VisibilityIconProps = {
  visibility: PrayerVisibility;
  className?: string;
};

export function VisibilityIcon({ visibility, className }: VisibilityIconProps) {
  if (visibility === "public") return <Globe aria-hidden="true" className={className} />;
  if (visibility === "shared") return <Users aria-hidden="true" className={className} />;
  return <Lock aria-hidden="true" className={className} />;
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: PrayerStatus }) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        status === "open"
          ? "bg-[var(--brand-muted)] text-[var(--brand-primary)]"
          : "bg-[var(--bg-base)] text-[var(--text-secondary)]",
      )}
    >
      {status === "open" ? (
        <BookOpen aria-hidden="true" className="h-3 w-3" />
      ) : (
        <CheckCircle2 aria-hidden="true" className="h-3 w-3" />
      )}
      {status === "open" ? t("prayer.status.open") : t("prayer.status.closed")}
    </span>
  );
}

// ─── VisibilityBadge ──────────────────────────────────────────────────────────

export function VisibilityBadge({ visibility }: { visibility: PrayerVisibility }) {
  const { t } = useTranslation();
  const labelKey =
    visibility === "public"
      ? "prayer.form.visibility.public"
      : visibility === "shared"
        ? "prayer.form.visibility.shared"
        : "prayer.form.visibility.private";

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase text-[var(--text-secondary)]">
      <VisibilityIcon className="h-3 w-3" visibility={visibility} />
      {t(labelKey)}
    </span>
  );
}
