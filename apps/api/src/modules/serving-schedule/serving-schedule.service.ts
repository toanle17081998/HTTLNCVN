import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { ServingScheduleRepository } from './serving-schedule.repository';
import {
  SERVING_SCHEDULE_TYPES,
  WORSHIP_SKILLS,
  type GenerateServingSchedulesDto,
  type ServingMemberDto,
  type ServingPlannerDto,
  type ServingScheduleDto,
  type UpdateServingScheduleDto,
  type UpsertServingProfilesDto,
} from './serving-schedule.types';

const WORSHIP_MANDATORY_ROLES = ['guitar', 'drum'] as const;
const WORSHIP_OPTIONAL_ROLES = ['bass', 'sing', 'organ'] as const;

type AssignmentSeed = { role: string; slot_index: number; user_id: string };

function startOfDate(value: string): Date {
  const date = new Date(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

@Injectable()
export class ServingScheduleService {
  constructor(private readonly repository: ServingScheduleRepository) {}

  async getPlanner(churchUnitId: string, type: string): Promise<ServingPlannerDto> {
    this.assertType(type);
    const planner = await this.repository.getPlanner(churchUnitId, type);
    if (!planner) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Church unit not found.' });
    }
    return planner;
  }

  async upsertProfiles(dto: UpsertServingProfilesDto): Promise<ServingPlannerDto> {
    if (!(await this.repository.churchUnitExists(dto.church_unit_id))) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Church unit not found.' });
    }

    for (const profile of dto.profiles) {
      const skills = profile.skills ?? [];
      const uniqueSkills = [...new Set(skills)];
      if (uniqueSkills.length !== skills.length || uniqueSkills.some((skill) => !WORSHIP_SKILLS.includes(skill as never))) {
        throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Invalid serving skills.' });
      }
    }

    await this.repository.upsertProfiles(dto);
    return this.getPlanner(dto.church_unit_id, 'worship');
  }

  async generate(dto: GenerateServingSchedulesDto): Promise<ServingScheduleDto[]> {
    this.assertType(dto.type);
    if (!(await this.repository.churchUnitExists(dto.church_unit_id))) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Church unit not found.' });
    }

    const weeks = Number.isFinite(dto.weeks) ? Math.min(Math.max(Math.floor(dto.weeks), 1), 26) : 8;
    const startDate = startOfDate(dto.start_date);
    const members = await this.repository.getMembersForUnit(dto.church_unit_id);
    const history = await this.repository.getExistingSchedules(dto.church_unit_id, dto.type);

    const serviceDates = Array.from({ length: weeks }, (_, index) => addDays(startDate, index * 7));
    const assignmentsByDate = new Map<string, AssignmentSeed[]>();
    const usage = this.buildUsage(history);

    for (const serviceDate of serviceDates) {
      const assignments =
        dto.type === 'worship'
          ? this.buildWorshipAssignments(serviceDate, members, usage)
          : this.buildCleaningAssignments(serviceDate, members, usage);

      assignmentsByDate.set(serviceDate.toISOString(), assignments);
      this.recordUsage(serviceDate, assignments, usage);
    }

    return this.repository.replaceSchedules(dto.church_unit_id, dto.type, serviceDates, assignmentsByDate);
  }

  async updateSchedule(id: string, dto: UpdateServingScheduleDto): Promise<ServingScheduleDto> {
    const seen = new Set<string>();
    for (const assignment of dto.assignments) {
      const key = `${assignment.role}:${assignment.slot_index ?? 0}`;
      if (seen.has(key)) {
        throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Duplicate schedule slot.' });
      }
      seen.add(key);
    }

    const schedule = await this.repository.updateSchedule(id, dto);
    if (!schedule) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Serving schedule not found.' });
    }
    return schedule;
  }

  private assertType(type: string): void {
    if (!SERVING_SCHEDULE_TYPES.includes(type as never)) {
      throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Invalid serving schedule type.' });
    }
  }

  private buildUsage(history: ServingScheduleDto[]) {
    const usage = new Map<string, { count: number; lastDate: Date | null }>();

    for (const schedule of history) {
      const date = new Date(schedule.service_date);
      for (const assignment of schedule.assignments) {
        const current = usage.get(assignment.user.id) ?? { count: 0, lastDate: null };
        current.count += 1;
        if (!current.lastDate || date > current.lastDate) {
          current.lastDate = date;
        }
        usage.set(assignment.user.id, current);
      }
    }

    return usage;
  }

  private recordUsage(serviceDate: Date, assignments: AssignmentSeed[], usage: Map<string, { count: number; lastDate: Date | null }>) {
    for (const assignment of assignments) {
      const current = usage.get(assignment.user_id) ?? { count: 0, lastDate: null };
      current.count += 1;
      current.lastDate = serviceDate;
      usage.set(assignment.user_id, current);
    }
  }

  private compareCandidates(
    serviceDate: Date,
    usage: Map<string, { count: number; lastDate: Date | null }>,
    left: ServingMemberDto,
    right: ServingMemberDto,
  ) {
    const leftUsage = usage.get(left.id) ?? { count: 0, lastDate: null };
    const rightUsage = usage.get(right.id) ?? { count: 0, lastDate: null };
    const previousWeek = addDays(serviceDate, -7).toISOString();
    const leftConsecutive = leftUsage.lastDate?.toISOString() === previousWeek ? 1 : 0;
    const rightConsecutive = rightUsage.lastDate?.toISOString() === previousWeek ? 1 : 0;

    if (leftConsecutive !== rightConsecutive) {
      return leftConsecutive - rightConsecutive;
    }

    if (leftUsage.count !== rightUsage.count) {
      return leftUsage.count - rightUsage.count;
    }

    const leftTime = leftUsage.lastDate?.getTime() ?? 0;
    const rightTime = rightUsage.lastDate?.getTime() ?? 0;
    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }

    return left.username.localeCompare(right.username);
  }

  private buildWorshipAssignments(
    serviceDate: Date,
    members: ServingMemberDto[],
    usage: Map<string, { count: number; lastDate: Date | null }>,
  ): AssignmentSeed[] {
    const selected = new Set<string>();
    const assignments: AssignmentSeed[] = [];

    for (const role of WORSHIP_MANDATORY_ROLES) {
      const candidate = members
        .filter((member) => !selected.has(member.id) && member.skills.includes(role))
        .sort((left, right) => this.compareCandidates(serviceDate, usage, left, right))[0];

      if (!candidate) {
        throw new BadRequestException({
          code: 'BAD_REQUEST',
          message: `Not enough members with ${role} skill to generate worship schedule.`,
        });
      }

      selected.add(candidate.id);
      assignments.push({ role, slot_index: 0, user_id: candidate.id });
    }

    for (const role of WORSHIP_OPTIONAL_ROLES) {
      const candidate = members
        .filter((member) => !selected.has(member.id) && member.skills.includes(role))
        .sort((left, right) => this.compareCandidates(serviceDate, usage, left, right))[0];

      if (candidate) {
        selected.add(candidate.id);
        assignments.push({ role, slot_index: 0, user_id: candidate.id });
      }
    }

    return assignments;
  }

  private buildCleaningAssignments(
    serviceDate: Date,
    members: ServingMemberDto[],
    usage: Map<string, { count: number; lastDate: Date | null }>,
  ): AssignmentSeed[] {
    if (members.length < 4) {
      throw new BadRequestException({
        code: 'BAD_REQUEST',
        message: 'Cleaning team requires at least 4 members.',
      });
    }

    const size = members.length >= 5 ? 5 : 4;
    const selected = members
      .slice()
      .sort((left, right) => this.compareCandidates(serviceDate, usage, left, right))
      .slice(0, size);

    return selected.map((member, index) => ({
      role: 'member',
      slot_index: index,
      user_id: member.id,
    }));
  }
}
