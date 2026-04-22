"use client";

import Link from "next/link";
import { PageLayout } from "@/components/layout";
import { Button, Card } from "@/components/ui";
import { PERMISSIONS } from "@/lib/rbac";
import { useAuth } from "@/providers/AuthProvider";
import { useTranslation } from "@/providers/I18nProvider";
import { useArticlesQuery, useDeleteArticleMutation } from "@services/article";

export function ArticlePage() {
  const { can } = useAuth();
  const { t } = useTranslation();
  const articlesQuery = useArticlesQuery({ take: 50 });
  const deleteArticle = useDeleteArticleMutation();
  const canManageArticle = can(PERMISSIONS.manageArticle);

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
            href="/create-article"
          >
            {t("action.createArticle")}
          </Link>
        ) : null
      }
      description={t("page.article.description")}
      eyebrow={t("page.article.eyebrow")}
      title={t("page.article.title")}
    >
      {articlesQuery.isLoading ? (
        <Card className="p-6 text-sm text-[var(--text-secondary)]">Loading articles...</Card>
      ) : null}

      {articlesQuery.error ? (
        <Card className="p-6 text-sm font-medium text-[var(--status-danger)]">
          {articlesQuery.error instanceof Error
            ? articlesQuery.error.message
            : "Could not load articles."}
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {articlesQuery.data?.items.map((article) => (
          <Card className="p-6 transition hover:border-[var(--brand-primary)]" key={article.id}>
            <Link
              className="block rounded-md focus:outline-none focus:ring-4 focus:ring-[var(--input-focus-ring)]"
              href={`/article/${encodeURIComponent(article.slug)}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-md bg-[var(--brand-muted)] px-2.5 py-1 text-xs font-semibold uppercase text-[var(--brand-primary)]">
                  {article.status}
                </span>
                {article.category ? (
                  <span className="text-xs font-medium text-[var(--text-secondary)]">
                    {article.category.name}
                  </span>
                ) : null}
              </div>
              <h2 className="mt-4 text-xl font-semibold text-[var(--text-primary)]">
                {article.title_vi || article.title_en}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
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
                  href={`/create-article?slug=${encodeURIComponent(article.slug)}`}
                >
                  Edit
                </Link>
                <Button
                  disabled={deleteArticle.isPending}
                  onClick={() => handleDelete(article.slug)}
                  size="sm"
                  variant="danger"
                >
                  Delete
                </Button>
              </div>
            ) : null}
          </Card>
        ))}
      </div>

      {articlesQuery.data && articlesQuery.data.items.length === 0 ? (
        <Card className="p-6 text-sm text-[var(--text-secondary)]">No articles found.</Card>
      ) : null}
    </PageLayout>
  );
}
