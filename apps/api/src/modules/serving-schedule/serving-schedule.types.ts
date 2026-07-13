export const SERVING_SCHEDULE_TYPES = ['worship', 'cleaning'] as const;
export const WORSHIP_SKILLS = ['guitar', 'drum', 'bass', 'sing', 'organ'] as const;

export type ServingScheduleType = (typeof SERVING_SCHEDULE_TYPES)[number];
export type WorshipSkill = (typeof WORSHIP_SKILLS)[number];

export type ServingMemberDto = {
  display_name: string;
  id: string;
  skills: string[];
  username: string;
};

export type ServingAssignmentDto = {
  id: string;
  role: string;
  slot_index: number;
  user: ServingMemberDto;
};

export type ServingScheduleDto = {
  assignments: ServingAssignmentDto[];
  church_unit_id: string;
  id: string;
  service_date: string;
  type: string;
};

export type ServingPlannerDto = {
  church_unit: { id: string; name: string; type: string };
  members: ServingMemberDto[];
  schedules: ServingScheduleDto[];
  type: string;
};

export type UpsertServingProfilesDto = {
  church_unit_id: string;
  profiles: Array<{
    is_active?: boolean;
    skills?: string[];
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
