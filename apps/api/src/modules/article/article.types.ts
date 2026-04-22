export type ArticleDto = {
  category: { id: number; name: string } | null;
  content_markdown_en: string;
  content_markdown_vi: string;
  cover_image_url: string | null;
  created_at: string;
  creator: { id: string; username: string };
  id: string;
  published_at: string | null;
  slug: string;
  status: string;
  title_en: string;
  title_vi: string;
  updated_at: string;
};

export type ArticleListDto = {
  category: { id: number; name: string } | null;
  cover_image_url: string | null;
  creator: { id: string; username: string };
  id: string;
  published_at: string | null;
  slug: string;
  status: string;
  title_en: string;
  title_vi: string;
};

export type ArticleListResult = {
  items: ArticleListDto[];
  total: number;
};

export type CreateArticleDto = {
  category_id?: number;
  content_markdown_en: string;
  content_markdown_vi: string;
  cover_image_url?: string;
  slug: string;
  title_en: string;
  title_vi: string;
};

export type UpdateArticleDto = Partial<CreateArticleDto> & {
  status?: 'draft' | 'published';
};
