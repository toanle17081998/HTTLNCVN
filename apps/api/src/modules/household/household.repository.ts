import { Injectable } from '@nestjs/common';
import { Prisma, type Household } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import type {
  AddHouseholdMemberDto,
  CreateHouseholdDto,
  HouseholdDto,
  HouseholdListResult,
  UpdateHouseholdDto,
} from './household.types';

const HOUSEHOLD_INCLUDE = {
  members: {
    include: { user: { include: { profile: true } } },
    orderBy: { joined_at: 'asc' as const },
  },
} as const;

function toDto(household: Household & { members: Array<{
  joined_at: Date;
  role: string | null;
  user: { id: string; username: string; profile: { first_name: string; last_name: string } | null };
}> }): HouseholdDto {
  return {
    address: household.address,
    created_at: household.created_at.toISOString(),
    id: household.id,
    members: household.members.map(({ joined_at, role, user }) => ({
      id: user.id,
      joined_at: joined_at.toISOString(),
      name: [user.profile?.first_name, user.profile?.last_name].filter(Boolean).join(' ') || user.username,
      role,
      username: user.username,
    })),
    name: household.name,
    note: household.note,
    phone: household.phone,
    updated_at: household.updated_at.toISOString(),
  };
}

@Injectable()
export class HouseholdRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(skip: number, take: number, q?: string): Promise<HouseholdListResult> {
    const where: Prisma.HouseholdWhereInput = q
      ? { OR: [{ name: { contains: q } }, { phone: { contains: q } }] }
      : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.household.findMany({ include: HOUSEHOLD_INCLUDE, orderBy: { name: 'asc' }, skip, take, where }),
      this.prisma.household.count({ where }),
    ]);
    return { items: items.map(toDto), total };
  }

  async findById(id: string): Promise<HouseholdDto | null> {
    const household = await this.prisma.household.findUnique({ include: HOUSEHOLD_INCLUDE, where: { id } });
    return household ? toDto(household) : null;
  }

  async create(dto: CreateHouseholdDto): Promise<HouseholdDto> {
    const household = await this.prisma.household.create({
      data: {
        address: dto.address ?? null,
        members: dto.member_ids?.length
          ? { create: [...new Set(dto.member_ids)].map((user_id) => ({ user_id })) }
          : undefined,
        name: dto.name.trim(),
        note: dto.note ?? null,
        phone: dto.phone ?? null,
      },
      include: HOUSEHOLD_INCLUDE,
    });
    return toDto(household);
  }

  async update(id: string, dto: UpdateHouseholdDto): Promise<HouseholdDto> {
    const household = await this.prisma.household.update({
      data: {
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.note !== undefined && { note: dto.note }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
      },
      include: HOUSEHOLD_INCLUDE,
      where: { id },
    });
    return toDto(household);
  }

  delete(id: string): Promise<Household> {
    return this.prisma.household.delete({ where: { id } });
  }

  async addMember(id: string, dto: AddHouseholdMemberDto): Promise<HouseholdDto | null> {
    await this.prisma.householdMember.upsert({
      create: { household_id: id, role: dto.role ?? null, user_id: dto.user_id },
      update: { role: dto.role ?? null },
      where: { household_id_user_id: { household_id: id, user_id: dto.user_id } },
    });
    return this.findById(id);
  }

  async removeMember(id: string, userId: string): Promise<HouseholdDto | null> {
    await this.prisma.householdMember.delete({
      where: { household_id_user_id: { household_id: id, user_id: userId } },
    });
    return this.findById(id);
  }
}

