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
} from '@nestjs/common';

import { Can } from '../../common/decorators/permissions.decorator';
import { ChurchUnitService } from './church-unit.service';
import type {
  ChurchUnitDto,
  ChurchUnitListResult,
  ChurchUnitMetaDto,
  CreateChurchUnitDto,
  UpdateChurchUnitDto,
} from './church-unit.types';

@Controller('church-units')
export class ChurchUnitController {
  constructor(private readonly churchUnitService: ChurchUnitService) {}

  @Get('meta')
  @Can('read', 'church_unit')
  getMeta(): Promise<ChurchUnitMetaDto> {
    return this.churchUnitService.getMeta();
  }

  @Get()
  @Can('read', 'church_unit')
  findAll(
    @Query('skip') skip = '0',
    @Query('take') take = '20',
  ): Promise<ChurchUnitListResult> {
    return this.churchUnitService.findAll(Number(skip), Number(take));
  }

  @Get(':id')
  @Can('read', 'church_unit')
  findById(@Param('id') id: string): Promise<ChurchUnitDto> {
    return this.churchUnitService.findById(id);
  }

  @Post()
  @Can('create', 'church_unit')
  create(@Body() dto: CreateChurchUnitDto): Promise<ChurchUnitDto> {
    return this.churchUnitService.create(dto);
  }

  @Patch(':id')
  @Can('update', 'church_unit')
  update(@Param('id') id: string, @Body() dto: UpdateChurchUnitDto): Promise<ChurchUnitDto> {
    return this.churchUnitService.update(id, dto);
  }

  @Delete(':id')
  @Can('delete', 'church_unit')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string): Promise<void> {
    return this.churchUnitService.delete(id);
  }
}
