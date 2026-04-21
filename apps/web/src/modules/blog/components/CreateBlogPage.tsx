"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { PageLayout } from "@/components/layout";
import {
  Button,
  Card,
  FormField,
  Input,
  Select,
  Textarea,
  cn,
} from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";

type SubmitState =
  | { status: "idle"; message: "" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

type ToolbarItem = {
  label: string;
  command: string;
  icon: ToolbarIconName;
  value?: string;
  className?: string;
};

type ToolbarItemKey = `${string}:${string}`;

type ToolbarIconName =
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

type ImageResizeState = {
  figure: HTMLElement;
  media: HTMLElement;
  maxWidth: number;
  startWidth: number;
  startX: number;
};

type ColumnResizeState = {
  columns: HTMLElement;
  startX: number;
  startLeftPercent: number;
  width: number;
};

type MediaKind = "image" | "video";

type ImageModalState =
  | { mode: "insert"; kind: MediaKind }
  | { mode: "edit"; kind: MediaKind; figure: HTMLElement; image: HTMLImageElement };

type ImageFormState = {
  url: string;
  alt: string;
  caption: string;
};

type TableFormState = {
  rows: string;
  columns: string;
};

const toolbarGroups: readonly (readonly ToolbarItem[])[] = [
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

const toolbarButtonClass =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-transparent bg-transparent px-2.5 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--input-focus-ring)]";

const toolbarButtonActiveClass =
  "border-[var(--brand-primary)] bg-[var(--brand-muted)] text-[var(--brand-primary)] shadow-sm";

const toolbarActionButtonClass =
  "inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-sm font-semibold text-[var(--text-primary)] shadow-sm transition hover:bg-[var(--brand-muted)] focus:outline-none focus:ring-4 focus:ring-[var(--input-focus-ring)]";

function SvgIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  );
}

function ToolbarIcon({ name }: { name: ToolbarIconName }) {
  switch (name) {
    case "heading2":
      return <span aria-hidden="true" className="text-[0.8rem] font-black">H2</span>;
    case "heading3":
      return <span aria-hidden="true" className="text-[0.8rem] font-black">H3</span>;
    case "paragraph":
      return <span aria-hidden="true" className="text-[0.8rem] font-black">P</span>;
    case "bold":
      return <span aria-hidden="true" className="text-sm font-black">B</span>;
    case "italic":
      return <span aria-hidden="true" className="font-serif text-sm italic">I</span>;
    case "underline":
      return <span aria-hidden="true" className="text-sm font-black underline">U</span>;
    case "list":
      return (
        <SvgIcon>
          <path d="M8 6h12" />
          <path d="M8 12h12" />
          <path d="M8 18h12" />
          <path d="M4 6h.01" />
          <path d="M4 12h.01" />
          <path d="M4 18h.01" />
        </SvgIcon>
      );
    case "orderedList":
      return (
        <SvgIcon>
          <path d="M10 6h10" />
          <path d="M10 12h10" />
          <path d="M10 18h10" />
          <path d="M4 6h1v4" />
          <path d="M4 10h2" />
          <path d="M4 14h2l-2 4h2" />
        </SvgIcon>
      );
    case "quote":
      return (
        <SvgIcon>
          <path d="M8 11H5a4 4 0 0 1 4-4" />
          <path d="M8 11v6H4v-6" />
          <path d="M19 11h-3a4 4 0 0 1 4-4" />
          <path d="M19 11v6h-4v-6" />
        </SvgIcon>
      );
    case "alignLeft":
      return (
        <SvgIcon>
          <path d="M4 6h16" />
          <path d="M4 10h10" />
          <path d="M4 14h16" />
          <path d="M4 18h10" />
        </SvgIcon>
      );
    case "alignCenter":
      return (
        <SvgIcon>
          <path d="M4 6h16" />
          <path d="M8 10h8" />
          <path d="M4 14h16" />
          <path d="M8 18h8" />
        </SvgIcon>
      );
    case "alignRight":
      return (
        <SvgIcon>
          <path d="M4 6h16" />
          <path d="M10 10h10" />
          <path d="M4 14h16" />
          <path d="M10 18h10" />
        </SvgIcon>
      );
    case "alignJustify":
      return (
        <SvgIcon>
          <path d="M4 6h16" />
          <path d="M4 10h16" />
          <path d="M4 14h16" />
          <path d="M4 18h16" />
        </SvgIcon>
      );
    case "link":
      return (
        <SvgIcon>
          <path d="M10 13a5 5 0 0 0 7.07 0l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15" />
          <path d="M14 11a5 5 0 0 0-7.07 0l-2 2A5 5 0 0 0 12 20.07l1.15-1.15" />
        </SvgIcon>
      );
    case "image":
      return (
        <SvgIcon>
          <rect height="16" rx="2" width="18" x="3" y="4" />
          <path d="m3 16 5-5 4 4 2-2 7 7" />
          <circle cx="15" cy="9" r="1" />
        </SvgIcon>
      );
    case "video":
      return (
        <SvgIcon>
          <rect height="14" rx="2" width="18" x="3" y="5" />
          <path d="m10 9 5 3-5 3Z" />
        </SvgIcon>
      );
    case "columns":
      return (
        <SvgIcon>
          <rect height="16" rx="2" width="18" x="3" y="4" />
          <path d="M12 4v16" />
        </SvgIcon>
      );
    case "table":
      return (
        <SvgIcon>
          <rect height="16" rx="2" width="18" x="3" y="4" />
          <path d="M3 10h18" />
          <path d="M3 16h18" />
          <path d="M9 4v16" />
          <path d="M15 4v16" />
        </SvgIcon>
      );
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char] ?? char;
  });
}

function parseCount(value: string, fallback: number, max: number) {
  const count = Number.parseInt(value, 10);

  if (Number.isNaN(count)) {
    return fallback;
  }

  return Math.min(Math.max(count, 1), max);
}

function getToolbarItemKey(item: ToolbarItem): ToolbarItemKey {
  return `${item.command}:${item.value ?? ""}`;
}

function normalizeWebUrl(value: string) {
  try {
    const url = new URL(value);

    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {
    return "";
  }

  return "";
}

function getGoogleDriveFileId(value: string) {
  try {
    const url = new URL(value);

    if (!url.hostname.includes("drive.google.com")) {
      return "";
    }

    const queryId = url.searchParams.get("id");

    if (queryId) {
      return queryId;
    }

    const filePathMatch = url.pathname.match(/\/file\/d\/([^/]+)/);

    return filePathMatch?.[1] ?? "";
  } catch {
    return "";
  }
}

function normalizeImageUrl(value: string) {
  const driveFileId = getGoogleDriveFileId(value);

  if (driveFileId) {
    return `https://drive.google.com/thumbnail?id=${encodeURIComponent(
      driveFileId,
    )}&sz=w1600`;
  }

  return normalizeWebUrl(value);
}

function getYouTubeVideoId(url: URL) {
  if (url.hostname.includes("youtu.be")) {
    return url.pathname.split("/").filter(Boolean)[0] ?? "";
  }

  if (!url.hostname.includes("youtube.com")) {
    return "";
  }

  if (url.pathname.startsWith("/embed/")) {
    return url.pathname.split("/").filter(Boolean)[1] ?? "";
  }

  if (url.pathname.startsWith("/shorts/")) {
    return url.pathname.split("/").filter(Boolean)[1] ?? "";
  }

  return url.searchParams.get("v") ?? "";
}

function normalizeVideoUrl(value: string) {
  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    const youtubeId = getYouTubeVideoId(url);

    if (youtubeId) {
      return {
        kind: "iframe",
        url: `https://www.youtube.com/embed/${encodeURIComponent(youtubeId)}`,
      } as const;
    }

    if (url.hostname.includes("vimeo.com")) {
      const vimeoId = url.pathname.split("/").filter(Boolean)[0] ?? "";

      if (vimeoId) {
        return {
          kind: "iframe",
          url: `https://player.vimeo.com/video/${encodeURIComponent(vimeoId)}`,
        } as const;
      }
    }

    return { kind: "video", url: url.toString() } as const;
  } catch {
    return null;
  }
}

export function CreateBlogPage() {
  const { t } = useTranslation();
  const editorRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const imageResizeRef = useRef<ImageResizeState | null>(null);
  const imagePlaceholderRef = useRef<Element | null>(null);
  const columnResizeRef = useRef<ColumnResizeState | null>(null);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("community");
  const [tags, setTags] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [imageModal, setImageModal] = useState<ImageModalState | null>(null);
  const [imageForm, setImageForm] = useState<ImageFormState>({
    url: "",
    alt: "",
    caption: "",
  });
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [tableForm, setTableForm] = useState<TableFormState>({
    rows: "3",
    columns: "3",
  });
  const [submitState, setSubmitState] = useState<SubmitState>({
    status: "idle",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeToolbarKeys, setActiveToolbarKeys] = useState<ToolbarItemKey[]>(
    [],
  );

  const updateToolbarState = useCallback(() => {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || selection.rangeCount === 0) {
      setActiveToolbarKeys([]);
      return;
    }

    const range = selection.getRangeAt(0);

    if (!editor.contains(range.commonAncestorContainer)) {
      setActiveToolbarKeys([]);
      return;
    }

    const container =
      range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? range.commonAncestorContainer
        : range.commonAncestorContainer.parentElement;

    const selectedElement = container instanceof Element ? container : null;
    const block = selectedElement?.closest("h2, h3, p, blockquote, li");
    const blockTag = block?.tagName.toLowerCase();
    const selectedFigure = selectedElement?.closest(".blog-image-frame");
    const selectedActionKeys: ToolbarItemKey[] = [];

    if (selectedElement?.closest("a")) {
      selectedActionKeys.push("action:link");
    }

    if (selectedFigure?.querySelector("img")) {
      selectedActionKeys.push("action:image");
    }

    if (selectedFigure?.querySelector("iframe, video")) {
      selectedActionKeys.push("action:video");
    }

    if (selectedElement?.closest(".blog-columns")) {
      selectedActionKeys.push("action:columns");
    }

    if (selectedElement?.closest("table")) {
      selectedActionKeys.push("action:table");
    }

    const nextKeys = [
      ...toolbarGroups
        .flatMap((group) => group)
        .filter((item) => {
          if (item.command === "formatBlock") {
            return item.value === (blockTag === "li" ? "p" : blockTag);
          }

          try {
            return document.queryCommandState(item.command);
          } catch {
            return false;
          }
        })
        .map(getToolbarItemKey),
      ...selectedActionKeys,
    ];

    setActiveToolbarKeys((currentKeys) => {
      if (
        currentKeys.length === nextKeys.length &&
        currentKeys.every((key, index) => key === nextKeys[index])
      ) {
        return currentKeys;
      }

      return nextKeys;
    });
  }, []);

  useEffect(() => {
    function handleMouseMove(event: MouseEvent) {
      const resizeState = imageResizeRef.current;
      const columnResizeState = columnResizeRef.current;

      if (columnResizeState) {
        const deltaPercent =
          ((event.clientX - columnResizeState.startX) /
            columnResizeState.width) *
          100;
        const nextLeftPercent = Math.min(
          Math.max(columnResizeState.startLeftPercent + deltaPercent, 20),
          80,
        );

        columnResizeState.columns.style.gridTemplateColumns = `calc(${nextLeftPercent.toFixed(
          2,
        )}% - 0.375rem) 0.75rem calc(${(100 - nextLeftPercent).toFixed(
          2,
        )}% - 0.375rem)`;
      }

      if (resizeState) {
        const nextWidth = Math.min(
          Math.max(
            resizeState.startWidth + event.clientX - resizeState.startX,
            160,
          ),
          resizeState.maxWidth,
        );
        const nextPercent = (nextWidth / resizeState.maxWidth) * 100;

        resizeState.figure.style.width = `${nextPercent.toFixed(2)}%`;
        resizeState.figure.style.maxWidth = "100%";
        resizeState.media.style.width = "100%";
        resizeState.media.style.maxWidth = "100%";
      }
    }

    function handleMouseUp() {
      if (!imageResizeRef.current && !columnResizeRef.current) {
        return;
      }

      imageResizeRef.current = null;
      columnResizeRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      setContentHtml(editorRef.current?.innerHTML ?? "");
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", updateToolbarState);

    return () => {
      document.removeEventListener("selectionchange", updateToolbarState);
    };
  }, [updateToolbarState]);

  function normalizeColumns() {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    editor.querySelectorAll(".blog-columns").forEach((columns) => {
      const columnsElement = columns as HTMLElement;
      const columnItems = Array.from(columns.children).filter(
        (child) =>
          child instanceof HTMLElement &&
          !child.classList.contains("blog-columns-resize-handle"),
      );

      columnsElement.style.gridTemplateColumns ||=
        "calc(50% - 0.375rem) 0.75rem calc(50% - 0.375rem)";

      columnItems.forEach((column) => {
        column.classList.add("blog-column");

        if (
          column.textContent?.trim() ||
          column.querySelector(
            "blockquote, figure, h2, h3, iframe, img, ol, table, ul, video",
          )
        ) {
          return;
        }

        column.innerHTML = "<p><br></p>";
      });

      if (
        columnItems.length >= 2 &&
        !columns.querySelector(".blog-columns-resize-handle")
      ) {
        columnItems[0].insertAdjacentHTML(
          "afterend",
          '<span class="blog-columns-resize-handle" contenteditable="false" aria-hidden="true"></span>',
        );
      }
    });
  }

  function normalizeMedia() {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    editor.querySelectorAll("figure").forEach((figure) => {
      const media = figure.querySelector("img, video, iframe");

      if (!(media instanceof HTMLElement)) {
        return;
      }

      figure.classList.add("blog-image-frame");
      figure.setAttribute("contenteditable", "false");
      figure.setAttribute("draggable", "false");
      media.setAttribute("draggable", "false");
      media.style.width = "100%";
      media.style.maxWidth = "100%";

      if (media instanceof HTMLIFrameElement) {
        media.style.aspectRatio = "16 / 9";
        media.style.height = "auto";
      } else {
        media.style.height = "auto";
      }

      if (!figure.querySelector(".blog-image-resize-handle")) {
        figure.insertAdjacentHTML(
          "beforeend",
          '<span class="blog-image-resize-handle" aria-hidden="true"></span>',
        );
      }
    });
  }

  function normalizeEditorRoot() {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    if (
      !editor.textContent?.trim() &&
      !editor.querySelector(
        "blockquote, figure, h2, h3, iframe, img, ol, table, ul, video",
      )
    ) {
      editor.innerHTML = "<p><br></p>";
      return;
    }

    editor.querySelectorAll(".blog-columns").forEach((columns) => {
      const next = columns.nextElementSibling;

      if (!next || next.classList.contains("blog-columns")) {
        columns.insertAdjacentHTML("afterend", "<p><br></p>");
      }
    });
  }

  function syncEditor() {
    normalizeColumns();
    normalizeMedia();
    normalizeEditorRoot();
    setContentHtml(editorRef.current?.innerHTML ?? "");
    updateToolbarState();
  }

  function saveSelection() {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);

    if (editor.contains(range.commonAncestorContainer)) {
      selectionRef.current = range.cloneRange();
      updateToolbarState();
      return;
    }

    setActiveToolbarKeys([]);
  }

  function restoreSelection() {
    const selection = window.getSelection();

    if (!selection || !selectionRef.current) {
      return;
    }

    selection.removeAllRanges();
    selection.addRange(selectionRef.current);
  }

  function getSelectedFigure() {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || selection.rangeCount === 0) {
      return null;
    }

    const range = selection.getRangeAt(0);
    const container =
      range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? range.commonAncestorContainer
        : range.commonAncestorContainer.parentElement;

    if (!(container instanceof Element)) {
      return null;
    }

    const figure = container.closest(".blog-image-frame");

    if (figure instanceof HTMLElement && editor.contains(figure)) {
      return figure;
    }

    return null;
  }

  function alignSelectedFigure(command: string) {
    const figure = getSelectedFigure();

    if (!figure) {
      return false;
    }

    if (command === "justifyLeft") {
      figure.style.marginLeft = "0";
      figure.style.marginRight = "auto";
      return true;
    }

    if (command === "justifyCenter") {
      figure.style.marginLeft = "auto";
      figure.style.marginRight = "auto";
      return true;
    }

    if (command === "justifyRight") {
      figure.style.marginLeft = "auto";
      figure.style.marginRight = "0";
      return true;
    }

    return false;
  }

  function runCommand(command: string, value?: string) {
    editorRef.current?.focus();
    restoreSelection();

    if (alignSelectedFigure(command)) {
      syncEditor();
      saveSelection();
      return;
    }

    document.execCommand(command, false, value);
    syncEditor();
    saveSelection();
  }

  function insertHtml(html: string) {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand("insertHTML", false, html);
    syncEditor();
    saveSelection();
  }

  function importMedia(kind: MediaKind, placeholder?: Element | null) {
    imagePlaceholderRef.current = placeholder ?? null;
    setImageForm({
      url: "",
      alt: "",
      caption: "",
    });
    setImageModal({ mode: "insert", kind });
  }

  function submitImageModal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!imageModal) {
      return;
    }

    const captionHtml = imageForm.caption.trim()
      ? `<figcaption>${escapeHtml(imageForm.caption.trim())}</figcaption>`
      : "";

    let mediaHtml = "";

    if (imageModal.kind === "image") {
      const normalizedUrl = normalizeImageUrl(imageForm.url);

      if (!normalizedUrl) {
        return;
      }

      mediaHtml = `<img src="${escapeHtml(
        normalizedUrl,
      )}" alt="${escapeHtml(
        imageForm.alt.trim(),
      )}" draggable="false" style="width:100%;height:auto;max-width:100%;">`;
    } else {
      const normalizedUrl = normalizeVideoUrl(imageForm.url);

      if (!normalizedUrl) {
        return;
      }

      mediaHtml =
        normalizedUrl.kind === "iframe"
          ? `<iframe src="${escapeHtml(
              normalizedUrl.url,
            )}" title="${escapeHtml(
              imageForm.alt.trim() || "Embedded video",
            )}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="width:100%;aspect-ratio:16/9;border:0;"></iframe>`
          : `<video src="${escapeHtml(
              normalizedUrl.url,
            )}" controls preload="metadata" style="width:100%;height:auto;max-width:100%;"></video>`;
    }

    const imageHtml = `<figure class="blog-image-frame" contenteditable="false" draggable="false" style="width:100%;max-width:100%;">${mediaHtml}${captionHtml}<span class="blog-image-resize-handle" aria-hidden="true"></span></figure><p><br></p>`;

    const placeholder =
      imageModal.mode === "insert" ? imagePlaceholderRef.current : null;

    if (placeholder) {
      placeholder.outerHTML = imageHtml;
      imagePlaceholderRef.current = null;
      syncEditor();
      saveSelection();
      setImageModal(null);
      return;
    }

    insertHtml(imageHtml);
    imagePlaceholderRef.current = null;
    setImageModal(null);
  }

  function getColumnLeftPercent(columns: HTMLElement) {
    const template = columns.style.gridTemplateColumns;
    const percentMatch = template.match(/([\d.]+)%/);

    if (percentMatch) {
      return Number.parseFloat(percentMatch[1]);
    }

    const [leftColumn, , rightColumn] = Array.from(columns.children);

    if (
      leftColumn instanceof HTMLElement &&
      rightColumn instanceof HTMLElement
    ) {
      const leftWidth = leftColumn.getBoundingClientRect().width;
      const rightWidth = rightColumn.getBoundingClientRect().width;
      const totalWidth = leftWidth + rightWidth;

      if (totalWidth > 0) {
        return (leftWidth / totalWidth) * 100;
      }
    }

    return 50;
  }

  function startColumnResize(event: ReactMouseEvent<HTMLDivElement>) {
    const editor = editorRef.current;
    const target = event.target;

    if (!editor || !(target instanceof Element)) {
      return false;
    }

    const handle = target.closest(".blog-columns-resize-handle");

    if (!handle || !editor.contains(handle)) {
      return false;
    }

    const columns = handle.closest(".blog-columns");

    if (!(columns instanceof HTMLElement)) {
      return false;
    }

    columnResizeRef.current = {
      columns,
      startX: event.clientX,
      startLeftPercent: getColumnLeftPercent(columns),
      width: columns.getBoundingClientRect().width,
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    event.preventDefault();
    event.stopPropagation();

    return true;
  }

  function startImageResize(event: ReactMouseEvent<HTMLDivElement>) {
    const editor = editorRef.current;
    const target = event.target;

    if (!editor || !(target instanceof Element)) {
      return false;
    }

    const handle = target.closest(".blog-image-resize-handle");

    if (!handle || !editor.contains(handle)) {
      return false;
    }

    const figure = handle.closest("figure");
    const media = figure?.querySelector("img, video, iframe");

    if (!(figure instanceof HTMLElement) || !(media instanceof HTMLElement)) {
      return false;
    }

    const editorWidth = editor.getBoundingClientRect().width;
    const figureWidth = figure.getBoundingClientRect().width;

    imageResizeRef.current = {
      figure,
      media,
      maxWidth: editorWidth,
      startWidth: figureWidth,
      startX: event.clientX,
    };
    document.body.style.cursor = "nwse-resize";
    document.body.style.userSelect = "none";
    event.preventDefault();
    event.stopPropagation();

    return true;
  }

  function focusEmptyColumn(event: ReactMouseEvent<HTMLDivElement>) {
    const editor = editorRef.current;
    const target = event.target;

    if (!editor || !(target instanceof Element)) {
      return;
    }

    const column = target.closest(".blog-column");

    if (!column || !editor.contains(column) || column.textContent?.trim()) {
      return;
    }

    normalizeColumns();

    const caretTarget = column.querySelector("p") ?? column;
    const range = document.createRange();
    const selection = window.getSelection();

    range.selectNodeContents(caretTarget);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);
    saveSelection();
  }

  function focusEditableSpace(event: ReactMouseEvent<HTMLDivElement>) {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const target = event.target;

    if (target instanceof Element) {
      const placeholder = target.closest(".blog-image-placeholder");

      if (placeholder && editor.contains(placeholder)) {
        const kind =
          placeholder.getAttribute("data-media-kind") === "video"
            ? "video"
            : "image";
        importMedia(kind, placeholder);
        return;
      }
    }

    focusEmptyColumn(event);

    if (event.target !== editor) {
      return;
    }

    normalizeEditorRoot();

    const caretTarget = editor.lastElementChild ?? editor;
    const range = document.createRange();
    const selection = window.getSelection();

    range.selectNodeContents(caretTarget);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
    saveSelection();
  }

  function handleEditorMouseDown(event: ReactMouseEvent<HTMLDivElement>) {
    if (startColumnResize(event)) {
      return;
    }

    startImageResize(event);
  }

  function addLink() {
    saveSelection();
    const url = window.prompt("https://");
    const normalizedUrl = url ? normalizeWebUrl(url) : "";

    if (!normalizedUrl) {
      return;
    }

    runCommand("createLink", normalizedUrl);
  }

  function addImage() {
    insertHtml(
      `<div class="blog-image-placeholder" data-media-kind="image" contenteditable="false" role="button" tabindex="0">Click to import image from URL</div><p><br></p>`,
    );
  }

  function addVideo() {
    insertHtml(
      `<div class="blog-image-placeholder" data-media-kind="video" contenteditable="false" role="button" tabindex="0">Click to import video from URL</div><p><br></p>`,
    );
  }

  function addColumns() {
    insertHtml(
      `<div class="blog-columns" style="grid-template-columns:calc(50% - 0.375rem) 0.75rem calc(50% - 0.375rem);"><div class="blog-column"><p>First column</p></div><span class="blog-columns-resize-handle" contenteditable="false" aria-hidden="true"></span><div class="blog-column"><p>Second column</p></div></div><p><br></p>`,
    );
  }

  function addTable() {
    saveSelection();
    setTableForm({ rows: "3", columns: "3" });
    setTableModalOpen(true);
  }

  function submitTableModal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const rowCount = parseCount(tableForm.rows, 3, 12);
    const columnCount = parseCount(tableForm.columns, 3, 8);
    const header = Array.from({ length: columnCount }, (_, index) => {
      return `<th>Header ${index + 1}</th>`;
    }).join("");
    const rows = Array.from({ length: rowCount }, () => {
      const cells = Array.from({ length: columnCount }, () => "<td>Cell</td>").join(
        "",
      );

      return `<tr>${cells}</tr>`;
    }).join("");

    insertHtml(
      `<table><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table><p><br></p>`,
    );
    setTableModalOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitState({ status: "idle", message: "" });

    const contentText = editorRef.current?.innerText.trim() ?? "";
    const payload = {
      title,
      excerpt,
      category,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      contentHtml: editorRef.current?.innerHTML ?? contentHtml,
      contentText,
    };

    try {
      const response = await fetch("/api/blog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string; blog?: { id: string } };

      if (!response.ok) {
        throw new Error(result.error ?? "Blog submit failed.");
      }

      setSubmitState({
        status: "success",
        message: `Submitted JSON blog ${result.blog?.id ?? ""}`.trim(),
      });
    } catch (error) {
      setSubmitState({
        status: "error",
        message: error instanceof Error ? error.message : "Blog submit failed.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageLayout
      description={t("blog.create.description")}
      eyebrow={t("page.blog.eyebrow")}
      title={t("blog.create.title")}
    >
      <form className="grid gap-4 lg:grid-cols-[20rem_1fr]" onSubmit={handleSubmit}>
        <Card className="grid gap-4 p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {t("blog.create.metadata")}
          </h2>
          <FormField htmlFor="blog-title" label={t("form.title")}>
            <Input
              id="blog-title"
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t("blog.create.titlePlaceholder")}
              required
              value={title}
            />
          </FormField>
          <FormField htmlFor="blog-excerpt" label="Excerpt">
            <Textarea
              id="blog-excerpt"
              onChange={(event) => setExcerpt(event.target.value)}
              placeholder={t("blog.create.excerptPlaceholder")}
              rows={4}
              value={excerpt}
            />
          </FormField>
          <FormField htmlFor="blog-category" label="Category">
            <Select
              id="blog-category"
              onChange={(event) => setCategory(event.target.value)}
              value={category}
            >
              <option value="community">Community</option>
              <option value="discipleship">Discipleship</option>
              <option value="event">Event</option>
              <option value="testimony">Testimony</option>
            </Select>
          </FormField>
          <FormField htmlFor="blog-tags" label="Tags">
            <Input
              id="blog-tags"
              onChange={(event) => setTags(event.target.value)}
              placeholder={t("blog.create.tagsPlaceholder")}
              value={tags}
            />
          </FormField>
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Submitting..." : t("action.submit")}
          </Button>
          {submitState.message ? (
            <p
              className={
                submitState.status === "success"
                  ? "text-sm font-medium text-[var(--status-success)]"
                  : "text-sm font-medium text-[var(--status-danger)]"
              }
            >
              {submitState.message}
            </p>
          ) : null}
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-[var(--border-subtle)] px-5 py-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              {t("blog.create.editor")}
            </h2>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto border-b border-[var(--border-subtle)] bg-[var(--bg-base)] px-5 py-3">
            {toolbarGroups.map((group, index) => (
              <div
                className="inline-flex shrink-0 items-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1 shadow-sm"
                key={index}
              >
                {group.map((item) => {
                  const isActive = activeToolbarKeys.includes(
                    getToolbarItemKey(item),
                  );

                  return (
                    <button
                      aria-label={item.label}
                      aria-pressed={isActive}
                      className={cn(
                        toolbarButtonClass,
                        isActive && toolbarButtonActiveClass,
                        item.className,
                      )}
                      key={`${item.command}-${item.label}`}
                      onClick={() => runCommand(item.command, item.value)}
                      onMouseDown={(event) => event.preventDefault()}
                      title={item.label}
                      type="button"
                    >
                      <ToolbarIcon name={item.icon} />
                    </button>
                  );
                })}
              </div>
            ))}
            <div className="ml-auto flex shrink-0 gap-2">
              <button
                aria-pressed={activeToolbarKeys.includes("action:link")}
                className={cn(
                  toolbarActionButtonClass,
                  activeToolbarKeys.includes("action:link") &&
                    toolbarButtonActiveClass,
                )}
                onClick={addLink}
                onMouseDown={(event) => event.preventDefault()}
                type="button"
              >
                <ToolbarIcon name="link" />
                Link
              </button>
              <button
                aria-pressed={activeToolbarKeys.includes("action:image")}
                className={cn(
                  toolbarActionButtonClass,
                  activeToolbarKeys.includes("action:image") &&
                    toolbarButtonActiveClass,
                )}
                onClick={addImage}
                onMouseDown={(event) => event.preventDefault()}
                type="button"
              >
                <ToolbarIcon name="image" />
                Image
              </button>
              <button
                aria-pressed={activeToolbarKeys.includes("action:video")}
                className={cn(
                  toolbarActionButtonClass,
                  activeToolbarKeys.includes("action:video") &&
                    toolbarButtonActiveClass,
                )}
                onClick={addVideo}
                onMouseDown={(event) => event.preventDefault()}
                type="button"
              >
                <ToolbarIcon name="video" />
                Video
              </button>
              <button
                aria-pressed={activeToolbarKeys.includes("action:columns")}
                className={cn(
                  toolbarActionButtonClass,
                  activeToolbarKeys.includes("action:columns") &&
                    toolbarButtonActiveClass,
                )}
                onClick={addColumns}
                onMouseDown={(event) => event.preventDefault()}
                type="button"
              >
                <ToolbarIcon name="columns" />
                Columns
              </button>
              <button
                aria-pressed={activeToolbarKeys.includes("action:table")}
                className={cn(
                  toolbarActionButtonClass,
                  activeToolbarKeys.includes("action:table") &&
                    toolbarButtonActiveClass,
                )}
                onClick={addTable}
                onMouseDown={(event) => event.preventDefault()}
                type="button"
              >
                <ToolbarIcon name="table" />
                Table
              </button>
            </div>
          </div>
          <div
            className="min-h-[26rem] px-5 py-4 text-base leading-7 text-[var(--text-primary)] outline-none [&_.blog-column]:min-h-24 [&_.blog-column]:rounded-md [&_.blog-column]:border [&_.blog-column]:border-dashed [&_.blog-column]:border-[var(--border-subtle)] [&_.blog-column]:px-3 [&_.blog-column]:py-2 [&_.blog-columns-resize-handle]:cursor-col-resize [&_.blog-columns-resize-handle]:rounded [&_.blog-columns-resize-handle]:bg-[var(--border-strong)] [&_.blog-columns-resize-handle]:transition [&_.blog-columns-resize-handle]:hover:bg-[var(--brand-primary)] [&_.blog-columns]:grid [&_.blog-columns]:gap-0 [&_.blog-columns]:rounded-md [&_.blog-columns]:border [&_.blog-columns]:border-[var(--border-subtle)] [&_.blog-columns]:p-4 [&_.blog-image-frame]:relative [&_.blog-image-frame]:max-w-full [&_.blog-image-placeholder]:my-4 [&_.blog-image-placeholder]:cursor-pointer [&_.blog-image-placeholder]:rounded-md [&_.blog-image-placeholder]:border [&_.blog-image-placeholder]:border-dashed [&_.blog-image-placeholder]:border-[var(--brand-primary)] [&_.blog-image-placeholder]:bg-[var(--brand-muted)] [&_.blog-image-placeholder]:px-4 [&_.blog-image-placeholder]:py-10 [&_.blog-image-placeholder]:text-center [&_.blog-image-placeholder]:text-sm [&_.blog-image-placeholder]:font-semibold [&_.blog-image-placeholder]:text-[var(--brand-primary)] [&_.blog-image-resize-handle]:absolute [&_.blog-image-resize-handle]:bottom-2 [&_.blog-image-resize-handle]:right-2 [&_.blog-image-resize-handle]:h-5 [&_.blog-image-resize-handle]:w-5 [&_.blog-image-resize-handle]:cursor-nwse-resize [&_.blog-image-resize-handle]:rounded [&_.blog-image-resize-handle]:border [&_.blog-image-resize-handle]:border-white [&_.blog-image-resize-handle]:bg-[var(--brand-primary)] [&_a]:font-semibold [&_a]:text-[var(--brand-primary)] [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--brand-primary)] [&_blockquote]:pl-4 [&_figcaption]:mt-2 [&_figcaption]:text-sm [&_figcaption]:text-[var(--text-secondary)] [&_figure]:my-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:text-xl [&_h3]:font-semibold [&_iframe]:max-w-full [&_iframe]:rounded-md [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-md [&_ol]:list-decimal [&_ol]:pl-6 [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-[var(--border-subtle)] [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-[var(--border-subtle)] [&_th]:bg-[var(--brand-muted)] [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_ul]:list-disc [&_ul]:pl-6 [&_video]:h-auto [&_video]:max-w-full [&_video]:rounded-md"
            contentEditable
            onInput={syncEditor}
            onClick={focusEditableSpace}
            onKeyUp={saveSelection}
            onMouseDown={handleEditorMouseDown}
            onMouseUp={saveSelection}
            ref={editorRef}
            role="textbox"
            suppressContentEditableWarning
          />
        </Card>
      </form>
      {imageModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
          <form
            className="grid w-full max-w-lg gap-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-xl"
            onSubmit={submitImageModal}
          >
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {imageModal.kind === "image" ? "Image details" : "Video details"}
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {imageModal.kind === "image"
                  ? "Paste an online image URL or a shared Google Drive image link."
                  : "Paste a YouTube, Vimeo, or direct video URL."}
              </p>
            </div>
            <FormField
              htmlFor="image-url"
              label={imageModal.kind === "image" ? "Image URL" : "Video URL"}
            >
              <Input
                autoFocus
                id="image-url"
                onChange={(event) =>
                  setImageForm((current) => ({
                    ...current,
                    url: event.target.value,
                  }))
                }
                placeholder={
                  imageModal.kind === "image"
                    ? "https://drive.google.com/file/d/..."
                    : "https://www.youtube.com/watch?v=..."
                }
                required
                value={imageForm.url}
              />
            </FormField>
            <FormField
              htmlFor="image-alt"
              label={imageModal.kind === "image" ? "Alt text" : "Title"}
            >
              <Input
                id="image-alt"
                onChange={(event) =>
                  setImageForm((current) => ({
                    ...current,
                    alt: event.target.value,
                  }))
                }
                placeholder={
                  imageModal.kind === "image"
                    ? "Describe the image"
                    : "Name the video"
                }
                value={imageForm.alt}
              />
            </FormField>
            <FormField htmlFor="image-caption" label="Caption">
              <Textarea
                id="image-caption"
                onChange={(event) =>
                  setImageForm((current) => ({
                    ...current,
                    caption: event.target.value,
                  }))
                }
                placeholder="Optional caption"
                rows={3}
                value={imageForm.caption}
              />
            </FormField>
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setImageModal(null)}
                type="button"
                variant="secondary"
              >
                Cancel
              </Button>
              <Button type="submit">
                {imageModal.kind === "image" ? "Insert image" : "Insert video"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
      {tableModalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
          <form
            className="grid w-full max-w-md gap-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-xl"
            onSubmit={submitTableModal}
          >
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Table size
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Choose up to 12 rows and 8 columns.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField htmlFor="table-rows" label="Rows">
                <Input
                  id="table-rows"
                  max={12}
                  min={1}
                  onChange={(event) =>
                    setTableForm((current) => ({
                      ...current,
                      rows: event.target.value,
                    }))
                  }
                  required
                  type="number"
                  value={tableForm.rows}
                />
              </FormField>
              <FormField htmlFor="table-columns" label="Columns">
                <Input
                  id="table-columns"
                  max={8}
                  min={1}
                  onChange={(event) =>
                    setTableForm((current) => ({
                      ...current,
                      columns: event.target.value,
                    }))
                  }
                  required
                  type="number"
                  value={tableForm.columns}
                />
              </FormField>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setTableModalOpen(false)}
                type="button"
                variant="secondary"
              >
                Cancel
              </Button>
              <Button type="submit">Insert table</Button>
            </div>
          </form>
        </div>
      ) : null}
    </PageLayout>
  );
}
