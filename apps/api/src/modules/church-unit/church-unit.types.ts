export const DEFAULT_CHURCH_UNIT_TYPES = [
  'church',
  'department',
  'ministry',
  'fellowship',
  'small_group',
  'team',
] as const;

export type ChurchUnitType = (typeof DEFAULT_CHURCH_UNIT_TYPES)[number];

export type ChurchUnitMemberDto = {
  display_name: string;
  id: string;
  username: string;
};

export type ChurchUnitSummaryDto = {
  id: string;
  name: string;
  type: string;
};

export type ChurchUnitDto = {
  children_count: number;
  created_at: string;
  description: string | null;
  id: string;
  is_active: boolean;
  leader: ChurchUnitMemberDto | null;
  member_count: number;
  members: ChurchUnitMemberDto[];
  name: string;
  parent: ChurchUnitSummaryDto | null;
  sort_order: number;
  type: string;
  updated_at: string;
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
