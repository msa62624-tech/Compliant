import { Module } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { MessagingController } from './messaging.controller';
import { PrismaService } from '../../config/prisma.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [MessagingController],
  providers: [MessagingService, PrismaService],
  exports: [MessagingService],
})
export class MessagingModule {}
