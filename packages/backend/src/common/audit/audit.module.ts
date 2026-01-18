import { Module, Global } from '@nestjs/common';
import { AuditService } from './audit.service';
import { PrismaModule } from '../../config/prisma.module';

/**
 * Audit Module - Provides comprehensive audit logging
 * 
 * This is a global module that can be imported anywhere in the application
 * to track user actions, data changes, and security events.
 */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
