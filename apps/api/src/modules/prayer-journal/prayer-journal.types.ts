export type PrayerVisibility = 'private' | 'public' | 'shared';
export type PrayerStatus = 'closed' | 'open';

export type PrayerDto = {
  category: { id: number; name: string } | null;
  close_reason: string | null;
  closed_at: string | null;
  content: string;
  created_at: string;
  created_by: string;
  id: string;
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
  category_id?: number;
  content: string;
  title?: string;
  visibility?: PrayerVisibility;
};

export type UpdatePrayerDto = Partial<CreatePrayerDto> & {
  close_reason?: string;
  status?: PrayerStatus;
};

export type SharePrayerDto = {
  userId: string;
};
