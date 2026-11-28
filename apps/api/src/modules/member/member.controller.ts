import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Request } from '@nestjs/common';

import { Can } from '../../common/decorators/permissions.decorator';
import type { JwtPayload } from '../../common/strategies/jwt.strategy';
import { MemberService } from './member.service';
import type { CreateMemberDto, MemberDto, MemberListResult, UpdateMemberDto } from './member.types';

@Controller('members')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Get()
  @Can('read', 'member')
  findAll(
    @Query('q') q?: string,
    @Query('skip') skip = '0',
    @Query('take') take = '20',
    @Query('role') role?: string,
  ): Promise<MemberListResult> {
    return this.memberService.findAll(Number(skip), Number(take), q, role);
  }

  @Get(':id')
  @Can('read', 'member')
  findById(@Param('id') id: string): Promise<MemberDto> {
    return this.memberService.findById(id);
  }

  @Post()
  @Can('create', 'member')
  create(@Body() dto: CreateMemberDto, @Request() req: { user: JwtPayload }): Promise<MemberDto> {
    return this.memberService.create(dto, req.user.sub);
  }

  @Patch(':id')
  @Can('update', 'member')
  update(@Param('id') id: string, @Body() dto: UpdateMemberDto, @Request() req: { user: JwtPayload }): Promise<MemberDto> {
    return this.memberService.update(id, dto, req.user.sub);
  }

  @Can('delete', 'member')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string): Promise<void> {
    return this.memberService.delete(id);
  }
}
