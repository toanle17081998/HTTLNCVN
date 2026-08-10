"use client";

import { Suspense } from "react";
import { CreateArticlePage } from "@/components/article/CreateArticlePage";

export default function AdminCreateArticleRoute() {
  return (
    <Suspense fallback={null}>
      <CreateArticlePage afterSaveHref="/admin/articles" />
    </Suspense>
  );
}
