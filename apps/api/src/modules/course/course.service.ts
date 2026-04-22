import { Injectable, NotFoundException } from '@nestjs/common';

import { CourseRepository } from './course.repository';
import type {
  CourseDto,
  CourseListResult,
  CreateCourseDto,
  UpdateCourseDto,
} from './course.types';

@Injectable()
export class CourseService {
  constructor(private readonly courseRepository: CourseRepository) {}

  findAll(skip: number, take: number): Promise<CourseListResult> {
    return this.courseRepository.findAll(skip, take);
  }

  async findBySlug(slug: string): Promise<CourseDto> {
    const course = await this.courseRepository.findBySlug(slug);

    if (!course) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Course not found.' });
    }

    return course;
  }

  create(dto: CreateCourseDto, creatorId: string): Promise<CourseDto> {
    return this.courseRepository.create(dto, creatorId);
  }

  async update(slug: string, dto: UpdateCourseDto): Promise<CourseDto> {
    const course = await this.courseRepository.update(slug, dto);

    if (!course) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Course not found.' });
    }

    return course;
  }

  async delete(slug: string): Promise<void> {
    await this.findBySlug(slug);
    await this.courseRepository.delete(slug);
  }

  enroll(courseId: string, userId: string): Promise<void> {
    return this.courseRepository.enroll(courseId, userId);
  }
}
