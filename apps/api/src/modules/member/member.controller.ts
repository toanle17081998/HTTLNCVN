import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Query } from '@nestjs/common';

import { Roles } from '../../common/decorators/roles.decorator';
import { MemberService } from './member.service';
import type { MemberDto, MemberListResult, UpdateMemberDto } from './member.types';

@Controller('members')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Get()
  findAll(
    @Query('skip') skip = '0',
    @Query('take') take = '20',
  ): Promise<MemberListResult> {
    return this.memberService.findAll(Number(skip), Number(take));
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<MemberDto> {
    return this.memberService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMemberDto): Promise<MemberDto> {
    return this.memberService.update(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string): Promise<void> {
    return this.memberService.delete(id);
  }
}
