import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { JwtStrategy } from './common/strategies/jwt.strategy';
import { DatabaseModule } from './database/database.module';
import { ArticleModule } from './modules/article/article.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChurchUnitModule } from './modules/church-unit/church-unit.module';
import { CourseModule } from './modules/course/course.module';
import { EventModule } from './modules/event/event.module';
import { MemberModule } from './modules/member/member.module';
import { NotificationModule } from './modules/notification/notification.module';
import { PageModule } from './modules/page/page.module';
import { PrayerJournalModule } from './modules/prayer-journal/prayer-journal.module';

@Module({
  imports: [
    DatabaseModule,
    PassportModule,
    JwtModule.register({}),
    AuthModule,
    ChurchUnitModule,
    MemberModule,
    ArticleModule,
    CourseModule,
    EventModule,
    NotificationModule,
    PrayerJournalModule,
    PageModule,
  ],
  providers: [JwtStrategy],
})
export class AppModule {}
