"use client";

import { BookOpen, CheckCircle2, Globe, Lock, Users } from "lucide-react";
import { cn } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import type { PrayerStatus, PrayerVisibility } from "@/hooks/prayer-journal";

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

export function StatusBadge({ status, iconOnly = false }: { status: PrayerStatus; iconOnly?: boolean }) {
  const { t } = useTranslation();
  const label = t(status === "open" ? "prayer.status.open" : "prayer.status.closed");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full py-0.5 text-xs font-semibold",
        iconOnly ? "px-1.5" : "px-2.5",
        status === "open"
          ? "bg-[var(--brand-muted)] text-[var(--brand-primary)]"
          : "bg-[var(--bg-base)] text-[var(--text-secondary)]",
      )}
      title={iconOnly ? label : undefined}
    >
      {status === "open" ? (
        <BookOpen aria-hidden="true" className="h-3 w-3" />
      ) : (
        <CheckCircle2 aria-hidden="true" className="h-3 w-3" />
      )}
      <span className={iconOnly ? "sr-only" : undefined}>{label}</span>
    </span>
  );
}

// ─── VisibilityBadge ──────────────────────────────────────────────────────────

export function VisibilityBadge({ visibility, iconOnly = false }: { visibility: PrayerVisibility; iconOnly?: boolean }) {
  const { t } = useTranslation();
  const labelKey =
    visibility === "public"
      ? "prayer.form.visibility.public"
      : visibility === "shared"
        ? "prayer.form.visibility.shared"
        : "prayer.form.visibility.private";
  const label = t(labelKey);

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase text-[var(--text-secondary)]" title={iconOnly ? label : undefined}>
      <VisibilityIcon className="h-3 w-3" visibility={visibility} />
      <span className={iconOnly ? "sr-only" : undefined}>{label}</span>
    </span>
  );
}
