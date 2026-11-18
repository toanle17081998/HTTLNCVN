import type { Metadata } from "next";
import { ArticlePage } from "@/components/article/ArticlePage";
import { createPageMetadata } from "@/lib/site";

export const metadata: Metadata = createPageMetadata(
  "Articles",
  "Read HTNC articles, church updates, and community resources.",
  "/article",
);

export default function ArticleRoute() {
  return <ArticlePage />;
}
