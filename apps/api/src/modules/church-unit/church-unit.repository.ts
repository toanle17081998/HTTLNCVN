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
  courses: {
    select: {
      id: true,
      title_en: true,
      title_vi: true,
    },
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
  children: {
    include: {
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
    },
  },
} as const;

function toMemberDto(
  user: {
    id: string;
    profile: { first_name: string; last_name: string } | null;
    username: string;
  },
  role?: string | null,
  autoAssignSchedule?: boolean,
): ChurchUnitMemberDto {
  const displayName = [user.profile?.first_name, user.profile?.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();

  return {
    display_name: displayName || user.username,
    id: user.id,
    username: user.username,
    role: role ?? null,
    auto_assign_schedule: autoAssignSchedule ?? false,
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

function toDto(unit: any): ChurchUnitDto {
  const members = unit.members.map((membership: any) =>
    toMemberDto(membership.user, membership.role, membership.auto_assign_schedule),
  );

  const serviceTeams = unit.children
    ? unit.children
        .filter((child: any) => child.type === 'service_team')
        .map((child: any) => ({
          id: child.id,
          name: child.name,
          leader: child.leader ? toMemberDto(child.leader) : null,
          members: child.members.map((m: any) =>
            toMemberDto(m.user, m.role, m.auto_assign_schedule),
          ),
        }))
    : [];

  return {
    children_count: unit.children.length,
    created_at: unit.created_at.toISOString(),
    description: unit.description,
    id: unit.id,
    is_active: unit.is_active,
    leader: unit.leader ? toMemberDto(unit.leader) : null,
    leader_position: unit.leader_position ?? null,
    member_count: members.length,
    members,
    name: unit.name,
    parent: unit.parent ? toSummaryDto(unit.parent) : null,
    sort_order: unit.sort_order ?? 0,
    type: unit.type,
    updated_at: unit.updated_at.toISOString(),
    courses: unit.courses ?? [],
    service_teams: serviceTeams,
  };
}

@Injectable()
export class ChurchUnitRepository {
  constructor(private readonly prisma: PrismaService) {}

  private async enrollMembersToCourses(
    tx: any,
    userIds: string[],
    courseIds: string[],
  ): Promise<void> {
    if (userIds.length === 0 || courseIds.length === 0) return;

    const gradeData: Array<{ user_id: string; course_id: string; status: string; overall_score: number }> = [];
    const attendanceData: Array<{ user_id: string; course_id: string }> = [];

    for (const userId of userIds) {
      for (const courseId of courseIds) {
        gradeData.push({
          user_id: userId,
          course_id: courseId,
          status: 'enrolled',
          overall_score: 0,
        });
        attendanceData.push({
          user_id: userId,
          course_id: courseId,
        });
      }
    }

    const batchSize = 1000;
    for (let i = 0; i < gradeData.length; i += batchSize) {
      const batchGrade = gradeData.slice(i, i + batchSize);
      const batchAttendance = attendanceData.slice(i, i + batchSize);

      await tx.courseGrade.createMany({
        data: batchGrade,
        skipDuplicates: true,
      });

      await tx.courseAttendance.createMany({
        data: batchAttendance,
        skipDuplicates: true,
      });
    }
  }

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
        where: {
          NOT: {
            type: 'service_team',
          },
        },
      }),
    ]);

    return {
      members: members.map((m: any) => toMemberDto(m)),
      types: [...DEFAULT_CHURCH_UNIT_TYPES].filter((t) => t !== 'service_team'),
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
        where: {
          NOT: {
            type: 'service_team',
          },
        },
      }),
      this.prisma.churchUnit.count({
        where: {
          NOT: {
            type: 'service_team',
          },
        },
      }),
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
    let memberData: Array<{ user_id: string; role?: string | null; auto_assign_schedule?: boolean }> = [];
    if (dto.members && dto.members.length > 0) {
      memberData = dto.members.map((m) => ({
        user_id: m.user_id,
        role: m.role ?? null,
        auto_assign_schedule: m.auto_assign_schedule ?? false,
      }));
    } else if (dto.member_ids && dto.member_ids.length > 0) {
      memberData = dto.member_ids.map((id) => ({
        user_id: id,
        role: dto.type === 'class' ? 'member' : 'member',
        auto_assign_schedule: false,
      }));
    }

    if (dto.leader_id) {
      const leaderExists = memberData.some((m) => m.user_id === dto.leader_id);
      if (!leaderExists) {
        memberData.push({
          user_id: dto.leader_id,
          role: dto.type === 'cell_group' ? 'leader' : 'member',
          auto_assign_schedule: false,
        });
      }
    }

    const unit = await this.prisma.$transaction(async (tx) => {
      const createdUnit = await tx.churchUnit.create({
        data: {
          description: dto.description ?? null,
          is_active: dto.is_active ?? true,
          leader_id: dto.leader_id ?? null,
          leader_position: dto.leader_position ?? null,
          name: dto.name.trim(),
          parent_id: dto.parent_id ?? null,
          sort_order: dto.sort_order ?? 0,
          type: dto.type,
          ...(dto.assigned_course_ids &&
            dto.assigned_course_ids.length > 0 && {
              courses: {
                connect: dto.assigned_course_ids.map((id) => ({ id })),
              },
            }),
          ...(memberData.length > 0 && {
            members: {
              createMany: {
                data: memberData.map((m) => ({
                  user_id: m.user_id,
                  role: m.role,
                  auto_assign_schedule: m.auto_assign_schedule,
                })),
              },
            },
          }),
        },
      });

      if (dto.type === 'event_organizer' && dto.service_teams && dto.service_teams.length > 0) {
        for (const team of dto.service_teams) {
          const teamMemberIds = [
            ...new Set([...(team.member_ids ?? []), team.leader_id].filter(Boolean) as string[]),
          ];
          await tx.churchUnit.create({
            data: {
              name: team.name.trim(),
              type: 'service_team',
              parent_id: createdUnit.id,
              leader_id: team.leader_id ?? null,
              is_active: true,
              members: {
                createMany: {
                  data: teamMemberIds.map((userId) => ({
                    user_id: userId,
                    role: userId === team.leader_id ? 'leader' : 'member',
                  })),
                },
              },
            },
          });
        }
      }

      if (dto.type === 'class' && dto.assigned_course_ids && dto.assigned_course_ids.length > 0 && memberData.length > 0) {
        const userIds = memberData.map((m) => m.user_id);
        await this.enrollMembersToCourses(tx, userIds, dto.assigned_course_ids);
      }

      return tx.churchUnit.findUnique({
        include: CHURCH_UNIT_INCLUDE,
        where: { id: createdUnit.id },
      });
    }, { maxWait: 10000, timeout: 30000 });

    return toDto(unit!);
  }

  async update(id: string, dto: UpdateChurchUnitDto): Promise<ChurchUnitDto | null> {
    const unit = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.churchUnit.findUnique({
        include: {
          children: {
            where: { type: 'service_team' },
          },
          courses: {
            select: { id: true },
          },
        },
        where: { id },
      });

      if (!existing) {
        return null;
      }

      if (dto.assigned_course_ids !== undefined) {
        await tx.churchUnit.update({
          data: {
            courses: {
              disconnect: existing.courses.map((c) => ({ id: c.id })),
            },
          },
          where: { id },
        });

        if (dto.assigned_course_ids.length > 0) {
          await tx.churchUnit.update({
            data: {
              courses: {
                connect: dto.assigned_course_ids.map((courseId) => ({ id: courseId })),
              },
            },
            where: { id },
          });
        }
      }

      await tx.churchUnit.update({
        data: {
          ...(dto.description !== undefined && { description: dto.description ?? null }),
          ...(dto.is_active !== undefined && { is_active: dto.is_active }),
          ...(dto.leader_id !== undefined && { leader_id: dto.leader_id ?? null }),
          ...(dto.leader_position !== undefined && {
            leader_position: dto.leader_position ?? null,
          }),
          ...(dto.name !== undefined && { name: dto.name.trim() }),
          ...(dto.parent_id !== undefined && { parent_id: dto.parent_id ?? null }),
          ...(dto.sort_order !== undefined && { sort_order: dto.sort_order }),
          ...(dto.type !== undefined && { type: dto.type }),
        },
        where: { id },
      });

      const finalLeaderId = dto.leader_id !== undefined ? dto.leader_id : existing.leader_id;
      let memberData: Array<{ user_id: string; role?: string | null; auto_assign_schedule?: boolean }> | null = null;

      if (dto.members !== undefined) {
        memberData = dto.members.map((m) => ({
          user_id: m.user_id,
          role: m.role ?? null,
          auto_assign_schedule: m.auto_assign_schedule ?? false,
        }));
      } else if (dto.member_ids !== undefined) {
        memberData = dto.member_ids.map((memberId) => ({
          user_id: memberId,
          role: 'member',
          auto_assign_schedule: false,
        }));
      }

      if (memberData) {
        if (finalLeaderId) {
          const leaderExists = memberData.some((m) => m.user_id === finalLeaderId);
          if (!leaderExists) {
            memberData.push({
              user_id: finalLeaderId,
              role: dto.type === 'cell_group' ? 'leader' : 'member',
              auto_assign_schedule: false,
            });
          }
        }

        await tx.churchUnitMember.deleteMany({ where: { church_unit_id: id } });
        if (memberData.length > 0) {
          await tx.churchUnitMember.createMany({
            data: memberData.map((m) => ({
              church_unit_id: id,
              user_id: m.user_id,
              role: m.role,
              auto_assign_schedule: m.auto_assign_schedule,
            })),
          });
        }
      }

      if (dto.type === 'event_organizer' || (dto.type === undefined && existing.type === 'event_organizer')) {
        if (dto.service_teams !== undefined) {
          const existingTeamIds = existing.children.map((c) => c.id);
          const incomingTeamIds = dto.service_teams.map((t) => t.id).filter(Boolean) as string[];

          const teamsToDelete = existingTeamIds.filter((teamId) => !incomingTeamIds.includes(teamId));
          if (teamsToDelete.length > 0) {
            await tx.churchUnit.deleteMany({
              where: {
                id: { in: teamsToDelete },
                parent_id: id,
              },
            });
          }

          for (const team of dto.service_teams) {
            const teamMemberIds = [
              ...new Set([...(team.member_ids ?? []), team.leader_id].filter(Boolean) as string[]),
            ];
            if (team.id) {
              await tx.churchUnit.update({
                data: {
                  name: team.name.trim(),
                  leader_id: team.leader_id ?? null,
                },
                where: { id: team.id },
              });

              await tx.churchUnitMember.deleteMany({ where: { church_unit_id: team.id } });
              if (teamMemberIds.length > 0) {
                await tx.churchUnitMember.createMany({
                  data: teamMemberIds.map((userId) => ({
                    church_unit_id: team.id!,
                    user_id: userId,
                    role: userId === team.leader_id ? 'leader' : 'member',
                  })),
                });
              }
            } else {
              await tx.churchUnit.create({
                data: {
                  name: team.name.trim(),
                  type: 'service_team',
                  parent_id: id,
                  leader_id: team.leader_id ?? null,
                  is_active: true,
                  members: {
                    createMany: {
                      data: teamMemberIds.map((userId) => ({
                        user_id: userId,
                        role: userId === team.leader_id ? 'leader' : 'member',
                      })),
                    },
                  },
                },
              });
            }
          }
        }
      }

      const isClass = dto.type === 'class' || (dto.type === undefined && existing.type === 'class');
      if (isClass) {
        const finalCourseIds = dto.assigned_course_ids !== undefined
          ? dto.assigned_course_ids
          : existing.courses.map((c) => c.id);

        let finalUserIds: string[] = [];
        if (memberData !== null) {
          finalUserIds = memberData.map((m) => m.user_id);
        } else {
          const currentMembers = await tx.churchUnitMember.findMany({
            where: { church_unit_id: id },
            select: { user_id: true },
          });
          finalUserIds = currentMembers.map((m) => m.user_id);
        }

        await this.enrollMembersToCourses(tx, finalUserIds, finalCourseIds);
      }

      return tx.churchUnit.findUnique({
        include: CHURCH_UNIT_INCLUDE,
        where: { id },
      });
    }, { maxWait: 10000, timeout: 30000 });

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

  async getClassScores(classId: string): Promise<any> {
    const classUnit = await this.prisma.churchUnit.findUnique({
      include: {
        courses: {
          select: {
            id: true,
            title_en: true,
            title_vi: true,
          },
        },
        members: {
          where: { role: { in: ['member', 'admin_member'] } },
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
      },
      where: { id: classId },
    });

    if (!classUnit) {
      return [];
    }

    const memberIds = classUnit.members.map((m) => m.user_id);
    const courseIds = classUnit.courses.map((c) => c.id);

    const courseGrades = await this.prisma.courseGrade.findMany({
      where: {
        user_id: { in: memberIds },
        course_id: { in: courseIds },
      },
    });

    const quizAttempts = await this.prisma.quizAttempt.findMany({
      include: {
        quiz: {
          select: {
            id: true,
            title_en: true,
            title_vi: true,
            _count: {
              select: {
                quiz_maps: true,
              },
            },
          },
        },
        test_availability: {
          select: {
            course_id: true,
          },
        },
      },
      where: {
        user_id: { in: memberIds },
        OR: [
          { test_availability: { course_id: { in: courseIds } } },
          {
            quiz: {
              quiz_maps: {
                some: {
                  template: {
                    lesson: {
                      course_id: { in: courseIds },
                    },
                  },
                },
              },
            },
          },
        ],
      },
    });

    const results = classUnit.members.map((m) => {
      const user = m.user;
      const displayName =
        [user.profile?.first_name, user.profile?.last_name].filter(Boolean).join(' ').trim() ||
        user.username;

      let totalCompletedAttempts = 0;

      const course_scores = classUnit.courses.map((course) => {
        const grade = courseGrades.find(
          (cg) => cg.user_id === user.id && cg.course_id === course.id,
        );

        const attemptsForCourse = quizAttempts.filter(
          (qa) =>
            qa.user_id === user.id &&
            (qa.test_availability?.course_id === course.id || !qa.test_availability_id),
        );

        if (attemptsForCourse.length > 0) {
          totalCompletedAttempts += attemptsForCourse.filter((a) => a.is_completed).length;
        }

        let computedStatus = grade ? grade.status : 'not_started';
        let computedScore = grade ? Number(grade.overall_score) : null;
        let totalQuestions = 0;

        if (attemptsForCourse.length > 0) {
          const maxAttempt = attemptsForCourse.reduce((max, curr) =>
            Number(curr.total_score || 0) >= Number(max.total_score || 0) ? curr : max,
          );
          totalQuestions = maxAttempt.quiz?._count?.quiz_maps || 0;

          if (computedStatus === 'not_started') {
            const completed = attemptsForCourse.filter((a) => a.is_completed);
            computedStatus = completed.length > 0 ? 'completed' : 'in_progress';
            computedScore = Number(maxAttempt.total_score || 0);
          }
        }

        const latestCompleted = attemptsForCourse.find((a) => a.completed_at)?.completed_at;

        const scoreDisplay =
          computedScore !== null
            ? totalQuestions > 0
              ? `${computedScore}/${totalQuestions}`
              : `${computedScore}`
            : null;

        return {
          course_id: course.id,
          course_title_en: course.title_en,
          course_title_vi: course.title_vi,
          score: computedScore,
          total_questions: totalQuestions,
          score_display: scoreDisplay,
          status: computedStatus,
          completed_at: grade?.completed_at ? grade.completed_at.toISOString() : latestCompleted ? latestCompleted.toISOString() : null,
          quiz_attempts: attemptsForCourse.map((qa) => {
            const qTotal = qa.quiz?._count?.quiz_maps || 0;
            const qScore = qa.total_score ? Number(qa.total_score) : 0;
            return {
              quiz_id: qa.quiz?.id,
              quiz_title_en: qa.quiz?.title_en,
              quiz_title_vi: qa.quiz?.title_vi,
              score: qa.total_score ? Number(qa.total_score) : null,
              total_questions: qTotal,
              score_display: qa.total_score !== null ? (qTotal > 0 ? `${qScore}/${qTotal}` : `${qScore}`) : null,
              is_completed: qa.is_completed ?? false,
              completed_at: qa.completed_at ? qa.completed_at.toISOString() : null,
            };
          }),
        };
      });

      return {
        member_id: user.id,
        display_name: displayName,
        username: user.username,
        total_attempts: totalCompletedAttempts,
        course_scores,
      };
    });

    // Sort students so users with active quiz attempts or completions appear first
    return results.sort((a, b) => b.total_attempts - a.total_attempts);
  }
}
