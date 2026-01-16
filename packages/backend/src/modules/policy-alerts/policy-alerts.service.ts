import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../config/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class PolicyAlertsService {
  private readonly logger = new Logger(PolicyAlertsService.name);
  private readonly alertDays: number[];

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
    private emailService: EmailService,
  ) {
    const days = this.configService.get<string>('EXPIRING_POLICY_ALERT_DAYS', '30,15,7,1');
    this.alertDays = days.split(',').map(d => parseInt(d.trim(), 10));
  }

  async checkExpiringPolicies(): Promise<void> {
    try {
      this.logger.log('Checking for expiring policies...');

      for (const days of this.alertDays) {
        await this.createAlertsForDays(days);
      }

      this.logger.log('Expiring policy check completed');
    } catch (error) {
      this.logger.error(`Failed to check expiring policies: ${error.message}`);
    }
  }

  private async createAlertsForDays(days: number): Promise<void> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Check expiring COIs
    const expiringCOIs = await this.prisma.generatedCOI.findMany({
      where: {
        status: 'ISSUED',
        expirationDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        contractor: {
          include: {
            createdBy: true,
          },
        },
      },
    });

    for (const coi of expiringCOIs) {
      // Check if alert already sent for this policy and days
      const existingAlert = await this.prisma.expiringPolicyAlert.findFirst({
        where: {
          contractorId: coi.contractorId,
          policyNumber: coi.certificateNumber,
          daysUntilExpiry: days,
          resolved: false,
        },
      });

      if (!existingAlert) {
        // Create alert
        await this.prisma.expiringPolicyAlert.create({
          data: {
            contractorId: coi.contractorId,
            policyType: 'COI',
            policyNumber: coi.certificateNumber,
            expirationDate: coi.expirationDate,
            daysUntilExpiry: days,
          },
        });

        // Send notification
        await this.notificationsService.notifyCOIExpiring(
          coi.contractor.createdById,
          coi.contractor.name,
          days,
        );

        // Send email alert
        await this.emailService.sendEmail({
          to: coi.contractor.createdBy.email,
          subject: `COI Expiring in ${days} Days - ${coi.contractor.name}`,
          template: 'coi-expiring',
          context: {
            contractorName: coi.contractor.name,
            certificateNumber: coi.certificateNumber,
            expirationDate: coi.expirationDate.toLocaleDateString(),
            daysUntilExpiry: days,
          },
        });

        this.logger.log(
          `Created expiring policy alert: ${coi.certificateNumber} (${days} days)`,
        );
      }
    }
  }

  async getExpiringPolicies(contractorId?: string, resolved?: boolean): Promise<any[]> {
    const where: any = {};

    if (contractorId) {
      where.contractorId = contractorId;
    }

    if (resolved !== undefined) {
      where.resolved = resolved;
    }

    return this.prisma.expiringPolicyAlert.findMany({
      where,
      include: {
        contractor: true,
      },
      orderBy: { expirationDate: 'asc' },
    });
  }

  async resolveAlert(alertId: string): Promise<any> {
    return this.prisma.expiringPolicyAlert.update({
      where: { id: alertId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
      },
    });
  }

  async getAlertSummary(contractorId?: string): Promise<any> {
    const where: any = { resolved: false };

    if (contractorId) {
      where.contractorId = contractorId;
    }

    const alerts = await this.prisma.expiringPolicyAlert.findMany({
      where,
      orderBy: { expirationDate: 'asc' },
    });

    return {
      total: alerts.length,
      critical: alerts.filter(a => a.daysUntilExpiry <= 7).length,
      warning: alerts.filter(a => a.daysUntilExpiry > 7 && a.daysUntilExpiry <= 15).length,
      info: alerts.filter(a => a.daysUntilExpiry > 15).length,
      alerts,
    };
  }
}
