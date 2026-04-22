"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./client";
import { getStoredTokens } from "./auth";

export type ArticleStatus = "draft" | "published";

export type ArticleCategory = {
  id: number;
  name: string;
};

export type ArticleListItem = {
  category: ArticleCategory | null;
  cover_image_url: string | null;
  creator: { id: string; username: string };
  id: string;
  published_at: string | null;
  slug: string;
  status: string;
  title_en: string;
  title_vi: string;
};

export type Article = ArticleListItem & {
  content_markdown_en: string;
  content_markdown_vi: string;
  created_at: string;
  updated_at: string;
};

export type ArticleListResult = {
  items: ArticleListItem[];
  total: number;
};

export type ArticleListParams = {
  category_id?: number;
  skip?: number;
  status?: string;
  take?: number;
};

export type CreateArticleDto = {
  category_id?: number;
  content_markdown_en: string;
  content_markdown_vi: string;
  cover_image_url?: string;
  slug: string;
  title_en: string;
  title_vi: string;
};

export type UpdateArticleDto = Partial<CreateArticleDto> & {
  status?: ArticleStatus;
};

function articleListSearch(params: ArticleListParams = {}) {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.category_id !== undefined) search.set("category_id", String(params.category_id));
  if (params.skip !== undefined) search.set("skip", String(params.skip));
  if (params.take !== undefined) search.set("take", String(params.take));
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const articleKeys = {
  all: ["articles"] as const,
  detail: (slug: string) => [...articleKeys.all, "detail", slug] as const,
  lists: () => [...articleKeys.all, "list"] as const,
  list: (params: ArticleListParams = {}) => [...articleKeys.lists(), params] as const,
};

export const articleApi = {
  list(params: ArticleListParams = {}) {
    return apiRequest<ArticleListResult>(`/articles${articleListSearch(params)}`);
  },
  detail(slug: string) {
    return apiRequest<Article>(`/articles/${encodeURIComponent(slug)}`);
  },
  create(dto: CreateArticleDto) {
    return apiRequest<Article>("/articles", {
      body: JSON.stringify(dto),
      method: "POST",
      token: getStoredTokens()?.accessToken,
    });
  },
  update(slug: string, dto: UpdateArticleDto) {
    return apiRequest<Article>(`/articles/${encodeURIComponent(slug)}`, {
      body: JSON.stringify(dto),
      method: "PATCH",
      token: getStoredTokens()?.accessToken,
    });
  },
  delete(slug: string) {
    return apiRequest<void>(`/articles/${encodeURIComponent(slug)}`, {
      method: "DELETE",
      token: getStoredTokens()?.accessToken,
    });
  },
  categories() {
    return apiRequest<ArticleCategory[]>("/articles/categories");
  },
};

export function useArticlesQuery(params: ArticleListParams = {}) {
  return useQuery({
    queryFn: () => articleApi.list(params),
    queryKey: articleKeys.list(params),
  });
}

export function useArticleCategoriesQuery() {
  return useQuery({
    queryFn: articleApi.categories,
    queryKey: [...articleKeys.all, "categories"],
  });
}

export function useArticleQuery(slug?: string) {
  return useQuery({
    enabled: Boolean(slug),
    queryFn: () => articleApi.detail(slug ?? ""),
    queryKey: articleKeys.detail(slug ?? ""),
  });
}

export function useCreateArticleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: articleApi.create,
    onSuccess(article) {
      queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
      queryClient.setQueryData(articleKeys.detail(article.slug), article);
    },
  });
}

export function useUpdateArticleMutation(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateArticleDto) => articleApi.update(slug, dto),
    onSuccess(article) {
      queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
      queryClient.setQueryData(articleKeys.detail(article.slug), article);
    },
  });
}

export function useDeleteArticleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: articleApi.delete,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
    },
  });
}
