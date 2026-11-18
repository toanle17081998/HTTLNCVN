import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';

import { Can } from '../../common/decorators/permissions.decorator';
import { HouseholdService } from './household.service';
import type { AddHouseholdMemberDto, CreateHouseholdDto, HouseholdDto, HouseholdListResult, UpdateHouseholdDto } from './household.types';

@Controller('households')
export class HouseholdController {
  constructor(private readonly householdService: HouseholdService) {}

  @Get()
  @Can('read', 'member')
  findAll(@Query('q') q?: string, @Query('skip') skip = '0', @Query('take') take = '20'): Promise<HouseholdListResult> {
    return this.householdService.findAll(Number(skip), Number(take), q);
  }

  @Get(':id')
  @Can('read', 'member')
  findById(@Param('id') id: string): Promise<HouseholdDto> {
    return this.householdService.findById(id);
  }

  @Post()
  @Can('create', 'member')
  create(@Body() dto: CreateHouseholdDto): Promise<HouseholdDto> {
    return this.householdService.create(dto);
  }

  @Patch(':id')
  @Can('update', 'member')
  update(@Param('id') id: string, @Body() dto: UpdateHouseholdDto): Promise<HouseholdDto> {
    return this.householdService.update(id, dto);
  }

  @Delete(':id')
  @Can('delete', 'member')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string): Promise<void> {
    return this.householdService.delete(id);
  }

  @Post(':id/members')
  @Can('update', 'member')
  addMember(@Param('id') id: string, @Body() dto: AddHouseholdMemberDto): Promise<HouseholdDto> {
    return this.householdService.addMember(id, dto);
  }

  @Delete(':id/members/:userId')
  @Can('update', 'member')
  removeMember(@Param('id') id: string, @Param('userId') userId: string): Promise<HouseholdDto> {
    return this.householdService.removeMember(id, userId);
  }
}

