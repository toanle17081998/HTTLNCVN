import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { ChurchUnitRepository } from './church-unit.repository';
import type {
  ChurchUnitDto,
  ChurchUnitListResult,
  ChurchUnitMetaDto,
  CreateChurchUnitDto,
  UpdateChurchUnitDto,
} from './church-unit.types';
import { DEFAULT_CHURCH_UNIT_TYPES } from './church-unit.types';

@Injectable()
export class ChurchUnitService {
  constructor(private readonly churchUnitRepository: ChurchUnitRepository) {}

  getMeta(): Promise<ChurchUnitMetaDto> {
    return this.churchUnitRepository.getMeta();
  }

  findAll(skip: number, take: number): Promise<ChurchUnitListResult> {
    const safeSkip = Number.isFinite(skip) && skip > 0 ? Math.floor(skip) : 0;
    const safeTake = Number.isFinite(take) && take > 0 ? Math.min(Math.floor(take), 100) : 20;

    return this.churchUnitRepository.findAll(safeSkip, safeTake);
  }

  async findById(id: string): Promise<ChurchUnitDto> {
    const unit = await this.churchUnitRepository.findById(id);

    if (!unit) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Church unit not found.' });
    }

    return unit;
  }

  async create(dto: CreateChurchUnitDto): Promise<ChurchUnitDto> {
    await this.validateWrite(dto);
    return this.churchUnitRepository.create(dto);
  }

  async update(id: string, dto: UpdateChurchUnitDto): Promise<ChurchUnitDto> {
    await this.findById(id);
    await this.validateWrite(dto, id);

    const unit = await this.churchUnitRepository.update(id, dto);

    if (!unit) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Church unit not found.' });
    }

    return unit;
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.churchUnitRepository.delete(id);
  }

  async getClassScores(id: string, userId: string): Promise<any> {
    const unit = await this.findById(id);

    if (unit.type !== 'class') {
      throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Church unit is not a class.' });
    }

    // Verify permission: user must be a class admin for this class
    const isClassAdmin = unit.members.some(
      (m) => m.id === userId && (m.role === 'admin' || m.role === 'admin_member'),
    );
    if (!isClassAdmin) {
      throw new BadRequestException({
        code: 'FORBIDDEN',
        message: 'You are not authorized to view scores for this class.',
      });
    }

    return this.churchUnitRepository.getClassScores(id);
  }

  private async validateWrite(
    dto: CreateChurchUnitDto | UpdateChurchUnitDto,
    currentUnitId?: string,
  ): Promise<void> {
    if ('name' in dto && dto.name !== undefined && !dto.name.trim()) {
      throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Church unit name is required.' });
    }

    if ('type' in dto && dto.type !== undefined && !DEFAULT_CHURCH_UNIT_TYPES.includes(dto.type as never)) {
      throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Invalid church unit type.' });
    }

    if (dto.parent_id !== undefined) {
      if (dto.parent_id === currentUnitId) {
        throw new BadRequestException({ code: 'BAD_REQUEST', message: 'A unit cannot be its own parent.' });
      }

      if (dto.parent_id) {
        const parentExists = await this.churchUnitRepository.exists(dto.parent_id);
        if (!parentExists) {
          throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Parent church unit does not exist.' });
        }
      }
    }

    if (dto.sort_order !== undefined && !Number.isFinite(dto.sort_order)) {
      throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Invalid sort order.' });
    }

    await this.validateUsers([dto.leader_id].filter(Boolean) as string[]);

    if (dto.members !== undefined) {
      if (!Array.isArray(dto.members)) {
        throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Members must be a list.' });
      }
      const userIds = dto.members.map((m) => m.user_id);
      await this.validateUsers(userIds);
    } else if (dto.member_ids !== undefined) {
      if (!Array.isArray(dto.member_ids)) {
        throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Members must be a list.' });
      }

      const uniqueMemberIds = [...new Set(dto.member_ids.filter((memberId) => memberId.trim()))];
      if (uniqueMemberIds.length !== dto.member_ids.length) {
        throw new BadRequestException({
          code: 'BAD_REQUEST',
          message: 'Members contain duplicate or invalid ids.',
        });
      }

      await this.validateUsers(uniqueMemberIds);
    }

    if (dto.type === 'event_organizer' && dto.service_teams !== undefined) {
      if (!Array.isArray(dto.service_teams)) {
        throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Service teams must be a list.' });
      }
      for (const team of dto.service_teams) {
        if (!team.name || !team.name.trim()) {
          throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Service team name is required.' });
        }
        const teamUserIds = [...(team.member_ids ?? []), team.leader_id].filter(Boolean) as string[];
        await this.validateUsers(teamUserIds);
      }
    }
  }

  private async validateUsers(userIds: string[]): Promise<void> {
    if (userIds.length === 0) {
      return;
    }

    const count = await this.churchUnitRepository.countUsersByIds(userIds);
    if (count !== userIds.length) {
      throw new BadRequestException({
        code: 'BAD_REQUEST',
        message: 'One or more selected members do not exist.',
      });
    }
  }
}
