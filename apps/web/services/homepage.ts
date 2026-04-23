"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getStoredTokens } from "./auth";
import { apiRequest } from "./client";

type LocalizedText = {
  en: string;
  vi: string;
};

export type HomepageSectionHeader = {
  eyebrow: LocalizedText;
  title: LocalizedText;
};

export type HomepageContent = {
  cta: {
    href: string;
    label: LocalizedText;
  };
  eyebrow: LocalizedText;
  headline: LocalizedText;
  image_urls: string[];
  secondary_cta: {
    href: string;
    label: LocalizedText;
  };
  section_headers: {
    articles: HomepageSectionHeader;
    courses: HomepageSectionHeader;
    events: HomepageSectionHeader;
  };
  stats: {
    label: LocalizedText;
    value: string;
  }[];
  subheadline: LocalizedText;
  updated_at: string;
};

export type HomepageData = {
  data: {
    featured_courses: unknown[];
    hero: Omit<HomepageContent, "section_headers" | "updated_at">;
    latest_posts: unknown[];
    section_headers: HomepageContent["section_headers"];
    upcoming_events: unknown[];
  };
  meta: {
    generated_at: string;
    included: string[];
  };
};

export type UpdateHomepageContentDto = {
  articles_eyebrow_en?: string;
  articles_eyebrow_vi?: string;
  articles_title_en?: string;
  articles_title_vi?: string;
  courses_eyebrow_en?: string;
  courses_eyebrow_vi?: string;
  courses_title_en?: string;
  courses_title_vi?: string;
  events_eyebrow_en?: string;
  events_eyebrow_vi?: string;
  events_title_en?: string;
  events_title_vi?: string;
  hero_eyebrow_en?: string;
  hero_eyebrow_vi?: string;
  hero_headline_en?: string;
  hero_headline_vi?: string;
  hero_image_urls?: string[];
  hero_subheadline_en?: string;
  hero_subheadline_vi?: string;
  primary_cta_href?: string;
  primary_cta_label_en?: string;
  primary_cta_label_vi?: string;
  secondary_cta_href?: string;
  secondary_cta_label_en?: string;
  secondary_cta_label_vi?: string;
  stat_1_label_en?: string;
  stat_1_label_vi?: string;
  stat_1_value?: string;
  stat_2_label_en?: string;
  stat_2_label_vi?: string;
  stat_2_value?: string;
  stat_3_label_en?: string;
  stat_3_label_vi?: string;
  stat_3_value?: string;
};

export const homepageKeys = {
  all: ["homepage"] as const,
  content: () => [...homepageKeys.all, "content"] as const,
  public: () => [...homepageKeys.all, "public"] as const,
};

export const homepageApi = {
  content() {
    return apiRequest<HomepageContent>("/homepage/content");
  },
  public() {
    return apiRequest<HomepageData>("/homepage");
  },
  updateContent(dto: UpdateHomepageContentDto) {
    return apiRequest<HomepageContent>("/homepage/content", {
      body: JSON.stringify(dto),
      method: "PATCH",
      token: getStoredTokens()?.accessToken,
    });
  },
};

export function useHomepageContentQuery() {
  return useQuery({
    queryFn: homepageApi.content,
    queryKey: homepageKeys.content(),
  });
}

export function useHomepageQuery() {
  return useQuery({
    queryFn: homepageApi.public,
    queryKey: homepageKeys.public(),
  });
}

export function useUpdateHomepageContentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: homepageApi.updateContent,
    onSuccess(content) {
      queryClient.setQueryData(homepageKeys.content(), content);
      queryClient.invalidateQueries({ queryKey: homepageKeys.public() });
    },
  });
}
