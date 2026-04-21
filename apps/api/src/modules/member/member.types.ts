export type MemberDto = {
  created_at: string;
  email: string;
  id: string;
  profile: {
    address: string | null;
    date_of_birth: string | null;
    first_name: string;
    gender: string | null;
    last_name: string;
    phone: string | null;
  } | null;
  role: string;
  status: string;
  username: string;
};

export type UpdateMemberDto = {
  profile?: {
    address?: string;
    first_name?: string;
    gender?: string;
    last_name?: string;
    phone?: string;
  };
  username?: string;
};

export type MemberListResult = {
  items: MemberDto[];
  total: number;
};
