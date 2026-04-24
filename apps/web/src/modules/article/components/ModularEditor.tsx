"use client";

import dynamic from "next/dynamic";
import dynamic from "next/dynamic";
import {
  forwardRef,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useMemo,
  useRef,
  useState,
  type ForwardedRef,
} from "react";
import type { DecoupledEditor } from "ckeditor5";
import { cn } from "@/components/ui";
import type { DecoupledEditor } from "ckeditor5";
import { cn } from "@/components/ui";
import {
  hasMeaningfulRichHtml,
  isRichTextHtml,
  markdownToHtml,
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
};

export type ModularEditorHandle = {
  getCleanedValue: () => string;
};

function normalizeInitialValue(value: string) {
  if (!value.trim()) return "";
  return isRichTextHtml(value) ? value : markdownToHtml(value);
}

function normalizeInitialValue(value: string) {
  if (!value.trim()) return "";
  return isRichTextHtml(value) ? value : markdownToHtml(value);
}

export const ModularEditor = forwardRef(function ModularEditor(
  {
    initialValue,
    onChange,
    label = "Content",
    placeholder = "Write something...",
    className,
  }: ModularEditorProps,
  ref: ForwardedRef<ModularEditorHandle>,
) {
  const editorRef = useRef<DecoupledEditor | null>(null);
  const [contentHtml, setContentHtml] = useState(() => normalizeInitialValue(initialValue));
  const normalizedInitialValue = useMemo(() => normalizeInitialValue(initialValue), [initialValue]);
  const editorRef = useRef<DecoupledEditor | null>(null);
  const [contentHtml, setContentHtml] = useState(() => normalizeInitialValue(initialValue));
  const normalizedInitialValue = useMemo(() => normalizeInitialValue(initialValue), [initialValue]);

  useImperativeHandle(ref, () => ({
    getCleanedValue: () => editorRef.current?.getData() ?? contentHtml,
  }));
  getCleanedValue: () => editorRef.current?.getData() ?? contentHtml,
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
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">{label}</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {hasMeaningfulRichHtml(contentHtml) ? "Editing document content" : placeholder}
        </p>
        <div
          className={cn(
            "flex min-w-0 max-w-full flex-col overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)]",
            className,
          )}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">{label}</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {hasMeaningfulRichHtml(contentHtml) ? "Editing document content" : placeholder}
              </p>
            </div>
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
        </div>
        );
});
