"use client";

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "./client";

export type PageContent = {
  content_markdown_en: string;
  content_markdown_vi: string;
  cover_image_url: string | null;
  id: string;
  slug: string;
  title_en: string;
  title_vi: string;
  updated_at: string;
};

export const pageKeys = {
  all: ["pages"] as const,
  detail: (slug: string) => [...pageKeys.all, "detail", slug] as const,
};

export const pageApi = {
  detail(slug: string) {
    return apiRequest<PageContent>(`/pages/${encodeURIComponent(slug)}`);
  },
};

export function usePageQuery(slug: string) {
  return useQuery({
    queryFn: () => pageApi.detail(slug),
    queryKey: pageKeys.detail(slug),
  });
}
