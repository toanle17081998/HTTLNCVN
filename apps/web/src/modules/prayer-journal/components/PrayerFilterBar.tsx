"use client";

import { useEffect, useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import type { StatusFilter, VisibilityFilter } from "./prayerJournalTypes";

type PrayerFilterBarProps = {
  statusFilter: StatusFilter;
  visibilityFilter: VisibilityFilter;
  onStatusChange: (s: StatusFilter) => void;
  onVisibilityChange: (v: VisibilityFilter) => void;
};

type FilterOption<T extends string> = {
  value: T;
  label: string;
};

export function PrayerFilterBar({
  statusFilter,
  visibilityFilter,
  onStatusChange,
  onVisibilityChange,
}: PrayerFilterBarProps) {
  const { t } = useTranslation();
  const statusOptions: FilterOption<StatusFilter>[] = [
    { value: "all", label: t("prayer.filter.all") },
    { value: "open", label: t("prayer.filter.open") },
    { value: "closed", label: t("prayer.filter.closed") },
  ];
  const visibilityOptions: FilterOption<VisibilityFilter>[] = [
    { value: "all", label: t("prayer.filter.all") },
    { value: "public", label: t("prayer.filter.public") },
    { value: "shared", label: t("prayer.filter.shared") },
    { value: "private", label: t("prayer.filter.private") },
  ];

  return (
    <div className="grid gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:grid-cols-2">
      <FilterInputDropdown
        label="Status"
        options={statusOptions}
        value={statusFilter}
        onValueChange={onStatusChange}
      />
      <FilterInputDropdown
        label="Visibility"
        options={visibilityOptions}
        value={visibilityFilter}
        onValueChange={onVisibilityChange}
      />
    </div>
  );
}

function FilterInputDropdown<T extends string>({
  label,
  options,
  value,
  onValueChange,
}: {
  label: string;
  options: FilterOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
}) {
  const listId = useId();
  const selectedOption = options.find((option) => option.value === value);
  const [inputValue, setInputValue] = useState(selectedOption?.label ?? "");

  useEffect(() => {
    setInputValue(selectedOption?.label ?? "");
  }, [selectedOption?.label]);

  function commit(nextValue: string) {
    const normalizedValue = nextValue.trim().toLowerCase();
    const matchedOption = options.find(
      (option) =>
        option.label.toLowerCase() === normalizedValue ||
        option.value.toLowerCase() === normalizedValue,
    );

    if (matchedOption) {
      onValueChange(matchedOption.value);
    }
  }

  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold uppercase text-[var(--text-tertiary)]">
        {label}
      </span>
      <span className="relative">
        <input
          className={cn(
            "h-10 w-full rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 pr-10 text-sm font-semibold text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--input-focus-ring)]",
          )}
          list={listId}
          onBlur={() => setInputValue(selectedOption?.label ?? "")}
          onChange={(event) => {
            const nextValue = event.target.value;
            setInputValue(nextValue);
            commit(nextValue);
          }}
          value={inputValue}
        />
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]"
        />
        <datalist id={listId}>
          {options.map((option) => (
            <option key={option.value} value={option.label} />
          ))}
        </datalist>
      </span>
    </label>
  );
}
