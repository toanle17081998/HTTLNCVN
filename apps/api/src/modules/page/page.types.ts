export type PageDto = {
  content_en: string;
  content_vi: string;
  created_at: string;
  id: string;
  route_path: string;
  slug: string;
  status: "draft" | "published";
  title_en: string;
  title_vi: string;
  updated_at: string;
};

export type PageListDto = Pick<
  PageDto,
  "id" | "route_path" | "slug" | "status" | "title_en" | "title_vi" | "updated_at"
>;

export type PageListResult = {
  items: PageListDto[];
};

export type CreatePageDto = {
  content_en: string;
  content_vi: string;
  route_path: string;
  slug: string;
  title_en: string;
  title_vi: string;
};

export type UpdatePageDto = Partial<CreatePageDto> & {
  status?: PageDto["status"];
};
