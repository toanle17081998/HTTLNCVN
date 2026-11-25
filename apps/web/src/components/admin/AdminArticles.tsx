"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { PageLayout } from "@/components/layout";
import { Badge, Button, Card, Pagination, Title } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import { useFeedback } from "@/providers/FeedbackProvider";
import { useArticlesQuery, useDeleteArticleMutation } from "@/hooks/article";

export function AdminArticles() {
  const { localize, t } = useTranslation();
  const { confirm } = useFeedback();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const articlesQuery = useArticlesQuery({ skip: page * pageSize, take: pageSize });
  const total = articlesQuery.data?.total ?? 0;
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
          <Card className="flex items-center justify-between gap-3 p-3.5 transition-all duration-200 hover:shadow-md sm:gap-4 sm:p-5" key={article.id}>
            <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-muted)] text-[var(--brand-primary)] sm:h-12 sm:w-12">
                <FileText aria-hidden="true" className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <Title as="h2" className="truncate" variant="labelStrong">
                  {localize(article, "title")}
                </Title>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  <Badge
                    size="xs"
                    variant={article.status === "published" ? "success" : "warning"}
                  >
                    {article.status}
                  </Badge>
                  {article.category ? (
                    <>
                      <span>•</span>
                      <span className="text-[var(--brand-primary)]">
                        {localize(article.category, "name")}
                      </span>
                    </>
                  ) : null}
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden truncate sm:inline">{article.slug}</span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Link
                aria-label={t("admin.common.edit")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm transition-all hover:bg-[var(--brand-muted)] hover:text-[var(--brand-primary)]"
                href={`/admin/articles/create?slug=${encodeURIComponent(article.slug)}`}
                title={t("admin.common.edit")}
              >
                <Pencil className="h-4 w-4" />
              </Link>
              <Button
                aria-label={t("admin.common.delete")}
                disabled={deleteArticle.isPending}
                onClick={() => handleDelete(article.slug)}
                size="icon"
                title={t("admin.common.delete")}
                variant="danger"
                className="rounded-lg"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}

        {articlesQuery.data?.items.length === 0 ? (
          <Card className="border-dashed p-8 text-center text-sm text-[var(--text-secondary)]">
            {t("admin.articles.empty")}
          </Card>
        ) : null}

        {total > 0 ? (
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
            page={page}
            pageSize={pageSize}
            total={total}
          />
        ) : null}
      </div>
    </PageLayout>
  );
}
