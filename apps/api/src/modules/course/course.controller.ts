import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';

import { Public } from '../../common/decorators/public.decorator';
import { Can } from '../../common/decorators/permissions.decorator';
import type { JwtPayload } from '../../common/strategies/jwt.strategy';
import { CourseService } from './course.service';
import type {
  CourseDto,
  CourseListResult,
  CreateCourseDto,
  UpdateCourseDto,
} from './course.types';

@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Public()
  @Get()
  findAll(
    @Query('skip') skip = '0',
    @Query('take') take = '20',
  ): Promise<CourseListResult> {
    return this.courseService.findAll(Number(skip), Number(take));
  }

  @Public()
  @Get(':slug')
  findBySlug(@Param('slug') slug: string): Promise<CourseDto> {
    return this.courseService.findBySlug(slug);
  }

  @Can('create', 'course')
  @Post()
  create(
    @Body() dto: CreateCourseDto,
    @Request() req: { user: JwtPayload },
  ): Promise<CourseDto> {
    return this.courseService.create(dto, req.user.sub);
  }

  @Can('update', 'course')
  @Patch(':slug')
  update(@Param('slug') slug: string, @Body() dto: UpdateCourseDto): Promise<CourseDto> {
    return this.courseService.update(slug, dto);
  }

  @Can('delete', 'course')
  @Delete(':slug')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('slug') slug: string): Promise<void> {
    return this.courseService.delete(slug);
  }

  @Post(':id/enroll')
  @Can('enroll', 'course')
  @HttpCode(HttpStatus.CREATED)
  enroll(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ): Promise<void> {
    return this.courseService.enroll(id, req.user.sub);
  }
}
