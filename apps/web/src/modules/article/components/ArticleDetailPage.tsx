"use client";

import Link from "next/link";
import { useMemo } from "react";
import { PageLayout } from "@/components/layout";
import { Card } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import { useArticleQuery } from "@services/article";
import { markdownToHtml } from "./articleEditorUtils";

type ArticleDetailPageProps = {
  slug: string;
};

type ArticleHeading = {
  id: string;
  level: number;
  text: string;
};

function isRichTextHtml(value: string) {
  return /<\/?(p|h[1-6]|ul|ol|li|blockquote|figure|img|video|iframe|table|thead|tbody|tr|td|th|a|strong|em|div|span)\b/i.test(
    value,
  );
}

function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function slugifyHeading(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[đĐ]/g, "d")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-+|-+$/g, "") || "section"
  );
}

function renderArticleBody(value: string) {
  const html = isRichTextHtml(value) ? value : markdownToHtml(value);
  const headings: ArticleHeading[] = [];
  const seenIds = new Map<string, number>();

  const htmlWithHeadingIds = html.replace(
    /<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (match, levelValue: string, attributes: string, content: string) => {
      const level = Number(levelValue);
      const text = stripHtml(content);
      if (!text || level > 4) return match;

      const existingId = attributes.match(/\sid=(["'])(.*?)\1/i)?.[2];
      const baseId = existingId || slugifyHeading(text);
      const nextCount = seenIds.get(baseId) ?? 0;
      seenIds.set(baseId, nextCount + 1);
      const id = nextCount === 0 ? baseId : `${baseId}-${nextCount + 1}`;

      headings.push({ id, level, text });

      if (existingId) {
        const nextAttributes =
          existingId === id
            ? attributes
            : attributes.replace(/\sid=(["']).*?\1/i, ` id="${id}"`);
        return `<h${levelValue}${nextAttributes}>${content}</h${levelValue}>`;
      }
      return `<h${levelValue}${attributes} id="${id}">${content}</h${levelValue}>`;
    },
  );

  return { headings, html: htmlWithHeadingIds };
}

export function ArticleDetailPage({ slug }: ArticleDetailPageProps) {
  const { t, locale } = useTranslation();
  const articleQuery = useArticleQuery(slug);
  const article = articleQuery.data;
  const body = article?.content_markdown_vi || article?.content_markdown_en || "";
  const renderedBody = useMemo(() => renderArticleBody(body), [body]);

  return (
    <PageLayout
      description={locale === "vi" ? (article?.title_vi || "Xem chi tiết bài viết.") : (article?.title_en || "Read article details.")}
      eyebrow={article?.category?.name ?? t("nav.article.label")}
      title={locale === "vi" ? (article?.title_vi || article?.title_en || "Bài viết") : (article?.title_en || article?.title_vi || "Article")}
    >
      {articleQuery.isLoading ? (
        <Card className="p-6 text-sm text-[var(--text-secondary)]">{t("common.ready")}...</Card>
      ) : null}

      {articleQuery.error ? (
        <Card className="p-6 text-sm font-medium text-[var(--status-danger)]">
          {articleQuery.error instanceof Error
            ? articleQuery.error.message
            : t("page.article.description")}
        </Card>
      ) : null}

      {article ? (
        <div className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[minmax(0,48rem)_16rem] lg:items-start">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Article",
                headline: locale === "vi" ? (article.title_vi || article.title_en) : (article.title_en || article.title_vi),
                image: article.cover_image_url ? [article.cover_image_url] : [],
                datePublished: article.published_at,
                dateModified: article.updated_at,
                author: [
                  {
                    "@type": "Person",
                    name: article.creator.username,
                  },
                ],
              }),
            }}
          />
          <article className="grid min-w-0 gap-5">
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
                className="mt-5 scroll-smooth text-base leading-7 text-[var(--text-primary)] [&_.article-column]:min-w-0 [&_.article-columns-resize-handle]:hidden [&_.article-columns]:my-4 [&_.article-columns]:grid [&_.article-columns]:gap-4 [&_a]:font-semibold [&_a]:text-[var(--brand-primary)] [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--brand-primary)] [&_blockquote]:pl-4 [&_code]:rounded [&_code]:bg-[var(--brand-muted)] [&_code]:px-1.5 [&_code]:py-0.5 [&_figcaption]:mt-2 [&_figcaption]:text-sm [&_figcaption]:text-[var(--text-secondary)] [&_figure]:my-5 [&_h2]:scroll-mt-24 [&_h2]:mt-7 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:scroll-mt-24 [&_h3]:mt-5 [&_h3]:text-xl [&_h3]:font-semibold [&_h4]:scroll-mt-24 [&_h4]:mt-4 [&_h4]:text-lg [&_h4]:font-semibold [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:rounded-md [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-md [&_li]:my-0.5 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-1 [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-[var(--brand-muted)] [&_pre]:p-4 [&_strong]:font-semibold [&_table]:my-4 [&_table]:w-full [&_table]:table-fixed [&_table]:border-collapse [&_td]:border [&_td]:border-[var(--border-subtle)] [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-[var(--border-subtle)] [&_th]:bg-[var(--brand-muted)] [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_video]:h-auto [&_video]:max-w-full [&_video]:rounded-md"
                dangerouslySetInnerHTML={{ __html: renderedBody.html }}
              />
            </Card>

            <Link
              className="inline-flex h-10 w-max items-center justify-center rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--brand-muted)] focus:outline-none focus:ring-4 focus:ring-[var(--input-focus-ring)]"
              href="/article"
            >
              {t("nav.article.label")}
            </Link>
          </article>

          <aside className="lg:sticky lg:top-24">
            <Card className="p-4">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">On this page</h2>
              {renderedBody.headings.length > 0 ? (
                <nav className="mt-3 grid gap-1" aria-label="Article sections">
                  {renderedBody.headings.map((heading) => (
                    <a
                      className={[
                        "rounded-md px-2 py-1.5 text-sm leading-5 text-[var(--text-secondary)] transition hover:bg-[var(--brand-muted)] hover:text-[var(--text-primary)]",
                        heading.level >= 3 ? "ml-3" : "",
                        heading.level >= 4 ? "ml-6 text-xs" : "",
                      ].join(" ")}
                      href={`#${heading.id}`}
                      key={heading.id}
                    >
                      {heading.text}
                    </a>
                  ))}
                </nav>
              ) : (
                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                  No sections in this article.
                </p>
              )}
            </Card>
          </aside>
        </div>
      ) : null}
    </PageLayout>
  );
}
