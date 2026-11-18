import { Metadata } from "next";
import { ArticleDetailPage } from "@/components/article/ArticleDetailPage";
import { articleApi } from "@/services/article";
import { getLocalizedField } from "@/lib/i18n";
import { summarizeText } from "@/lib/site";

type ArticleDetailRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: ArticleDetailRouteProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const article = await articleApi.detail(slug);
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
  } catch {
    return {
      title: "Article",
      robots: { index: false },
    };
  }
}

export default async function ArticleDetailRoute({ params }: ArticleDetailRouteProps) {
  const { slug } = await params;

  return <ArticleDetailPage slug={slug} />;
}
