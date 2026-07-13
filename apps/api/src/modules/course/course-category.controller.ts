import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Can } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';

type CourseCategoryDto = {
  id: string;
  name_en: string;
  name_vi: string;
  created_at: string;
};

type CreateCourseCategoryDto = {
  name_en: string;
  name_vi: string;
};

type UpdateCourseCategoryDto = Partial<CreateCourseCategoryDto>;

function mapCategory(c: { id: string; name_en: string; name_vi: string; created_at: Date }): CourseCategoryDto {
  return {
    id: c.id,
    name_en: c.name_en,
    name_vi: c.name_vi,
    created_at: c.created_at.toISOString(),
  };
}

@Controller('course-categories')
export class CourseCategoryController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async findAll(): Promise<CourseCategoryDto[]> {
    const categories = await (this.prisma as any).courseCategory.findMany({
      orderBy: { name_vi: 'asc' },
    });
    return categories.map(mapCategory);
  }

  @Can('create', 'course')
  @Post()
  async create(@Body() dto: CreateCourseCategoryDto): Promise<CourseCategoryDto> {
    const category = await (this.prisma as any).courseCategory.create({
      data: { name_en: dto.name_en, name_vi: dto.name_vi },
    });
    return mapCategory(category);
  }

  @Can('update', 'course')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCourseCategoryDto): Promise<CourseCategoryDto> {
    const existing = await (this.prisma as any).courseCategory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Category not found.' });

    const category = await (this.prisma as any).courseCategory.update({
      data: dto,
      where: { id },
    });
    return mapCategory(category);
  }

  @Can('delete', 'course')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    const existing = await (this.prisma as any).courseCategory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Category not found.' });

    // Unlink courses from this category before deleting
    await (this.prisma as any).course.updateMany({
      data: { category_id: null },
      where: { category_id: id },
    });

    await (this.prisma as any).courseCategory.delete({ where: { id } });
  }
}
