"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getStoredTokens } from "./auth";
import { apiRequest } from "./client";

export type ChurchUnitMember = {
  display_name: string;
  id: string;
  username: string;
};

export type ChurchUnitSummary = {
  id: string;
  name: string;
  type: string;
};

export type ChurchUnit = {
  children_count: number;
  created_at: string;
  description: string | null;
  id: string;
  is_active: boolean;
  leader: ChurchUnitMember | null;
  member_count: number;
  members: ChurchUnitMember[];
  name: string;
  parent: ChurchUnitSummary | null;
  sort_order: number;
  type: string;
  updated_at: string;
};

export type ChurchUnitListResult = {
  items: ChurchUnit[];
  total: number;
};

export type ChurchUnitMeta = {
  members: ChurchUnitMember[];
  types: string[];
  units: ChurchUnitSummary[];
};

export type ChurchUnitListParams = {
  skip?: number;
  take?: number;
};

export type CreateChurchUnitDto = {
  description?: string | null;
  is_active?: boolean;
  leader_id?: string | null;
  member_ids?: string[];
  name: string;
  parent_id?: string | null;
  sort_order?: number;
  type: string;
};

export type UpdateChurchUnitDto = Partial<CreateChurchUnitDto>;

function churchUnitListSearch(params: ChurchUnitListParams = {}) {
  const search = new URLSearchParams();
  if (params.skip !== undefined) search.set("skip", String(params.skip));
  if (params.take !== undefined) search.set("take", String(params.take));
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const churchUnitKeys = {
  all: ["church-units"] as const,
  detail: (id: string) => [...churchUnitKeys.all, "detail", id] as const,
  lists: () => [...churchUnitKeys.all, "list"] as const,
  list: (params: ChurchUnitListParams = {}) => [...churchUnitKeys.lists(), params] as const,
  meta: () => [...churchUnitKeys.all, "meta"] as const,
};

export const churchUnitApi = {
  list(params: ChurchUnitListParams = {}) {
    return apiRequest<ChurchUnitListResult>(`/church-units${churchUnitListSearch(params)}`, {
      token: getStoredTokens()?.accessToken,
    });
  },
  detail(id: string) {
    return apiRequest<ChurchUnit>(`/church-units/${encodeURIComponent(id)}`, {
      token: getStoredTokens()?.accessToken,
    });
  },
  meta() {
    return apiRequest<ChurchUnitMeta>("/church-units/meta", {
      token: getStoredTokens()?.accessToken,
    });
  },
  create(dto: CreateChurchUnitDto) {
    return apiRequest<ChurchUnit>("/church-units", {
      body: JSON.stringify(dto),
      method: "POST",
      token: getStoredTokens()?.accessToken,
    });
  },
  update(id: string, dto: UpdateChurchUnitDto) {
    return apiRequest<ChurchUnit>(`/church-units/${encodeURIComponent(id)}`, {
      body: JSON.stringify(dto),
      method: "PATCH",
      token: getStoredTokens()?.accessToken,
    });
  },
  delete(id: string) {
    return apiRequest<void>(`/church-units/${encodeURIComponent(id)}`, {
      method: "DELETE",
      token: getStoredTokens()?.accessToken,
    });
  },
};

export function useChurchUnitsQuery(params: ChurchUnitListParams = {}, enabled = true) {
  return useQuery({
    enabled,
    queryFn: () => churchUnitApi.list(params),
    queryKey: churchUnitKeys.list(params),
  });
}

export function useChurchUnitMetaQuery(enabled = true) {
  return useQuery({
    enabled,
    queryFn: churchUnitApi.meta,
    queryKey: churchUnitKeys.meta(),
  });
}

export function useCreateChurchUnitMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: churchUnitApi.create,
    onSuccess(unit) {
      queryClient.invalidateQueries({ queryKey: churchUnitKeys.lists() });
      queryClient.invalidateQueries({ queryKey: churchUnitKeys.meta() });
      queryClient.setQueryData(churchUnitKeys.detail(unit.id), unit);
    },
  });
}

export function useUpdateChurchUnitMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dto, id }: { dto: UpdateChurchUnitDto; id: string }) =>
      churchUnitApi.update(id, dto),
    onSuccess(unit) {
      queryClient.invalidateQueries({ queryKey: churchUnitKeys.lists() });
      queryClient.invalidateQueries({ queryKey: churchUnitKeys.meta() });
      queryClient.setQueryData(churchUnitKeys.detail(unit.id), unit);
    },
  });
}

export function useDeleteChurchUnitMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: churchUnitApi.delete,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: churchUnitKeys.lists() });
      queryClient.invalidateQueries({ queryKey: churchUnitKeys.meta() });
    },
  });
}
