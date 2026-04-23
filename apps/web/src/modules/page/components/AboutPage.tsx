"use client";

import { PageLayout } from "@/components/layout";
import { Card } from "@/components/ui";
import { usePageQuery } from "@services/page";
import { useTranslation } from "@/providers/I18nProvider";

/** Strip HTML tags from a string so it can be used in plain-text contexts. */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function AboutPage() {
  const { data: pageData } = usePageQuery("about");
  const { locale } = useTranslation();

  const htmlContent = locale === "vi"
    ? (pageData?.content_markdown_vi || "")
    : (pageData?.content_markdown_en || "");

  const content = {
    title: locale === "vi" ? (pageData?.title_vi || "Về Chúng Tôi") : (pageData?.title_en || "About Us"),
    htmlBody: htmlContent,
    plainText: stripHtml(htmlContent) || (
      locale === "vi"
        ? "HTNC Platform mang đến các bản cập nhật công khai, lộ trình học tập, sự kiện và các công cụ thành viên vào một không gian làm việc chuyên nghiệp."
        : "HTNC Platform brings public updates, learning paths, events, and member tools into one calm workspace."
    ),
    cover: pageData?.cover_image_url,
  };

  return (
    <PageLayout
      description={content.plainText.substring(0, 160) + "..."}
      eyebrow="Public"
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
          <Card className="p-8 sm:p-10 rounded-[2rem] border-[var(--border-subtle)] shadow-sm">
            <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">
              {content.title}
            </h2>
            <div
              className="mt-6 prose prose-slate max-w-none text-base leading-relaxed text-[var(--text-secondary)] [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[var(--text-primary)] [&_h2]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-[var(--text-primary)] [&_h3]:mt-4 [&_p]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mt-2 [&_li]:mt-1 [&_strong]:font-bold [&_strong]:text-[var(--text-primary)] [&_a]:text-[var(--brand-primary)] [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--brand-primary)] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[var(--text-secondary)]"
              dangerouslySetInnerHTML={{ __html: content.htmlBody }}
            />
          </Card>
          
          <div className="space-y-6">
            <Card className="p-6 rounded-3xl bg-[var(--brand-muted)]/30 border-[var(--brand-muted)]">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {locale === "vi" ? "Truy cập công khai" : "Public access"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                {locale === "vi" 
                  ? "Trang này có sẵn cho mọi vai trò, bao gồm cả khách."
                  : "This page is available to every role, including guests."}
              </p>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
