export type EventDto = {
  audience: string;
  category: { id: number; name: string } | null;
  cover_image_url: string | null;
  created_at: string;
  creator: { id: string; username: string };
  description: string | null;
  ends_at: string;
  id: string;
  location: string | null;
  slug: string;
  starts_at: string;
  status: string;
  title: string;
};

export type EventListDto = {
  audience: string;
  cover_image_url: string | null;
  ends_at: string;
  id: string;
  location: string | null;
  slug: string;
  starts_at: string;
  status: string;
  title: string;
};

export type EventListResult = {
  items: EventListDto[];
  total: number;
};

export type CreateEventDto = {
  audience?: string;
  category_id?: number;
  cover_image_url?: string;
  description?: string;
  ends_at: string;
  location?: string;
  slug: string;
  starts_at: string;
  title: string;
};

export type UpdateEventDto = Partial<CreateEventDto> & {
  status?: 'draft' | 'published';
};
