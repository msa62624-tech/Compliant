import { Module } from '@nestjs/common';
import { HoldHarmlessService } from './hold-harmless.service';
import { HoldHarmlessController } from './hold-harmless.controller';
import { PrismaModule } from '../../config/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HoldHarmlessController],
  providers: [HoldHarmlessService],
  exports: [HoldHarmlessService],
})
export class HoldHarmlessModule {}
