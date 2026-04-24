export const DEFAULT_EVENT_AUDIENCES = ['public', 'church', 'church_unit', 'people'] as const;
export const DEFAULT_EVENT_REPEATS = ['none', 'daily', 'weekly', 'monthly', 'weekdays'] as const;
export const DEFAULT_EVENT_STATUSES = ['draft', 'published'] as const;

export type EventAudience = (typeof DEFAULT_EVENT_AUDIENCES)[number];
export type EventRepeat = (typeof DEFAULT_EVENT_REPEATS)[number];
export type EventStatus = (typeof DEFAULT_EVENT_STATUSES)[number];

export type EventCategoryDto = {
  description: string | null;
  id: number;
  name: string;
};

export type EventMemberDto = {
  display_name: string;
  id: string;
  username: string;
};

export type EventChurchUnitDto = {
  id: string;
  name: string;
  type: string;
};

export type EventDto = {
  audience: string;
  category: EventCategoryDto | null;
  color: string | null;
  cover_image_url: string | null;
  created_at: string;
  creator: { id: string; username: string };
  description: string | null;
  ends_at: string;
  id: string;
  location: string | null;
  repeat: string;
  slug: string;
  starts_at: string;
  status: string;
  target_church_units: EventChurchUnitDto[];
  target_users: EventMemberDto[];
  title: string;
  updated_at: string;
};

export type EventListDto = EventDto;

export type EventListResult = {
  items: EventListDto[];
  total: number;
};

export type EventMetaDto = {
  audiences: string[];
  categories: EventCategoryDto[];
  church_units: EventChurchUnitDto[];
  members: EventMemberDto[];
  repeats: string[];
  statuses: string[];
};

export type CreateEventCategoryDto = {
  description?: string | null;
  name: string;
};

export type UpdateEventCategoryDto = Partial<CreateEventCategoryDto>;

export type CreateEventDto = {
  audience?: EventAudience;
  category_id?: number | null;
  church_unit_ids?: string[];
  color?: string | null;
  cover_image_url?: string | null;
  description?: string | null;
  ends_at: string;
  location?: string | null;
  repeat?: EventRepeat;
  slug: string;
  starts_at: string;
  status?: EventStatus;
  title: string;
  user_ids?: string[];
};

export type UpdateEventDto = Partial<CreateEventDto>;
