import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import type {
  ServingAssignmentDto,
  ServingMemberDto,
  ServingPlannerDto,
  ServingScheduleDto,
  UpdateServingScheduleDto,
  UpsertServingProfilesDto,
} from './serving-schedule.types';

function toMemberDto(member: {
  id: string;
  username: string;
  profile: { first_name: string; last_name: string } | null;
  serving_profiles?: Array<{ is_active: boolean; skills: string[] }>;
}): ServingMemberDto {
  const displayName = [member.profile?.first_name, member.profile?.last_name].filter(Boolean).join(' ').trim();
  const profile = member.serving_profiles?.[0];

  return {
    display_name: displayName || member.username,
    id: member.id,
    skills: profile?.is_active === false ? [] : (profile?.skills ?? []),
    username: member.username,
  };
}

function toAssignmentDto(assignment: {
  id: string;
  role: string;
  slot_index: number;
  user: {
    id: string;
    username: string;
    profile: { first_name: string; last_name: string } | null;
    serving_profiles?: Array<{ is_active: boolean; skills: string[] }>;
  };
}): ServingAssignmentDto {
  return {
    id: assignment.id,
    role: assignment.role,
    slot_index: assignment.slot_index,
    user: toMemberDto(assignment.user),
  };
}

function toScheduleDto(schedule: {
  assignments: Array<{
    id: string;
    role: string;
    slot_index: number;
    user: {
      id: string;
      username: string;
      profile: { first_name: string; last_name: string } | null;
      serving_profiles?: Array<{ is_active: boolean; skills: string[] }>;
    };
  }>;
  church_unit_id: string;
  id: string;
  service_date: Date;
  type: string;
}): ServingScheduleDto {
  return {
    assignments: schedule.assignments.map(toAssignmentDto),
    church_unit_id: schedule.church_unit_id,
    id: schedule.id,
    service_date: schedule.service_date.toISOString(),
    type: schedule.type,
  };
}

@Injectable()
export class ServingScheduleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getPlanner(churchUnitId: string, type: string): Promise<ServingPlannerDto | null> {
    const unit = (await this.prisma.churchUnit.findUnique({
      select: {
        id: true,
        members: {
          include: {
            user: {
              include: {
                profile: {
                  select: { first_name: true, last_name: true },
                },
                serving_profiles: {
                  select: { is_active: true, skills: true },
                  where: { church_unit_id: churchUnitId },
                },
              },
            },
          },
          orderBy: { user: { username: 'asc' } },
        },
        name: true,
        type: true,
      },
      where: { id: churchUnitId },
    } as any)) as any;

    if (!unit) {
      return null;
    }

    const schedules = await (this.prisma as any).servingSchedule.findMany({
      include: {
        assignments: {
          include: {
            user: {
              include: {
                profile: {
                  select: { first_name: true, last_name: true },
                },
                serving_profiles: {
                  select: { is_active: true, skills: true },
                  where: { church_unit_id: churchUnitId },
                },
              },
            },
          },
          orderBy: [{ role: 'asc' }, { slot_index: 'asc' }],
        },
      },
      orderBy: { service_date: 'asc' },
      where: {
        church_unit_id: churchUnitId,
        type,
      },
    } as any);

    return {
      church_unit: { id: unit.id, name: unit.name, type: unit.type },
      members: unit.members.map((membership: any) => toMemberDto(membership.user)),
      schedules: schedules.map((schedule: any) => toScheduleDto(schedule)),
      type,
    };
  }

  async upsertProfiles(dto: UpsertServingProfilesDto): Promise<void> {
    await this.prisma.$transaction(
      dto.profiles.map((profile) =>
        (this.prisma as any).servingProfile.upsert({
          create: {
            church_unit_id: dto.church_unit_id,
            is_active: profile.is_active ?? true,
            skills: profile.skills ?? [],
            user_id: profile.user_id,
          },
          update: {
            ...(profile.is_active !== undefined && { is_active: profile.is_active }),
            ...(profile.skills !== undefined && { skills: profile.skills }),
          },
          where: {
            church_unit_id_user_id: {
              church_unit_id: dto.church_unit_id,
              user_id: profile.user_id,
            },
          },
        }),
      ),
    );
  }

  async replaceSchedules(
    churchUnitId: string,
    type: string,
    serviceDates: Date[],
    assignmentsByDate: Map<string, Array<{ role: string; slot_index: number; user_id: string }>>,
  ): Promise<ServingScheduleDto[]> {
    return this.prisma.$transaction(async (tx) => {
      await (tx as any).servingSchedule.deleteMany({
        where: {
          church_unit_id: churchUnitId,
          service_date: { in: serviceDates },
          type,
        },
      });

      for (const serviceDate of serviceDates) {
        const key = serviceDate.toISOString();
        const assignments = assignmentsByDate.get(key) ?? [];
        await (tx as any).servingSchedule.create({
          data: {
            church_unit_id: churchUnitId,
            service_date: serviceDate,
            type,
            assignments: {
              createMany: {
                data: assignments,
              },
            },
          },
        });
      }

      const schedules = await (tx as any).servingSchedule.findMany({
        include: {
          assignments: {
            include: {
              user: {
                include: {
                  profile: {
                    select: { first_name: true, last_name: true },
                  },
                  serving_profiles: {
                    select: { is_active: true, skills: true },
                    where: { church_unit_id: churchUnitId },
                  },
                },
              },
            },
            orderBy: [{ role: 'asc' }, { slot_index: 'asc' }],
          },
        },
        orderBy: { service_date: 'asc' },
        where: {
          church_unit_id: churchUnitId,
          service_date: { in: serviceDates },
          type,
        },
      } as any);

      return schedules.map((schedule: any) => toScheduleDto(schedule));
    });
  }

  async updateSchedule(id: string, dto: UpdateServingScheduleDto): Promise<ServingScheduleDto | null> {
    const schedule = await this.prisma.$transaction(async (tx) => {
      const existing = await (tx as any).servingSchedule.findUnique({
        select: { church_unit_id: true, id: true },
        where: { id },
      });

      if (!existing) {
        return null;
      }

      await (tx as any).servingAssignment.deleteMany({ where: { schedule_id: id } });
      if (dto.assignments.length > 0) {
        await (tx as any).servingAssignment.createMany({
          data: dto.assignments.map((assignment, index) => ({
            role: assignment.role,
            schedule_id: id,
            slot_index: assignment.slot_index ?? index,
            user_id: assignment.user_id,
          })),
        });
      }

      return (tx as any).servingSchedule.findUnique({
        include: {
          assignments: {
            include: {
              user: {
                include: {
                  profile: {
                    select: { first_name: true, last_name: true },
                  },
                  serving_profiles: {
                    select: { is_active: true, skills: true },
                    where: { church_unit_id: existing.church_unit_id },
                  },
                },
              },
            },
            orderBy: [{ role: 'asc' }, { slot_index: 'asc' }],
          },
        },
        where: { id },
      } as any);
    });

    return schedule ? toScheduleDto(schedule as any) : null;
  }

  async getMembersForUnit(churchUnitId: string): Promise<ServingMemberDto[]> {
    const members = (await this.prisma.churchUnitMember.findMany({
      include: {
        user: {
          include: {
            profile: {
              select: { first_name: true, last_name: true },
            },
            serving_profiles: {
              select: { is_active: true, skills: true },
              where: { church_unit_id: churchUnitId },
            },
          },
        },
      },
      orderBy: { user: { username: 'asc' } },
      where: { church_unit_id: churchUnitId },
    } as any)) as any[];

    return members.map((membership: any) => toMemberDto(membership.user));
  }

  async getExistingSchedules(churchUnitId: string, type: string): Promise<ServingScheduleDto[]> {
    const schedules = await (this.prisma as any).servingSchedule.findMany({
      include: {
        assignments: {
          include: {
            user: {
              include: {
                profile: {
                  select: { first_name: true, last_name: true },
                },
                serving_profiles: {
                  select: { is_active: true, skills: true },
                  where: { church_unit_id: churchUnitId },
                },
              },
            },
          },
          orderBy: [{ role: 'asc' }, { slot_index: 'asc' }],
        },
      },
      orderBy: { service_date: 'asc' },
      where: { church_unit_id: churchUnitId, type },
    } as any);

    return schedules.map((schedule: any) => toScheduleDto(schedule));
  }

  async churchUnitExists(churchUnitId: string): Promise<boolean> {
    const unit = await this.prisma.churchUnit.findUnique({
      select: { id: true },
      where: { id: churchUnitId },
    });

    return Boolean(unit);
  }
}
