"use client";

import { useState } from "react";
import { FileText, Plus, ArrowLeft, Eye, RotateCcw, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageLayout } from "@/components/layout";
import { Badge, Button, Card, Pagination, Switch, Title } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import { useFeedback } from "@/providers/FeedbackProvider";
import { pageApi } from "@/api/page";
import { usePagesQuery, useDeletePageMutation, useRestorePageMutation, type Page } from "@/hooks/page";
import { CraftPageEditor } from "@/components/page-builder/CraftPageEditor";
import { CreatePageModal } from "@/components/page-builder/editor/CreatePageModal";

function PageList({ onEdit }: { onEdit: (slug: string) => void }) {
  const { localize, t } = useTranslation();
  const { confirm, toast } = useFeedback();
  const [showDeleted, setShowDeleted] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const pagesQuery = usePagesQuery(showDeleted ? "deleted" : undefined);
  const allPages = pagesQuery.data?.items ?? [];
  const totalPagesCount = allPages.length;
  const safePage = Math.min(page, Math.max(0, Math.ceil(totalPagesCount / pageSize) - 1));
  const pagedPages = allPages.slice(safePage * pageSize, safePage * pageSize + pageSize);
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
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setShowDeleted((current) => !current)} variant="secondary">
            <RotateCcw className="mr-2 h-4 w-4" />
            {showDeleted ? t("admin.pages.showActive") : t("admin.pages.showDeleted")}
          </Button>
          <Button variant="primary" onClick={() => setIsCreateOpen(true)} className="gap-2">
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

        {pagedPages.map((page) => (
          <Card className="flex flex-col gap-4 p-5 transition-all duration-200 hover:shadow-md sm:flex-row sm:items-center" key={page.id}>
            <div className="flex flex-1 items-center gap-4 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-muted)] text-[var(--brand-primary)]">
                <FileText aria-hidden="true" className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <Title as="h2" className="truncate" variant="labelStrong">
                  {localize(page, "title")}
                </Title>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  <Badge
                    size="xs"
                    variant={page.status === "published" ? "success" : page.status === "deleted" ? "danger" : "warning"}
                  >
                    {page.status}
                  </Badge>
                  <span>•</span>
                  <span>{page.route_path}</span>
                </div>
              </div>
            </div>
            
            {showDeleted ? (
              <div className="flex w-full items-center justify-between gap-3 sm:ml-auto sm:w-auto sm:justify-end">
                {page.deleted_at ? (
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {new Date(page.deleted_at).toLocaleString()}
                  </span>
                ) : null}
                <Button
                  variant="primary"
                  aria-label={t("admin.pages.restore")}
                  className="w-9 !px-0 sm:w-auto sm:!px-3"
                  isLoading={restorePage.isPending}
                  onClick={() => handleRestore(page)}
                  size="sm"
                  title={t("admin.pages.restore")}
                >
                  <RotateCcw className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">{t("admin.pages.restore")}</span>
                </Button>
              </div>
            ) : (
            <div className="flex w-full items-center justify-between gap-3 sm:ml-auto sm:w-auto sm:justify-end">
              <div className="flex items-center gap-2 sm:border-r sm:border-[var(--border-subtle)] sm:pr-3">
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  {page.status === 'published' ? t("action.publish") : t("action.saveDraft")}
                </span>
                <Switch 
                  checked={page.status === 'published'} 
                  onCheckedChange={() => handleToggleStatus(page.slug, page.status)}
                />
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  aria-label={t("admin.common.edit")}
                  className="rounded-lg"
                  onClick={() => onEdit(page.slug)}
                  size="icon"
                  title={t("admin.common.edit")}
                  variant="secondary"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Link aria-label={t("admin.common.viewSite")} href={page.route_path} target="_blank" title={t("admin.common.viewSite")}>
                  <Button size="icon" variant="secondary" className="rounded-lg">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  aria-label={t("admin.common.delete")}
                  disabled={deletePage.isPending}
                  isLoading={deletePage.isPending && deletePage.variables === page.slug}
                  onClick={() => handleDelete(page.slug, page.title_en)}
                  size="icon"
                  title={t("admin.common.delete")}
                  variant="danger"
                  className="rounded-lg"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            )}
          </Card>
        ))}

        {pagesQuery.data?.items.length === 0 ? (
          <Card className="border-dashed p-8 text-center text-sm text-[var(--text-secondary)]">
            {showDeleted ? t("admin.pages.noDeleted") : t("admin.articles.empty")}
          </Card>
        ) : null}

        {totalPagesCount > 0 ? (
          <Pagination
            className="mt-2"
            onPageChange={(nextPage) => {
              setPage(nextPage);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onPageSizeChange={(nextSize) => {
              setPageSize(nextSize);
              setPage(0);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            page={safePage}
            pageSize={pageSize}
            total={totalPagesCount}
          />
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
          <Title as="h1" tone="inherit" variant="card">{t("pageBuilder.editor")}</Title>
        </div>
        <CraftPageEditor initialSlug={editingSlug || undefined} />
      </div>
    );
  }

  return <PageList onEdit={(slug) => setEditingSlug(slug || "")} />;
}

