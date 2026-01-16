import { Module } from '@nestjs/common';
import { PolicyAlertsService } from './policy-alerts.service';
import { PolicyAlertsController } from './policy-alerts.controller';
import { PrismaService } from '../../config/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [NotificationsModule, EmailModule],
  controllers: [PolicyAlertsController],
  providers: [PolicyAlertsService, PrismaService],
  exports: [PolicyAlertsService],
})
export class PolicyAlertsModule {}
