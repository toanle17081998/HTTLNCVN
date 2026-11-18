export type HouseholdMemberDto = {
  id: string;
  joined_at: string;
  name: string;
  role: string | null;
  username: string;
};

export type HouseholdDto = {
  address: string | null;
  created_at: string;
  id: string;
  members: HouseholdMemberDto[];
  name: string;
  note: string | null;
  phone: string | null;
  updated_at: string;
};

export type HouseholdListResult = { items: HouseholdDto[]; total: number };

export type CreateHouseholdDto = {
  address?: string | null;
  member_ids?: string[];
  name: string;
  note?: string | null;
  phone?: string | null;
};

export type UpdateHouseholdDto = Partial<Omit<CreateHouseholdDto, 'member_ids'>>;

export type AddHouseholdMemberDto = { role?: string | null; user_id: string };

