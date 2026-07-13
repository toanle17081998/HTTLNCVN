export const DEFAULT_CHURCH_UNIT_TYPES = [
  'cell_group',
  'class',
  'care_team',
  'praise_worship',
  'event_organizer',
  'service_team',
] as const;

export type ChurchUnitType = (typeof DEFAULT_CHURCH_UNIT_TYPES)[number];

export type ChurchUnitMemberDto = {
  display_name: string;
  id: string;
  username: string;
  role?: string | null;
  auto_assign_schedule?: boolean;
};

export type ChurchUnitSummaryDto = {
  id: string;
  name: string;
  type: string;
};

export type ServiceTeamDto = {
  id: string;
  name: string;
  leader: ChurchUnitMemberDto | null;
  members: ChurchUnitMemberDto[];
};

export type ChurchUnitDto = {
  children_count: number;
  created_at: string;
  description: string | null;
  id: string;
  is_active: boolean;
  leader: ChurchUnitMemberDto | null;
  leader_position: string | null;
  member_count: number;
  members: ChurchUnitMemberDto[];
  name: string;
  parent: ChurchUnitSummaryDto | null;
  sort_order: number;
  type: string;
  updated_at: string;
  courses: Array<{ id: string; title_en: string; title_vi: string }>;
  service_teams?: ServiceTeamDto[];
};

export type ChurchUnitListResult = {
  items: ChurchUnitDto[];
  total: number;
};

export type ChurchUnitMetaDto = {
  members: ChurchUnitMemberDto[];
  types: string[];
  units: ChurchUnitSummaryDto[];
};

export type CreateChurchUnitMemberInput = {
  user_id: string;
  role?: string | null;
  auto_assign_schedule?: boolean;
};

export type CreateChurchUnitDto = {
  description?: string | null;
  is_active?: boolean;
  leader_id?: string | null;
  leader_position?: string | null;
  member_ids?: string[];
  members?: CreateChurchUnitMemberInput[];
  assigned_course_ids?: string[];
  name: string;
  parent_id?: string | null;
  sort_order?: number;
  type: string;
  service_teams?: Array<{
    id?: string;
    name: string;
    leader_id?: string | null;
    member_ids: string[];
  }>;
};

export type UpdateChurchUnitDto = Partial<CreateChurchUnitDto>;
