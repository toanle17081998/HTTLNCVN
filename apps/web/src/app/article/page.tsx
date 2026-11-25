import type { Metadata } from "next";
import { ArticlePage } from "@/components/article/ArticlePage";
import { getServerLocale } from "@/lib/server-locale";
import { createBilingualPageMetadata } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return createBilingualPageMetadata(
    {
      vi: {
        title: "Bài viết",
        description: "Đọc bài viết, tĩnh nguyện, tin tức và tài nguyên cộng đồng của Hội Thánh Tin Lành Nhân Cấp (HTTLNC).",
      },
      en: {
        title: "Articles",
        description: "Read articles, devotionals, church updates, and community resources from Multiplying Evangelical Church (MEC).",
      },
    },
    "/article",
    locale,
  );
}

export default function ArticleRoute() {
  return <ArticlePage />;
}
