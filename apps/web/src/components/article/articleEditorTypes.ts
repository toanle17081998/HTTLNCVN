// ─── Domain types ─────────────────────────────────────────────────────────────

export type SubmitState =
  | { status: "idle"; message: "" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export type ToolbarItem = {
  label: string;
  command: string;
  icon: ToolbarIconName;
  value?: string;
  className?: string;
};

export type ToolbarItemKey = `${string}:${string}`;

export type ToolbarIconName =
  | "heading2"
  | "heading3"
  | "paragraph"
  | "bold"
  | "italic"
  | "underline"
  | "list"
  | "orderedList"
  | "quote"
  | "alignLeft"
  | "alignCenter"
  | "alignRight"
  | "alignJustify"
  | "link"
  | "image"
  | "video"
  | "columns"
  | "table";

export type ImageResizeState = {
  figure: HTMLElement;
  media: HTMLElement;
  maxWidth: number;
  startWidth: number;
  startX: number;
};

export type ColumnResizeState = {
  columns: HTMLElement;
  startX: number;
  startLeftPercent: number;
  width: number;
};

export type MediaKind = "image" | "video";
export type EditorMode = "rich" | "markdown";

export type ImageModalState =
  | { mode: "insert"; kind: MediaKind }
  | { mode: "edit"; kind: MediaKind; figure: HTMLElement; image: HTMLImageElement };

export type ImageFormState = {
  url: string;
  alt: string;
  caption: string;
};

export type TableFormState = {
  rows: string;
  columns: string;
};

// ─── Toolbar configuration ────────────────────────────────────────────────────

export const toolbarGroups: readonly (readonly ToolbarItem[])[] = [
  [
    { label: "Heading 2", command: "formatBlock", icon: "heading2", value: "h2" },
    { label: "Heading 3", command: "formatBlock", icon: "heading3", value: "h3" },
    { label: "Paragraph", command: "formatBlock", icon: "paragraph", value: "p" },
  ],
  [
    { label: "Bold", command: "bold", icon: "bold", className: "font-black" },
    { label: "Italic", command: "italic", icon: "italic", className: "font-serif" },
    { label: "Underline", command: "underline", icon: "underline" },
  ],
  [
    { label: "Bullet list", command: "insertUnorderedList", icon: "list" },
    { label: "Numbered list", command: "insertOrderedList", icon: "orderedList" },
    { label: "Quote", command: "formatBlock", icon: "quote", value: "blockquote" },
  ],
  [
    { label: "Align left", command: "justifyLeft", icon: "alignLeft" },
    { label: "Align center", command: "justifyCenter", icon: "alignCenter" },
    { label: "Align right", command: "justifyRight", icon: "alignRight" },
    { label: "Justify", command: "justifyFull", icon: "alignJustify" },
  ],
] as const;

// ─── CSS class constants ──────────────────────────────────────────────────────

export const toolbarButtonClass =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-transparent bg-transparent px-2.5 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--input-focus-ring)]";

export const toolbarButtonActiveClass =
  "border-[var(--brand-primary)] bg-[var(--brand-muted)] text-[var(--brand-primary)] shadow-sm";

export const toolbarActionButtonClass =
  "inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-sm font-semibold text-[var(--text-primary)] shadow-sm transition hover:bg-[var(--brand-muted)] focus:outline-none focus:ring-4 focus:ring-[var(--input-focus-ring)]";

// ─── Key helper ───────────────────────────────────────────────────────────────

export function getToolbarItemKey(item: ToolbarItem): ToolbarItemKey {
  return `${item.command}:${item.value ?? ""}`;
}
