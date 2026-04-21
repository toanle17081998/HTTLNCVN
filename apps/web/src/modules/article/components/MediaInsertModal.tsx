"use client";

import type { FormEvent } from "react";
import { Button, FormField, Input, Textarea } from "@/components/ui";
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

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
      <form
        className="grid max-h-[calc(100vh-3rem)] w-full max-w-lg gap-4 overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-xl"
        onSubmit={onSubmit}
      >
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {isImage ? "Image details" : "Video details"}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {isImage
              ? "Paste an online image URL or a shared Google Drive image link."
              : "Paste a YouTube, Vimeo, or direct video URL."}
          </p>
        </div>

        <FormField htmlFor="media-url" label={isImage ? "Image URL" : "Video URL"}>
          <Input
            autoFocus
            id="media-url"
            onChange={(e) => onImageFormChange({ ...imageForm, url: e.target.value })}
            placeholder={
              isImage
                ? "https://drive.google.com/file/d/..."
                : "https://www.youtube.com/watch?v=..."
            }
            required
            value={imageForm.url}
          />
        </FormField>

        <FormField htmlFor="media-alt" label={isImage ? "Alt text" : "Title"}>
          <Input
            id="media-alt"
            onChange={(e) => onImageFormChange({ ...imageForm, alt: e.target.value })}
            placeholder={isImage ? "Describe the image" : "Name the video"}
            value={imageForm.alt}
          />
        </FormField>

        <FormField htmlFor="media-caption" label="Caption">
          <Textarea
            id="media-caption"
            onChange={(e) => onImageFormChange({ ...imageForm, caption: e.target.value })}
            placeholder="Optional caption"
            rows={3}
            value={imageForm.caption}
          />
        </FormField>

        <div className="flex justify-end gap-2">
          <Button onClick={onClose} type="button" variant="secondary">
            Cancel
          </Button>
          <Button type="submit">
            {isImage ? "Insert image" : "Insert video"}
          </Button>
        </div>
      </form>
    </div>
  );
}
