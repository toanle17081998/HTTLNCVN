"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getStoredTokens } from "./auth";
import { apiRequest } from "./client";

export type ServingScheduleType = "worship" | "cleaning";
export type WorshipSkill = "guitar" | "drum" | "bass" | "sing" | "organ";

export type ServingMember = {
  display_name: string;
  id: string;
  skills: string[];
  username: string;
};

export type ServingAssignment = {
  id: string;
  role: string;
  slot_index: number;
  user: ServingMember;
};

export type ServingSchedule = {
  assignments: ServingAssignment[];
  church_unit_id: string;
  id: string;
  service_date: string;
  type: ServingScheduleType;
};

export type ServingPlanner = {
  church_unit: { id: string; name: string; type: string };
  members: ServingMember[];
  schedules: ServingSchedule[];
  type: ServingScheduleType;
};

export type UpsertServingProfilesDto = {
  church_unit_id: string;
  profiles: Array<{
    is_active?: boolean;
    skills?: WorshipSkill[];
    user_id: string;
  }>;
};

export type GenerateServingSchedulesDto = {
  church_unit_id: string;
  start_date: string;
  type: ServingScheduleType;
  weeks: number;
};

export type UpdateServingScheduleDto = {
  assignments: Array<{
    role: string;
    slot_index?: number;
    user_id: string;
  }>;
};

function plannerSearch(churchUnitId: string, type: ServingScheduleType) {
  const search = new URLSearchParams();
  search.set("church_unit_id", churchUnitId);
  search.set("type", type);
  return `?${search.toString()}`;
}

export const servingScheduleKeys = {
  all: ["serving-schedules"] as const,
  planner: (churchUnitId: string, type: ServingScheduleType) =>
    [...servingScheduleKeys.all, "planner", churchUnitId, type] as const,
};

export const servingScheduleApi = {
  planner(churchUnitId: string, type: ServingScheduleType) {
    return apiRequest<ServingPlanner>(`/serving-schedules${plannerSearch(churchUnitId, type)}`, {
      token: getStoredTokens()?.accessToken,
    });
  },
  upsertProfiles(dto: UpsertServingProfilesDto) {
    return apiRequest<ServingPlanner>("/serving-schedules/profiles", {
      body: JSON.stringify(dto),
      method: "PATCH",
      token: getStoredTokens()?.accessToken,
    });
  },
  generate(dto: GenerateServingSchedulesDto) {
    return apiRequest<ServingSchedule[]>("/serving-schedules/generate", {
      body: JSON.stringify(dto),
      method: "POST",
      token: getStoredTokens()?.accessToken,
    });
  },
  update(id: string, dto: UpdateServingScheduleDto) {
    return apiRequest<ServingSchedule>(`/serving-schedules/${encodeURIComponent(id)}`, {
      body: JSON.stringify(dto),
      method: "PATCH",
      token: getStoredTokens()?.accessToken,
    });
  },
};

export function useServingPlannerQuery(churchUnitId: string, type: ServingScheduleType, enabled = true) {
  return useQuery({
    enabled: enabled && Boolean(churchUnitId),
    queryFn: () => servingScheduleApi.planner(churchUnitId, type),
    queryKey: servingScheduleKeys.planner(churchUnitId, type),
  });
}

export function useUpsertServingProfilesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: servingScheduleApi.upsertProfiles,
    onSuccess(planner) {
      queryClient.setQueryData(
        servingScheduleKeys.planner(planner.church_unit.id, planner.type),
        planner,
      );
    },
  });
}

export function useGenerateServingSchedulesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: servingScheduleApi.generate,
    onSuccess(schedules, dto) {
      queryClient.invalidateQueries({
        queryKey: servingScheduleKeys.planner(dto.church_unit_id, dto.type),
      });
      return schedules;
    },
  });
}

export function useUpdateServingScheduleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dto, id }: { dto: UpdateServingScheduleDto; id: string }) =>
      servingScheduleApi.update(id, dto),
    onSuccess(schedule) {
      queryClient.invalidateQueries({
        queryKey: servingScheduleKeys.planner(schedule.church_unit_id, schedule.type),
      });
    },
  });
}
