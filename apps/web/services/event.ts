"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getStoredTokens } from "./auth";
import { apiRequest } from "./client";

export type EventAudience = "public" | "church" | "church_unit" | "people";
export type EventRepeat = "none" | "daily" | "weekly" | "monthly" | "weekdays";
export type EventStatus = "draft" | "published";

export type EventCategory = {
  description: string | null;
  id: number;
  name: string;
};

export type EventMember = {
  display_name: string;
  id: string;
  username: string;
};

export type EventChurchUnit = {
  id: string;
  name: string;
  type: string;
};

export type EventItem = {
  audience: EventAudience;
  category: EventCategory | null;
  color: string | null;
  cover_image_url: string | null;
  created_at: string;
  creator: { id: string; username: string };
  description: string | null;
  ends_at: string;
  id: string;
  location: string | null;
  repeat: EventRepeat;
  slug: string;
  starts_at: string;
  status: EventStatus;
  target_church_units: EventChurchUnit[];
  target_users: EventMember[];
  title: string;
  updated_at: string;
};

export type EventListResult = {
  items: EventItem[];
  total: number;
};

export type EventMeta = {
  audiences: EventAudience[];
  categories: EventCategory[];
  church_units: EventChurchUnit[];
  members: EventMember[];
  repeats: EventRepeat[];
  statuses: EventStatus[];
};

export type EventListParams = {
  audience?: string;
  category_id?: number;
  q?: string;
  skip?: number;
  status?: string;
  take?: number;
  upcoming?: boolean;
};

export type CreateEventDto = {
  audience: EventAudience;
  category_id?: number | null;
  church_unit_ids?: string[];
  color?: string | null;
  cover_image_url?: string | null;
  description?: string | null;
  ends_at: string;
  location?: string | null;
  repeat: EventRepeat;
  slug: string;
  starts_at: string;
  status: EventStatus;
  title: string;
  user_ids?: string[];
};

export type UpdateEventDto = Partial<CreateEventDto>;

export type CreateEventCategoryDto = {
  description?: string | null;
  name: string;
};

export type UpdateEventCategoryDto = Partial<CreateEventCategoryDto>;

function eventListSearch(params: EventListParams = {}) {
  const search = new URLSearchParams();
  if (params.audience) search.set("audience", params.audience);
  if (params.category_id !== undefined) search.set("category_id", String(params.category_id));
  if (params.q) search.set("q", params.q);
  if (params.skip !== undefined) search.set("skip", String(params.skip));
  if (params.status) search.set("status", params.status);
  if (params.take !== undefined) search.set("take", String(params.take));
  if (params.upcoming !== undefined) search.set("upcoming", String(params.upcoming));
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const eventKeys = {
  all: ["events"] as const,
  detail: (slug: string) => [...eventKeys.all, "detail", slug] as const,
  lists: () => [...eventKeys.all, "list"] as const,
  list: (params: EventListParams = {}) => [...eventKeys.lists(), params] as const,
  meta: () => [...eventKeys.all, "meta"] as const,
};

export const eventApi = {
  list(params: EventListParams = {}) {
    return apiRequest<EventListResult>(`/events${eventListSearch(params)}`, {
      token: getStoredTokens()?.accessToken,
    });
  },
  detail(slug: string) {
    return apiRequest<EventItem>(`/events/${encodeURIComponent(slug)}`, {
      token: getStoredTokens()?.accessToken,
    });
  },
  meta() {
    return apiRequest<EventMeta>("/events/meta", {
      token: getStoredTokens()?.accessToken,
    });
  },
  create(dto: CreateEventDto) {
    return apiRequest<EventItem>("/events", {
      body: JSON.stringify(dto),
      method: "POST",
      token: getStoredTokens()?.accessToken,
    });
  },
  update(slug: string, dto: UpdateEventDto) {
    return apiRequest<EventItem>(`/events/${encodeURIComponent(slug)}`, {
      body: JSON.stringify(dto),
      method: "PATCH",
      token: getStoredTokens()?.accessToken,
    });
  },
  delete(slug: string) {
    return apiRequest<void>(`/events/${encodeURIComponent(slug)}`, {
      method: "DELETE",
      token: getStoredTokens()?.accessToken,
    });
  },
  createCategory(dto: CreateEventCategoryDto) {
    return apiRequest<EventCategory>("/events/categories", {
      body: JSON.stringify(dto),
      method: "POST",
      token: getStoredTokens()?.accessToken,
    });
  },
  updateCategory(id: number, dto: UpdateEventCategoryDto) {
    return apiRequest<EventCategory>(`/events/categories/${id}`, {
      body: JSON.stringify(dto),
      method: "PATCH",
      token: getStoredTokens()?.accessToken,
    });
  },
  deleteCategory(id: number) {
    return apiRequest<void>(`/events/categories/${id}`, {
      method: "DELETE",
      token: getStoredTokens()?.accessToken,
    });
  },
};

export function useEventsQuery(params: EventListParams = {}, enabled = true) {
  return useQuery({
    enabled,
    queryFn: () => eventApi.list(params),
    queryKey: eventKeys.list(params),
  });
}

export function useEventMetaQuery(enabled = true) {
  return useQuery({
    enabled,
    queryFn: eventApi.meta,
    queryKey: eventKeys.meta(),
  });
}

export function useCreateEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eventApi.create,
    onSuccess(event) {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.invalidateQueries({ queryKey: eventKeys.meta() });
      queryClient.setQueryData(eventKeys.detail(event.slug), event);
    },
  });
}

export function useUpdateEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dto, slug }: { dto: UpdateEventDto; slug: string }) => eventApi.update(slug, dto),
    onSuccess(event) {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.invalidateQueries({ queryKey: eventKeys.meta() });
      queryClient.setQueryData(eventKeys.detail(event.slug), event);
    },
  });
}

export function useDeleteEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eventApi.delete,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
    },
  });
}

export function useCreateEventCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eventApi.createCategory,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: eventKeys.meta() });
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
    },
  });
}

export function useUpdateEventCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dto, id }: { dto: UpdateEventCategoryDto; id: number }) =>
      eventApi.updateCategory(id, dto),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: eventKeys.meta() });
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
    },
  });
}

export function useDeleteEventCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eventApi.deleteCategory,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: eventKeys.meta() });
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
    },
  });
}
