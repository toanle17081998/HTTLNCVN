import { Metadata } from "next";
import { ArticleDetailPage } from "@/modules/article/components/ArticleDetailPage";
import { articleApi } from "@services/article";

type ArticleDetailRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: ArticleDetailRouteProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const article = await articleApi.detail(slug);
    return {
      title: `${article.title_vi || article.title_en} | HTNC`,
      description: article.title_en,
      openGraph: {
        title: article.title_vi || article.title_en,
        description: article.title_en,
        images: article.cover_image_url ? [article.cover_image_url] : [],
        type: "article",
        publishedTime: article.published_at ?? undefined,
      },
    };
  } catch {
    return {
      title: "Article | HTNC",
    };
  }
}

export default async function ArticleDetailRoute({ params }: ArticleDetailRouteProps) {
  const { slug } = await params;

  return <ArticleDetailPage slug={slug} />;
}
