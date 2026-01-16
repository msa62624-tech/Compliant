import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ContractorsModule } from './modules/contractors/contractors.module';
import { EmailModule } from './modules/email/email.module';
import { FilesModule } from './modules/files/files.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { PdfModule } from './modules/pdf/pdf.module';
import { AIModule } from './modules/ai/ai.module';
import { ExtractionModule } from './modules/extraction/extraction.module';
import { COIReviewModule } from './modules/coi-review/coi-review.module';
import { DeficienciesModule } from './modules/deficiencies/deficiencies.module';
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
    PdfModule,
    AIModule,
    ExtractionModule,
    COIReviewModule,
    DeficienciesModule,
  ],
})
export class AppModule {}
