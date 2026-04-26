import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import type {
  ChurchUnitDto,
  ChurchUnitListResult,
  ChurchUnitMemberDto,
  ChurchUnitMetaDto,
  ChurchUnitSummaryDto,
  CreateChurchUnitDto,
  UpdateChurchUnitDto,
} from './church-unit.types';
import { DEFAULT_CHURCH_UNIT_TYPES } from './church-unit.types';

const CHURCH_UNIT_INCLUDE = {
  children: {
    select: { id: true },
  },
  leader: {
    include: {
      profile: {
        select: {
          first_name: true,
          last_name: true,
        },
      },
    },
  },
  members: {
    include: {
      user: {
        include: {
          profile: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
        },
      },
    },
  },
  parent: {
    select: {
      id: true,
      name: true,
      type: true,
    },
  },
} as const;

function toMemberDto(member: {
  id: string;
  profile: { first_name: string; last_name: string } | null;
  username: string;
}): ChurchUnitMemberDto {
  const displayName = [member.profile?.first_name, member.profile?.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();

  return {
    display_name: displayName || member.username,
    id: member.id,
    username: member.username,
  };
}

function toSummaryDto(unit: {
  id: string;
  name: string;
  type: string;
}): ChurchUnitSummaryDto {
  return {
    id: unit.id,
    name: unit.name,
    type: unit.type,
  };
}

function toDto(unit: {
  children: Array<{ id: string }>;
  created_at: Date;
  description: string | null;
  id: string;
  is_active: boolean;
  leader: {
    id: string;
    profile: { first_name: string; last_name: string } | null;
    username: string;
  } | null;
  members: Array<{
    user: {
      id: string;
      profile: { first_name: string; last_name: string } | null;
      username: string;
    };
  }>;
  name: string;
  parent: { id: string; name: string; type: string } | null;
  sort_order: number | null;
  type: string;
  updated_at: Date;
}): ChurchUnitDto {
  const members = unit.members.map((membership) => toMemberDto(membership.user));

  return {
    children_count: unit.children.length,
    created_at: unit.created_at.toISOString(),
    description: unit.description,
    id: unit.id,
    is_active: unit.is_active,
    leader: unit.leader ? toMemberDto(unit.leader) : null,
    member_count: members.length,
    members,
    name: unit.name,
    parent: unit.parent ? toSummaryDto(unit.parent) : null,
    sort_order: unit.sort_order ?? 0,
    type: unit.type,
    updated_at: unit.updated_at.toISOString(),
  };
}

@Injectable()
export class ChurchUnitRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getMeta(): Promise<ChurchUnitMetaDto> {
    const [members, units] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        include: {
          profile: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
        },
        orderBy: [{ username: 'asc' }],
        where: {
          deleted_at: null,
          status: 'active',
        },
      }),
      this.prisma.churchUnit.findMany({
        orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          type: true,
        },
      }),
    ]);

    return {
      members: members.map(toMemberDto),
      types: [...DEFAULT_CHURCH_UNIT_TYPES],
      units: units.map(toSummaryDto),
    };
  }

  async findAll(skip: number, take: number): Promise<ChurchUnitListResult> {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.churchUnit.findMany({
        include: CHURCH_UNIT_INCLUDE,
        orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
        skip,
        take,
      }),
      this.prisma.churchUnit.count(),
    ]);

    return { items: items.map((item) => toDto(item)), total };
  }

  async findById(id: string): Promise<ChurchUnitDto | null> {
    const unit = await this.prisma.churchUnit.findUnique({
      include: CHURCH_UNIT_INCLUDE,
      where: { id },
    });

    return unit ? toDto(unit) : null;
  }

  async create(dto: CreateChurchUnitDto): Promise<ChurchUnitDto> {
    const memberIds = [...new Set([...(dto.member_ids ?? []), dto.leader_id].filter(Boolean) as string[])];

    const unit = await this.prisma.churchUnit.create({
      data: {
        description: dto.description ?? null,
        is_active: dto.is_active ?? true,
        leader_id: dto.leader_id ?? null,
        name: dto.name.trim(),
        parent_id: dto.parent_id ?? null,
        sort_order: dto.sort_order ?? 0,
        type: dto.type,
        ...(memberIds.length > 0 && {
          members: {
            createMany: {
              data: memberIds.map((memberId) => ({ user_id: memberId })),
            },
          },
        }),
      },
      include: CHURCH_UNIT_INCLUDE,
    });

    return toDto(unit);
  }

  async update(id: string, dto: UpdateChurchUnitDto): Promise<ChurchUnitDto | null> {
    const unit = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.churchUnit.findUnique({
        select: { leader_id: true },
        where: { id },
      });

      if (!existing) {
        return null;
      }

      const finalLeaderId = dto.leader_id !== undefined ? dto.leader_id : existing.leader_id;
      const memberIds = dto.member_ids
        ? [...new Set([...dto.member_ids, finalLeaderId].filter(Boolean) as string[])]
        : null;

      await tx.churchUnit.update({
        data: {
          ...(dto.description !== undefined && { description: dto.description ?? null }),
          ...(dto.is_active !== undefined && { is_active: dto.is_active }),
          ...(dto.leader_id !== undefined && { leader_id: dto.leader_id ?? null }),
          ...(dto.name !== undefined && { name: dto.name.trim() }),
          ...(dto.parent_id !== undefined && { parent_id: dto.parent_id ?? null }),
          ...(dto.sort_order !== undefined && { sort_order: dto.sort_order }),
          ...(dto.type !== undefined && { type: dto.type }),
        },
        where: { id },
      });

      if (memberIds) {
        await tx.churchUnitMember.deleteMany({ where: { church_unit_id: id } });
        if (memberIds.length > 0) {
          await tx.churchUnitMember.createMany({
            data: memberIds.map((memberId) => ({
              church_unit_id: id,
              user_id: memberId,
            })),
          });
        }
      }

      return tx.churchUnit.findUnique({
        include: CHURCH_UNIT_INCLUDE,
        where: { id },
      });
    });

    return unit ? toDto(unit) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.churchUnit.delete({ where: { id } });
  }

  async exists(id: string): Promise<boolean> {
    const unit = await this.prisma.churchUnit.findUnique({
      select: { id: true },
      where: { id },
    });

    return Boolean(unit);
  }

  async countUsersByIds(userIds: string[]): Promise<number> {
    return this.prisma.user.count({
      where: {
        deleted_at: null,
        id: { in: userIds },
      },
    });
  }
}
