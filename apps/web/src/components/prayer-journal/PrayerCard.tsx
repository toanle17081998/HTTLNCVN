"use client";

import { CheckCircle2, Circle, Edit3, EllipsisVertical } from "lucide-react";
import { Button, cn, Title, Text } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import type { Prayer } from "@/hooks/prayer-journal";
import { StatusBadge, VisibilityBadge } from "./PrayerBadges";
import { formatPrayerDate } from "./prayerJournalTypes";

type PrayerCardProps = {
  canEdit: boolean;
  prayer: Prayer;
  onEdit: (prayer: Prayer) => void;
  onToggleStatus: (prayer: Prayer) => void;
};

export function PrayerCard({
  canEdit,
  prayer,
  onEdit,
  onToggleStatus,
}: PrayerCardProps) {
  const { t } = useTranslation();
  const isClosed = prayer.status === "closed";
  const statusAction = t(isClosed ? "prayer.action.reopen" : "prayer.action.close");

  return (
    <div
      className={cn(
        "relative grid rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 shadow-sm transition-colors focus-within:z-10",
        isClosed ? "opacity-80" : "",
      )}
    >
      <header className={cn("grid items-start gap-2 lg:gap-3", canEdit && "grid-cols-[minmax(0,1fr)_auto]")}>
        <div className="min-w-0 wrap-anywhere">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Title
              as="h3"
              className={cn("min-w-0", isClosed && "line-through")}
              tone={isClosed ? "secondary" : "primary"}
              variant="label"
            >
              {prayer.title ?? t("prayer.form.titlePlaceholder")}
            </Title>
            <span className="inline-flex shrink-0 items-center gap-2">
              <StatusBadge iconOnly status={prayer.status} />
              <VisibilityBadge iconOnly visibility={prayer.visibility} />
            </span>
          </div>
          <Text as="p" tone="inherit" variant="inherit" className="mt-1 text-xs text-[var(--text-tertiary)] lg:hidden">
            {prayer.created_by_name} · <time dateTime={prayer.created_at}>{formatPrayerDate(prayer.created_at)}</time>
          </Text>
        </div>

        {canEdit ? (
          <details
            className="relative"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
            }}
            onKeyDown={(event) => {
              if (event.key !== "Escape" || !event.currentTarget.open) return;
              event.stopPropagation();
              event.currentTarget.open = false;
              event.currentTarget.querySelector("summary")?.focus();
            }}
          >
            <summary
              aria-label={t("prayer.action.more")}
              className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--brand-muted)] [&::-webkit-details-marker]:hidden"
            >
              <EllipsisVertical aria-hidden="true" className="h-5 w-5" />
            </summary>
            <div className="absolute right-0 top-full z-20 mt-1 grid w-max max-w-64 gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-1 shadow-lg">
              <Button className="justify-start" onClick={(event) => {
                event.currentTarget.closest("details")?.removeAttribute("open");
                onEdit(prayer);
              }} size="sm" variant="ghost">
                <Edit3 aria-hidden="true" className="mr-2 h-4 w-4" />
                {t("action.edit")}
              </Button>
              <Button className="justify-start" onClick={(event) => {
                event.currentTarget.closest("details")?.removeAttribute("open");
                onToggleStatus(prayer);
              }} size="sm" variant="ghost">
                {isClosed ? <Circle aria-hidden="true" className="mr-2 h-4 w-4" /> : <CheckCircle2 aria-hidden="true" className="mr-2 h-4 w-4" />}
                {statusAction}
              </Button>
            </div>
          </details>
        ) : null}
      </header>
      <Text as="p" tone="inherit" variant="inherit"
        className={cn(
          "mt-1 whitespace-pre-wrap text-sm leading-6 wrap-anywhere",
          isClosed ? "text-[var(--text-tertiary)]" : "text-[var(--text-secondary)]",
        )}
      >
        {prayer.content}
      </Text>
    </div>
  );
}
