import { apiRequest } from "./client";
import type { Article, UpdateArticleDto } from "@/services/article";

export const articleApi = {
  detail(slug: string) {
    return apiRequest<Article>(`/articles/${encodeURIComponent(slug)}`);
  },
  update(slug: string, dto: UpdateArticleDto) {
    return apiRequest<Article>(`/articles/${encodeURIComponent(slug)}`, {
      body: JSON.stringify(dto),
      method: "PATCH",
    });
  },
};
