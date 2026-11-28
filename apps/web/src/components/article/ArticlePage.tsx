"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PageLayout } from "@/components/layout";
import { Badge, Button, Card, Input, Pagination, Dropdown, Skeleton, Text, Title } from "@/components/ui";
import { PERMISSIONS } from "@/lib/rbac";
import { useAuth } from "@/providers/AuthProvider";
import { useTranslation } from "@/providers/I18nProvider";
import { useFeedback } from "@/providers/FeedbackProvider";
import { CardActions } from "@/components/ui/CardActions";
import {
  articleApi,
  articleKeys,
  useArticlesQuery,
  useArticleCategoriesQuery,
  useDeleteArticleMutation,
} from "@/hooks/article";

const PAGE_SIZE_DEFAULT = 4;

export function ArticlePage() {
  const { can, isLoading: authLoading } = useAuth();
  const { t, localize } = useTranslation();
  const { confirm } = useFeedback();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>();
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);
  const listTopRef = useRef<HTMLDivElement>(null);

  const canManageArticle = can(PERMISSIONS.manageArticle);

  const categoriesQuery = useArticleCategoriesQuery();
  const articlesQuery = useArticlesQuery(
    {
      take: pageSize,
      skip: page * pageSize,
      status: canManageArticle ? undefined : "published",
      category_id: selectedCategoryId,
      q: q || undefined,
    },
    { enabled: !authLoading },
  );

  const deleteArticle = useDeleteArticleMutation();

  const total = articlesQuery.data?.total ?? 0;
  const isListLoading = articlesQuery.isLoading || articlesQuery.isFetching;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (authLoading || (page + 1) * pageSize >= total) return;
    const nextParams = {
      take: pageSize,
      skip: (page + 1) * pageSize,
      status: canManageArticle ? undefined : "published",
      category_id: selectedCategoryId,
      q: q || undefined,
    };
    void queryClient.prefetchQuery({
      queryFn: () => articleApi.list(nextParams),
      queryKey: articleKeys.list(nextParams),
    });
  }, [authLoading, canManageArticle, page, pageSize, q, queryClient, selectedCategoryId, total]);

  const scrollToList = useCallback(() => {
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handlePageChange = useCallback(
    (nextPage: number) => {
      setPage(nextPage);
      scrollToList();
    },
    [scrollToList],
  );

  const handlePageSizeChange = useCallback(
    (nextSize: number) => {
      setPageSize(nextSize);
      setPage(0);
      scrollToList();
    },
    [scrollToList],
  );

  useEffect(() => {
    const nextQuery = searchInput.trim();
    if (nextQuery === q) return;
    const timer = window.setTimeout(() => {
      setQ(nextQuery);
      setPage(0);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [q, searchInput]);

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
        <Input
          aria-label={t("article.searchPlaceholder")}
          className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-ring)]"
          placeholder={t("article.searchPlaceholder")}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          type="search"
        />
      </div>

      {/* Category filters */}
      <div className="mb-8 md:hidden">
        <Dropdown
          aria-label={t("article.form.category")}
          className="rounded-xl border-[var(--border-subtle)]"
          onChange={(e) => handleCategoryChange(e.target.value ? Number(e.target.value) : undefined)}
          value={selectedCategoryId !== undefined ? String(selectedCategoryId) : ""}
        >
          <option value="">{t("prayer.filter.all")}</option>
          {categoriesQuery.data?.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {localize(cat, "name")}
            </option>
          ))}
        </Dropdown>
      </div>
      <div className="mb-8 hidden flex-wrap gap-2 md:flex">
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
            {localize(cat, "name")}
          </Button>
        ))}
      </div>

      <div ref={listTopRef} className="scroll-mt-24" />

      {isListLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-[16/9] w-full rounded-none" />
              <div className="space-y-4 p-6">
                <div className="flex items-center justify-between gap-3">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-4/5" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {articlesQuery.error ? (
        <Card className="p-6 text-sm font-medium text-[var(--status-danger)]">
          {articlesQuery.error instanceof Error
            ? articlesQuery.error.message
            : t("page.article.description")}
        </Card>
      ) : null}

      {!isListLoading ? (
      <div className="grid gap-6 md:grid-cols-2">
        {articlesQuery.data?.items.map((article) => (
          <Card className="group relative flex h-full flex-col overflow-hidden transition-all duration-300 hover:border-[var(--brand-primary)] hover:shadow-lg" key={article.id}>
            <Link
              className="block flex-1 focus:outline-none"
              href={`/article/${encodeURIComponent(article.slug)}`}
            >
              {article.cover_image_url ? (
                <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-[var(--border-subtle)] bg-[var(--bg-base)]">
                  <Image
                    alt=""
                    aria-hidden="true"
                    className="scale-110 object-cover blur-2xl brightness-75"
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    src={article.cover_image_url}
                  />
                  <Image
                    alt={localize(article, "title")}
                    className="object-contain object-center motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105"
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    src={article.cover_image_url}
                  />
                </div>
              ) : (
                <div className="aspect-[16/9] w-full flex items-center justify-center bg-[var(--bg-base)] border-b border-[var(--border-subtle)]">
                  <div className="h-12 w-12 rounded-full bg-[var(--brand-muted)] flex items-center justify-center motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105">
                    <span className="text-xl">📖</span>
                  </div>
                </div>
              )}
              <div className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <Badge
                    size="xs"
                    uppercase
                    variant={article.status === "published" ? "brand" : "neutral"}
                  >
                    {article.status}
                  </Badge>
                  {article.category ? (
                    <Text as="span" tone="tertiary" variant="meta">
                      {localize(article.category, "name")}
                    </Text>
                  ) : null}
                </div>
                <Title as="h2" className="mt-4 transition-colors group-hover:text-[var(--brand-primary)]" variant="card">
                  {localize(article, "title")}
                </Title>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full bg-[var(--bg-base)] flex items-center justify-center text-[10px] font-bold text-[var(--text-tertiary)]">
                    {article.creator.username.slice(0, 2).toUpperCase()}
                  </div>
                  <Text tone="tertiary" variant="meta">
                    {article.creator.username} • {article.published_at ? new Date(article.published_at).toLocaleDateString() : 'Draft'}
                  </Text>
                </div>
              </div>
            </Link>

            {canManageArticle ? (
              <CardActions
                className="absolute right-3 top-3 z-10"
                deleting={deleteArticle.isPending}
                editHref={`/admin/articles/create?slug=${encodeURIComponent(article.slug)}`}
                onDelete={() => handleDelete(article.slug)}
                resource="article"
              />
            ) : null}
          </Card>
        ))}
      </div>
      ) : null}

      {!isListLoading && articlesQuery.data && articlesQuery.data.items.length === 0 ? (
        <Card className="p-12 text-center text-sm text-[var(--text-secondary)] border-dashed rounded-2xl">
          <div className="text-4xl mb-4 opacity-20">📭</div>
          {t("article.empty")}
        </Card>
      ) : null}

      {/* Pagination */}
      {total > 0 ? (
        <Pagination
          className="mt-6"
          page={page}
          pageSize={pageSize}
          pageSizeOptions={[4, 8, 10, 20]}
          total={total}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      ) : null}
    </PageLayout>
  );
}

