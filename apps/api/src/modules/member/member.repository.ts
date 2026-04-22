import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';

import { PrismaService } from '../../database/prisma.service';
import type { CreateMemberDto, MemberDto, MemberListResult, UpdateMemberDto } from './member.types';

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
    const user = await this.prisma.user.findFirst({
      include: MEMBER_INCLUDE,
      where: { deleted_at: null, id },
    });

    return user ? toDto(user) : null;
  }

  async create(dto: CreateMemberDto): Promise<MemberDto> {
    const role = await this.findRole(dto.role ?? 'church_member');
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.trim(),
        password_hash: passwordHash,
        role_id: role.id,
        status: dto.status ?? 'active',
        username: dto.username.trim(),
        ...(dto.profile !== undefined && {
          profile: {
            create: {
              address: dto.profile.address ?? null,
              date_of_birth: dto.profile.date_of_birth ? new Date(dto.profile.date_of_birth) : null,
              first_name: dto.profile.first_name ?? '',
              gender: dto.profile.gender ?? null,
              last_name: dto.profile.last_name ?? '',
              phone: dto.profile.phone ?? null,
            },
          },
        }),
      },
      include: MEMBER_INCLUDE,
    });

    return toDto(user);
  }

  async update(id: string, dto: UpdateMemberDto): Promise<MemberDto | null> {
    const role = dto.role ? await this.findRole(dto.role) : null;
    const user = await this.prisma.user.update({
      data: {
        ...(dto.email !== undefined && { email: dto.email.trim() }),
        ...(role && { role_id: role.id }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.username !== undefined && { username: dto.username.trim() }),
        ...(dto.profile !== undefined && {
          profile: {
            upsert: {
              create: {
                address: dto.profile.address ?? null,
                date_of_birth: dto.profile.date_of_birth ? new Date(dto.profile.date_of_birth) : null,
                first_name: dto.profile.first_name ?? '',
                gender: dto.profile.gender ?? null,
                last_name: dto.profile.last_name ?? '',
                phone: dto.profile.phone ?? null,
              },
              update: {
                ...(dto.profile.address !== undefined && { address: dto.profile.address }),
                ...(dto.profile.date_of_birth !== undefined && {
                  date_of_birth: dto.profile.date_of_birth
                    ? new Date(dto.profile.date_of_birth)
                    : null,
                }),
                ...(dto.profile.first_name !== undefined && { first_name: dto.profile.first_name }),
                ...(dto.profile.gender !== undefined && { gender: dto.profile.gender }),
                ...(dto.profile.last_name !== undefined && { last_name: dto.profile.last_name }),
                ...(dto.profile.phone !== undefined && { phone: dto.profile.phone }),
              },
            },
          },
        }),
      },
      include: MEMBER_INCLUDE,
      where: { id, deleted_at: null },
    });

    return toDto(user);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.update({
      data: { deleted_at: new Date() },
      where: { id },
    });
  }

  private async findRole(name: string): Promise<{ id: number }> {
    const role = await this.prisma.role.findUnique({
      select: { id: true },
      where: { name },
    });

    if (!role) {
      throw new Error('ROLE_NOT_FOUND');
    }

    return role;
  }
}
