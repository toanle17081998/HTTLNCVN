import { ArticleDetailPage } from "@/modules/article/components/ArticleDetailPage";

type ArticleDetailRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ArticleDetailRoute({ params }: ArticleDetailRouteProps) {
  const { slug } = await params;

  return <ArticleDetailPage slug={slug} />;
}
