import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';

import type { CreateCourseCategoryDto, UpdateCourseCategoryDto } from './course-category.types';

@Injectable()
export class CourseCategoryValidationPipe implements PipeTransform {
  constructor(private readonly partial = false) {}

  transform(value: unknown): CreateCourseCategoryDto | UpdateCourseCategoryDto {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Category data is required.' });
    }

    const input = value as Record<string, unknown>;
    const output: UpdateCourseCategoryDto = {};
    for (const field of ['name_en', 'name_vi'] as const) {
      const fieldValue = input[field];
      if (fieldValue === undefined && this.partial) continue;
      if (typeof fieldValue !== 'string' || !fieldValue.trim()) {
        throw new BadRequestException({ code: 'VALIDATION_ERROR', message: `${field} is required.` });
      }
      output[field] = fieldValue.trim();
    }
    return output;
  }
}
