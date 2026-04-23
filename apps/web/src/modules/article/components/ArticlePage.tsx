"use client";

import Link from "next/link";
import { useState } from "react";
import { PageLayout } from "@/components/layout";
import { Button, Card, cn } from "@/components/ui";
import { PERMISSIONS } from "@/lib/rbac";
import { useAuth } from "@/providers/AuthProvider";
import { useTranslation } from "@/providers/I18nProvider";
import {
  useArticlesQuery,
  useArticleCategoriesQuery,
  useDeleteArticleMutation,
} from "@services/article";

export function ArticlePage() {
  const { can } = useAuth();
  const { t, locale } = useTranslation();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>();
  
  const canManageArticle = can(PERMISSIONS.manageArticle);
  
  const categoriesQuery = useArticleCategoriesQuery();
  const articlesQuery = useArticlesQuery({
    take: 50,
    status: canManageArticle ? undefined : "published",
    category_id: selectedCategoryId,
  });
  
  const deleteArticle = useDeleteArticleMutation();

  async function handleDelete(slug: string) {
    if (!window.confirm("Delete this article?")) return;
    await deleteArticle.mutateAsync(slug);
  }

  return (
    <PageLayout
      actions={
        canManageArticle ? (
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md border border-transparent bg-[var(--btn-primary-bg)] px-4 text-sm font-semibold text-[var(--btn-primary-text)] shadow-sm transition hover:brightness-95 focus:outline-none focus:ring-4 focus:ring-[var(--input-focus-ring)]"
            href="/admin/articles/create"
          >
            {t("action.createArticle")}
          </Link>
        ) : null
      }
      description={t("page.article.description")}
      eyebrow={t("page.article.eyebrow")}
      title={t("page.article.title")}
    >
      <div className="mb-8 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={selectedCategoryId === undefined ? "primary" : "secondary"}
          onClick={() => setSelectedCategoryId(undefined)}
        >
          {t("prayer.filter.all")}
        </Button>
        {categoriesQuery.data?.map((cat) => (
          <Button
            key={cat.id}
            size="sm"
            variant={selectedCategoryId === cat.id ? "primary" : "secondary"}
            onClick={() => setSelectedCategoryId(cat.id)}
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {articlesQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
           {[1, 2, 3, 4].map(i => <Card key={i} className="h-48 animate-pulse bg-[var(--bg-surface)]" />)}
        </div>
      ) : null}

      {articlesQuery.error ? (
        <Card className="p-6 text-sm font-medium text-[var(--status-danger)]">
          {articlesQuery.error instanceof Error
            ? articlesQuery.error.message
            : t("page.article.description")}
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {articlesQuery.data?.items.map((article) => (
          <Card className="p-6 transition hover:border-[var(--brand-primary)] flex flex-col" key={article.id}>
            <Link
              className="block flex-1 rounded-md focus:outline-none focus:ring-4 focus:ring-[var(--input-focus-ring)]"
              href={`/article/${encodeURIComponent(article.slug)}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-semibold uppercase",
                  article.status === 'published' ? "bg-[var(--brand-muted)] text-[var(--brand-primary)]" : "bg-[var(--bg-base)] text-[var(--text-tertiary)]"
                )}>
                  {article.status}
                </span>
                {article.category ? (
                  <span className="text-xs font-medium text-[var(--text-secondary)]">
                    {article.category.name}
                  </span>
                ) : null}
              </div>
              <h2 className="mt-4 text-xl font-semibold text-[var(--text-primary)]">
                {locale === 'vi' ? (article.title_vi || article.title_en) : (article.title_en || article.title_vi)}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] line-clamp-2">
                {article.title_en}
              </p>
              <p className="mt-3 text-xs text-[var(--text-tertiary)]">
                By {article.creator.username}
                {article.published_at ? ` - ${new Date(article.published_at).toLocaleDateString()}` : ""}
              </p>
            </Link>

            {canManageArticle ? (
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  className="inline-flex h-9 items-center justify-center rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--brand-muted)] focus:outline-none focus:ring-4 focus:ring-[var(--input-focus-ring)]"
                  href={`/admin/articles/create?slug=${encodeURIComponent(article.slug)}`}
                >
                  {t("lesson.action.edit")}
                </Link>
                <Button
                  disabled={deleteArticle.isPending}
                  onClick={() => handleDelete(article.slug)}
                  size="sm"
                  variant="danger"
                >
                  {t("prayer.action.delete")}
                </Button>
              </div>
            ) : null}
          </Card>
        ))}
      </div>

      {articlesQuery.data && articlesQuery.data.items.length === 0 ? (
        <Card className="p-12 text-center text-sm text-[var(--text-secondary)] border-dashed">
          <div className="text-4xl mb-4">Empty</div>
          No articles found in this category.
        </Card>
      ) : null}
    </PageLayout>
  );
}
