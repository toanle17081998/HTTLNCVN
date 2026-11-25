"use client";

import { useMemo, useRef, useState } from "react";
import { useEditor, useNode } from "@craftjs/core";
import {
  Bold,
  Eye,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pencil,
  Quote,
  Trash2,
} from "lucide-react";
import { Textarea, cn } from "@/components/ui";
import { isRichTextHtml, markdownToHtml } from "@/components/article/articleEditorUtils";
import { Field, NativeSelect, BoxSettings, defaultBoxProps } from "../../shared/settings";
import { buildBoxStyle, useIsMobile } from "../../shared/helpers";
import { NodeFrame } from "../../shared/NodeFrame";
import type { Align, BoxProps } from "../../shared/types";

type RichTextProps = BoxProps & {
  align?: Align;
  content?: string;
  mobileAlign?: Align;
  removable?: boolean;
};

const PROSE_CLASSES =
  "min-w-0 max-w-full [overflow-wrap:anywhere] text-[length:var(--section-body-size)] leading-[var(--section-body-leading)] text-[var(--text-secondary)] " +
  "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0 " +
  "[&_a]:font-semibold [&_a]:text-[var(--brand-primary)] [&_a]:underline [&_a]:underline-offset-2 " +
  "[&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--brand-primary)] [&_blockquote]:pl-4 [&_blockquote]:italic " +
  "[&_code]:rounded [&_code]:bg-[var(--brand-muted)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.9em] " +
  "[&_h1]:mt-6 [&_h1]:mb-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-[var(--text-primary)] " +
  "[&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[var(--text-primary)] " +
  "[&_h3]:mt-4 [&_h3]:mb-1.5 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-[var(--text-primary)] " +
  "[&_h4]:mt-3 [&_h4]:mb-1 [&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-[var(--text-primary)] " +
  "[&_hr]:my-5 [&_hr]:border-[var(--border-subtle)] " +
  "[&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 " +
  "[&_p]:my-2.5 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-[var(--brand-muted)] [&_pre]:p-3 " +
  "[&_strong]:font-semibold [&_strong]:text-[var(--text-primary)] " +
  "[&_table]:my-4 [&_table]:w-full [&_table]:border-collapse " +
  "[&_td]:border [&_td]:border-[var(--border-subtle)] [&_td]:px-3 [&_td]:py-2 " +
  "[&_th]:border [&_th]:border-[var(--border-subtle)] [&_th]:bg-[var(--brand-muted)] [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-[var(--text-primary)] " +
  "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6";

function renderRichContent(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (isRichTextHtml(trimmed)) return trimmed;
  // Support horizontal rules (---) in addition to standard markdownToHtml blocks
  const normalized = trimmed.replace(/^(?:---|\*\*\*|___)\s*$/gm, "\n<hr />\n");
  return normalized
    .split(/\n<hr \/>\n/)
    .map((chunk) => markdownToHtml(chunk))
    .join("<hr />");
}

export function RichTextBlock(props: RichTextProps) {
  const { actions: editorActions, enabled, parentAllowsInsert } = useEditor((state: any) => ({
    enabled: state.options.enabled,
    parentAllowsInsert: (parentId: string | null) =>
      Boolean(parentId && state.nodes?.[parentId]?.data?.props?.allowTextInsert),
  }));
  const {
    actions: { setProp },
    id,
    isSelected,
    nodeAlign,
    nodeContent,
    nodeMobileAlign,
    nodeRemovable,
    parentId,
  } = useNode((node) => ({
    isSelected: node.events.selected,
    nodeAlign: node.data.props.align,
    nodeContent: node.data.props.content,
    nodeMobileAlign: node.data.props.mobileAlign,
    nodeRemovable: node.data.props.removable,
    parentId: node.data.parent,
  }));
  const isMobile = useIsMobile();
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const align = nodeAlign ?? props.align ?? "left";
  const mobileAlign = nodeMobileAlign ?? props.mobileAlign;
  const content = String(nodeContent ?? props.content ?? "");
  const isRemovable = Boolean(nodeRemovable ?? props.removable ?? parentAllowsInsert(parentId));
  const renderedHtml = useMemo(() => renderRichContent(content), [content]);

  if (!enabled && !content.trim()) {
    return null;
  }

  function updateContent(nextValue: string) {
    setProp((draft: any) => {
      draft.content = nextValue;
    });
  }

  function wrapSelection(prefix: string, suffix = "", placeholder = "text") {
    const el = textareaRef.current;
    if (!el) {
      updateContent(`${content}${prefix}${placeholder}${suffix}`);
      return;
    }
    const start = el.selectionStart ?? content.length;
    const end = el.selectionEnd ?? content.length;
    const selected = content.slice(start, end) || placeholder;
    const next = `${content.slice(0, start)}${prefix}${selected}${suffix}${content.slice(end)}`;
    updateContent(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    });
  }

  function prefixLine(prefix: string, placeholder: string) {
    const el = textareaRef.current;
    if (!el) {
      updateContent(`${content}${content && !content.endsWith("\n") ? "\n" : ""}${prefix}${placeholder}`);
      return;
    }
    const start = el.selectionStart ?? content.length;
    const end = el.selectionEnd ?? content.length;
    const selected = content.slice(start, end) || placeholder;
    const needsNewline = start > 0 && content[start - 1] !== "\n";
    const inserted = `${needsNewline ? "\n" : ""}${prefix}${selected}`;
    const next = `${content.slice(0, start)}${inserted}${content.slice(end)}`;
    updateContent(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursorEnd = start + inserted.length;
      el.setSelectionRange(cursorEnd - selected.length, cursorEnd);
    });
  }

  const showEditor = enabled && isEditing;

  return (
    <NodeFrame>
      <div
        className="group/richtext relative w-full"
        style={{
          ...buildBoxStyle(props),
          textAlign: isMobile && mobileAlign ? mobileAlign : align,
        }}
      >
        {enabled && isRemovable ? (
          <button
            aria-label="Delete rich text block"
            className={cn(
              "absolute -right-2 -top-2 z-20 inline-flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--bg-elevated)] text-[var(--status-danger)] shadow-sm transition hover:bg-[var(--status-danger)] hover:text-white cursor-pointer",
              isSelected || isEditing ? "opacity-100" : "opacity-0 group-hover/richtext:opacity-100 focus:opacity-100",
            )}
            onClick={(event) => {
              event.stopPropagation();
              editorActions.delete(id);
            }}
            title="Delete"
            type="button"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : null}

        {showEditor ? (
          <div
            className="grid gap-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] p-2.5 text-left"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-wrap items-center justify-between gap-1 border-b border-[var(--border-subtle)] pb-2">
              <div className="flex flex-wrap items-center gap-1">
                <button
                  className="inline-flex h-7 w-7 items-center justify-center rounded text-[var(--text-secondary)] hover:bg-[var(--brand-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  onClick={() => wrapSelection("**", "**", "bold")}
                  title="Bold"
                  type="button"
                >
                  <Bold className="h-3.5 w-3.5" />
                </button>
                <button
                  className="inline-flex h-7 w-7 items-center justify-center rounded text-[var(--text-secondary)] hover:bg-[var(--brand-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  onClick={() => wrapSelection("*", "*", "italic")}
                  title="Italic"
                  type="button"
                >
                  <Italic className="h-3.5 w-3.5" />
                </button>
                <button
                  className="inline-flex h-7 w-7 items-center justify-center rounded text-[var(--text-secondary)] hover:bg-[var(--brand-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  onClick={() => prefixLine("## ", "Heading")}
                  title="Heading 2"
                  type="button"
                >
                  <Heading2 className="h-3.5 w-3.5" />
                </button>
                <button
                  className="inline-flex h-7 w-7 items-center justify-center rounded text-[var(--text-secondary)] hover:bg-[var(--brand-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  onClick={() => prefixLine("### ", "Subheading")}
                  title="Heading 3"
                  type="button"
                >
                  <Heading3 className="h-3.5 w-3.5" />
                </button>
                <button
                  className="inline-flex h-7 w-7 items-center justify-center rounded text-[var(--text-secondary)] hover:bg-[var(--brand-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  onClick={() => prefixLine("- ", "List item")}
                  title="Bullet list"
                  type="button"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
                <button
                  className="inline-flex h-7 w-7 items-center justify-center rounded text-[var(--text-secondary)] hover:bg-[var(--brand-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  onClick={() => prefixLine("1. ", "List item")}
                  title="Numbered list"
                  type="button"
                >
                  <ListOrdered className="h-3.5 w-3.5" />
                </button>
                <button
                  className="inline-flex h-7 w-7 items-center justify-center rounded text-[var(--text-secondary)] hover:bg-[var(--brand-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  onClick={() => prefixLine("> ", "Quote")}
                  title="Quote"
                  type="button"
                >
                  <Quote className="h-3.5 w-3.5" />
                </button>
                <button
                  className="inline-flex h-7 w-7 items-center justify-center rounded text-[var(--text-secondary)] hover:bg-[var(--brand-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  onClick={() => wrapSelection("[", "](https://example.com)", "link text")}
                  title="Link"
                  type="button"
                >
                  <Link2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <button
                className="inline-flex items-center gap-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-1 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--brand-primary)] cursor-pointer"
                onClick={() => setIsEditing(false)}
                type="button"
              >
                <Eye className="h-3.5 w-3.5" />
                Preview
              </button>
            </div>
            <textarea
              className="min-h-40 w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)]"
              onChange={(event) => updateContent(event.target.value)}
              placeholder="Write Markdown or HTML here..."
              ref={textareaRef}
              value={content}
            />
          </div>
        ) : (
          <div className="relative">
            {enabled ? (
              <button
                className={cn(
                  "absolute right-6 -top-2 z-20 inline-flex h-6 items-center gap-1 rounded-full border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-2 text-[11px] font-medium text-[var(--text-secondary)] shadow-sm transition hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] cursor-pointer",
                  isSelected ? "opacity-100" : "opacity-0 group-hover/richtext:opacity-100 focus:opacity-100",
                )}
                onClick={(event) => {
                  event.stopPropagation();
                  setIsEditing(true);
                }}
                type="button"
              >
                <Pencil className="h-3 w-3" />
                Markdown
              </button>
            ) : null}
            {renderedHtml ? (
              <div
                className={cn(PROSE_CLASSES, enabled && "cursor-text")}
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
                onDoubleClick={enabled ? () => setIsEditing(true) : undefined}
              />
            ) : (
              <div
                className="rounded-md border border-dashed border-[var(--border-subtle)] px-3 py-2 text-sm text-[var(--text-tertiary)] cursor-text"
                onClick={enabled ? () => setIsEditing(true) : undefined}
              >
                Click to write Markdown / Rich Text...
              </div>
            )}
          </div>
        )}
      </div>
    </NodeFrame>
  );
}

function RichTextBlockSettings() {
  const {
    actions: { setProp },
    align,
    content,
  } = useNode((node) => ({
    align: node.data.props.align,
    content: node.data.props.content,
  }));

  return (
    <div className="grid gap-3">
      <Field label="Markdown / Rich Text">
        <Textarea
          className="min-h-40 font-mono text-sm"
          onChange={(event) => setProp((props: any) => (props.content = event.target.value))}
          value={String(content ?? "")}
        />
      </Field>
      <Field label="Alignment">
        <NativeSelect
          onChange={(value) => setProp((props: any) => (props.align = value))}
          value={String(align ?? "left")}
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </NativeSelect>
      </Field>
      <BoxSettings includeBackground={false} />
    </div>
  );
}

RichTextBlock.craft = {
  displayName: "Rich Text",
  props: {
    ...defaultBoxProps({
      width: "100%",
    }),
    align: "left",
    content: "Write **rich text** or *Markdown* here...",
  },
  related: { settings: RichTextBlockSettings },
};
