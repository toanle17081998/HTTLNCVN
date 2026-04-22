import { Suspense } from "react";
import { CreateArticlePage } from "@/modules/article/components/CreateArticlePage";

export default function CreateArticleRoute() {
  return (
    <Suspense fallback={null}>
      <CreateArticlePage />
    </Suspense>
  );
}
