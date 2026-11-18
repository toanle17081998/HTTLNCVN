"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./client";

export type HouseholdMember = { id: string; joined_at: string; name: string; role: string | null; username: string };
export type Household = {
  address: string | null;
  created_at: string;
  id: string;
  members: HouseholdMember[];
  name: string;
  note: string | null;
  phone: string | null;
  updated_at: string;
};
export type HouseholdListResult = { items: Household[]; total: number };
export type HouseholdInput = { address?: string | null; name: string; note?: string | null; phone?: string | null };

const householdKeys = { all: ["households"] as const, list: ["households", "list"] as const };

export const householdApi = {
  list: () => apiRequest<HouseholdListResult>("/households?take=100"),
  create: (dto: HouseholdInput) => apiRequest<Household>("/households", { body: JSON.stringify(dto), method: "POST" }),
  update: (id: string, dto: Partial<HouseholdInput>) => apiRequest<Household>(`/households/${id}`, { body: JSON.stringify(dto), method: "PATCH" }),
  delete: (id: string) => apiRequest<void>(`/households/${id}`, { method: "DELETE" }),
  addMember: (id: string, user_id: string, role?: string) => apiRequest<Household>(`/households/${id}/members`, {
    body: JSON.stringify({ role: role || null, user_id }),
    method: "POST",
  }),
  removeMember: (id: string, userId: string) => apiRequest<Household>(`/households/${id}/members/${userId}`, { method: "DELETE" }),
};

export function useHouseholdsQuery() {
  return useQuery({ queryFn: householdApi.list, queryKey: householdKeys.list });
}

function useHouseholdMutation<T>(mutationFn: (input: T) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn, onSuccess: () => queryClient.invalidateQueries({ queryKey: householdKeys.all }) });
}

export function useCreateHouseholdMutation() {
  return useHouseholdMutation(householdApi.create);
}

export function useUpdateHouseholdMutation() {
  return useHouseholdMutation(({ id, dto }: { id: string; dto: Partial<HouseholdInput> }) => householdApi.update(id, dto));
}

export function useDeleteHouseholdMutation() {
  return useHouseholdMutation(householdApi.delete);
}

export function useAddHouseholdMemberMutation() {
  return useHouseholdMutation(({ householdId, role, userId }: { householdId: string; role?: string; userId: string }) => householdApi.addMember(householdId, userId, role));
}

export function useRemoveHouseholdMemberMutation() {
  return useHouseholdMutation(({ householdId, userId }: { householdId: string; userId: string }) => householdApi.removeMember(householdId, userId));
}

