export type PrayerVisibility = 'private' | 'public' | 'shared';
export type PrayerStatus = 'closed' | 'open';

export type PrayerCategoryDto = {
  id: number;
  name: string;
};

export type PrayerMemberDto = {
  display_name: string;
  id: string;
  username: string;
};

export type PrayerDto = {
  category: PrayerCategoryDto | null;
  close_reason: string | null;
  closed_at: string | null;
  content: string;
  created_at: string;
  created_by: string;
  created_by_name: string;
  id: string;
  shared_with: PrayerMemberDto[];
  status: PrayerStatus;
  title: string | null;
  updated_at: string;
  visibility: PrayerVisibility;
};

export type PrayerListResult = {
  items: PrayerDto[];
  total: number;
};

export type CreatePrayerDto = {
  category_id?: number | null;
  content: string;
  shared_with_user_ids?: string[];
  title?: string;
  visibility?: PrayerVisibility;
};

export type UpdatePrayerDto = Partial<CreatePrayerDto> & {
  close_reason?: string;
  status?: PrayerStatus;
};

export type SharePrayerDto = {
  userIds: string[];
};

export type PrayerJournalMetaDto = {
  categories: PrayerCategoryDto[];
  members: PrayerMemberDto[];
};
