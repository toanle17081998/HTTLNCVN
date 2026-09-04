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
    <div className="flex flex-1 items-end gap-2 sm:flex-none">
      <div className="flex flex-col gap-1 min-w-0 flex-1 sm:w-36 sm:flex-none">
        <label className="text-xs font-semibold text-[var(--text-secondary)]" htmlFor="prayer-status-filter">
          {t("common.status")}
        </label>
        <Select
          id="prayer-status-filter"
          aria-label={t("common.status")}
          className="h-9 text-sm"
          onChange={(event) => onStatusChange(event.target.value as StatusFilter)}
          value={statusFilter}
        >
          <option value="all">{t("prayer.filter.all")}</option>
          <option value="open">{t("prayer.filter.open")}</option>
          <option value="closed">{t("prayer.filter.closed")}</option>
        </Select>
      </div>

      <div className="flex flex-col gap-1 min-w-0 flex-1 sm:w-36 sm:flex-none">
        <label className="text-xs font-semibold text-[var(--text-secondary)]" htmlFor="prayer-visibility-filter">
          {t("common.visibility")}
        </label>
        <Select
          id="prayer-visibility-filter"
          aria-label={t("common.visibility")}
          className="h-9 text-sm"
          onChange={(event) => onVisibilityChange(event.target.value as VisibilityFilter)}
          value={visibilityFilter}
        >
          <option value="all">{t("prayer.filter.all")}</option>
          <option value="public">{t("prayer.filter.public")}</option>
          <option value="shared">{t("prayer.filter.shared")}</option>
          <option value="private">{t("prayer.filter.private")}</option>
        </Select>
      </div>
    </div>
  );
}
