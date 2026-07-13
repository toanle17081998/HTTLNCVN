import { Suspense } from "react";
import { CreateArticlePage } from "@/components/article/CreateArticlePage";

export default function CreateArticleRoute() {
  return (
    <Suspense fallback={null}>
      <CreateArticlePage />
    </Suspense>
  );
}
