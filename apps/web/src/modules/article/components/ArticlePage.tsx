"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { PageLayout } from "@/components/layout";
import { Button, Card, Pagination, cn } from "@/components/ui";
import { PERMISSIONS } from "@/lib/rbac";
import { useAuth } from "@/providers/AuthProvider";
import { useTranslation } from "@/providers/I18nProvider";
import { useFeedback } from "@/providers/FeedbackProvider";
import {
  useArticlesQuery,
  useArticleCategoriesQuery,
  useDeleteArticleMutation,
} from "@services/article";

const PAGE_SIZE_DEFAULT = 12;

export function ArticlePage() {
  const { can } = useAuth();
  const { t, locale } = useTranslation();
  const { confirm } = useFeedback();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>();
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);

  const canManageArticle = can(PERMISSIONS.manageArticle);

  const categoriesQuery = useArticleCategoriesQuery();
  const articlesQuery = useArticlesQuery({
    take: pageSize,
    skip: page * pageSize,
    status: canManageArticle ? undefined : "published",
    category_id: selectedCategoryId,
    q: q || undefined,
  });

  const deleteArticle = useDeleteArticleMutation();

  const total = articlesQuery.data?.total ?? 0;

  const handleSearch = useCallback(() => {
    setQ(searchInput.trim());
    setPage(0);
  }, [searchInput]);

  const handleCategoryChange = (id: number | undefined) => {
    setSelectedCategoryId(id);
    setPage(0);
  };

  async function handleDelete(slug: string) {
    const ok = await confirm({
      variant: "delete",
      title: t("admin.courses.deleteConfirm"),
      description: `${t("admin.common.delete")} ${slug}?`,
    });
    if (!ok) return;
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
      {/* Search bar */}
      <div className="mb-4 flex gap-2">
        <input
          className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-ring)]"
          placeholder="Search articles…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button size="sm" variant="primary" onClick={handleSearch}>
          Search
        </Button>
      </div>

      {/* Category filters */}
      <div className="mb-8 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={selectedCategoryId === undefined ? "primary" : "secondary"}
          onClick={() => handleCategoryChange(undefined)}
        >
          {t("prayer.filter.all")}
        </Button>
        {categoriesQuery.data?.map((cat) => (
          <Button
            key={cat.id}
            size="sm"
            variant={selectedCategoryId === cat.id ? "primary" : "secondary"}
            onClick={() => handleCategoryChange(cat.id)}
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

      <div className="grid gap-6 md:grid-cols-2">
        {articlesQuery.data?.items.map((article) => (
          <Card className="overflow-hidden transition-all duration-300 hover:border-[var(--brand-primary)] hover:shadow-lg flex flex-col h-full" key={article.id}>
            <Link
              className="block flex-1 focus:outline-none"
              href={`/article/${encodeURIComponent(article.slug)}`}
            >
              {article.cover_image_url ? (
                <div className="aspect-[16/9] w-full overflow-hidden border-b border-[var(--border-subtle)]">
                  <img
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    src={article.cover_image_url}
                  />
                </div>
              ) : (
                <div className="aspect-[16/9] w-full flex items-center justify-center bg-[var(--bg-base)] border-b border-[var(--border-subtle)]">
                   <div className="h-12 w-12 rounded-full bg-[var(--brand-muted)] flex items-center justify-center">
                      <span className="text-xl">📖</span>
                   </div>
                </div>
              )}
              <div className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className={cn(
                    "rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                    article.status === 'published' ? "bg-[var(--brand-muted)] text-[var(--brand-primary)]" : "bg-[var(--bg-base)] text-[var(--text-tertiary)]"
                  )}>
                    {article.status}
                  </span>
                  {article.category ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                      {article.category.name}
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-4 text-xl font-bold text-[var(--text-primary)] group-hover:text-[var(--brand-primary)] transition-colors">
                  {locale === 'vi' ? (article.title_vi || article.title_en) : (article.title_en || article.title_vi)}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] line-clamp-2">
                  {locale === 'vi' ? article.title_en : article.title_vi}
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full bg-[var(--bg-base)] flex items-center justify-center text-[10px] font-bold text-[var(--text-tertiary)]">
                    {article.creator.username.slice(0, 2).toUpperCase()}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                    {article.creator.username} • {article.published_at ? new Date(article.published_at).toLocaleDateString() : 'Draft'}
                  </p>
                </div>
              </div>
            </Link>

            {canManageArticle ? (
              <div className="px-6 pb-6 mt-auto flex flex-wrap gap-2">
                <Link
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 text-[10px] font-bold uppercase tracking-wider text-[var(--text-primary)] transition hover:bg-[var(--brand-muted)] hover:text-[var(--brand-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--input-focus-ring)]"
                  href={`/admin/articles/create?slug=${encodeURIComponent(article.slug)}`}
                >
                  {t("lesson.action.edit")}
                </Link>
                <Button
                  disabled={deleteArticle.isPending}
                  onClick={() => handleDelete(article.slug)}
                  size="sm"
                  variant="danger"
                  className="h-9 rounded-lg px-4 text-[10px] font-bold uppercase tracking-wider"
                >
                  {t("prayer.action.delete")}
                </Button>
              </div>
            ) : null}
          </Card>
        ))}
      </div>

      {articlesQuery.data && articlesQuery.data.items.length === 0 ? (
        <Card className="p-12 text-center text-sm text-[var(--text-secondary)] border-dashed rounded-2xl">
          <div className="text-4xl mb-4 opacity-20">📭</div>
          No articles found.
        </Card>
      ) : null}

      {/* Pagination */}
      {total > 0 ? (
        <Pagination
          className="mt-6"
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(0); }}
        />
      ) : null}
    </PageLayout>
  );
}

