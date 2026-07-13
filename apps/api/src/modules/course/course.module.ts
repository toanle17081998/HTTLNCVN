import { Module } from '@nestjs/common';

import { CourseController } from './course.controller';
import { CourseCategoryController } from './course-category.controller';
import { CourseRepository } from './course.repository';
import { CourseService } from './course.service';

@Module({
  controllers: [CourseController, CourseCategoryController],
  providers: [CourseService, CourseRepository],
})
export class CourseModule {}
