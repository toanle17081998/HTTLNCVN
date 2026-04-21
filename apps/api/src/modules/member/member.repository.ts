import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import type { MemberDto, MemberListResult, UpdateMemberDto } from './member.types';

const MEMBER_INCLUDE = { profile: true, role: true } as const;

function toDto(u: {
  id: string;
  email: string;
  username: string;
  status: string;
  created_at: Date;
  role: { name: string };
  profile: {
    first_name: string;
    last_name: string;
    phone: string | null;
    address: string | null;
    date_of_birth: Date | null;
    gender: string | null;
  } | null;
}): MemberDto {
  return {
    created_at: u.created_at.toISOString(),
    email: u.email,
    id: u.id,
    profile: u.profile
      ? {
          address: u.profile.address,
          date_of_birth: u.profile.date_of_birth?.toISOString().slice(0, 10) ?? null,
          first_name: u.profile.first_name,
          gender: u.profile.gender,
          last_name: u.profile.last_name,
          phone: u.profile.phone,
        }
      : null,
    role: u.role.name,
    status: u.status,
    username: u.username,
  };
}

@Injectable()
export class MemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(skip: number, take: number): Promise<MemberListResult> {
    const where = { deleted_at: null };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({ include: MEMBER_INCLUDE, orderBy: { created_at: 'desc' }, skip, take, where }),
      this.prisma.user.count({ where }),
    ]);

    return { items: items.map(toDto), total };
  }

  async findById(id: string): Promise<MemberDto | null> {
    const user = await this.prisma.user.findUnique({ include: MEMBER_INCLUDE, where: { id } });

    return user ? toDto(user) : null;
  }

  async update(id: string, dto: UpdateMemberDto): Promise<MemberDto | null> {
    const user = await this.prisma.user.update({
      data: {
        ...(dto.username !== undefined && { username: dto.username }),
        ...(dto.profile !== undefined && {
          profile: {
            upsert: {
              create: {
                first_name: dto.profile.first_name ?? '',
                last_name: dto.profile.last_name ?? '',
                ...dto.profile,
              },
              update: dto.profile,
            },
          },
        }),
      },
      include: MEMBER_INCLUDE,
      where: { id },
    });

    return toDto(user);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.update({
      data: { deleted_at: new Date() },
      where: { id },
    });
  }
}
