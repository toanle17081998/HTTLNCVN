export type CourseCategoryDto = {
  id: string;
  name_en: string;
  name_vi: string;
  created_at: string;
};

export type CreateCourseCategoryDto = {
  name_en: string;
  name_vi: string;
};

export type UpdateCourseCategoryDto = Partial<CreateCourseCategoryDto>;

export type CourseCategoryRecord = {
  id: string;
  name_en: string;
  name_vi: string;
  created_at: Date;
};
