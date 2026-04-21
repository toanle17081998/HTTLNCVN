import { Injectable, NotFoundException } from '@nestjs/common';

import { MemberRepository } from './member.repository';
import type { MemberDto, MemberListResult, UpdateMemberDto } from './member.types';

@Injectable()
export class MemberService {
  constructor(private readonly memberRepository: MemberRepository) {}

  findAll(skip: number, take: number): Promise<MemberListResult> {
    return this.memberRepository.findAll(skip, take);
  }

  async findById(id: string): Promise<MemberDto> {
    const member = await this.memberRepository.findById(id);

    if (!member) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Member not found.' });
    }

    return member;
  }

  async update(id: string, dto: UpdateMemberDto): Promise<MemberDto> {
    const member = await this.memberRepository.update(id, dto);

    if (!member) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Member not found.' });
    }

    return member;
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.memberRepository.delete(id);
  }
}
