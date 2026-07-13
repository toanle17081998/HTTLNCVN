"use client";

import type { FormEvent } from "react";
import { Button, FormField, Input, Textarea } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import type { ImageFormState, ImageModalState } from "./articleEditorTypes";

type MediaInsertModalProps = {
  imageModal: ImageModalState;
  imageForm: ImageFormState;
  onImageFormChange: (form: ImageFormState) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
};

export function MediaInsertModal({
  imageModal,
  imageForm,
  onImageFormChange,
  onSubmit,
  onClose,
}: MediaInsertModalProps) {
  const isImage = imageModal.kind === "image";
  const { t } = useTranslation();

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center px-4"
      style={{ backgroundColor: "var(--bg-scrim)" }}
    >
      <form
        className="grid max-h-[calc(100vh-3rem)] w-full max-w-lg gap-4 overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-lg)]"
        onSubmit={onSubmit}
      >
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {isImage ? t("editor.media.imageTitle") : t("editor.media.videoTitle")}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {isImage
              ? t("editor.media.imageDescription")
              : t("editor.media.videoDescription")}
          </p>
        </div>

        <FormField htmlFor="media-url" label={isImage ? t("editor.media.imageUrl") : t("editor.media.videoUrl")}>
          <Input
            autoFocus
            id="media-url"
            onChange={(e) => onImageFormChange({ ...imageForm, url: e.target.value })}
            placeholder={
              isImage
                ? t("editor.media.imageUrlPlaceholder")
                : t("editor.media.videoUrlPlaceholder")
            }
            required
            value={imageForm.url}
          />
        </FormField>

        <FormField htmlFor="media-alt" label={isImage ? t("editor.media.altText") : t("form.title")}>
          <Input
            id="media-alt"
            onChange={(e) => onImageFormChange({ ...imageForm, alt: e.target.value })}
            placeholder={isImage ? t("editor.media.altPlaceholder") : t("editor.media.videoTitlePlaceholder")}
            value={imageForm.alt}
          />
        </FormField>

        <FormField htmlFor="media-caption" label={t("editor.media.caption")}>
          <Textarea
            id="media-caption"
            onChange={(e) => onImageFormChange({ ...imageForm, caption: e.target.value })}
            placeholder={t("editor.media.captionPlaceholder")}
            rows={3}
            value={imageForm.caption}
          />
        </FormField>

        <div className="flex justify-end gap-2">
          <Button onClick={onClose} type="button" variant="secondary">
            {t("common.cancel")}
          </Button>
          <Button type="submit">
            {isImage ? t("editor.media.insertImage") : t("editor.media.insertVideo")}
          </Button>
        </div>
      </form>
    </div>
  );
}
