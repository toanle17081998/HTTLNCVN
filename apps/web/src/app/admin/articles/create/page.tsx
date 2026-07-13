"use client";

import { CreateArticlePage } from "@/components/article/CreateArticlePage";

export default function AdminCreateArticleRoute() {
  return <CreateArticlePage afterSaveHref="/admin/articles" />;
}
