import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getOperationalData(thirtyDaysAgo: Date) {
    const [
      courseCheckIns,
      eventCheckIns,
      courseAttendees,
      eventAttendees,
      grades,
      workload,
      activeMembers,
      completedLessons,
      prayersLast30Days,
    ] = await Promise.all([
      this.prisma.courseAttendance.count(),
      this.prisma.eventAttendance.count(),
      this.prisma.courseAttendance.groupBy({ by: ['user_id'] }),
      this.prisma.eventAttendance.groupBy({ by: ['user_id'] }),
      this.prisma.courseGrade.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.servingAssignment.groupBy({
        by: ['user_id'],
        _count: { _all: true },
        orderBy: { _count: { user_id: 'desc' } },
      }),
      this.prisma.user.count({ where: { deleted_at: null, status: 'active' } }),
      this.prisma.userLessonProgress.count({ where: { status: 'completed' } }),
      this.prisma.prayer.count({ where: { created_at: { gte: thirtyDaysAgo } } }),
    ]);

    const topWorkload = workload.slice(0, 10);
    const users = topWorkload.length
      ? await this.prisma.user.findMany({
          include: { profile: true },
          where: { id: { in: topWorkload.map((item) => item.user_id) } },
        })
      : [];

    return {
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
    };
  }
}
