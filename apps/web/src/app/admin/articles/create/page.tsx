"use client";

import { CreateArticlePage } from "@/modules/article/components/CreateArticlePage";

export default function AdminCreateArticleRoute() {
  return <CreateArticlePage afterSaveHref="/admin/articles" />;
}
