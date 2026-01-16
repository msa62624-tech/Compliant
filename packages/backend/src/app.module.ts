import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ContractorsModule } from './modules/contractors/contractors.module';
import { GeneratedCOIModule } from './modules/generated-coi/generated-coi.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { HealthModule } from './modules/health/health.module';
import { AuditModule } from './modules/audit/audit.module';
import { CacheModule } from './modules/cache/cache.module';
import { EncryptionModule } from './common/encryption/encryption.module';
import { PrismaModule } from './config/prisma.module';
import { winstonConfig } from './config/logger.config';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    WinstonModule.forRoot(winstonConfig),
    ThrottlerModule.forRoot([{
      ttl: 60000, // 60 seconds in milliseconds
      limit: 10,
    }]),
    PrismaModule,
    CacheModule,
    EncryptionModule,
    HealthModule,
    AuditModule,
    AuthModule,
    UsersModule,
    ContractorsModule,
    GeneratedCOIModule,
    ProjectsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
