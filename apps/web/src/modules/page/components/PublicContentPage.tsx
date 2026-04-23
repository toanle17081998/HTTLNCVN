"use client";

import { Card } from "@/components/ui";
import { useTranslation } from "@/providers/I18nProvider";
import { usePageQuery } from "@services/page";

type PublicContentPageProps = {
  fallback: {
    body: string;
    description: string;
    title: string;
  };
  slug: string;
};

export function PublicContentPage({ fallback, slug }: PublicContentPageProps) {
  const { locale } = useTranslation();
  const pageQuery = usePageQuery(slug);
  const page = pageQuery.data;
  const title = page ? (locale === "vi" ? page.title_vi : page.title_en) : fallback.title;
  const body = page
    ? locale === "vi"
      ? page.content_markdown_vi
      : page.content_markdown_en
    : fallback.body;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <section className="grid gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
          {title == "about" ? '' : title}
        </h1>
      </section>

      {page?.cover_image_url ? (
        <div
          className="min-h-72 rounded-lg border border-[var(--border-subtle)] bg-cover bg-center shadow-sm"
          style={{ backgroundImage: `url(${page.cover_image_url})` }}
        />
      ) : null}

      <Card className="rounded-md p-6">
        {pageQuery.isLoading ? (
          <div className="grid gap-3">
            <div className="h-5 w-2/3 animate-pulse rounded-md bg-[var(--brand-muted)]" />
            <div className="h-5 animate-pulse rounded-md bg-[var(--brand-muted)]" />
            <div className="h-5 w-5/6 animate-pulse rounded-md bg-[var(--brand-muted)]" />
          </div>
        ) : (
          <div
            className="prose prose-slate max-w-none text-base leading-relaxed text-[var(--text-secondary)] [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[var(--text-primary)] [&_h2]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-[var(--text-primary)] [&_h3]:mt-4 [&_p]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mt-2 [&_li]:mt-1 [&_strong]:font-bold [&_strong]:text-[var(--text-primary)] [&_a]:text-[var(--brand-primary)] [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--brand-primary)] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[var(--text-secondary)]"
            dangerouslySetInnerHTML={{ __html: body }}
          />
        )}
      </Card>
    </div>
  );
}
