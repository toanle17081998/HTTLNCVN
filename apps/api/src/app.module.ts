import { Module } from '@nestjs/common';

import { DatabaseModule } from './database/database.module';
import { HomepageModule } from './modules/homepage/homepage.module';

@Module({
  imports: [DatabaseModule, HomepageModule],
})
export class AppModule {}
