"use client";

import { CheckCircle2, Circle, Edit3, Eye, Tag, Users } from "lucide-react";
import { Button, cn } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import type { Prayer } from "@services/prayer-journal";
import { StatusBadge, VisibilityBadge } from "./PrayerBadges";
import { formatPrayerDate } from "./prayerJournalTypes";

type PrayerCardProps = {
  canEdit: boolean;
  prayer: Prayer;
  onEdit: (prayer: Prayer) => void;
  onToggleStatus: (prayer: Prayer) => void;
  onView: (prayer: Prayer) => void;
};

export function PrayerCard({
  canEdit,
  prayer,
  onEdit,
  onToggleStatus,
  onView,
}: PrayerCardProps) {
  const { t } = useTranslation();
  const isClosed = prayer.status === "closed";

  return (
    <div
      className={cn(
        "grid gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-sm transition-colors",
        isClosed ? "opacity-80" : "",
      )}
    >
      <div className="flex items-start gap-3">
        <button
          aria-label={isClosed ? t("prayer.action.reopen") : t("prayer.action.close")}
          className={cn(
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border-strong)] text-[var(--brand-primary)] transition",
            canEdit ? "hover:bg-[var(--brand-muted)]" : "cursor-default opacity-50",
          )}
          disabled={!canEdit}
          onClick={() => onToggleStatus(prayer)}
          type="button"
        >
          {isClosed ? (
            <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
          ) : (
            <Circle aria-hidden="true" className="h-5 w-5" />
          )}
        </button>

        <button
          className="min-w-0 flex-1 text-left"
          onClick={() => onView(prayer)}
          type="button"
        >
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={prayer.status} />
            <VisibilityBadge visibility={prayer.visibility} />
            {prayer.category ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-base)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                <Tag aria-hidden="true" className="h-3 w-3" />
                {prayer.category.name}
              </span>
            ) : null}
            {prayer.shared_with.length > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-base)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                <Users aria-hidden="true" className="h-3 w-3" />
                {prayer.shared_with.length}
              </span>
            ) : null}
          </div>

          <h3
            className={cn(
              "mt-3 text-base font-semibold text-[var(--text-primary)]",
              isClosed ? "line-through text-[var(--text-secondary)]" : "",
            )}
          >
            {prayer.title ?? t("prayer.form.titlePlaceholder")}
          </h3>
          <p
            className={cn(
              "mt-1 line-clamp-2 text-sm leading-6 text-[var(--text-secondary)]",
              isClosed ? "text-[var(--text-tertiary)]" : "",
            )}
          >
            {prayer.content}
          </p>
          <p className="mt-3 text-xs text-[var(--text-tertiary)]">
            {prayer.created_by_name} · {formatPrayerDate(prayer.created_at)}
          </p>
          {prayer.close_reason ? (
            <p className="mt-2 rounded-xl bg-[var(--bg-base)] px-3 py-2 text-xs text-[var(--text-secondary)]">
              {prayer.close_reason}
            </p>
          ) : null}
        </button>

        <div className="flex shrink-0 items-center gap-2">
          <Button onClick={() => onView(prayer)} size="sm" variant="ghost">
            <Eye aria-hidden="true" className="mr-2 h-4 w-4" />
            {t("prayer.config.title.view")}
          </Button>
          {canEdit ? (
            <Button onClick={() => onEdit(prayer)} size="sm" variant="secondary">
              <Edit3 aria-hidden="true" className="mr-2 h-4 w-4" />
              {t("prayer.config.title.edit")}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
