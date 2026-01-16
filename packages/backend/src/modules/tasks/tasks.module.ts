import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksService } from './tasks.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule,
  ],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
