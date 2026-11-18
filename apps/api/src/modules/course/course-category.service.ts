import { Injectable, NotFoundException } from '@nestjs/common';

import { mapCourseCategory } from './course-category.mapper';
import { CourseCategoryRepository } from './course-category.repository';
import type { CourseCategoryDto, CreateCourseCategoryDto, UpdateCourseCategoryDto } from './course-category.types';

@Injectable()
export class CourseCategoryService {
  constructor(private readonly courseCategoryRepository: CourseCategoryRepository) {}

  async findAll(): Promise<CourseCategoryDto[]> {
    return (await this.courseCategoryRepository.findAll()).map(mapCourseCategory);
  }

  async create(dto: CreateCourseCategoryDto): Promise<CourseCategoryDto> {
    return mapCourseCategory(await this.courseCategoryRepository.create(dto));
  }

  async update(id: string, dto: UpdateCourseCategoryDto): Promise<CourseCategoryDto> {
    await this.requireCategory(id);
    return mapCourseCategory(await this.courseCategoryRepository.update(id, dto));
  }

  async delete(id: string): Promise<void> {
    await this.requireCategory(id);
    await this.courseCategoryRepository.delete(id);
  }

  private async requireCategory(id: string): Promise<void> {
    if (!(await this.courseCategoryRepository.findById(id))) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Category not found.' });
    }
  }
}
