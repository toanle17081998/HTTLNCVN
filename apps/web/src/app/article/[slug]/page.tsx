import { cache } from "react";
import { Metadata } from "next";
import { ArticleDetailPage } from "@/components/article/ArticleDetailPage";
import { articleApi } from "@/api/article";
import { getLocalizedField } from "@/lib/i18n";
import { absoluteUrl, getSiteName, getSiteShortName, summarizeText } from "@/lib/site";
import { getServerLocale } from "@/lib/server-locale";

type ArticleDetailRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

const getArticleBySlug = cache((slug: string) => articleApi.detail(slug).catch(() => null));

export async function generateMetadata({ params }: ArticleDetailRouteProps): Promise<Metadata> {
  const [{ slug }, locale] = await Promise.all([params, getServerLocale()]);
  const article = await getArticleBySlug(slug);
  if (!article) {
    return {
      title: locale === "en" ? "Article" : "Bài viết",
      robots: { index: false },
    };
  }
  const title = getLocalizedField(article, "title", locale);
  const description = summarizeText(getLocalizedField(article, "content_markdown", locale)) || title;
  const image = article.cover_image_url || "/church-logo.png";
  const path = `/article/${encodeURIComponent(article.slug)}`;
  return {
    title,
    description,
    alternates: { canonical: path, languages: { vi: path, en: path, "x-default": path } },
    openGraph: {
      title,
      description,
      locale: locale === "en" ? "en_US" : "vi_VN",
      alternateLocale: [locale === "en" ? "vi_VN" : "en_US"],
      images: [image],
      type: "article",
      publishedTime: article.published_at ?? undefined,
      url: path,
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function ArticleDetailRoute({ params }: ArticleDetailRouteProps) {
  const [{ slug }, locale] = await Promise.all([params, getServerLocale()]);
  const article = await getArticleBySlug(slug);
  const articleUrl = article ? absoluteUrl(`/article/${encodeURIComponent(article.slug)}`) : null;
  const title = article ? getLocalizedField(article, "title", locale) : "";
  const description = article ? summarizeText(getLocalizedField(article, "content_markdown", locale)) || title : "";
  const articleJsonLd =
    article && articleUrl
      ? {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Article",
              headline: title,
              description,
              inLanguage: locale,
              image: article.cover_image_url ? [article.cover_image_url] : [absoluteUrl("/church-logo.png")],
              datePublished: article.published_at ?? undefined,
              mainEntityOfPage: articleUrl,
              url: articleUrl,
              publisher: {
                "@type": "Organization",
                name: getSiteName(locale),
                url: absoluteUrl("/"),
                logo: {
                  "@type": "ImageObject",
                  url: absoluteUrl("/church-logo.png"),
                },
              },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: getSiteShortName(locale), item: absoluteUrl("/") },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: locale === "en" ? "Articles" : "Bài viết",
                  item: absoluteUrl("/article"),
                },
                { "@type": "ListItem", position: 3, name: title, item: articleUrl },
              ],
            },
          ],
        }
      : null;

  return (
    <>
      {articleJsonLd ? (
        <script
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd).replace(/</g, "\\u003c") }}
          type="application/ld+json"
        />
      ) : null}
      <ArticleDetailPage initialArticle={article} slug={slug} />
    </>
  );
}
