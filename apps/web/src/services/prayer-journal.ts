"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getStoredTokens } from "./auth";
import { apiRequest } from "./client";

export type PrayerVisibility = "private" | "public" | "shared";
export type PrayerStatus = "open" | "closed";

export type PrayerCategory = {
  id: number;
  name: string;
};

export type PrayerMember = {
  display_name: string;
  id: string;
  username: string;
};

export type Prayer = {
  category: PrayerCategory | null;
  close_reason: string | null;
  closed_at: string | null;
  content: string;
  created_at: string;
  created_by: string;
  created_by_name: string;
  id: string;
  shared_with: PrayerMember[];
  status: PrayerStatus;
  title: string | null;
  updated_at: string;
  visibility: PrayerVisibility;
};

export type PrayerListResult = {
  items: Prayer[];
  total: number;
};

export type PrayerJournalMeta = {
  categories: PrayerCategory[];
  members: PrayerMember[];
};

export type PrayerListParams = {
  skip?: number;
  take?: number;
};

export type CreatePrayerDto = {
  category_id?: number | null;
  content: string;
  shared_with_user_ids?: string[];
  title?: string;
  visibility?: PrayerVisibility;
};

export type UpdatePrayerDto = Partial<CreatePrayerDto> & {
  close_reason?: string;
  status?: PrayerStatus;
};

function prayerListSearch(params: PrayerListParams = {}) {
  const search = new URLSearchParams();
  if (params.skip !== undefined) search.set("skip", String(params.skip));
  if (params.take !== undefined) search.set("take", String(params.take));
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const prayerJournalKeys = {
  all: ["prayer-journal"] as const,
  detail: (id: string) => [...prayerJournalKeys.all, "detail", id] as const,
  lists: () => [...prayerJournalKeys.all, "list"] as const,
  list: (params: PrayerListParams = {}) => [...prayerJournalKeys.lists(), params] as const,
  meta: () => [...prayerJournalKeys.all, "meta"] as const,
};

export const prayerJournalApi = {
  list(params: PrayerListParams = {}) {
    return apiRequest<PrayerListResult>(`/prayer-journal${prayerListSearch(params)}`, {
      token: getStoredTokens()?.accessToken,
    });
  },
  detail(id: string) {
    return apiRequest<Prayer>(`/prayer-journal/${encodeURIComponent(id)}`, {
      token: getStoredTokens()?.accessToken,
    });
  },
  meta() {
    return apiRequest<PrayerJournalMeta>("/prayer-journal/meta", {
      token: getStoredTokens()?.accessToken,
    });
  },
  create(dto: CreatePrayerDto) {
    return apiRequest<Prayer>("/prayer-journal", {
      body: JSON.stringify(dto),
      method: "POST",
      token: getStoredTokens()?.accessToken,
    });
  },
  update(id: string, dto: UpdatePrayerDto) {
    return apiRequest<Prayer>(`/prayer-journal/${encodeURIComponent(id)}`, {
      body: JSON.stringify(dto),
      method: "PATCH",
      token: getStoredTokens()?.accessToken,
    });
  },
  delete(id: string) {
    return apiRequest<void>(`/prayer-journal/${encodeURIComponent(id)}`, {
      method: "DELETE",
      token: getStoredTokens()?.accessToken,
    });
  },
};

export function usePrayerJournalQuery(params: PrayerListParams = {}, enabled = true) {
  return useQuery({
    enabled,
    queryFn: () => prayerJournalApi.list(params),
    queryKey: prayerJournalKeys.list(params),
  });
}

export function usePrayerJournalMetaQuery(enabled = true) {
  return useQuery({
    enabled,
    queryFn: prayerJournalApi.meta,
    queryKey: prayerJournalKeys.meta(),
  });
}

export function useCreatePrayerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: prayerJournalApi.create,
    onSuccess(prayer) {
      queryClient.invalidateQueries({ queryKey: prayerJournalKeys.lists() });
      queryClient.setQueryData(prayerJournalKeys.detail(prayer.id), prayer);
    },
  });
}

export function useUpdatePrayerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePrayerDto }) =>
      prayerJournalApi.update(id, dto),
    onSuccess(prayer) {
      queryClient.invalidateQueries({ queryKey: prayerJournalKeys.lists() });
      queryClient.setQueryData(prayerJournalKeys.detail(prayer.id), prayer);
    },
  });
}

export function useDeletePrayerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: prayerJournalApi.delete,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: prayerJournalKeys.lists() });
    },
  });
}
