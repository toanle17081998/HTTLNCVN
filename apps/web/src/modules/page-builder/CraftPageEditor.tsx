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
  Save,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@services/client";
import {
  pageKeys,
  useCreatePageMutation,
  useDeletePageMutation,
  usePageQuery,
  usePagesQuery,
  useUpdatePageMutation,
} from "@services/page";
import { Button, Card, Input, Select, cn } from "@/components/ui";
import { useAdminLayoutChrome } from "@/modules/admin/components/AdminLayout";
import { useFeedback } from "@/providers/FeedbackProvider";
import { useTranslation } from "@/providers/I18nProvider";
import { craftResolver, PageBuilderToolbox, PageCanvas, RenderNodeSettings } from "./craftNodes";
import { createDefaultPageContent, ensureValidPageContent, slugifyPageTitle } from "./defaultContent";

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

function BuilderShell({
  content,
  onSave,
  saving,
  saveLabel,
}: {
  content: string;
  onSave: (content: string) => Promise<void>;
  saving: boolean;
  saveLabel: string;
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
      <div
        className={cn(
          "grid gap-6",
          isFullscreen ? "fixed inset-0 z-40 overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)]" : "",
        )}
      >
        <div
          className={cn(
            "grid gap-6",
            isFullscreen
              ? "h-full grid-cols-[9rem_minmax(0,1fr)] gap-0"
              : "xl:grid-cols-[9rem_minmax(0,1fr)]",
          )}
        >
          <aside className={cn(isFullscreen ? "h-full border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2" : "xl:sticky xl:top-24 xl:self-start")}>
            <Card className={cn("flex w-[9rem] flex-col rounded-lg p-2", isFullscreen ? "h-full w-full rounded-none border-0 shadow-none" : "max-h-[calc(100vh-7rem)] overflow-hidden")}>
              <div className="flex-1 overflow-y-auto">
                <PageBuilderToolbox />
              </div>
            </Card>
          </aside>

          <div className="min-w-0">
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
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-secondary)]"
                    onClick={() => setIsFullscreen((current) => !current)}
                    type="button"
                  >
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </button>
                  <BuilderSaveButton label={saveLabel} onSave={onSave} saving={saving} />
                </div>
              </div>
              <div className={cn("overflow-auto bg-[var(--bg-base)] p-4 sm:p-6", isFullscreen && "flex-1 p-6")}>
                <div className="mx-auto w-full">
                  <Frame data={content}>
                    <Element canvas is={PageCanvas} />
                  </Frame>
                </div>
              </div>
            </Card>
          </div>
        </div>
        <RenderNodeSettings />
      </div>
    </Editor>
  );
}

function CreatePageCard({ onCreated }: { onCreated: (slug: string) => void }) {
  const createPage = useCreatePageMutation();
  const [routePath, setRoutePath] = useState("/");
  const [title, setTitle] = useState("Home");
  const { toast } = useFeedback();
  const { t } = useTranslation();

  async function handleCreate() {
    const slug = slugifyPageTitle(routePath === "/" ? "home" : routePath);

    try {
      const page = await createPage.mutateAsync({
        content: createDefaultPageContent(title, routePath),
        route_path: routePath,
        slug,
        title_en: title,
        title_vi: title,
      });
      toast({ title: t("toast.page.created"), variant: "success" });
      onCreated(page.slug);
    } catch (error) {
      toast({
        description: error instanceof ApiError ? error.message : undefined,
        title: t("toast.page.createFailed"),
        variant: "error",
      });
    }
  }

  return (
    <Card className="rounded-2xl p-6">
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            {t("pageBuilder.createPage")}
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
            {t("pageBuilder.startRoute")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            {t("pageBuilder.createDescription")}
          </p>
        </div>
        <label className="grid gap-2 text-sm font-medium text-[var(--text-primary)]">
          {t("pageBuilder.routePath")}
          <Input onChange={(event) => setRoutePath(event.target.value)} value={routePath} />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[var(--text-primary)]">
          {t("form.title")}
          <Input onChange={(event) => setTitle(event.target.value)} value={title} />
        </label>
        <Button isLoading={createPage.isPending} onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t("pageBuilder.createAction")}
        </Button>
      </div>
    </Card>
  );
}

export function CraftPageEditor() {
  const searchParams = useSearchParams();
  const requestedRoute = searchParams.get("route");
  const pagesQuery = usePagesQuery();
  const deletePage = useDeletePageMutation();
  const queryClient = useQueryClient();
  const { confirm, toast } = useFeedback();
  const { t } = useTranslation();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const pages = pagesQuery.data?.items ?? [];

  const effectiveSlug = useMemo(() => {
    if (selectedSlug) return selectedSlug;
    if (requestedRoute) {
      return pages.find((page) => page.route_path === requestedRoute)?.slug ?? null;
    }
    return pages[0]?.slug ?? null;
  }, [pages, requestedRoute, selectedSlug]);

  const selectedPageSummary = pages.find((page) => page.slug === effectiveSlug) ?? null;
  const selectedPageQuery = usePageQuery(effectiveSlug ?? undefined);
  const selectedPage = selectedPageQuery.data ?? null;
  const updatePage = useUpdatePageMutation(selectedPageSummary?.slug ?? "");

  async function handleSave(content: string) {
    if (!selectedPage) return;

    try {
      await updatePage.mutateAsync({ content });
      toast({ title: t("toast.page.saved"), variant: "success" });
      queryClient.invalidateQueries({ queryKey: pageKeys.resolve(selectedPage.route_path) });
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
              <Select onChange={(event) => setSelectedSlug(event.target.value)} value={effectiveSlug ?? ""}>
                {pages.map((page) => (
                  <option key={page.id} value={page.slug}>
                    {page.title_en} ({page.route_path})
                  </option>
                ))}
              </Select>
            </div>
            <Button onClick={() => setIsCreating((current) => !current)} size="sm" variant="secondary">
              <Plus className="mr-2 h-4 w-4" />
              {t("pageBuilder.newPage")}
            </Button>
          </div>
        </div>
      </Card>

      {isCreating ? (
        <CreatePageCard
          onCreated={(slug) => {
            setSelectedSlug(slug);
            setIsCreating(false);
          }}
        />
      ) : null}

      <section className="space-y-4">
        <main className="space-y-6">
          {selectedPage ? (
            <>
              <Card className="rounded-2xl border-[var(--border-subtle)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                      {t("pageBuilder.editing")}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{selectedPage.title_en}</h2>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      {t("pageBuilder.routeLabel", { route: selectedPage.route_path })}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={selectedPage.route_path} target="_blank">
                      <Button size="sm" variant="secondary">
                        <Eye className="mr-2 h-4 w-4" />
                        {t("pageBuilder.preview")}
                      </Button>
                    </Link>
                    <Button onClick={() => toggleStatus("draft")} size="sm" variant="secondary">
                      {t("action.saveDraft")}
                    </Button>
                    <Button onClick={() => toggleStatus("published")} size="sm">
                      <Globe className="mr-2 h-4 w-4" />
                      {t("action.publish")}
                    </Button>
                    <Button onClick={handleDelete} size="sm" variant="danger">
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t("action.delete")}
                    </Button>
                  </div>
                </div>
              </Card>

              <BuilderShell
                content={ensureValidPageContent(selectedPage.content, selectedPage.title_en, selectedPage.route_path)}
                onSave={handleSave}
                saveLabel={t("pageBuilder.saveLayout")}
                saving={updatePage.isPending}
              />
            </>
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
