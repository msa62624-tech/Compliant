import { Module } from '@nestjs/common';
import { DeficienciesService } from './deficiencies.service';
import { DeficienciesController } from './deficiencies.controller';
import { EmailModule } from '../email/email.module';
import { PrismaService } from '../config/prisma.service';

@Module({
  imports: [EmailModule],
  controllers: [DeficienciesController],
  providers: [DeficienciesService, PrismaService],
  exports: [DeficienciesService],
})
export class DeficienciesModule {}
