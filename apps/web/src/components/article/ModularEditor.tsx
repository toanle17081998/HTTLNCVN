"use client";

import { Button, Text, Title, cn } from "@/components/ui";
import { MediaPickerModal } from "@/components/media/MediaPickerModal";
import { useTranslation } from "@/providers/I18nProvider";
import { FolderOpen } from "lucide-react";
import dynamic from "next/dynamic";
import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ForwardedRef,
} from "react";
import type { DecoupledEditor } from "ckeditor5";
import {
  hasMeaningfulRichHtml,
  isRichTextHtml,
  markdownToHtml,
} from "./articleEditorUtils";

const CkDocumentEditor = dynamic(() => import("./CkDocumentEditor"), {
  ssr: false,
  loading: () => (
    <div className="grid min-h-[36rem] place-items-center bg-[var(--bg-card)] text-sm font-semibold text-[var(--text-secondary)]">
      Loading editor...
    </div>
  ),
});

type ModularEditorProps = {
  initialValue: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  lessonOutline?: boolean;
};

export type ModularEditorHandle = {
  getCleanedValue: () => string;
  setData: (value: string) => void;
};

function normalizeInitialValue(value: string, lessonOutline = false) {
  if (!value.trim()) return "";
  return isRichTextHtml(value) ? value : markdownToHtml(value, { lessonOutline });
}

export const ModularEditor = forwardRef(function ModularEditor(
  {
    initialValue,
    onChange,
    label = "Content",
    placeholder = "Write something...",
    className,
    lessonOutline = false,
  }: ModularEditorProps,
  ref: ForwardedRef<ModularEditorHandle>,
) {
  const { t } = useTranslation();
  const editorRef = useRef<DecoupledEditor | null>(null);
  const [contentHtml, setContentHtml] = useState(() =>
    normalizeInitialValue(initialValue, lessonOutline),
  );
  const [galleryOpen, setGalleryOpen] = useState(false);
  const normalizedInitialValue = useMemo(
    () => normalizeInitialValue(initialValue, lessonOutline),
    [initialValue, lessonOutline],
  );

  useImperativeHandle(ref, () => ({
    getCleanedValue: () => editorRef.current?.getData() ?? contentHtml,
    setData: (value: string) => {
      const normalized = normalizeInitialValue(value, lessonOutline);
      setContentHtml(normalized);
      if (editorRef.current) {
        editorRef.current.setData(normalized);
      }
    },
  }));

  return (
    <div
      className={cn(
        "flex min-w-0 max-w-full flex-col overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)]",
        className,
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-4">
        <div>
          <Title as="h2" variant="subsection">{label}</Title>
          <Text className="mt-1" variant="small">
            {hasMeaningfulRichHtml(contentHtml) ? "Editing document content" : placeholder}
          </Text>
        </div>
        <Button
          onClick={() => setGalleryOpen(true)}
          size="sm"
          title={t("media.picker.insertFromGallery")}
          type="button"
          variant="secondary"
        >
          <FolderOpen className="mr-1.5 h-4 w-4" />
          {t("media.picker.insertFromGallery")}
        </Button>
      </div>

      <CkDocumentEditor
        initialValue={normalizedInitialValue}
        onChange={(value) => {
          setContentHtml(value);
          onChange(value);
        }}
        onReady={(editor) => {
          editorRef.current = editor;
        }}
        placeholder={placeholder}
      />

      <MediaPickerModal
        onClose={() => setGalleryOpen(false)}
        onSelect={(item) => {
          const editor = editorRef.current;
          if (!editor) return;
          editor.execute("insertImage", { source: [item.url] });
          editor.editing.view.focus();
        }}
        open={galleryOpen}
        title={t("media.picker.insertTitle")}
      />
    </div>
  );
});
