import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { containsSearchQuery } from '../../database/search-query';
import type { CreateMemberDto, MemberDto, MemberListResult, UpdateMemberDto } from './member.types';

const MEMBER_SELECT = {
  created_at: true,
  email: true,
  id: true,
  profile: {
    select: {
      address: true,
      date_of_birth: true,
      first_name: true,
      gender: true,
      last_name: true,
      phone: true,
    },
  },
  role: { select: { name: true } },
  status: true,
  username: true,
} as const;

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

  async findAll(skip: number, take: number, q?: string, role?: string): Promise<MemberListResult> {
    const search = containsSearchQuery(q);
    const where: Prisma.UserWhereInput = {
      deleted_at: null,
      ...(role && { role: { name: role } }),
      ...(search && {
        OR: [
          { email: search },
          { username: search },
          {
            profile: {
              OR: [
                { first_name: search },
                { last_name: search },
              ],
            },
          },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({ select: MEMBER_SELECT, orderBy: { created_at: 'desc' }, skip, take, where }),
      this.prisma.user.count({ where }),
    ]);

    return { items: items.map(toDto), total };
  }

  async findById(id: string): Promise<MemberDto | null> {
    const user = await this.prisma.user.findFirst({
      select: MEMBER_SELECT,
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
      select: MEMBER_SELECT,
    });

    return toDto(user);
  }

  async update(id: string, dto: UpdateMemberDto): Promise<MemberDto | null> {
    const role = dto.role ? await this.findRole(dto.role) : null;
    const passwordHash = dto.password !== undefined ? await bcrypt.hash(dto.password, 10) : undefined;
    const user = await this.prisma.user.update({
      data: {
        ...(dto.email !== undefined && { email: dto.email.trim() }),
        ...(passwordHash !== undefined && { password_hash: passwordHash }),
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
      select: MEMBER_SELECT,
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
      select: { id: true, name: true },
      where: { name },
    });

    if (!role || role.name !== name) {
      throw new Error('ROLE_NOT_FOUND');
    }

    return role;
  }
}
