"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getStoredTokens } from "./auth";
import { apiRequest } from "./client";

export type MemberProfile = {
  address: string | null;
  date_of_birth: string | null;
  first_name: string;
  gender: string | null;
  last_name: string;
  phone: string | null;
};

export type Member = {
  created_at: string;
  email: string;
  id: string;
  profile: MemberProfile | null;
  role: string;
  status: string;
  username: string;
};

export type MemberListResult = {
  items: Member[];
  total: number;
};

export type MemberListParams = {
  skip?: number;
  take?: number;
  q?: string;
};

export type CreateMemberDto = {
  email: string;
  password: string;
  profile?: Partial<MemberProfile>;
  role?: string;
  status?: string;
  username: string;
};

export type UpdateMemberDto = Partial<Omit<CreateMemberDto, "password">>;

function memberListSearch(params: MemberListParams = {}) {
  const search = new URLSearchParams();
  if (params.skip !== undefined) search.set("skip", String(params.skip));
  if (params.take !== undefined) search.set("take", String(params.take));
  if (params.q) search.set("q", params.q);
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const memberKeys = {
  all: ["members"] as const,
  detail: (id: string) => [...memberKeys.all, "detail", id] as const,
  lists: () => [...memberKeys.all, "list"] as const,
  list: (params: MemberListParams = {}) => [...memberKeys.lists(), params] as const,
};

export const memberApi = {
  list(params: MemberListParams = {}) {
    return apiRequest<MemberListResult>(`/members${memberListSearch(params)}`, {
      token: getStoredTokens()?.accessToken,
    });
  },
  detail(id: string) {
    return apiRequest<Member>(`/members/${encodeURIComponent(id)}`, {
      token: getStoredTokens()?.accessToken,
    });
  },
  create(dto: CreateMemberDto) {
    return apiRequest<Member>("/members", {
      body: JSON.stringify(dto),
      method: "POST",
      token: getStoredTokens()?.accessToken,
    });
  },
  update(id: string, dto: UpdateMemberDto) {
    return apiRequest<Member>(`/members/${encodeURIComponent(id)}`, {
      body: JSON.stringify(dto),
      method: "PATCH",
      token: getStoredTokens()?.accessToken,
    });
  },
  delete(id: string) {
    return apiRequest<void>(`/members/${encodeURIComponent(id)}`, {
      method: "DELETE",
      token: getStoredTokens()?.accessToken,
    });
  },
};

export function useMembersQuery(params: MemberListParams = {}, enabled = true) {
  return useQuery({
    enabled,
    queryFn: () => memberApi.list(params),
    queryKey: memberKeys.list(params),
  });
}

export function useCreateMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: memberApi.create,
    onSuccess(member) {
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
      queryClient.setQueryData(memberKeys.detail(member.id), member);
    },
  });
}

export function useUpdateMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateMemberDto }) =>
      memberApi.update(id, dto),
    onSuccess(member) {
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
      queryClient.setQueryData(memberKeys.detail(member.id), member);
    },
  });
}

export function useDeleteMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: memberApi.delete,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
    },
  });
}
