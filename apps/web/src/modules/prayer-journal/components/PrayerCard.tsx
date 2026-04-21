"use client";

import { CheckCircle2, Edit3, Tag } from "lucide-react";
import { useTranslation } from "@/providers/I18nProvider";
import type { Prayer, PrayerCategory } from "@/mockData";
import { StatusBadge, VisibilityBadge } from "./PrayerBadges";
import {
  formatRelativeDate,
  getCategoryName,
  getMemberName,
} from "./prayerJournalTypes";

type PrayerCardProps = {
  prayer: Prayer;
  categories: PrayerCategory[];
  canEdit: boolean;
  onView: (prayer: Prayer) => void;
  onEdit: (prayer: Prayer) => void;
};

export function PrayerCard({
  prayer,
  categories,
  canEdit,
  onView,
  onEdit,
}: PrayerCardProps) {
  const { t } = useTranslation();

  return (
    <div
      className="group relative cursor-pointer rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 transition-shadow hover:shadow-md"
      onClick={() => onView(prayer)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <VisibilityBadge visibility={prayer.visibility} />
            {prayer.category_id !== null && (
              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--bg-base)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                <Tag aria-hidden="true" className="h-3 w-3" />
                {getCategoryName(prayer.category_id, categories)}
              </span>
            )}
          </div>
          <h3 className="mt-2 text-base font-semibold text-[var(--text-primary)] transition-colors group-hover:text-[var(--brand-primary)]">
            {prayer.title ?? (
              <span className="italic text-[var(--text-secondary)]">
                {t("prayer.form.titlePlaceholder")}
              </span>
            )}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-[var(--text-secondary)]">
            {prayer.content}
          </p>
        </div>

        {canEdit ? (
          <div className="relative z-10 flex shrink-0 gap-1">
            <button
              aria-label="Edit prayer"
              className="rounded-md p-2 text-[var(--text-secondary)] hover:bg-[var(--brand-muted)] hover:text-[var(--brand-primary)]"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(prayer);
              }}
              type="button"
            >
              <Edit3 aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>

      {/* Footer row */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <StatusBadge status={prayer.status} />
        <span className="text-xs text-[var(--text-tertiary)]">
          {getMemberName(prayer.created_by)} · {formatRelativeDate(prayer.created_at)}
        </span>
      </div>

      {/* Answered reason */}
      {prayer.status === "closed" && prayer.close_reason && (
        <div className="mt-3 flex items-start gap-2 rounded-md bg-[var(--bg-base)] px-3 py-2 text-xs text-[var(--text-secondary)]">
          <CheckCircle2
            aria-hidden="true"
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--brand-primary)]"
          />
          {prayer.close_reason}
        </div>
      )}
    </div>
  );
}
