"use client";

import { Tag } from "lucide-react";
import { cn } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import type { Prayer, PrayerCategory } from "@services/prayer-journal";

type CategorySidebarProps = {
  prayers: Prayer[];
  categories: PrayerCategory[];
  categoryFilter: number | "all";
  onCategoryChange: (id: number | "all") => void;
};

export function CategorySidebar({
  prayers,
  categories,
  categoryFilter,
  onCategoryChange,
}: CategorySidebarProps) {
  const { t } = useTranslation();

  const uncategorisedCount = prayers.filter((p) => p.category === null).length;

  return (
    <div className="h-max rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--brand-primary)]">
            {t("prayer.form.category")}
          </p>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Filter by topic
          </h2>
        </div>
        <Tag aria-hidden="true" className="h-5 w-5 text-[var(--brand-primary)]" />
      </div>

      <div className="mt-5 grid gap-2">
        <CategoryButton
          active={categoryFilter === "all"}
          count={prayers.length}
          label={t("prayer.filter.all")}
          onClick={() => onCategoryChange("all")}
        />

        {categories.map((cat) => (
          <CategoryButton
            key={cat.id}
            active={categoryFilter === cat.id}
            count={prayers.filter((p) => p.category?.id === cat.id).length}
            label={cat.name}
            onClick={() =>
              onCategoryChange(categoryFilter === cat.id ? "all" : cat.id)
            }
          />
        ))}

        {uncategorisedCount > 0 && (
          <button
            type="button"
            className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-base)] hover:text-[var(--text-primary)]"
            onClick={() => onCategoryChange("all")}
          >
            <span className="italic">{t("prayer.form.categoryNone")}</span>
            <CountBadge count={uncategorisedCount} />
          </button>
        )}
      </div>
    </div>
  );
}

function CountBadge({ count }: { count: number }) {
  return (
    <span className="rounded-full bg-[var(--bg-base)] px-2 py-0.5 text-xs font-semibold text-[var(--text-secondary)]">
      {count}
    </span>
  );
}

function CategoryButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-[var(--brand-muted)] text-[var(--brand-primary)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-base)] hover:text-[var(--text-primary)]",
      )}
    >
      <span>{label}</span>
      <CountBadge count={count} />
    </button>
  );
}
