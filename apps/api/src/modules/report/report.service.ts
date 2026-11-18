import { Injectable } from '@nestjs/common';

import { CacheService } from '../../common/performance/cache.service';
import { ReportRepository } from './report.repository';
import type { OperationalReportDto } from './report.types';

@Injectable()
export class ReportService {
  constructor(
    private readonly reportRepository: ReportRepository,
    private readonly cache: CacheService,
  ) {}

  getOperationalReport(): Promise<OperationalReportDto> {
    return this.cache.getOrSet('report:operations', 30_000, () => this.generateOperationalReport());
  }

  private async generateOperationalReport(): Promise<OperationalReportDto> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const {
      activeMembers,
      completedLessons,
      courseAttendees,
      courseCheckIns,
      eventAttendees,
      eventCheckIns,
      grades,
      prayersLast30Days,
      topWorkload,
      users,
      workload,
    } = await this.reportRepository.getOperationalData(thirtyDaysAgo);
    const userMap = new Map(users.map((user) => [
      user.id,
      [user.profile?.first_name, user.profile?.last_name].filter(Boolean).join(' ') || user.username,
    ]));
    const gradeCount = (status: string) => grades.find((item) => item.status === status)?._count._all ?? 0;
    const completed = gradeCount('completed');
    const enrolled = grades.reduce((total, item) => total + item._count._all, 0);

    return {
      attendance: {
        course_check_ins: courseCheckIns,
        event_check_ins: eventCheckIns,
        unique_course_attendees: courseAttendees.length,
        unique_event_attendees: eventAttendees.length,
      },
      course_completion: {
        completed,
        completion_rate: enrolled ? Math.round((completed / enrolled) * 1000) / 10 : 0,
        enrolled,
        in_progress: gradeCount('in_progress') + gradeCount('enrolled'),
      },
      generated_at: new Date().toISOString(),
      member_engagement: {
        active_members: activeMembers,
        completed_lessons: completedLessons,
        event_participants: eventAttendees.length,
        prayers_last_30_days: prayersLast30Days,
      },
      serving_workload: {
        assignments: workload.reduce((total, item) => total + item._count._all, 0),
        members: topWorkload.map((item) => ({
          assignments: item._count._all,
          name: userMap.get(item.user_id) ?? 'Unknown member',
          user_id: item.user_id,
        })),
        serving_members: workload.length,
      },
    };
  }
}

