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
import { COIGeneratorModule } from './modules/coi-generator/coi-generator.module';
import { NYCDOBModule } from './modules/integrations/nyc-dob/nyc-dob.module';
import { GooglePlacesModule } from './modules/integrations/google-places/google-places.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PolicyAlertsModule } from './modules/policy-alerts/policy-alerts.module';
import { AdminModule } from './modules/admin/admin.module';
import { GCPortalModule } from './modules/portals/gc-portal/gc-portal.module';
import { BrokerPortalModule } from './modules/portals/broker-portal/broker-portal.module';
import { GeneratedCOIModule } from './modules/generated-coi/generated-coi.module';
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
    COIGeneratorModule,
    NYCDOBModule,
    GooglePlacesModule,
    MessagingModule,
    NotificationsModule,
    PolicyAlertsModule,
    AdminModule,
    GCPortalModule,
    BrokerPortalModule,
    GeneratedCOIModule,
  ],
})
export class AppModule {}
