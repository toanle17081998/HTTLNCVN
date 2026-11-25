"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FolderOpen, Upload, X } from "lucide-react";
import { Button, Input, cn } from "@/components/ui";
import { mediaKeys, resolveMediaUrl, uploadMedia } from "@/api/media";
import { useTranslation } from "@/providers/I18nProvider";
import { MediaPickerModal } from "./MediaPickerModal";

type ImagePickerFieldProps = {
  id?: string;
  name?: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  className?: string;
  compact?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  folder?: string;
};

export function ImagePickerField({
  id,
  name,
  value,
  onChange,
  placeholder = "https://example.com/image.jpg",
  className,
  compact = false,
  required,
  autoFocus,
  folder,
}: ImagePickerFieldProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(file?: File) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const media = await uploadMedia(file, undefined, folder);
      onChange(media.url);
      void queryClient.invalidateQueries({ queryKey: mediaKeys.all });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("media.gallery.uploadFailed"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="grid gap-2">
      <div className={cn("flex gap-1.5", compact ? "flex-col" : "flex-wrap items-center")}>
        <Input
          autoFocus={autoFocus}
          className={cn("min-w-0 flex-1", className)}
          id={id}
          name={name}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          value={value}
        />

        <input
          accept="image/*"
          className="hidden"
          onChange={(e) => void handleFileChange(e.target.files?.[0])}
          ref={fileInputRef}
          type="file"
        />

        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            onClick={() => setPickerOpen(true)}
            size="sm"
            title={t("media.picker.chooseFromGallery")}
            type="button"
            variant="secondary"
          >
            <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
            {t("media.picker.gallery")}
          </Button>
          <Button
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            size="sm"
            title={t("media.gallery.uploadFromComputer")}
            type="button"
            variant="secondary"
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            {uploading ? "..." : t("media.picker.upload")}
          </Button>
        </div>
      </div>

      {error ? <p className="text-xs text-[var(--status-danger)]">{error}</p> : null}

      {value && !compact ? (
        <div className="relative w-full max-w-[220px] overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="Preview" className="aspect-[16/9] w-full object-cover" src={resolveMediaUrl(value)} />
          <button
            aria-label={t("media.picker.clear")}
            className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white transition hover:bg-black/80"
            onClick={() => onChange("")}
            title={t("media.picker.clear")}
            type="button"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : null}

      <MediaPickerModal
        onClose={() => setPickerOpen(false)}
        onSelect={(item) => onChange(item.url)}
        open={pickerOpen}
        selectedUrl={value}
      />
    </div>
  );
}
