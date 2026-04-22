"use client";

import Link from "next/link";
import { PageLayout } from "@/components/layout";
import { Card } from "@/components/ui";
import { useArticleQuery } from "@services/article";
import { markdownToHtml } from "./articleEditorUtils";

type ArticleDetailPageProps = {
  slug: string;
};

function isRichTextHtml(value: string) {
  return /<\/?(p|h[1-6]|ul|ol|li|blockquote|figure|img|video|iframe|table|thead|tbody|tr|td|th|a|strong|em|div|span)\b/i.test(
    value,
  );
}

function renderArticleBody(value: string) {
  return isRichTextHtml(value) ? value : markdownToHtml(value);
}

export function ArticleDetailPage({ slug }: ArticleDetailPageProps) {
  const articleQuery = useArticleQuery(slug);
  const article = articleQuery.data;
  const body = article?.content_markdown_vi || article?.content_markdown_en || "";

  return (
    <PageLayout
      description={article?.title_en ?? "Read article details."}
      eyebrow={article?.category?.name ?? "Article"}
      title={article?.title_vi || article?.title_en || "Article"}
    >
      {articleQuery.isLoading ? (
        <Card className="p-6 text-sm text-[var(--text-secondary)]">Loading article...</Card>
      ) : null}

      {articleQuery.error ? (
        <Card className="p-6 text-sm font-medium text-[var(--status-danger)]">
          {articleQuery.error instanceof Error
            ? articleQuery.error.message
            : "Could not load article."}
        </Card>
      ) : null}

      {article ? (
        <article className="mx-auto grid max-w-3xl gap-5">
          {article.cover_image_url ? (
            <img
              alt=""
              className="aspect-[16/9] w-full rounded-lg border border-[var(--border-subtle)] object-cover"
              src={article.cover_image_url}
            />
          ) : null}

          <Card className="p-6">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase text-[var(--text-tertiary)]">
              <span>{article.status}</span>
              <span>By {article.creator.username}</span>
              {article.published_at ? (
                <span>{new Date(article.published_at).toLocaleDateString()}</span>
              ) : null}
            </div>

            <div
              className="mt-6 text-base leading-8 text-[var(--text-primary)] [&_a]:font-semibold [&_a]:text-[var(--brand-primary)] [&_blockquote]:my-5 [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--brand-primary)] [&_blockquote]:pl-4 [&_code]:rounded [&_code]:bg-[var(--brand-muted)] [&_code]:px-1.5 [&_code]:py-0.5 [&_figcaption]:mt-2 [&_figcaption]:text-sm [&_figcaption]:text-[var(--text-secondary)] [&_figure]:my-6 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:rounded-md [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-md [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-4 [&_pre]:my-5 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-[var(--brand-muted)] [&_pre]:p-4 [&_strong]:font-semibold [&_table]:my-5 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-[var(--border-subtle)] [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-[var(--border-subtle)] [&_th]:bg-[var(--brand-muted)] [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_video]:h-auto [&_video]:max-w-full [&_video]:rounded-md"
              dangerouslySetInnerHTML={{ __html: renderArticleBody(body) }}
            />
          </Card>

          <Link
            className="inline-flex h-10 w-max items-center justify-center rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--brand-muted)] focus:outline-none focus:ring-4 focus:ring-[var(--input-focus-ring)]"
            href="/article"
          >
            Back to articles
          </Link>
        </article>
      ) : null}
    </PageLayout>
  );
}
