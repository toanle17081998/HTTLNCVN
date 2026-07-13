"use client";

import { Select } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import type { StatusFilter, VisibilityFilter } from "./prayerJournalTypes";

type PrayerFilterBarProps = {
  onStatusChange: (status: StatusFilter) => void;
  onVisibilityChange: (visibility: VisibilityFilter) => void;
  statusFilter: StatusFilter;
  visibilityFilter: VisibilityFilter;
};

export function PrayerFilterBar({
  onStatusChange,
  onVisibilityChange,
  statusFilter,
  visibilityFilter,
}: PrayerFilterBarProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:grid-cols-2">
      <label className="grid gap-1.5">
        <span className="text-xs font-semibold uppercase text-[var(--text-tertiary)]">
          Status
        </span>
        <Select
          onChange={(event) => onStatusChange(event.target.value as StatusFilter)}
          value={statusFilter}
        >
          <option value="all">{t("prayer.filter.all")}</option>
          <option value="open">{t("prayer.filter.open")}</option>
          <option value="closed">{t("prayer.filter.closed")}</option>
        </Select>
      </label>

      <label className="grid gap-1.5">
        <span className="text-xs font-semibold uppercase text-[var(--text-tertiary)]">
          Visibility
        </span>
        <Select
          onChange={(event) => onVisibilityChange(event.target.value as VisibilityFilter)}
          value={visibilityFilter}
        >
          <option value="all">{t("prayer.filter.all")}</option>
          <option value="public">{t("prayer.filter.public")}</option>
          <option value="shared">{t("prayer.filter.shared")}</option>
          <option value="private">{t("prayer.filter.private")}</option>
        </Select>
      </label>
    </div>
  );
}
