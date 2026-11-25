"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Copy,
  Folder,
  FolderPlus,
  Image as ImageIcon,
  Pencil,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { Button, Card, Input, Pagination, Select, Skeleton, Text, Title, cn } from "@/components/ui";
import {
  mediaKeys,
  uploadMedia,
  useCreateMediaFolderMutation,
  useDeleteMediaFolderMutation,
  useDeleteMediaImageMutation,
  useMediaGalleryQuery,
  useMoveMediaImagesMutation,
  useRenameMediaFolderMutation,
  type MediaGalleryItem,
} from "@/api/media";
import { useTranslation } from "@/providers/I18nProvider";

type MediaGalleryManagerProps = {
  mode?: "manager" | "picker";
  selectedUrl?: string;
  onSelect?: (item: MediaGalleryItem) => void;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaGalleryManager({
  mode = "manager",
  selectedUrl,
  onSelect,
}: MediaGalleryManagerProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeFolder, setActiveFolder] = useState<string>("__all__");
  const [search, setSearch] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(16);

  const galleryQuery = useMediaGalleryQuery({
    folder: activeFolder,
    q: search.trim() || undefined,
  });
  const createFolder = useCreateMediaFolderMutation();
  const renameFolder = useRenameMediaFolderMutation();
  const deleteFolder = useDeleteMediaFolderMutation();
  const moveImages = useMoveMediaImagesMutation();
  const deleteImage = useDeleteMediaImageMutation();

  const folders = galleryQuery.data?.folders ?? [];
  const items = galleryQuery.data?.items ?? [];
  const safePage = Math.min(page, Math.max(0, Math.ceil(items.length / pageSize) - 1));
  const pagedItems = items.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const totalCount = galleryQuery.data?.totalCount ?? 0;
  const uncategorizedCount = galleryQuery.data?.uncategorizedCount ?? 0;

  const targetUploadFolder =
    activeFolder === "__all__" || activeFolder === "__uncategorized__" ? "" : activeFolder;

  async function handleUploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(null);
    try {
      const uploaded: MediaGalleryItem[] = [];
      for (const file of Array.from(files)) {
        const res = await uploadMedia(file, undefined, targetUploadFolder);
        if (res.filename) {
          uploaded.push({
            filename: res.filename,
            folder: res.folder ?? targetUploadFolder,
            height: res.height,
            originalName: res.originalName,
            size: res.size,
            updatedAt: new Date().toISOString(),
            url: res.url,
            width: res.width,
          });
        }
      }
      await queryClient.invalidateQueries({ queryKey: mediaKeys.all });
      if (mode === "picker" && uploaded.length === 1 && onSelect) {
        onSelect(uploaded[0]);
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : t("media.gallery.uploadFailed"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleCreateFolder() {
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    await createFolder.mutateAsync(trimmed);
    setActiveFolder(trimmed);
    setNewFolderName("");
    setShowNewFolder(false);
  }

  async function handleRenameFolder(oldName: string) {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === oldName) {
      setRenamingFolder(null);
      return;
    }
    await renameFolder.mutateAsync({ newName: trimmed, oldName });
    if (activeFolder === oldName) setActiveFolder(trimmed);
    setRenamingFolder(null);
  }

  async function handleDeleteFolder(name: string) {
    await deleteFolder.mutateAsync(name);
    if (activeFolder === name) setActiveFolder("__all__");
  }

  async function handleCopy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      window.setTimeout(() => setCopiedUrl((cur) => (cur === url ? null : cur)), 1500);
    } catch {
      // ignore clipboard errors
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
      {/* Folder sidebar */}
      <Card className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <Title as="h3" variant="subsection">
            {t("media.gallery.folders")}
          </Title>
          <Button
            aria-label={t("media.gallery.newFolder")}
            onClick={() => setShowNewFolder((prev) => !prev)}
            size="iconSm"
            title={t("media.gallery.newFolder")}
            type="button"
            variant="ghost"
          >
            <FolderPlus className="h-4 w-4" />
          </Button>
        </div>

        {showNewFolder ? (
          <div className="flex gap-1.5">
            <Input
              autoFocus
              className="h-9 text-sm"
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleCreateFolder();
                }
              }}
              placeholder={t("media.gallery.folderPlaceholder")}
              value={newFolderName}
            />
            <Button
              disabled={createFolder.isPending || !newFolderName.trim()}
              onClick={() => void handleCreateFolder()}
              size="sm"
              type="button"
            >
              {t("media.gallery.add")}
            </Button>
          </div>
        ) : null}

        <div className="flex gap-1.5 overflow-x-auto pb-1 lg:grid lg:gap-1 lg:overflow-visible lg:pb-0">
          <button
            className={cn(
              "flex shrink-0 items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition lg:w-full",
              activeFolder === "__all__"
                ? "bg-[var(--brand-muted)] text-[var(--brand-primary)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]",
            )}
            onClick={() => setActiveFolder("__all__")}
            type="button"
          >
            <span className="flex items-center gap-2 truncate">
              <ImageIcon className="h-4 w-4 shrink-0" />
              {t("media.gallery.allImages")}
            </span>
            <span className="text-xs opacity-75">{totalCount}</span>
          </button>

          <button
            className={cn(
              "flex shrink-0 items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition lg:w-full",
              activeFolder === "__uncategorized__"
                ? "bg-[var(--brand-muted)] text-[var(--brand-primary)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]",
            )}
            onClick={() => setActiveFolder("__uncategorized__")}
            type="button"
          >
            <span className="flex items-center gap-2 truncate">
              <Folder className="h-4 w-4 shrink-0" />
              {t("media.gallery.uncategorized")}
            </span>
            <span className="text-xs opacity-75">{uncategorizedCount}</span>
          </button>

          {folders.map((folder) => (
            <div className="group flex shrink-0 items-center gap-1 lg:w-full" key={folder.name}>
              {renamingFolder === folder.name ? (
                <div className="flex flex-1 gap-1">
                  <Input
                    autoFocus
                    className="h-8 text-xs"
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void handleRenameFolder(folder.name);
                      } else if (e.key === "Escape") {
                        setRenamingFolder(null);
                      }
                    }}
                    value={renameValue}
                  />
                  <Button
                    onClick={() => void handleRenameFolder(folder.name)}
                    size="iconSm"
                    type="button"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <>
                  <button
                    className={cn(
                      "flex min-w-0 flex-1 items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition",
                      activeFolder === folder.name
                        ? "bg-[var(--brand-muted)] text-[var(--brand-primary)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]",
                    )}
                    onClick={() => setActiveFolder(folder.name)}
                    type="button"
                  >
                    <span className="flex min-w-0 items-center gap-2 truncate">
                      <Folder className="h-4 w-4 shrink-0" />
                      <span className="truncate">{folder.name}</span>
                    </span>
                    <span className="ml-2 text-xs opacity-75">{folder.count}</span>
                  </button>
                  {mode === "manager" ? (
                    <div className="flex shrink-0 items-center opacity-0 transition group-hover:opacity-100">
                      <button
                        aria-label={t("media.gallery.renameFolder")}
                        className="rounded p-1 text-[var(--text-tertiary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                        onClick={() => {
                          setRenamingFolder(folder.name);
                          setRenameValue(folder.name);
                        }}
                        title={t("media.gallery.renameFolder")}
                        type="button"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        aria-label={t("media.gallery.deleteFolder")}
                        className="rounded p-1 text-[var(--text-tertiary)] hover:bg-[var(--status-danger-muted)] hover:text-[var(--status-danger)]"
                        onClick={() => void handleDeleteFolder(folder.name)}
                        title={t("media.gallery.deleteFolder")}
                        type="button"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Main gallery pane */}
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <Input
              className="pl-9"
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("media.gallery.searchPlaceholder")}
              value={search}
            />
          </div>

          <input
            accept="image/*"
            className="hidden"
            multiple
            onChange={(e) => void handleUploadFiles(e.target.files)}
            ref={fileInputRef}
            type="file"
          />
          <Button
            className="ml-auto"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading
              ? t("media.gallery.uploading")
              : targetUploadFolder
                ? t("media.gallery.uploadToFolder", { folder: targetUploadFolder })
                : t("media.gallery.uploadFromComputer")}
          </Button>
        </div>

        {uploadError ? (
          <Card className="border-[var(--status-danger)] p-3 text-sm text-[var(--status-danger)]">
            {uploadError}
          </Card>
        ) : null}

        {galleryQuery.isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card className="overflow-hidden" key={i}>
                <Skeleton className="aspect-[4/3] w-full rounded-none" />
                <div className="space-y-2 p-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-2 border-dashed p-10 text-center">
            <ImageIcon className="h-8 w-8 text-[var(--text-tertiary)]" />
            <Text tone="secondary" variant="small">
              {t("media.gallery.empty")}
            </Text>
          </Card>
        ) : (
          <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {pagedItems.map((item) => {
              const isSelected = Boolean(selectedUrl && selectedUrl === item.url);
              return (
                <Card
                  className={cn(
                    "group flex flex-col overflow-hidden transition",
                    mode === "picker" && "cursor-pointer hover:border-[var(--brand-primary)]",
                    isSelected && "border-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)]",
                  )}
                  key={item.filename}
                  onClick={mode === "picker" && onSelect ? () => onSelect(item) : undefined}
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--bg-base)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={item.originalName}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                      src={item.url}
                    />
                    {isSelected ? (
                      <span className="absolute right-2 top-2 rounded-full bg-[var(--brand-primary)] p-1 text-white shadow">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-1 flex-col gap-2 p-2.5">
                    <p
                      className="truncate text-xs font-semibold text-[var(--text-primary)]"
                      title={item.originalName}
                    >
                      {item.originalName}
                    </p>
                    <p className="text-[11px] text-[var(--text-tertiary)]">
                      {formatBytes(item.size)}
                      {item.width && item.height ? ` • ${item.width}×${item.height}` : ""}
                    </p>

                    {mode === "manager" ? (
                      <div
                        className="mt-auto flex items-center gap-1 pt-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Select
                          aria-label={t("media.gallery.moveToFolder")}
                          className="h-8 flex-1 px-2 text-xs"
                          onChange={(e) =>
                            void moveImages.mutateAsync({
                              filenames: [item.filename],
                              folder: e.target.value,
                            })
                          }
                          value={item.folder}
                        >
                          <option value="">{t("media.gallery.uncategorized")}</option>
                          {folders.map((folder) => (
                            <option key={folder.name} value={folder.name}>
                              {folder.name}
                            </option>
                          ))}
                        </Select>

                        <Button
                          aria-label={t("media.gallery.copyUrl")}
                          onClick={() => void handleCopy(item.url)}
                          size="iconSm"
                          title={t("media.gallery.copyUrl")}
                          type="button"
                          variant="ghost"
                        >
                          {copiedUrl === item.url ? (
                            <Check className="h-3.5 w-3.5 text-[var(--status-success)]" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          aria-label={t("media.gallery.deleteImage")}
                          className="text-[var(--status-danger)] hover:bg-[var(--status-danger-muted)]"
                          onClick={() => void deleteImage.mutateAsync(item.filename)}
                          size="iconSm"
                          title={t("media.gallery.deleteImage")}
                          type="button"
                          variant="ghost"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </Card>
              );
            })}
          </div>
          <Pagination
            onPageChange={setPage}
            onPageSizeChange={(nextSize) => {
              setPageSize(nextSize);
              setPage(0);
            }}
            page={safePage}
            pageSize={pageSize}
            pageSizeOptions={[16, 24, 48]}
            total={items.length}
          />
          </>
        )}
      </div>
    </div>
  );
}
