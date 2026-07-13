import { Module } from '@nestjs/common';

import { NotificationModule } from '../notification/notification.module';
import { EventController } from './event.controller';
import { EventRepository } from './event.repository';
import { EventService } from './event.service';

@Module({
  imports: [NotificationModule],
  controllers: [EventController],
  providers: [EventService, EventRepository],
})
export class EventModule {}
