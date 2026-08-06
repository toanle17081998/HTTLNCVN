"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./client";

export type NotificationDto = {
  action_url: string | null;
  created_at: string;
  id: string;
  is_read: boolean;
  read_at: string | null;
  title: string;
  message: string;
  type: string;
};

export type NotificationListResult = {
  items: NotificationDto[];
  total: number;
};

export type CreateNotificationDto = {
  action_url?: string;
  message: string;
  target_id?: string;
  target_type: "all" | "church_unit" | "user";
  title: string;
  type?: string;
};

export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
};

export function useNotificationsQuery(
  params: { skip?: number; take?: number } = {},
  enabled = true
) {
  return useQuery({
    queryKey: [...notificationKeys.lists(), params],
    queryFn: () => {
      const search = new URLSearchParams();
      if (params.skip !== undefined) search.set("skip", String(params.skip));
      if (params.take !== undefined) search.set("take", String(params.take));
      const query = search.toString();
      return apiRequest<NotificationListResult>(`/notifications${query ? `?${query}` : ""}`, {
        method: "GET",
      });
    },
    enabled,
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<void>(`/notifications/${encodeURIComponent(id)}/read`, {
        method: "PATCH",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useCreateNotificationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateNotificationDto) =>
      apiRequest<void>("/notifications", {
        method: "POST",
        body: JSON.stringify(dto),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
