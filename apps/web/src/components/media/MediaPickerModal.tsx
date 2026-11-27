"use client";

import { FolderOpen, X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { Button, Title } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import { MediaGalleryManager } from "./MediaGalleryManager";
import type { MediaGalleryItem, MediaKind } from "@/api/media";

type MediaPickerModalProps = {
  open: boolean;
  mediaKind?: MediaKind;
  selectedUrl?: string;
  title?: string;
  onClose: () => void;
  onSelect: (item: MediaGalleryItem) => void;
};

export function MediaPickerModal({
  open,
  mediaKind,
  selectedUrl,
  title,
  onClose,
  onSelect,
}: MediaPickerModalProps) {
  const { t } = useTranslation();

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(event) => {
        event.stopPropagation();
        onClose();
      }}
      onMouseDown={(event) => event.stopPropagation()}
      style={{ backgroundColor: "var(--bg-scrim)" }}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[var(--shadow-lg)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
          <Title as="h2" variant="subsection">
            {title ?? t("media.picker.title")}
          </Title>
          <Button
            aria-label={t("media.picker.close")}
            onClick={onClose}
            size="iconSm"
            title={t("media.picker.close")}
            type="button"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <MediaGalleryManager
            mediaKind={mediaKind}
            mode="picker"
            onSelect={(item) => {
              onSelect(item);
              onClose();
            }}
            selectedUrl={selectedUrl}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function MediaLibraryButton({
  label,
  mediaKind,
  onSelect,
  selectedUrl,
}: Pick<MediaPickerModalProps, "mediaKind" | "onSelect" | "selectedUrl"> & { label?: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" type="button" variant="secondary">
        <FolderOpen aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
        {label ?? t("media.picker.chooseFromGallery")}
      </Button>
      <MediaPickerModal
        mediaKind={mediaKind}
        onClose={() => setOpen(false)}
        onSelect={onSelect}
        open={open}
        selectedUrl={selectedUrl}
        title={t("media.gallery.title")}
      />
    </>
  );
}
