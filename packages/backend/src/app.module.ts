import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { ScheduleModule } from "@nestjs/schedule";
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from "@nestjs/core";
import { WinstonModule } from "nest-winston";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { ContractorsModule } from "./modules/contractors/contractors.module";
import { GeneratedCOIModule } from "./modules/generated-coi/generated-coi.module";
import { ProjectsModule } from "./modules/projects/projects.module";
import { HealthModule } from "./modules/health/health.module";
import { AuditModule } from "./modules/audit/audit.module";
import { CacheModule } from "./modules/cache/cache.module";
import { EmailModule } from "./modules/email/email.module";
import { TasksModule } from "./modules/tasks/tasks.module";
import { ProgramsModule } from "./modules/programs/programs.module";
import { RemindersModule } from "./modules/reminders/reminders.module";
import { HoldHarmlessModule } from "./modules/hold-harmless/hold-harmless.module";
import { TradesModule } from "./modules/trades/trades.module";
import { EncryptionModule } from "./common/encryption/encryption.module";
import { PrismaModule } from "./config/prisma.module";
import { winstonConfig } from "./config/logger.config";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { AllExceptionsFilter } from "./common/filters/http-exception.filter";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    WinstonModule.forRoot(winstonConfig),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds in milliseconds
        // In test/development environments, allow more requests to support E2E tests
        limit: process.env.NODE_ENV === 'test' ? 10000 : (process.env.NODE_ENV === 'development' ? 1000 : 10),
      },
    ]),
    PrismaModule,
    CacheModule,
    EncryptionModule,
    EmailModule,
    HealthModule,
    AuditModule,
    AuthModule,
    UsersModule,
    ContractorsModule,
    GeneratedCOIModule,
    ProjectsModule,
    TasksModule,
    ProgramsModule,
    RemindersModule,
    HoldHarmlessModule,
    TradesModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
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
