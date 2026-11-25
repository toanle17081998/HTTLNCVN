import { cache } from "react";
import { Metadata } from "next";
import { ArticleDetailPage } from "@/components/article/ArticleDetailPage";
import { articleApi } from "@/api/article";
import { getLocalizedField } from "@/lib/i18n";
import { summarizeText } from "@/lib/site";

type ArticleDetailRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

const getArticleBySlug = cache((slug: string) => articleApi.detail(slug).catch(() => null));

export async function generateMetadata({ params }: ArticleDetailRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) {
    return {
      title: "Article",
      robots: { index: false },
    };
  }
  const title = getLocalizedField(article, "title");
  const description = summarizeText(getLocalizedField(article, "content_markdown")) || title;
  return {
    title,
    description,
    alternates: { canonical: `/article/${encodeURIComponent(article.slug)}` },
    openGraph: {
      title,
      description,
      images: article.cover_image_url ? [article.cover_image_url] : [],
      type: "article",
      publishedTime: article.published_at ?? undefined,
      url: `/article/${encodeURIComponent(article.slug)}`,
    },
    twitter: { title, description, images: article.cover_image_url ? [article.cover_image_url] : [] },
  };
}

export default async function ArticleDetailRoute({ params }: ArticleDetailRouteProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  return <ArticleDetailPage initialArticle={article} slug={slug} />;
}
