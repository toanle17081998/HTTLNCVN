"use client";

import { useState } from "react";
import { FileText, Plus, ArrowLeft, Globe, Eye } from "lucide-react";
import Link from "next/link";
import { PageLayout } from "@/components/layout";
import { Button, Card, cn, Switch } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import { useFeedback } from "@/providers/FeedbackProvider";
import { usePagesQuery, useDeletePageMutation, pageApi } from "@services/page";
import { CraftPageEditor } from "@/modules/page-builder/CraftPageEditor";

function PageList({ onEdit }: { onEdit: (slug: string) => void }) {
  const { locale, t } = useTranslation();
  const { confirm, toast } = useFeedback();
  const pagesQuery = usePagesQuery();
  const deletePage = useDeletePageMutation();

  async function handleToggleStatus(slug: string, currentStatus: string) {
    const newStatus = currentStatus === "published" ? "draft" : "published";
    try {
      await pageApi.update(slug, { status: newStatus as any });
      pagesQuery.refetch();
      toast({
        title: newStatus === "published" ? t("toast.page.published") : t("toast.page.draftSaved"),
        variant: "success",
      });
    } catch (error) {
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

  return (
    <PageLayout
      actions={
        <Button onClick={() => onEdit("")} className="gap-2">
          <Plus className="h-4 w-4" />
          {t("pageBuilder.newPage")}
        </Button>
      }
      description={t("pageBuilder.createDescription")}
      eyebrow={t("admin.common.admin")}
      title={t("admin.nav.pages")}
    >
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
                      : "bg-[var(--status-warning-bg)] text-[var(--status-warning)]"
                  )}>
                    {page.status}
                  </span>
                  <span>•</span>
                  <span>{page.route_path}</span>
                </div>
              </div>
            </div>
            
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
          </Card>
        ))}

        {pagesQuery.data?.items.length === 0 ? (
          <Card className="border-dashed p-8 text-center text-sm text-[var(--text-secondary)]">
            {t("admin.articles.empty")}
          </Card>
        ) : null}
      </div>
    </PageLayout>
  );
}

export function AdminPages() {
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
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
        <CraftPageEditor initialSlug={editingSlug ?? undefined} />
      </div>
    );
  }

  return <PageList onEdit={(slug) => setEditingSlug(slug || "")} />;
}

