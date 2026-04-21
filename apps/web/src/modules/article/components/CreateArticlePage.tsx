"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { PageLayout } from "@/components/layout";
import { Card, cn } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import {
  type ColumnResizeState,
  type EditorMode,
  type ImageFormState,
  type ImageModalState,
  type ImageResizeState,
  type SubmitState,
  type TableFormState,
  type ToolbarItemKey,
  getToolbarItemKey,
  toolbarGroups,
} from "./articleEditorTypes";
import {
  escapeHtml,
  markdownToHtml,
  normalizeImageUrl,
  normalizeVideoUrl,
  normalizeWebUrl,
  parseCount,
} from "./articleEditorUtils";
import { ArticleEditorToolbar } from "./ArticleEditorToolbar";
import { ArticleMetadataPanel } from "./ArticleMetadataPanel";
import { MediaInsertModal } from "./MediaInsertModal";
import { TableInsertModal } from "./TableInsertModal";

export function CreateArticlePage() {
  const { t } = useTranslation();

  // ── Refs ───────────────────────────────────────────────────────────────────
  const editorRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const imageResizeRef = useRef<ImageResizeState | null>(null);
  const imagePlaceholderRef = useRef<Element | null>(null);
  const columnResizeRef = useRef<ColumnResizeState | null>(null);

  // ── State ──────────────────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("community");
  const [tags, setTags] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [editorMode, setEditorMode] = useState<EditorMode>("rich");
  const [markdownContent, setMarkdownContent] = useState("");
  const [imageModal, setImageModal] = useState<ImageModalState | null>(null);
  const [imageForm, setImageForm] = useState<ImageFormState>({ url: "", alt: "", caption: "" });
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [tableForm, setTableForm] = useState<TableFormState>({ rows: "3", columns: "3" });
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeToolbarKeys, setActiveToolbarKeys] = useState<ToolbarItemKey[]>([]);

  const hasEditorContent =
    editorMode === "markdown"
      ? markdownContent.trim().length > 0
      : Boolean(editorRef.current?.innerText.trim() || contentHtml.trim());

  // ── Toolbar state tracking ─────────────────────────────────────────────────
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
    const selectedFigure = selectedElement?.closest(".article-image-frame");
    const selectedActionKeys: ToolbarItemKey[] = [];

    if (selectedElement?.closest("a")) selectedActionKeys.push("action:link");
    if (selectedFigure?.querySelector("img")) selectedActionKeys.push("action:image");
    if (selectedFigure?.querySelector("iframe, video")) selectedActionKeys.push("action:video");
    if (selectedElement?.closest(".article-columns")) selectedActionKeys.push("action:columns");
    if (selectedElement?.closest("table")) selectedActionKeys.push("action:table");

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

  // ── Global mouse/selection listeners ──────────────────────────────────────
  useEffect(() => {
    function handleMouseMove(event: MouseEvent) {
      const resizeState = imageResizeRef.current;
      const columnResizeState = columnResizeRef.current;

      if (columnResizeState) {
        const deltaPercent =
          ((event.clientX - columnResizeState.startX) / columnResizeState.width) * 100;
        const nextLeftPercent = Math.min(
          Math.max(columnResizeState.startLeftPercent + deltaPercent, 20),
          80,
        );
        columnResizeState.columns.style.gridTemplateColumns = `calc(${nextLeftPercent.toFixed(2)}% - 0.375rem) 0.75rem calc(${(100 - nextLeftPercent).toFixed(2)}% - 0.375rem)`;
      }

      if (resizeState) {
        const nextWidth = Math.min(
          Math.max(resizeState.startWidth + event.clientX - resizeState.startX, 160),
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
      if (!imageResizeRef.current && !columnResizeRef.current) return;
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
    return () => document.removeEventListener("selectionchange", updateToolbarState);
  }, [updateToolbarState]);

  // ── Editor normalisation ───────────────────────────────────────────────────
  function normalizeColumns() {
    const editor = editorRef.current;
    if (!editor) return;

    editor.querySelectorAll(".article-columns").forEach((columns) => {
      const columnsElement = columns as HTMLElement;
      const columnItems = Array.from(columns.children).filter(
        (child) =>
          child instanceof HTMLElement &&
          !child.classList.contains("article-columns-resize-handle"),
      );

      columnsElement.style.gridTemplateColumns ||=
        "calc(50% - 0.375rem) 0.75rem calc(50% - 0.375rem)";

      columnItems.forEach((column) => {
        column.classList.add("article-column");
        if (
          column.textContent?.trim() ||
          column.querySelector("blockquote, figure, h2, h3, iframe, img, ol, table, ul, video")
        ) {
          return;
        }
        column.innerHTML = "<p><br></p>";
      });

      if (columnItems.length >= 2 && !columns.querySelector(".article-columns-resize-handle")) {
        columnItems[0].insertAdjacentHTML(
          "afterend",
          '<span class="article-columns-resize-handle" contenteditable="false" aria-hidden="true"></span>',
        );
      }
    });
  }

  function normalizeMedia() {
    const editor = editorRef.current;
    if (!editor) return;

    editor.querySelectorAll("figure").forEach((figure) => {
      const media = figure.querySelector("img, video, iframe");
      if (!(media instanceof HTMLElement)) return;

      figure.classList.add("article-image-frame");
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

      if (!figure.querySelector(".article-image-resize-handle")) {
        figure.insertAdjacentHTML(
          "beforeend",
          '<span class="article-image-resize-handle" aria-hidden="true"></span>',
        );
      }
    });
  }

  function normalizeEditorRoot() {
    const editor = editorRef.current;
    if (!editor) return;

    if (
      !editor.textContent?.trim() &&
      !editor.querySelector("blockquote, figure, h2, h3, iframe, img, ol, table, ul, video")
    ) {
      editor.innerHTML = "<p><br></p>";
      return;
    }

    editor.querySelectorAll(".article-columns").forEach((columns) => {
      const next = columns.nextElementSibling;
      if (!next || next.classList.contains("article-columns")) {
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

  // ── Selection management ───────────────────────────────────────────────────
  function saveSelection() {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) return;
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
    if (!selection || !selectionRef.current) return;
    selection.removeAllRanges();
    selection.addRange(selectionRef.current);
  }

  // ── Figure alignment ───────────────────────────────────────────────────────
  function getSelectedFigure() {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    const container =
      range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? range.commonAncestorContainer
        : range.commonAncestorContainer.parentElement;
    if (!(container instanceof Element)) return null;
    const figure = container.closest(".article-image-frame");
    return figure instanceof HTMLElement && editor.contains(figure) ? figure : null;
  }

  function alignSelectedFigure(command: string) {
    const figure = getSelectedFigure();
    if (!figure) return false;
    if (command === "justifyLeft") { figure.style.marginLeft = "0"; figure.style.marginRight = "auto"; return true; }
    if (command === "justifyCenter") { figure.style.marginLeft = "auto"; figure.style.marginRight = "auto"; return true; }
    if (command === "justifyRight") { figure.style.marginLeft = "auto"; figure.style.marginRight = "0"; return true; }
    return false;
  }

  // ── Editor commands ────────────────────────────────────────────────────────
  function runCommand(command: string, value?: string) {
    editorRef.current?.focus();
    restoreSelection();
    if (alignSelectedFigure(command)) { syncEditor(); saveSelection(); return; }
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

  // ── Media helpers ──────────────────────────────────────────────────────────
  function importMedia(kind: "image" | "video", placeholder?: Element | null) {
    imagePlaceholderRef.current = placeholder ?? null;
    setImageForm({ url: "", alt: "", caption: "" });
    setImageModal({ mode: "insert", kind });
  }

  function submitImageModal(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!imageModal) return;

    const captionHtml = imageForm.caption.trim()
      ? `<figcaption>${escapeHtml(imageForm.caption.trim())}</figcaption>`
      : "";

    let mediaHtml = "";

    if (imageModal.kind === "image") {
      const normalizedUrl = normalizeImageUrl(imageForm.url);
      if (!normalizedUrl) return;
      mediaHtml = `<img src="${escapeHtml(normalizedUrl)}" alt="${escapeHtml(imageForm.alt.trim())}" draggable="false" style="width:100%;height:auto;max-width:100%;">`;
    } else {
      const normalizedUrl = normalizeVideoUrl(imageForm.url);
      if (!normalizedUrl) return;
      mediaHtml =
        normalizedUrl.kind === "iframe"
          ? `<iframe src="${escapeHtml(normalizedUrl.url)}" title="${escapeHtml(imageForm.alt.trim() || "Embedded video")}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="width:100%;aspect-ratio:16/9;border:0;"></iframe>`
          : `<video src="${escapeHtml(normalizedUrl.url)}" controls preload="metadata" style="width:100%;height:auto;max-width:100%;"></video>`;
    }

    const imageHtml = `<figure class="article-image-frame" contenteditable="false" draggable="false" style="width:100%;max-width:100%;">${mediaHtml}${captionHtml}<span class="article-image-resize-handle" aria-hidden="true"></span></figure><p><br></p>`;

    const placeholder = imageModal.mode === "insert" ? imagePlaceholderRef.current : null;
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

  // ── Column resize ──────────────────────────────────────────────────────────
  function getColumnLeftPercent(columns: HTMLElement) {
    const template = columns.style.gridTemplateColumns;
    const percentMatch = template.match(/([\d.]+)%/);
    if (percentMatch) return Number.parseFloat(percentMatch[1]);
    const [leftColumn, , rightColumn] = Array.from(columns.children);
    if (leftColumn instanceof HTMLElement && rightColumn instanceof HTMLElement) {
      const leftWidth = leftColumn.getBoundingClientRect().width;
      const rightWidth = rightColumn.getBoundingClientRect().width;
      const totalWidth = leftWidth + rightWidth;
      if (totalWidth > 0) return (leftWidth / totalWidth) * 100;
    }
    return 50;
  }

  function startColumnResize(event: ReactMouseEvent<HTMLDivElement>) {
    const editor = editorRef.current;
    const target = event.target;
    if (!editor || !(target instanceof Element)) return false;
    const handle = target.closest(".article-columns-resize-handle");
    if (!handle || !editor.contains(handle)) return false;
    const columns = handle.closest(".article-columns");
    if (!(columns instanceof HTMLElement)) return false;
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
    if (!editor || !(target instanceof Element)) return false;
    const handle = target.closest(".article-image-resize-handle");
    if (!handle || !editor.contains(handle)) return false;
    const figure = handle.closest("figure");
    const media = figure?.querySelector("img, video, iframe");
    if (!(figure instanceof HTMLElement) || !(media instanceof HTMLElement)) return false;
    const editorWidth = editor.getBoundingClientRect().width;
    const figureWidth = figure.getBoundingClientRect().width;
    imageResizeRef.current = { figure, media, maxWidth: editorWidth, startWidth: figureWidth, startX: event.clientX };
    document.body.style.cursor = "nwse-resize";
    document.body.style.userSelect = "none";
    event.preventDefault();
    event.stopPropagation();
    return true;
  }

  function focusEmptyColumn(event: ReactMouseEvent<HTMLDivElement>) {
    const editor = editorRef.current;
    const target = event.target;
    if (!editor || !(target instanceof Element)) return;
    const column = target.closest(".article-column");
    if (!column || !editor.contains(column) || column.textContent?.trim()) return;
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
    if (!editor) return;
    const target = event.target;
    if (target instanceof Element) {
      const placeholder = target.closest(".article-image-placeholder");
      if (placeholder && editor.contains(placeholder)) {
        const kind = placeholder.getAttribute("data-media-kind") === "video" ? "video" : "image";
        importMedia(kind, placeholder);
        return;
      }
    }
    focusEmptyColumn(event);
    if (event.target !== editor) return;
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
    if (startColumnResize(event)) return;
    startImageResize(event);
  }

  // ── Toolbar actions ────────────────────────────────────────────────────────
  function addLink() {
    saveSelection();
    const url = window.prompt("https://");
    const normalizedUrl = url ? normalizeWebUrl(url) : "";
    if (!normalizedUrl) return;
    runCommand("createLink", normalizedUrl);
  }

  function addImage() {
    insertHtml(
      `<div class="article-image-placeholder" data-media-kind="image" contenteditable="false" role="button" tabindex="0">Click to import image from URL</div><p><br></p>`,
    );
  }

  function addVideo() {
    insertHtml(
      `<div class="article-image-placeholder" data-media-kind="video" contenteditable="false" role="button" tabindex="0">Click to import video from URL</div><p><br></p>`,
    );
  }

  function addColumns() {
    insertHtml(
      `<div class="article-columns" style="grid-template-columns:calc(50% - 0.375rem) 0.75rem calc(50% - 0.375rem);"><div class="article-column"><p>First column</p></div><span class="article-columns-resize-handle" contenteditable="false" aria-hidden="true"></span><div class="article-column"><p>Second column</p></div></div><p><br></p>`,
    );
  }

  function addTable() {
    saveSelection();
    setTableForm({ rows: "3", columns: "3" });
    setTableModalOpen(true);
  }

  function submitTableModal(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const rowCount = parseCount(tableForm.rows, 3, 12);
    const columnCount = parseCount(tableForm.columns, 3, 8);
    const header = Array.from({ length: columnCount }, (_, i) => `<th>Header ${i + 1}</th>`).join("");
    const rows = Array.from({ length: rowCount }, () => {
      const cells = Array.from({ length: columnCount }, () => "<td>Cell</td>").join("");
      return `<tr>${cells}</tr>`;
    }).join("");
    insertHtml(`<table><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table><p><br></p>`);
    setTableModalOpen(false);
  }

  // ── Editor mode switch ─────────────────────────────────────────────────────
  function switchEditorMode(nextMode: EditorMode) {
    if (nextMode === editorMode) return;
    if (nextMode === "markdown") {
      setMarkdownContent(editorRef.current?.innerText ?? markdownContent);
      setEditorMode("markdown");
      setActiveToolbarKeys([]);
      return;
    }
    const nextHtml = markdownToHtml(markdownContent);
    setContentHtml(nextHtml);
    setEditorMode("rich");
    window.requestAnimationFrame(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = nextHtml || "<p><br></p>";
        syncEditor();
      }
    });
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitState({ status: "idle", message: "" });

    const isMarkdownMode = editorMode === "markdown";
    const nextContentHtml = isMarkdownMode
      ? markdownToHtml(markdownContent)
      : editorRef.current?.innerHTML ?? contentHtml;
    const contentText = isMarkdownMode
      ? markdownContent.trim()
      : editorRef.current?.innerText.trim() ?? "";

    const payload = {
      title,
      excerpt,
      category,
      tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      contentHtml: nextContentHtml,
      contentText,
    };

    try {
      const response = await fetch("/api/article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string; article?: { id: string } };
      if (!response.ok) throw new Error(result.error ?? "Article submit failed.");
      setSubmitState({
        status: "success",
        message: `Submitted JSON article ${result.article?.id ?? ""}`.trim(),
      });
    } catch (error) {
      setSubmitState({
        status: "error",
        message: error instanceof Error ? error.message : "Article submit failed.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <PageLayout
      description={t("article.create.description")}
      eyebrow={t("page.article.eyebrow")}
      title={t("article.create.title")}
    >
      <form
        className="grid gap-4 lg:grid-cols-[20rem_1fr] lg:items-start"
        onSubmit={handleSubmit}
      >
        {/* ── Left: metadata panel ── */}
        <ArticleMetadataPanel
          category={category}
          excerpt={excerpt}
          isSubmitting={isSubmitting}
          submitState={submitState}
          tags={tags}
          title={title}
          onCategoryChange={setCategory}
          onExcerptChange={setExcerpt}
          onTagsChange={setTags}
          onTitleChange={setTitle}
        />

        {/* ── Right: editor card ── */}
        <Card className="flex min-h-[32rem] flex-col overflow-hidden lg:max-h-[calc(100vh-9rem)]">
          {/* Editor header / mode toggle */}
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              {t("article.create.editor")}
            </h2>
            <div
              aria-label="Editor mode"
              className="inline-flex rounded-md border border-[var(--border-subtle)] bg-[var(--bg-base)] p-1"
              role="group"
            >
              {(["rich", "markdown"] as const).map((mode) => (
                <button
                  key={mode}
                  aria-pressed={editorMode === mode}
                  className={cn(
                    "h-8 rounded px-3 text-sm font-semibold transition",
                    editorMode === mode
                      ? "bg-[var(--bg-surface)] text-[var(--brand-primary)] shadow-sm"
                      : "text-[var(--text-secondary)] hover:bg-[var(--brand-muted)] hover:text-[var(--text-primary)]",
                    hasEditorContent &&
                      editorMode !== mode &&
                      "cursor-not-allowed opacity-50 hover:bg-transparent hover:text-[var(--text-secondary)]",
                  )}
                  disabled={hasEditorContent && editorMode !== mode}
                  onClick={() => switchEditorMode(mode)}
                  type="button"
                >
                  {mode === "rich" ? "Rich" : "Markdown"}
                </button>
              ))}
            </div>
          </div>

          {/* Toolbar (rich mode only) */}
          {editorMode === "rich" ? (
            <ArticleEditorToolbar
              activeToolbarKeys={activeToolbarKeys}
              onAddColumns={addColumns}
              onAddImage={addImage}
              onAddLink={addLink}
              onAddTable={addTable}
              onAddVideo={addVideo}
              onRunCommand={runCommand}
            />
          ) : null}

          {/* Rich editor area */}
          {editorMode === "rich" ? (
            <div
              className="min-h-[26rem] flex-1 overflow-y-auto overflow-x-auto px-5 py-4 text-base leading-7 text-[var(--text-primary)] outline-none [&_.article-column]:min-h-24 [&_.article-column]:rounded-md [&_.article-column]:border [&_.article-column]:border-dashed [&_.article-column]:border-[var(--border-subtle)] [&_.article-column]:px-3 [&_.article-column]:py-2 [&_.article-columns-resize-handle]:cursor-col-resize [&_.article-columns-resize-handle]:rounded [&_.article-columns-resize-handle]:bg-[var(--border-strong)] [&_.article-columns-resize-handle]:transition [&_.article-columns-resize-handle]:hover:bg-[var(--brand-primary)] [&_.article-columns]:grid [&_.article-columns]:gap-0 [&_.article-columns]:rounded-md [&_.article-columns]:border [&_.article-columns]:border-[var(--border-subtle)] [&_.article-columns]:p-4 [&_.article-image-frame]:relative [&_.article-image-frame]:max-w-full [&_.article-image-placeholder]:my-4 [&_.article-image-placeholder]:cursor-pointer [&_.article-image-placeholder]:rounded-md [&_.article-image-placeholder]:border [&_.article-image-placeholder]:border-dashed [&_.article-image-placeholder]:border-[var(--brand-primary)] [&_.article-image-placeholder]:bg-[var(--brand-muted)] [&_.article-image-placeholder]:px-4 [&_.article-image-placeholder]:py-10 [&_.article-image-placeholder]:text-center [&_.article-image-placeholder]:text-sm [&_.article-image-placeholder]:font-semibold [&_.article-image-placeholder]:text-[var(--brand-primary)] [&_.article-image-resize-handle]:absolute [&_.article-image-resize-handle]:bottom-2 [&_.article-image-resize-handle]:right-2 [&_.article-image-resize-handle]:h-5 [&_.article-image-resize-handle]:w-5 [&_.article-image-resize-handle]:cursor-nwse-resize [&_.article-image-resize-handle]:rounded [&_.article-image-resize-handle]:border [&_.article-image-resize-handle]:border-white [&_.article-image-resize-handle]:bg-[var(--brand-primary)] [&_a]:font-semibold [&_a]:text-[var(--brand-primary)] [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--brand-primary)] [&_blockquote]:pl-4 [&_figcaption]:mt-2 [&_figcaption]:text-sm [&_figcaption]:text-[var(--text-secondary)] [&_figure]:my-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:text-xl [&_h3]:font-semibold [&_iframe]:max-w-full [&_iframe]:rounded-md [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-md [&_ol]:list-decimal [&_ol]:pl-6 [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-[var(--border-subtle)] [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-[var(--border-subtle)] [&_th]:bg-[var(--brand-muted)] [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_ul]:list-disc [&_ul]:pl-6 [&_video]:h-auto [&_video]:max-w-full [&_video]:rounded-md"
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
          ) : (
            <textarea
              aria-label="Markdown content"
              className="min-h-[26rem] flex-1 resize-none overflow-y-auto bg-[var(--bg-surface)] px-5 py-4 font-mono text-sm leading-7 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
              onChange={(e) => setMarkdownContent(e.target.value)}
              placeholder={"## Heading\n\nWrite Markdown here..."}
              value={markdownContent}
            />
          )}
        </Card>
      </form>

      {/* ── Media insert modal ── */}
      {imageModal ? (
        <MediaInsertModal
          imageForm={imageForm}
          imageModal={imageModal}
          onClose={() => setImageModal(null)}
          onImageFormChange={setImageForm}
          onSubmit={submitImageModal}
        />
      ) : null}

      {/* ── Table insert modal ── */}
      {tableModalOpen ? (
        <TableInsertModal
          tableForm={tableForm}
          onClose={() => setTableModalOpen(false)}
          onSubmit={submitTableModal}
          onTableFormChange={setTableForm}
        />
      ) : null}
    </PageLayout>
  );
}
