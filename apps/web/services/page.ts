"use client";

// Force rebuild 2
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getStoredTokens } from "./auth";
import { apiRequest, ApiError } from "./client";

export type Page = {
  content_en: string;
  content_vi: string;
  created_at: string;
  id: string;
  route_path: string;
  slug: string;
  status: "draft" | "published";
  title_en: string;
  title_vi: string;
  updated_at: string;
};

export type PageListResult = {
  items: Array<
    Pick<Page, "id" | "route_path" | "slug" | "status" | "title_en" | "title_vi" | "updated_at">
  >;
};

export type CreatePageDto = Pick<Page, "content_en" | "content_vi" | "route_path" | "slug" | "title_en" | "title_vi">;
export type UpdatePageDto = Partial<CreatePageDto> & { status?: Page["status"] };

function listSearch(status?: string) {
  return status ? `?status=${encodeURIComponent(status)}` : "";
}

export const pageKeys = {
  all: ["pages"] as const,
  details: () => [...pageKeys.all, "detail"] as const,
  detail: (slug: string) => [...pageKeys.details(), slug] as const,
  lists: () => [...pageKeys.all, "list"] as const,
  list: (status?: string) => [...pageKeys.lists(), status ?? "all"] as const,
  resolved: () => [...pageKeys.all, "resolved"] as const,
  resolve: (path: string) => [...pageKeys.resolved(), path] as const,
};

export const pageApi = {
  list(status?: string) {
    return apiRequest<PageListResult>(`/pages${listSearch(status)}`, {
      token: getStoredTokens()?.accessToken,
    });
  },
  detail(slug: string) {
    return apiRequest<Page>(`/pages/${encodeURIComponent(slug)}`, {
      token: getStoredTokens()?.accessToken,
    });
  },
  resolve(path: string) {
    const search = new URLSearchParams({ path });
    return apiRequest<Page>(`/pages/resolve?${search.toString()}`);
  },
  create(dto: CreatePageDto) {
    return apiRequest<Page>("/pages", {
      body: JSON.stringify(dto),
      method: "POST",
      token: getStoredTokens()?.accessToken,
    });
  },
  update(slug: string, dto: UpdatePageDto) {
    return apiRequest<Page>(`/pages/${encodeURIComponent(slug)}`, {
      body: JSON.stringify(dto),
      method: "PATCH",
      token: getStoredTokens()?.accessToken,
    });
  },
  remove(slug: string) {
    return apiRequest<void>(`/pages/${encodeURIComponent(slug)}`, {
      method: "DELETE",
      token: getStoredTokens()?.accessToken,
    });
  },
};

export function usePagesQuery(status?: string) {
  return useQuery({
    queryFn: () => pageApi.list(status),
    queryKey: pageKeys.list(status),
  });
}

export function usePageQuery(slug?: string) {
  return useQuery({
    enabled: Boolean(slug),
    queryFn: () => pageApi.detail(slug ?? ""),
    queryKey: pageKeys.detail(slug ?? ""),
  });
}

export function useResolvedPageQuery(path: string) {
  return useQuery({
    queryFn: () => pageApi.resolve(path),
    queryKey: pageKeys.resolve(path),
  });
}

export function useCreatePageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pageApi.create,
    onSuccess(page) {
      queryClient.invalidateQueries({ queryKey: pageKeys.lists() });
      queryClient.setQueryData(pageKeys.detail(page.slug), page);
      queryClient.setQueryData(pageKeys.resolve(page.route_path), page);
    },
  });
}

export function useUpdatePageMutation(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdatePageDto) => pageApi.update(slug, dto),
    onSuccess(page) {
      queryClient.invalidateQueries({ queryKey: pageKeys.lists() });
      queryClient.setQueryData(pageKeys.detail(page.slug), page);
      queryClient.setQueryData(pageKeys.resolve(page.route_path), page);
    },
  });
}

export function useDeletePageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pageApi.remove,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: pageKeys.lists() });
    },
  });
}
