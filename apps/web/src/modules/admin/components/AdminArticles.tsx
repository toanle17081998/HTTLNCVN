"use client";

import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { PageLayout } from "@/components/layout";
import { Button, Card, cn } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import { useFeedback } from "@/providers/FeedbackProvider";
import { useArticlesQuery, useDeleteArticleMutation } from "@services/article";

export function AdminArticles() {
  const { locale, t } = useTranslation();
  const { confirm } = useFeedback();
  const articlesQuery = useArticlesQuery({ take: 100 });
  const deleteArticle = useDeleteArticleMutation();

  async function handleDelete(slug: string) {
    const ok = await confirm({
      variant: "delete",
      title: t("admin.courses.deleteConfirm"), // Reusing the translation for consistency
      description: `${t("admin.common.delete")} ${slug}?`,
    });
    if (!ok) return;
    await deleteArticle.mutateAsync(slug);
  }

  return (
    <PageLayout
      actions={
        <Link
          className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--btn-primary-bg)] px-4 text-sm font-semibold text-[var(--btn-primary-text)] transition hover:brightness-95"
          href="/admin/articles/create"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          {t("admin.articles.create")}
        </Link>
      }
      description={t("admin.articles.description")}
      eyebrow={t("admin.common.admin")}
      title={t("admin.articles.title")}
    >
      <div className="grid gap-3">
        {articlesQuery.isLoading ? (
          <Card className="p-5 text-sm text-[var(--text-secondary)]">{t("admin.articles.loading")}</Card>
        ) : null}

        {articlesQuery.data?.items.map((article) => (
          <Card className="flex flex-col gap-4 p-5 transition-all duration-200 hover:shadow-md sm:flex-row sm:items-center" key={article.id}>
            <div className="flex flex-1 items-center gap-4 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-muted)] text-[var(--brand-primary)]">
                <FileText aria-hidden="true" className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-bold text-[var(--text-primary)]">
                  {locale === "vi" ? article.title_vi || article.title_en : article.title_en || article.title_vi}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  <span className={cn(
                    "rounded px-1.5 py-0.5",
                    article.status === 'published'
                      ? "bg-[var(--status-success-bg)] text-[var(--status-success)]"
                      : "bg-[var(--status-warning-bg)] text-[var(--status-warning)]"
                  )}>
                    {article.status}
                  </span>
                  {article.category ? (
                    <>
                      <span>•</span>
                      <span className="text-[var(--brand-primary)]">{article.category.name}</span>
                    </>
                  ) : null}
                  <span>•</span>
                  <span>{article.slug}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:ml-auto">
              <Link
                className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 text-xs font-bold text-[var(--text-primary)] shadow-sm transition-all hover:bg-[var(--brand-muted)] hover:text-[var(--brand-primary)]"
                href={`/admin/articles/create?slug=${encodeURIComponent(article.slug)}`}
              >
                {t("admin.common.edit")}
              </Link>
              <Button
                disabled={deleteArticle.isPending}
                onClick={() => handleDelete(article.slug)}
                size="sm"
                variant="danger"
                className="h-10 rounded-lg px-4 text-xs font-bold"
              >
                {t("admin.common.delete")}
              </Button>
            </div>
          </Card>
        ))}

        {articlesQuery.data?.items.length === 0 ? (
          <Card className="border-dashed p-8 text-center text-sm text-[var(--text-secondary)]">
            {t("admin.articles.empty")}
          </Card>
        ) : null}
      </div>
    </PageLayout>
  );
}
