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
} from '@nestjs/common';
import { Can } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CourseCategoryService } from './course-category.service';
import type { CourseCategoryDto, CreateCourseCategoryDto, UpdateCourseCategoryDto } from './course-category.types';
import { CourseCategoryValidationPipe } from './course-category.validation';

@Controller('course-categories')
export class CourseCategoryController {
  constructor(private readonly courseCategoryService: CourseCategoryService) {}

  @Public()
  @Get()
  async findAll(): Promise<CourseCategoryDto[]> {
    return this.courseCategoryService.findAll();
  }

  @Can('create', 'course')
  @Post()
  create(@Body(new CourseCategoryValidationPipe()) dto: CreateCourseCategoryDto): Promise<CourseCategoryDto> {
    return this.courseCategoryService.create(dto);
  }

  @Can('update', 'course')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new CourseCategoryValidationPipe(true)) dto: UpdateCourseCategoryDto,
  ): Promise<CourseCategoryDto> {
    return this.courseCategoryService.update(id, dto);
  }

  @Can('delete', 'course')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    await this.courseCategoryService.delete(id);
  }
}
