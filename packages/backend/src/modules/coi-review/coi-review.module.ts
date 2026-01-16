import { Module } from '@nestjs/common';
import { COIReviewService } from './coi-review.service';
import { COIReviewController } from './coi-review.controller';
import { EmailModule } from '../email/email.module';
import { PrismaService } from '../config/prisma.service';

@Module({
  imports: [EmailModule],
  controllers: [COIReviewController],
  providers: [COIReviewService, PrismaService],
  exports: [COIReviewService],
})
export class COIReviewModule {}
