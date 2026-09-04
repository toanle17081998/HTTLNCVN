"use client";

import { useEffect, useMemo, useState } from "react";
import { Editor, Element, Frame, useEditor } from "@craftjs/core";
import {
  Eye,
  Globe,
  Maximize2,
  Minimize2,
  PenSquare,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/services/client";
import {
  pageKeys,
  useDeletePageMutation,
  usePageQuery,
  usePagesQuery,
  useRestorePageMutation,
  useUpdatePageMutation,
  type Page,
} from "@/services/page";
import { Button, Card, Select, cn } from "@/components/ui";
import { useAdminLayoutChrome } from "@/components/admin/AdminLayout";
import { useFeedback } from "@/providers/FeedbackProvider";
import { useTranslation } from "@/providers/I18nProvider";
import {
  craftResolver,
  PageCanvas,
  SectionBuilderProvider,
} from "./craftNodes";
import {
  ensureValidPageContent,
} from "./defaultContent";
import { CreatePageModal } from "./editor/CreatePageModal";

function LanguageSelector({
  activeLanguage,
  onLanguageChange,
}: {
  activeLanguage: "en" | "vi";
  onLanguageChange: (lang: "en" | "vi") => void;
}) {
  return (
    <div className="flex items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1 text-xs font-semibold">
      <button
        className={`rounded-lg px-2.5 py-1 transition-all ${
          activeLanguage === "vi"
            ? "bg-[var(--brand-primary)] text-[var(--text-inverse)] shadow-sm"
            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        }`}
        onClick={() => onLanguageChange("vi")}
        type="button"
      >
        VI
      </button>
      <button
        className={`rounded-lg px-2.5 py-1 transition-all ${
          activeLanguage === "en"
            ? "bg-[var(--brand-primary)] text-[var(--text-inverse)] shadow-sm"
            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        }`}
        onClick={() => onLanguageChange("en")}
        type="button"
      >
        EN
      </button>
    </div>
  );
}

function BuilderSaveButton({
  onSave,
  saving,
  label,
}: {
  onSave: (content: string) => Promise<void>;
  saving: boolean;
  label: string;
}) {
  const { query } = useEditor();

  return (
    <Button isLoading={saving} onClick={() => onSave(query.serialize())} size="sm">
      <Save className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}

function BuilderHeaderActions({
  onSave,
  saving,
  page,
  editLang,
  onLanguageChange,
  onDelete,
}: {
  onSave: (content: string, status?: "draft" | "published") => Promise<void>;
  saving: boolean;
  page: Page;
  editLang: "en" | "vi";
  onLanguageChange: (lang: "en" | "vi") => void;
  onDelete: () => void;
}) {
  const { query } = useEditor();
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <LanguageSelector activeLanguage={editLang} onLanguageChange={onLanguageChange} />
      <Link href={`${page.route_path}?previewLanguage=${editLang}`} target="_blank">
        <Button size="sm" variant="secondary">
          <Eye className="mr-2 h-4 w-4" />
          {t("pageBuilder.preview")}
        </Button>
      </Link>
      <Button
        disabled={saving}
        onClick={() => onSave(query.serialize(), "draft")}
        size="sm"
        variant="secondary"
      >
        {t("action.saveDraft")}
      </Button>
      <Button
        isLoading={saving}
        onClick={() => onSave(query.serialize(), "published")}
        size="sm"
      >
        <Globe className="mr-2 h-4 w-4" />
        {t("action.publish")}
      </Button>
      <Button
        disabled={saving}
        onClick={onDelete}
        size="sm"
        variant="danger"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        {t("action.delete")}
      </Button>
    </div>
  );
}

function BuilderShell({
  content,
  onSave,
  saving,
  saveLabel,
  page,
  editLang,
  onLanguageChange,
  onDelete,
}: {
  content: string;
  onSave: (content: string, status?: "draft" | "published") => Promise<void>;
  saving: boolean;
  saveLabel: string;
  page: Page;
  editLang: "en" | "vi";
  onLanguageChange: (lang: "en" | "vi") => void;
  onDelete: () => void;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const adminChrome = useAdminLayoutChrome();
  const { t } = useTranslation();

  useEffect(() => {
    adminChrome?.setIsFullscreen(isFullscreen);
    return () => {
      adminChrome?.setIsFullscreen(false);
    };
  }, [adminChrome, isFullscreen]);

  return (
    <Editor enabled resolver={craftResolver}>
      <SectionBuilderProvider>
        <div
          className={cn(
            "grid gap-6",
            isFullscreen ? "fixed inset-0 z-40 flex h-dvh flex-col overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)]" : "",
          )}
        >
          {!isFullscreen ? (
            <Card className="rounded-2xl border-[var(--border-subtle)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                    {t("pageBuilder.editing")}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{page.title_en}</h2>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {t("pageBuilder.routeLabel", { route: page.route_path })}
                  </p>
                </div>
                <BuilderHeaderActions
                  editLang={editLang}
                  onDelete={onDelete}
                  onLanguageChange={onLanguageChange}
                  onSave={onSave}
                  page={page}
                  saving={saving}
                />
              </div>
            </Card>
          ) : null}

          <div className={cn("min-w-0 flex-1", isFullscreen && "min-h-0 overflow-hidden")}>
            <Card className={cn("overflow-hidden rounded-2xl border-[var(--border-subtle)]", isFullscreen && "flex h-full flex-col rounded-none border-0 shadow-none")}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                      {t("pageBuilder.canvas")}
                    </p>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                      {t("pageBuilder.title")}
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-secondary)] cursor-pointer"
                      onClick={() => setIsFullscreen((current) => !current)}
                      type="button"
                    >
                      {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </button>
                    <BuilderSaveButton label={saveLabel} onSave={onSave} saving={saving} />
                  </div>
                </div>
                <div className={cn("overflow-auto bg-[var(--bg-base)]", isFullscreen && "min-h-0 flex-1")}>
                  <div className="w-full">
                    <Frame data={content}>
                      <Element canvas is={PageCanvas} />
                    </Frame>
                  </div>
                </div>
              </Card>
            </div>
        </div>
      </SectionBuilderProvider>
    </Editor>
  );
}

export function CraftPageEditor({ initialSlug }: { initialSlug?: string }) {
  const searchParams = useSearchParams();
  const requestedRoute = searchParams.get("route");
  const [showDeleted, setShowDeleted] = useState(false);
  const pagesQuery = usePagesQuery(showDeleted ? "deleted" : undefined);
  const deletePage = useDeletePageMutation();
  const restorePage = useRestorePageMutation();
  const queryClient = useQueryClient();
  const { confirm, toast } = useFeedback();
  const { t } = useTranslation();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(initialSlug || null);
  const [selectedDeletedId, setSelectedDeletedId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editLang, setEditLang] = useState<"en" | "vi">("vi");
  const pages = pagesQuery.data?.items ?? [];

  const effectiveSlug = useMemo(() => {
    if (showDeleted) return null;
    if (selectedSlug) return selectedSlug;
    if (requestedRoute) {
      return pages.find((page) => page.route_path === requestedRoute)?.slug ?? null;
    }
    return pages[0]?.slug ?? null;
  }, [pages, requestedRoute, selectedSlug, showDeleted]);

  const selectedDeletedPage = showDeleted
    ? pages.find((page) => page.id === selectedDeletedId) ?? pages[0] ?? null
    : null;
  const selectedPageSummary = showDeleted ? null : pages.find((page) => page.slug === effectiveSlug) ?? null;
  const selectedPageQuery = usePageQuery(effectiveSlug ?? undefined);
  const selectedPage = selectedPageQuery.data ?? null;
  const updatePage = useUpdatePageMutation(selectedPageSummary?.slug ?? "");

  async function handleSave(content: string, newStatus?: "draft" | "published") {
    if (!selectedPage) return;

    try {
      const isOtherEmptyOrDefault =
        editLang === "en"
          ? !selectedPage.content_vi || selectedPage.content_vi.includes("Encounter grace") || selectedPage.content_vi === "{}"
          : !selectedPage.content_en || selectedPage.content_en.includes("Encounter grace") || selectedPage.content_en === "{}";

      if (editLang === "en") {
        await updatePage.mutateAsync({
          content_en: content,
          ...(isOtherEmptyOrDefault ? { content_vi: content } : {}),
          ...(newStatus ? { status: newStatus } : {}),
        });
      } else {
        await updatePage.mutateAsync({
          content_vi: content,
          ...(isOtherEmptyOrDefault ? { content_en: content } : {}),
          ...(newStatus ? { status: newStatus } : {}),
        });
      }
      toast({
        title: newStatus === "published"
          ? t("toast.page.published")
          : newStatus === "draft"
            ? t("toast.page.draftSaved")
            : t("toast.page.saved"),
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: pageKeys.all });
    } catch (error) {
      toast({
        description: error instanceof ApiError ? error.message : undefined,
        title: t("toast.page.saveFailed"),
        variant: "error",
      });
    }
  }

  async function toggleStatus(status: "draft" | "published") {
    if (!selectedPage) return;

    try {
      await updatePage.mutateAsync({ status });
      toast({
        title: status === "published" ? t("toast.page.published") : t("toast.page.draftSaved"),
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: pageKeys.all });
    } catch (error) {
      toast({
        description: error instanceof ApiError ? error.message : undefined,
        title: t("toast.page.statusFailed"),
        variant: "error",
      });
    }
  }

  async function handleDelete() {
    if (!selectedPage) return;

    const shouldDelete = await confirm({
      confirmLabel: t("action.delete"),
      description: t("confirm.pageDelete.description", {
        route: selectedPage.route_path,
        title: selectedPage.title_en,
      }),
      title: t("confirm.pageDelete.title"),
      variant: "delete",
    });

    if (!shouldDelete) {
      return;
    }

    try {
      await deletePage.mutateAsync(selectedPage.slug);
      queryClient.removeQueries({ queryKey: pageKeys.detail(selectedPage.slug) });
      queryClient.removeQueries({ queryKey: pageKeys.resolve(selectedPage.route_path) });
      setSelectedSlug(null);
      toast({ title: t("toast.page.deleted"), variant: "success" });
    } catch (error) {
      toast({
        description: error instanceof ApiError ? error.message : undefined,
        title: t("toast.page.deleteFailed"),
        variant: "error",
      });
    }
  }

  async function handleRestore() {
    if (!selectedDeletedPage) return;

    const shouldRestore = await confirm({
      confirmLabel: t("pageBuilder.restoreConfirmLabel"),
      description: t("pageBuilder.restoreConfirmDesc", {
        route: selectedDeletedPage.route_path,
        title: selectedDeletedPage.title_en,
      }),
      title: t("pageBuilder.restoreConfirmTitle"),
      variant: "warning",
    });

    if (!shouldRestore) return;

    try {
      const restoredPage = await restorePage.mutateAsync(selectedDeletedPage.id);
      setShowDeleted(false);
      setSelectedDeletedId(null);
      setSelectedSlug(restoredPage.slug);
      toast({ title: t("toast.page.restored"), variant: "success" });
    } catch (error) {
      toast({
        description: error instanceof ApiError ? error.message : undefined,
        title: t("toast.page.restoreFailed"),
        variant: "error",
      });
    }
  }

  return (
    <div className="space-y-5">
      <Card className="rounded-2xl border-[var(--border-subtle)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--text-primary)] text-[var(--bg-surface)]">
              <PenSquare className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                {t("pageBuilder.editor")}
              </p>
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                {t("pageBuilder.title")}
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-[15rem]">
              <Select
                onChange={(event) => {
                  if (showDeleted) setSelectedDeletedId(event.target.value);
                  else setSelectedSlug(event.target.value);
                }}
                value={showDeleted ? selectedDeletedPage?.id ?? "" : effectiveSlug ?? ""}
              >
                {pages.map((page) => (
                  <option key={page.id} value={showDeleted ? page.id : page.slug}>
                    {page.title_en} ({page.route_path})
                  </option>
                ))}
              </Select>
            </div>
            <Button
              onClick={() => {
                setShowDeleted((current) => !current);
                setSelectedDeletedId(null);
              }}
              size="sm"
              variant="secondary"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {showDeleted ? t("pageBuilder.showActive") : t("pageBuilder.showDeleted")}
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)} size="sm" variant="secondary">
              <Plus className="mr-2 h-4 w-4" />
              {t("pageBuilder.newPage")}
            </Button>
          </div>
        </div>
      </Card>

      <CreatePageModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={(slug) => {
          setSelectedSlug(slug);
        }}
      />

      <section className="space-y-4">
        <main className="space-y-6">
          {showDeleted ? (
            selectedDeletedPage ? (
              <Card className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--status-danger)]">
                      {t("pageBuilder.deletedPage")}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                      {selectedDeletedPage.title_en}
                    </h2>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      {selectedDeletedPage.route_path} / {selectedDeletedPage.slug}
                    </p>
                    {selectedDeletedPage.deleted_at ? (
                      <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                        {t("pageBuilder.deletedAt", {
                          date: new Date(selectedDeletedPage.deleted_at).toLocaleString(),
                        })}
                      </p>
                    ) : null}
                  </div>
                  <Button isLoading={restorePage.isPending} onClick={handleRestore}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {t("pageBuilder.restore")}
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="p-8 text-sm text-[var(--text-secondary)]">
                {t("pageBuilder.noDeletedPages")}
              </Card>
            )
          ) : selectedPage ? (
            <BuilderShell
              key={`${selectedPage.id}-${editLang}-${selectedPage.updated_at}`}
              content={ensureValidPageContent(
                editLang === "en" ? selectedPage.content_en : selectedPage.content_vi,
                editLang === "en" ? selectedPage.title_en : selectedPage.title_vi,
                selectedPage.route_path
              )}
              editLang={editLang}
              onDelete={handleDelete}
              onLanguageChange={setEditLang}
              onSave={handleSave}
              page={selectedPage}
              saveLabel={t("pageBuilder.saveLayout")}
              saving={updatePage.isPending}
            />
          ) : selectedPageSummary && selectedPageQuery.isLoading ? (
            <Card className="rounded-2xl p-8">
              <div className="h-6 w-48 animate-pulse rounded bg-[var(--bg-base)]" />
              <div className="mt-3 h-4 w-72 animate-pulse rounded bg-[var(--bg-base)]" />
              <div className="mt-6 h-[32rem] animate-pulse rounded-2xl bg-[var(--bg-base)]" />
            </Card>
          ) : (
            <Card className="rounded-2xl p-8">
              <p className="text-sm leading-6 text-[var(--text-secondary)]">
                {t("pageBuilder.emptyState")}
              </p>
            </Card>
          )}
        </main>
      </section>
    </div>
  );
}
