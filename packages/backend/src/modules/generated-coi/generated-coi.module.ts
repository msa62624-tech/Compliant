import { Module } from '@nestjs/common';
import { GeneratedCOIService } from './generated-coi.service';
import { GeneratedCOIController } from './generated-coi.controller';
import { PrismaModule } from '../../config/prisma.module';
import { HoldHarmlessModule } from '../hold-harmless/hold-harmless.module';

@Module({
  imports: [PrismaModule, HoldHarmlessModule],
  controllers: [GeneratedCOIController],
  providers: [GeneratedCOIService],
  exports: [GeneratedCOIService],
})
export class GeneratedCOIModule {}
