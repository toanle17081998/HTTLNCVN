import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';

import { Can, Permissions } from '../../common/decorators/permissions.decorator';
import { MemberService } from './member.service';
import type { CreateMemberDto, MemberDto, MemberListResult, UpdateMemberDto } from './member.types';

@Controller('members')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Get()
  @Can('read', 'member')
  findAll(
    @Query('skip') skip = '0',
    @Query('take') take = '20',
  ): Promise<MemberListResult> {
    return this.memberService.findAll(Number(skip), Number(take));
  }

  @Get(':id')
  @Can('read', 'member')
  findById(@Param('id') id: string): Promise<MemberDto> {
    return this.memberService.findById(id);
  }

  @Post()
  @Permissions({ action: 'create', resource: 'member' }, { action: 'update', resource: 'member' })
  create(@Body() dto: CreateMemberDto): Promise<MemberDto> {
    return this.memberService.create(dto);
  }

  @Patch(':id')
  @Can('update', 'member')
  update(@Param('id') id: string, @Body() dto: UpdateMemberDto): Promise<MemberDto> {
    return this.memberService.update(id, dto);
  }

  @Can('delete', 'member')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string): Promise<void> {
    return this.memberService.delete(id);
  }
}
