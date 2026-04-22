import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { MemberRepository } from './member.repository';
import type { CreateMemberDto, MemberDto, MemberListResult, UpdateMemberDto } from './member.types';

const allowedStatuses = new Set(['active', 'pending', 'suspended']);

@Injectable()
export class MemberService {
  constructor(private readonly memberRepository: MemberRepository) {}

  findAll(skip: number, take: number): Promise<MemberListResult> {
    const safeSkip = Number.isFinite(skip) && skip > 0 ? Math.floor(skip) : 0;
    const safeTake = Number.isFinite(take) && take > 0 ? Math.min(Math.floor(take), 100) : 20;

    return this.memberRepository.findAll(safeSkip, safeTake);
  }

  async findById(id: string): Promise<MemberDto> {
    const member = await this.memberRepository.findById(id);

    if (!member) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Member not found.' });
    }

    return member;
  }

  async create(dto: CreateMemberDto): Promise<MemberDto> {
    this.validateCreate(dto);

    try {
      return await this.memberRepository.create(dto);
    } catch (error) {
      this.handleWriteError(error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateMemberDto): Promise<MemberDto> {
    this.validateUpdate(dto);

    try {
      const member = await this.memberRepository.update(id, dto);

      if (!member) {
        throw new NotFoundException({ code: 'NOT_FOUND', message: 'Member not found.' });
      }

      return member;
    } catch (error) {
      this.handleWriteError(error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.memberRepository.delete(id);
  }

  private validateCreate(dto: CreateMemberDto): void {
    if (!dto.email?.trim()) {
      throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Email is required.' });
    }

    if (!dto.username?.trim()) {
      throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Username is required.' });
    }

    if (!dto.password || dto.password.length < 8) {
      throw new BadRequestException({
        code: 'BAD_REQUEST',
        message: 'Password must be at least 8 characters.',
      });
    }

    if (dto.status && !allowedStatuses.has(dto.status)) {
      throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Invalid member status.' });
    }
  }

  private validateUpdate(dto: UpdateMemberDto): void {
    if (dto.email !== undefined && !dto.email.trim()) {
      throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Email cannot be empty.' });
    }

    if (dto.username !== undefined && !dto.username.trim()) {
      throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Username cannot be empty.' });
    }

    if (dto.status !== undefined && !allowedStatuses.has(dto.status)) {
      throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Invalid member status.' });
    }
  }

  private handleWriteError(error: unknown): void {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: 'A member with that email or username already exists.',
      });
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2025'
    ) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Member not found.' });
    }

    if (error instanceof Error && error.message === 'ROLE_NOT_FOUND') {
      throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Role does not exist.' });
    }
  }
}
