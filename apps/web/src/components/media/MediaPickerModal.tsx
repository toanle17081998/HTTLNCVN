"use client";

import { X } from "lucide-react";
import { Button, Title } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import { MediaGalleryManager } from "./MediaGalleryManager";
import type { MediaGalleryItem } from "@/api/media";

type MediaPickerModalProps = {
  open: boolean;
  selectedUrl?: string;
  title?: string;
  onClose: () => void;
  onSelect: (item: MediaGalleryItem) => void;
};

export function MediaPickerModal({
  open,
  selectedUrl,
  title,
  onClose,
  onSelect,
}: MediaPickerModalProps) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
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
            mode="picker"
            onSelect={(item) => {
              onSelect(item);
              onClose();
            }}
            selectedUrl={selectedUrl}
          />
        </div>
      </div>
    </div>
  );
}
