import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ContractorsModule } from './modules/contractors/contractors.module';
import { EmailModule } from './modules/email/email.module';
import { FilesModule } from './modules/files/files.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { PrismaModule } from './config/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ContractorsModule,
    EmailModule,
    FilesModule,
    SessionsModule,
  ],
})
export class AppModule {}
