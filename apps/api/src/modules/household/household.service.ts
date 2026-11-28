import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { HouseholdRepository } from './household.repository';
import type {
  AddHouseholdMemberDto,
  CreateHouseholdDto,
  HouseholdDto,
  HouseholdListResult,
  UpdateHouseholdDto,
} from './household.types';

@Injectable()
export class HouseholdService {
  constructor(private readonly householdRepository: HouseholdRepository) {}

  findAll(skip: number, take: number, q?: string): Promise<HouseholdListResult> {
    const safeSkip = Number.isFinite(skip) && skip > 0 ? Math.floor(skip) : 0;
    const safeTake = Number.isFinite(take) && take > 0 ? Math.min(Math.floor(take), 100) : 20;
    return this.householdRepository.findAll(safeSkip, safeTake, q);
  }

  async findById(id: string): Promise<HouseholdDto> {
    const household = await this.householdRepository.findById(id);
    if (!household) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Household not found.' });
    return household;
  }

  async create(dto: CreateHouseholdDto): Promise<HouseholdDto> {
    this.validateName(dto.name);
    return this.runWrite(() => this.householdRepository.create(dto));
  }

  async update(id: string, dto: UpdateHouseholdDto): Promise<HouseholdDto> {
    if (dto.name !== undefined) this.validateName(dto.name);
    await this.findById(id);
    return this.runWrite(() => this.householdRepository.update(id, dto));
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.householdRepository.delete(id);
  }

  async addMember(id: string, dto: AddHouseholdMemberDto): Promise<HouseholdDto> {
    if (!dto.user_id) throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Member is required.' });
    await this.findById(id);
    const household = await this.runWrite(() => this.householdRepository.addMember(id, dto));
    if (!household) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Household not found.' });
    return household;
  }

  async removeMember(id: string, userId: string): Promise<HouseholdDto> {
    await this.findById(id);
    const household = await this.runWrite(() => this.householdRepository.removeMember(id, userId));
    if (!household) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Household not found.' });
    return household;
  }

  private validateName(name: string): void {
    if (!name?.trim()) throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Name is required.' });
  }

  private async runWrite<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (typeof error === 'object' && error && 'code' in error && error.code === 'P2003') {
        throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Member does not exist.' });
      }
      if (typeof error === 'object' && error && 'code' in error && error.code === 'P2025') {
        throw new NotFoundException({ code: 'NOT_FOUND', message: 'Household or member not found.' });
      }
      if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') {
        throw new ConflictException({ code: 'CONFLICT', message: 'Member already belongs to this household.' });
      }
      throw error;
    }
  }
}

