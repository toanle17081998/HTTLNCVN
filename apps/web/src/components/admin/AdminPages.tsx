"use client";

import { useState } from "react";
import { FileText, Plus, ArrowLeft, Eye, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageLayout } from "@/components/layout";
import { Button, Card, cn, Switch } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import { useFeedback } from "@/providers/FeedbackProvider";
import { usePagesQuery, useDeletePageMutation, useRestorePageMutation, pageApi, type Page } from "@/services/page";
import { CraftPageEditor } from "@/components/page-builder/CraftPageEditor";
import { CreatePageModal } from "@/components/page-builder/editor/CreatePageModal";

function PageList({ onEdit }: { onEdit: (slug: string) => void }) {
  const { locale, t } = useTranslation();
  const { confirm, toast } = useFeedback();
  const [showDeleted, setShowDeleted] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const pagesQuery = usePagesQuery(showDeleted ? "deleted" : undefined);
  const deletePage = useDeletePageMutation();
  const restorePage = useRestorePageMutation();

  async function handleToggleStatus(slug: string, currentStatus: string) {
    const newStatus = currentStatus === "published" ? "draft" : "published";
    try {
      await pageApi.update(slug, { status: newStatus });
      pagesQuery.refetch();
      toast({
        title: newStatus === "published" ? t("toast.page.published") : t("toast.page.draftSaved"),
        variant: "success",
      });
    } catch {
      toast({ title: t("toast.page.statusFailed"), variant: "error" });
    }
  }

  async function handleDelete(slug: string, title: string) {
    const ok = await confirm({
      variant: "delete",
      title: t("confirm.pageDelete.title"),
      description: t("confirm.pageDelete.description", { title, route: slug }),
    });
    if (!ok) return;
    await deletePage.mutateAsync(slug);
  }

  async function handleRestore(page: Pick<Page, "id" | "route_path" | "slug" | "title_en">) {
    const ok = await confirm({
      confirmLabel: "Restore and override",
      description: `Restore "${page.title_en}" as the published page for ${page.route_path}? Any active page using the same route or slug will be moved to Deleted.`,
      title: "Restore deleted page",
      variant: "warning",
    });
    if (!ok) return;

    try {
      await restorePage.mutateAsync(page.id);
      toast({ title: "Page restored and published.", variant: "success" });
    } catch {
      toast({ title: "Page could not be restored.", variant: "error" });
    }
  }

  return (
    <PageLayout
      actions={
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setShowDeleted((current) => !current)} variant="secondary">
            <RotateCcw className="mr-2 h-4 w-4" />
            {showDeleted ? "Show active" : "Show deleted"}
          </Button>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("pageBuilder.newPage")}
          </Button>
        </div>
      }
      description={t("pageBuilder.createDescription")}
      eyebrow={t("admin.common.admin")}
      title={t("admin.nav.pages")}
    >
      <CreatePageModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(slug) => onEdit(slug)}
      />
      <div className="grid gap-3">
        {pagesQuery.isLoading ? (
          <Card className="p-5 text-sm text-[var(--text-secondary)]">{t("admin.articles.loading")}</Card>
        ) : null}

        {pagesQuery.data?.items.map((page) => (
          <Card className="flex flex-col gap-4 p-5 transition-all duration-200 hover:shadow-md sm:flex-row sm:items-center" key={page.id}>
            <div className="flex flex-1 items-center gap-4 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-muted)] text-[var(--brand-primary)]">
                <FileText aria-hidden="true" className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-bold text-[var(--text-primary)]">
                  {locale === "vi" ? page.title_vi || page.title_en : page.title_en || page.title_vi}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  <span className={cn(
                    "rounded px-1.5 py-0.5",
                    page.status === 'published'
                      ? "bg-[var(--status-success-bg)] text-[var(--status-success)]"
                      : page.status === 'deleted'
                        ? "bg-[var(--status-danger-bg)] text-[var(--status-danger)]"
                        : "bg-[var(--status-warning-bg)] text-[var(--status-warning)]"
                  )}>
                    {page.status}
                  </span>
                  <span>•</span>
                  <span>{page.route_path}</span>
                </div>
              </div>
            </div>
            
            {showDeleted ? (
              <div className="flex flex-wrap items-center gap-3 sm:ml-auto">
                {page.deleted_at ? (
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {new Date(page.deleted_at).toLocaleString()}
                  </span>
                ) : null}
                <Button
                  isLoading={restorePage.isPending}
                  onClick={() => handleRestore(page)}
                  size="sm"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restore
                </Button>
              </div>
            ) : (
            <div className="flex flex-wrap items-center gap-4 sm:ml-auto">
              <div className="flex items-center gap-2 pr-2 border-r border-[var(--border-subtle)]">
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  {page.status === 'published' ? t("action.publish") : t("action.saveDraft")}
                </span>
                <Switch 
                  checked={page.status === 'published'} 
                  onCheckedChange={() => handleToggleStatus(page.slug, page.status)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => onEdit(page.slug)}
                  size="sm"
                  variant="secondary"
                  className="h-10 rounded-lg px-4 text-xs font-bold"
                >
                  {t("admin.common.edit")}
                </Button>
                <Link href={page.route_path} target="_blank">
                  <Button size="sm" variant="secondary" className="h-10 w-10 p-0 rounded-lg">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  disabled={deletePage.isPending}
                  onClick={() => handleDelete(page.slug, page.title_en)}
                  size="sm"
                  variant="danger"
                  className="h-10 rounded-lg px-4 text-xs font-bold"
                >
                  {t("admin.common.delete")}
                </Button>
              </div>
            </div>
            )}
          </Card>
        ))}

        {pagesQuery.data?.items.length === 0 ? (
          <Card className="border-dashed p-8 text-center text-sm text-[var(--text-secondary)]">
            {showDeleted ? "No deleted pages." : t("admin.articles.empty")}
          </Card>
        ) : null}
      </div>
    </PageLayout>
  );
}

export function AdminPages() {
  const searchParams = useSearchParams();
  const requestedRoute = searchParams.get("route");
  const requestedSlug = searchParams.get("slug");
  const [editingSlug, setEditingSlug] = useState<string | null>(
    requestedSlug ?? (requestedRoute ? "" : null)
  );
  const { t } = useTranslation();

  if (editingSlug !== null) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="secondary" size="sm" onClick={() => setEditingSlug(null)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("action.goBack")}
          </Button>
          <h1 className="text-xl font-bold">{t("pageBuilder.editor")}</h1>
        </div>
        <CraftPageEditor initialSlug={editingSlug || undefined} />
      </div>
    );
  }

  return <PageList onEdit={(slug) => setEditingSlug(slug || "")} />;
}

