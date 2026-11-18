import type { CourseCategoryDto, CourseCategoryRecord } from './course-category.types';

export function mapCourseCategory(category: CourseCategoryRecord): CourseCategoryDto {
  return {
    id: category.id,
    name_en: category.name_en,
    name_vi: category.name_vi,
    created_at: category.created_at.toISOString(),
  };
}
