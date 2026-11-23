import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { JwtStrategy } from './common/strategies/jwt.strategy';
import { DatabaseModule } from './database/database.module';
import { PerformanceModule } from './common/performance/performance.module';
import { ArticleModule } from './modules/article/article.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChurchUnitModule } from './modules/church-unit/church-unit.module';
import { CourseModule } from './modules/course/course.module';
import { EventModule } from './modules/event/event.module';
import { FeatureFlagModule } from './modules/feature-flag/feature-flag.module';
import { HouseholdModule } from './modules/household/household.module';
import { HealthModule } from './modules/health/health.module';
import { MemberModule } from './modules/member/member.module';
import { MediaModule } from './modules/media/media.module';
import { NotificationModule } from './modules/notification/notification.module';
import { PageModule } from './modules/page/page.module';
import { PrayerJournalModule } from './modules/prayer-journal/prayer-journal.module';
import { PrivacyModule } from './modules/privacy/privacy.module';
import { ReportModule } from './modules/report/report.module';
import { ServingScheduleModule } from './modules/serving-schedule/serving-schedule.module';

@Module({
  imports: [
    DatabaseModule,
    PerformanceModule,
    PassportModule,
    JwtModule.register({}),
    AuthModule,
    ChurchUnitModule,
    MemberModule,
    MediaModule,
    ArticleModule,
    AuditModule,
    CourseModule,
    EventModule,
    FeatureFlagModule,
    HouseholdModule,
    HealthModule,
    NotificationModule,
    PrayerJournalModule,
    PrivacyModule,
    ReportModule,
    PageModule,
    ServingScheduleModule,
  ],
  providers: [JwtStrategy],
})
export class AppModule {}
