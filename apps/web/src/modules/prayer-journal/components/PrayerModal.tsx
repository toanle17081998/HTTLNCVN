"use client";

import type { FormEvent } from "react";
import { CheckCircle2, Edit3, Tag, X } from "lucide-react";
import { Button, FormField, Input, Select, Textarea } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import type { Prayer, PrayerCategory } from "@/mockData";
import { StatusBadge, VisibilityBadge } from "./PrayerBadges";
import {
  formatRelativeDate,
  getCategoryName,
  getMemberName,
  type ModalMode,
  type PrayerForm,
} from "./prayerJournalTypes";
import type { PrayerVisibility } from "@/mockData";

type PrayerModalProps = {
  modalMode: ModalMode;
  activePrayer: Prayer | null;
  categories: PrayerCategory[];
  form: PrayerForm;
  closeReason: string;
  canManageOwn: boolean;
  canModerate: boolean;
  onClose: () => void;
  onFormChange: (form: PrayerForm) => void;
  onCloseReasonChange: (reason: string) => void;
  onSubmitPrayer: (e: FormEvent<HTMLFormElement>) => void;
  onClosePrayer: (e: FormEvent<HTMLFormElement>) => void;
  onDelete: () => void;
  onReopenPrayer: (prayer: Prayer) => void;
  onOpenEdit: (prayer: Prayer) => void;
  onOpenClose: (prayer: Prayer) => void;
};

export function PrayerModal({
  modalMode,
  activePrayer,
  categories,
  form,
  closeReason,
  canManageOwn,
  canModerate,
  onClose,
  onFormChange,
  onCloseReasonChange,
  onSubmitPrayer,
  onClosePrayer,
  onDelete,
  onReopenPrayer,
  onOpenEdit,
  onOpenClose,
}: PrayerModalProps) {
  const { t } = useTranslation();

  const canAct = canManageOwn || canModerate;

  function modalTitle(): string {
    if (modalMode === "create") return t("prayer.config.title.add");
    if (modalMode === "edit") return t("prayer.config.title.edit");
    if (modalMode === "close") return t("prayer.action.close");
    return activePrayer?.title ?? t("prayer.config.title.view");
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[var(--bg-overlay)] px-4 py-6">
      <div className="grid max-h-[calc(100vh-3rem)] w-full max-w-2xl gap-5 overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase text-[var(--brand-primary)]">
              {t("prayer.config.eyebrow")}
            </p>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              {modalTitle()}
            </h2>
          </div>
          <button
            aria-label="Close"
            className="rounded-md p-2 text-[var(--text-secondary)] hover:bg-[var(--brand-muted)] hover:text-[var(--text-primary)]"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        {/* ── VIEW ── */}
        {modalMode === "view" && activePrayer ? (
          <PrayerViewPanel
            activePrayer={activePrayer}
            canAct={canAct}
            categories={categories}
            onClose={onClose}
            onOpenClose={onOpenClose}
            onOpenEdit={onOpenEdit}
            onReopenPrayer={onReopenPrayer}
            t={t}
          />
        ) : modalMode === "close" && activePrayer ? (
          /* ── CLOSE / MARK ANSWERED ── */
          <form className="grid gap-5" onSubmit={onClosePrayer}>
            <p className="text-sm text-[var(--text-secondary)]">
              Recording how God answered —{" "}
              <span className="font-semibold text-[var(--text-primary)]">
                {activePrayer.title ?? "Untitled"}
              </span>
            </p>
            <FormField htmlFor="prayer-close-reason" label={t("prayer.form.closeReason")}>
              <Textarea
                id="prayer-close-reason"
                placeholder={t("prayer.form.closeReasonPlaceholder")}
                rows={4}
                value={closeReason}
                onChange={(e) => onCloseReasonChange(e.target.value)}
              />
            </FormField>
            <div className="flex justify-end gap-2 border-t border-[var(--border-subtle)] pt-4">
              <Button onClick={onClose} type="button" variant="secondary">
                {t("common.cancel")}
              </Button>
              <Button type="submit">
                <CheckCircle2 aria-hidden="true" className="mr-2 h-4 w-4" />
                {t("prayer.action.close")}
              </Button>
            </div>
          </form>
        ) : (
          /* ── CREATE / EDIT ── */
          <form className="grid gap-5" onSubmit={onSubmitPrayer}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                className="sm:col-span-2"
                htmlFor="prayer-title"
                label={t("prayer.form.title")}
              >
                <Input
                  id="prayer-title"
                  placeholder={t("prayer.form.titlePlaceholder")}
                  value={form.title}
                  onChange={(e) => onFormChange({ ...form, title: e.target.value })}
                />
              </FormField>

              <FormField htmlFor="prayer-visibility" label={t("prayer.form.visibility")}>
                <Select
                  id="prayer-visibility"
                  value={form.visibility}
                  onChange={(e) =>
                    onFormChange({ ...form, visibility: e.target.value as PrayerVisibility })
                  }
                >
                  <option value="private">{t("prayer.form.visibility.private")}</option>
                  <option value="shared">{t("prayer.form.visibility.shared")}</option>
                  <option value="public">{t("prayer.form.visibility.public")}</option>
                </Select>
              </FormField>

              <FormField htmlFor="prayer-category" label={t("prayer.form.category")}>
                <Select
                  id="prayer-category"
                  value={form.category_id}
                  onChange={(e) =>
                    onFormChange({
                      ...form,
                      category_id: e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                >
                  <option value="">{t("prayer.form.categoryNone")}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField
                className="sm:col-span-2"
                htmlFor="prayer-content"
                label={t("prayer.form.content")}
              >
                <Textarea
                  id="prayer-content"
                  placeholder={t("prayer.form.contentPlaceholder")}
                  required
                  rows={6}
                  value={form.content}
                  onChange={(e) => onFormChange({ ...form, content: e.target.value })}
                />
              </FormField>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-4">
              {modalMode === "edit" ? (
                <Button onClick={onDelete} type="button" variant="danger">
                  {t("prayer.action.delete")}
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button onClick={onClose} type="button" variant="secondary">
                  {t("common.cancel")}
                </Button>
                <Button type="submit">
                  {modalMode === "edit"
                    ? t("prayer.action.saveChanges")
                    : t("prayer.action.add")}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── View panel (read-only) ───────────────────────────────────────────────────

type PrayerViewPanelProps = {
  activePrayer: Prayer;
  categories: PrayerCategory[];
  canAct: boolean;
  onClose: () => void;
  onOpenEdit: (prayer: Prayer) => void;
  onOpenClose: (prayer: Prayer) => void;
  onReopenPrayer: (prayer: Prayer) => void;
  t: ReturnType<typeof useTranslation>["t"];
};

function PrayerViewPanel({
  activePrayer,
  categories,
  canAct,
  onClose,
  onOpenEdit,
  onOpenClose,
  onReopenPrayer,
  t,
}: PrayerViewPanelProps) {
  return (
    <div className="grid gap-5">
      {/* Badges */}
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={activePrayer.status} />
        <VisibilityBadge visibility={activePrayer.visibility} />
        {activePrayer.category_id !== null && (
          <span className="inline-flex items-center gap-1 rounded-md bg-[var(--bg-base)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">
            <Tag aria-hidden="true" className="h-3 w-3" />
            {getCategoryName(activePrayer.category_id, categories)}
          </span>
        )}
      </div>

      {/* Author / date */}
      <p className="text-xs text-[var(--text-tertiary)]">
        {getMemberName(activePrayer.created_by)} ·{" "}
        {formatRelativeDate(activePrayer.created_at)}
        {activePrayer.closed_at
          ? ` · ${t("prayer.meta.answeredOn", { date: formatRelativeDate(activePrayer.closed_at) })}`
          : null}
      </p>

      {/* Content */}
      <div className="rounded-lg bg-[var(--bg-base)] p-4">
        <p className="whitespace-pre-wrap text-sm leading-7 text-[var(--text-primary)]">
          {activePrayer.content}
        </p>
      </div>

      {/* Close reason */}
      {activePrayer.close_reason ? (
        <div className="flex items-start gap-3 rounded-lg border border-[var(--border-subtle)] p-4">
          <CheckCircle2
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 shrink-0 text-[var(--brand-primary)]"
          />
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--brand-primary)]">
              {t("prayer.action.close")}
            </p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {activePrayer.close_reason}
            </p>
          </div>
        </div>
      ) : null}

      {/* Footer */}
      <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--border-subtle)] pt-4">
        <Button onClick={onClose} type="button" variant="secondary">
          {t("common.cancel")}
        </Button>
        {canAct ? (
          <>
            {activePrayer.status === "open" ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenClose(activePrayer)}
              >
                <CheckCircle2 aria-hidden="true" className="mr-2 h-4 w-4" />
                {t("prayer.action.close")}
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                onClick={() => onReopenPrayer(activePrayer)}
              >
                {t("prayer.action.reopen")}
              </Button>
            )}
            <Button
              onClick={() => {
                const p = activePrayer;
                onClose();
                onOpenEdit(p);
              }}
            >
              <Edit3 aria-hidden="true" className="mr-2 h-4 w-4" />
              {t("prayer.config.title.edit")}
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
