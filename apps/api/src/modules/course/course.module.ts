import { Module } from '@nestjs/common';

import { CourseController } from './course.controller';
import { CourseCategoryController } from './course-category.controller';
import { CourseCategoryRepository } from './course-category.repository';
import { CourseCategoryService } from './course-category.service';
import { CourseRepository } from './course.repository';
import { CourseService } from './course.service';

@Module({
  controllers: [CourseController, CourseCategoryController],
  providers: [CourseService, CourseRepository, CourseCategoryService, CourseCategoryRepository],
})
export class CourseModule {}
