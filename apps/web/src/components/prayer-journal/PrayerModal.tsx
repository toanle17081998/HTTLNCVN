"use client";

import { Text, Button, FormField, Input, Dropdown, Textarea, Title, Label, Modal, ModalBody, ModalFooter, ModalHeader, cn } from "@/components/ui";
import type { FormEvent } from "react";
import { CheckCircle2, Edit3, Tag, Users, X } from "lucide-react";
import { useTranslation } from "@/providers/I18nProvider";
import type { Prayer, PrayerCategory, PrayerMember, PrayerVisibility } from "@/hooks/prayer-journal";
import { StatusBadge, VisibilityBadge } from "./PrayerBadges";
import {
  formatPrayerDate,
  getMemberNames,
  type ModalMode,
  type PrayerForm,
} from "./prayerJournalTypes";

type PrayerModalProps = {
  activePrayer: Prayer | null;
  canManageOwn: boolean;
  categories: PrayerCategory[];
  closeReason: string;
  form: PrayerForm;
  isSaving: boolean;
  members: PrayerMember[];
  modalMode: ModalMode;
  onClose: () => void;
  onClosePrayer: (event: FormEvent<HTMLFormElement>) => void;
  onCloseReasonChange: (reason: string) => void;
  onDelete: () => void;
  onFormChange: (form: PrayerForm) => void;
  onOpenClose: (prayer: Prayer) => void;
  onOpenEdit: (prayer: Prayer) => void;
  onReopenPrayer: (prayer: Prayer) => void;
  onSubmitPrayer: (event: FormEvent<HTMLFormElement>) => void;
};

function visibilityHint(visibility: PrayerVisibility, t: ReturnType<typeof useTranslation>["t"]) {
  if (visibility === "public") return t("prayer.visibility.help.public");
  if (visibility === "shared") return t("prayer.visibility.help.shared");
  return t("prayer.visibility.help.private");
}

export function PrayerModal({
  activePrayer,
  canManageOwn,
  categories,
  closeReason,
  form,
  isSaving,
  members,
  modalMode,
  onClose,
  onClosePrayer,
  onCloseReasonChange,
  onDelete,
  onFormChange,
  onOpenClose,
  onOpenEdit,
  onReopenPrayer,
  onSubmitPrayer,
}: PrayerModalProps) {
  const { t } = useTranslation();
  const isViewing = modalMode === "view" && activePrayer !== null;
  const isAnswering = modalMode === "close" && activePrayer !== null;

  return (
    <Modal
      className={isViewing || isAnswering ? "max-w-xl" : "max-w-3xl"}
      labelledBy="prayer-modal-title"
      onClose={onClose}
      onSubmit={isViewing ? undefined : isAnswering ? onClosePrayer : onSubmitPrayer}
    >
        <ModalHeader className={cn("flex items-start justify-between gap-4", isViewing && "p-4")}>
          <div className="min-w-0">
            {!isViewing ? (
              <Text as="p" tone="inherit" variant="inherit" className="text-sm font-semibold uppercase text-[var(--brand-primary)]">
                {t("prayer.config.eyebrow")}
              </Text>
            ) : null}
            <Title as="h2" id="prayer-modal-title" className={isViewing ? "wrap-anywhere text-xl" : undefined} variant="modal">
              {modalMode === "create"
                ? t("prayer.config.title.add")
                : modalMode === "edit"
                  ? t("prayer.config.title.edit")
                  : modalMode === "close"
                    ? t("prayer.action.close")
                    : activePrayer?.title ?? t("prayer.config.title.view")}
            </Title>
          </div>
          <Button
            variant="unstyled"
            aria-label={t("action.close")}
            className="shrink-0 rounded-full p-2 text-[var(--text-secondary)] hover:bg-[var(--brand-muted)] hover:text-[var(--text-primary)]"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </Button>
        </ModalHeader>

        {isViewing && activePrayer ? (
          <PrayerViewPanel
            activePrayer={activePrayer}
            canManageOwn={canManageOwn}
            members={members}
            onOpenClose={onOpenClose}
            onOpenEdit={onOpenEdit}
            onReopenPrayer={onReopenPrayer}
          />
        ) : isAnswering ? (
          <>
            <ModalBody className="grid gap-4">
              <Text variant="small">
                {t("prayer.close.description", {
                  defaultValue: "Record how this prayer was answered.",
                })}
              </Text>
              <FormField htmlFor="prayer-close-reason" label={t("prayer.form.closeReason")}>
                <Textarea
                  id="prayer-close-reason"
                  onChange={(event) => onCloseReasonChange(event.target.value)}
                  placeholder={t("prayer.form.closeReasonPlaceholder")}
                  rows={5}
                  value={closeReason}
                />
              </FormField>
            </ModalBody>
            <ModalFooter className="flex flex-wrap justify-end gap-2">
              <Button onClick={onClose} type="button" variant="secondary">
                {t("common.cancel")}
              </Button>
              <Button variant="primary" isLoading={isSaving} type="submit">
                <CheckCircle2 aria-hidden="true" className="mr-2 h-4 w-4" />
                {t("prayer.action.close")}
              </Button>
            </ModalFooter>
          </>
        ) : (
          <>
            <ModalBody className="grid gap-4 sm:grid-cols-2">
              <FormField className="sm:col-span-2" htmlFor="prayer-title" label={t("prayer.form.title")}>
                <Input
                  id="prayer-title"
                  onChange={(event) => onFormChange({ ...form, title: event.target.value })}
                  placeholder={t("prayer.form.titlePlaceholder")}
                  value={form.title}
                />
              </FormField>

              <FormField htmlFor="prayer-category" label={t("prayer.form.category")}>
                <Dropdown
                  id="prayer-category"
                  onChange={(event) =>
                    onFormChange({
                      ...form,
                      category_id: event.target.value ? Number(event.target.value) : "",
                    })
                  }
                  value={form.category_id}
                >
                  <option value="">{t("prayer.form.categoryNone")}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Dropdown>
              </FormField>

              <FormField htmlFor="prayer-visibility" label={t("prayer.form.visibility")}>
                <Dropdown
                  id="prayer-visibility"
                  onChange={(event) =>
                    onFormChange({
                      ...form,
                      selected_member_ids:
                        event.target.value === "shared" ? form.selected_member_ids : [],
                      visibility: event.target.value as PrayerVisibility,
                    })
                  }
                  value={form.visibility}
                >
                  <option value="private">{t("prayer.form.visibility.private")}</option>
                  <option value="public">{t("prayer.form.visibility.public")}</option>
                  <option value="shared">{t("prayer.form.visibility.shared")}</option>
                </Dropdown>
              </FormField>

              <div className="sm:col-span-2 rounded-2xl bg-[var(--bg-base)] p-4 text-sm text-[var(--text-secondary)]">
                {visibilityHint(form.visibility, t)}
              </div>

              {form.visibility === "shared" ? (
                <FormField
                  className="sm:col-span-2"
                  htmlFor="prayer-shared-members"
                  label={t("prayer.share.members")}
                >
                  <div
                    className="grid max-h-60 gap-2 overflow-y-auto rounded-2xl border border-[var(--border-subtle)] p-3"
                    id="prayer-shared-members"
                  >
                    {members.map((member) => {
                      const checked = form.selected_member_ids.includes(member.id);

                      return (
                        <Label variant="inherit"
                          className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 hover:bg-[var(--bg-base)]"
                          key={member.id}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">
                              {member.display_name}
                            </span>
                            <span className="block truncate text-xs text-[var(--text-tertiary)]">
                              @{member.username}
                            </span>
                          </span>
                          <Input
                            checked={checked}
                            className="h-4 w-4 accent-[var(--brand-primary)]"
                            onChange={(event) =>
                              onFormChange({
                                ...form,
                                selected_member_ids: event.target.checked
                                  ? [...form.selected_member_ids, member.id]
                                  : form.selected_member_ids.filter((id) => id !== member.id),
                              })
                            }
                            type="checkbox"
                          />
                        </Label>
                      );
                    })}
                  </div>
                </FormField>
              ) : null}

              <FormField className="sm:col-span-2" htmlFor="prayer-content" label={t("prayer.form.content")}>
                <Textarea
                  id="prayer-content"
                  onChange={(event) => onFormChange({ ...form, content: event.target.value })}
                  placeholder={t("prayer.form.contentPlaceholder")}
                  required
                  rows={7}
                  value={form.content}
                />
              </FormField>
            </ModalBody>

            <ModalFooter className="flex flex-wrap items-center justify-between gap-3">
              {modalMode === "edit" ? (
                <Button isLoading={isSaving} onClick={onDelete} type="button" variant="danger">
                  {t("prayer.action.delete")}
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button onClick={onClose} type="button" variant="secondary">
                  {t("common.cancel")}
                </Button>
                <Button variant="primary" isLoading={isSaving} type="submit">
                  {modalMode === "edit" ? t("prayer.action.saveChanges") : t("prayer.action.add")}
                </Button>
              </div>
            </ModalFooter>
          </>
        )}
    </Modal>
  );
}

function PrayerViewPanel({
  activePrayer,
  canManageOwn,
  members,
  onOpenClose,
  onOpenEdit,
  onReopenPrayer,
}: {
  activePrayer: Prayer;
  canManageOwn: boolean;
  members: PrayerMember[];
  onOpenClose: (prayer: Prayer) => void;
  onOpenEdit: (prayer: Prayer) => void;
  onReopenPrayer: (prayer: Prayer) => void;
}) {
  const { t } = useTranslation();
  const sharedNames = getMemberNames(
    activePrayer.shared_with.map((member) => member.id),
    members.length > 0 ? members : activePrayer.shared_with,
  );

  return (
    <>
      <ModalBody className="grid gap-3 px-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={activePrayer.status} />
          <VisibilityBadge visibility={activePrayer.visibility} />
          {activePrayer.category ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-base)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">
              <Tag aria-hidden="true" className="h-3 w-3" />
              {activePrayer.category.name}
            </span>
          ) : null}
        </div>

        <div className="grid min-w-0 gap-2 rounded-xl bg-[var(--bg-base)] p-3">
          <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-[var(--text-secondary)]">
            <span>{activePrayer.created_by_name}</span>
            <span>{formatPrayerDate(activePrayer.created_at)}</span>
            {activePrayer.visibility === "shared" ? (
              <span className="inline-flex items-center gap-1">
                <Users aria-hidden="true" className="h-4 w-4" />
                {sharedNames || t("prayer.share.members.none")}
              </span>
            ) : null}
          </div>

          <Text as="p" tone="inherit" variant="inherit" className="whitespace-pre-wrap text-sm leading-6 wrap-anywhere text-[var(--text-primary)]">
            {activePrayer.content}
          </Text>

          {activePrayer.close_reason ? (
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
              <Text as="p" tone="inherit" variant="inherit" className="text-xs font-semibold uppercase text-[var(--brand-primary)]">
                {t("prayer.action.close")}
              </Text>
              <Text as="p" tone="inherit" variant="inherit" className="mt-2 text-sm text-[var(--text-secondary)]">{activePrayer.close_reason}</Text>
            </div>
          ) : null}
        </div>
      </ModalBody>

      {canManageOwn ? (
        <ModalFooter className="flex flex-wrap justify-end gap-2 p-4">
          {activePrayer.status === "open" ? (
            <Button onClick={() => onOpenClose(activePrayer)} size="sm" type="button" variant="secondary">
              <CheckCircle2 aria-hidden="true" className="mr-2 h-4 w-4" />
              {t("prayer.action.close")}
            </Button>
          ) : (
            <Button onClick={() => onReopenPrayer(activePrayer)} size="sm" type="button" variant="secondary">
              {t("prayer.action.reopen")}
            </Button>
          )}
          <Button variant="primary" onClick={() => onOpenEdit(activePrayer)} size="sm" type="button">
            <Edit3 aria-hidden="true" className="mr-2 h-4 w-4" />
            {t("action.edit")}
          </Button>
        </ModalFooter>
      ) : null}
    </>
  );
}
