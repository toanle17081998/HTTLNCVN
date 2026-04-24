"use client";

import { PageLayout } from "@/components/layout";
import { Card } from "@/components/ui";
import { usePageQuery } from "@services/page";
import { useTranslation } from "@/providers/I18nProvider";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function AboutPage() {
  const { data: pageData } = usePageQuery("about");
  const { locale, t } = useTranslation();

  const htmlContent = locale === "vi"
    ? (pageData?.content_markdown_vi || "")
    : (pageData?.content_markdown_en || "");

  const content = {
    title:
      locale === "vi"
        ? (pageData?.title_vi || t("nav.about.label"))
        : (pageData?.title_en || t("nav.about.label")),
    htmlBody: htmlContent,
    plainText: stripHtml(htmlContent) || t("about.fallback.body"),
    cover: pageData?.cover_image_url,
  };

  return (
    <PageLayout
      description={content.plainText.substring(0, 160) + "..."}
      eyebrow={t("page.public.eyebrow")}
      title={content.title}
    >
      <div className="grid gap-8">
        {content.cover ? (
          <div
            className="aspect-[21/9] w-full overflow-hidden rounded-[2rem] border border-[var(--border-subtle)] bg-cover bg-center shadow-lg"
            style={{ backgroundImage: `url(${content.cover})` }}
          />
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <Card className="rounded-[2rem] border-[var(--border-subtle)] p-8 shadow-sm sm:p-10">
            <h2 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
              {content.title}
            </h2>
            <div
              className="mt-6 prose prose-slate max-w-none text-base leading-relaxed text-[var(--text-secondary)] [&_a]:text-[var(--brand-primary)] [&_a]:underline [&_blockquote]:border-[var(--brand-primary)] [&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[var(--text-secondary)] [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[var(--text-primary)] [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-[var(--text-primary)] [&_li]:mt-1 [&_p]:mt-3 [&_strong]:font-bold [&_strong]:text-[var(--text-primary)] [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: content.htmlBody }}
            />
          </Card>

          <div className="space-y-6">
            <Card className="rounded-3xl border-[var(--brand-muted)] bg-[var(--brand-muted)]/30 p-6">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {t("about.access.title")}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                {t("about.access.description")}
              </p>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
