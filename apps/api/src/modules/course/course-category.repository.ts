import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import type {
  CourseCategoryRecord,
  CreateCourseCategoryDto,
  UpdateCourseCategoryDto,
} from './course-category.types';

@Injectable()
export class CourseCategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<CourseCategoryRecord[]> {
    return (this.prisma as any).courseCategory.findMany({ orderBy: { name_vi: 'asc' } });
  }

  findById(id: string): Promise<CourseCategoryRecord | null> {
    return (this.prisma as any).courseCategory.findUnique({ where: { id } });
  }

  create(dto: CreateCourseCategoryDto): Promise<CourseCategoryRecord> {
    return (this.prisma as any).courseCategory.create({ data: dto });
  }

  update(id: string, dto: UpdateCourseCategoryDto): Promise<CourseCategoryRecord> {
    return (this.prisma as any).courseCategory.update({ data: dto, where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.$transaction([
      (this.prisma as any).course.updateMany({
        data: { category_id: null },
        where: { category_id: id },
      }),
      (this.prisma as any).courseCategory.delete({ where: { id } }),
    ]);
  }
}
