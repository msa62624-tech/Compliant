import { Module } from '@nestjs/common';
import { GeneratedCOIService } from './generated-coi.service';
import { GeneratedCOIController } from './generated-coi.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GeneratedCOIController],
  providers: [GeneratedCOIService],
  exports: [GeneratedCOIService],
})
export class GeneratedCOIModule {}
