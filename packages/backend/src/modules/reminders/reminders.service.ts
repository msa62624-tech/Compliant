import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { PrismaService } from '../../config/prisma.service';
import { ReminderType } from '@prisma/client';
import { EmailService } from '../email/email.service';

/**
 * Service for automated policy expiration reminders
 * Implements the 30d→14d→7d→2d→every 2d reminder schedule
 */
@Injectable()
export class RemindersService {
  // Reminder thresholds in days
  private readonly REMINDER_THRESHOLDS = {
    DAYS_30: 30,
    DAYS_14: 14,
    DAYS_7: 7,
    DAYS_2: 2,
  };

  // Email configuration
  private readonly ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@compliant.com';

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  /**
   * Main cron job that runs daily to check for expiring policies
   * Runs at 6 AM daily to send reminders
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async checkExpiringPolicies() {
    this.logger.log({
      message: 'Starting automated expiration reminder check',
      context: 'RemindersService',
    });

    try {
      // Check all active COIs for expiring policies
      const activeCOIs = await this.prisma.generatedCOI.findMany({
        where: {
          status: {
            in: ['ACTIVE', 'AWAITING_ADMIN_REVIEW'],
          },
          OR: [
            { glExpirationDate: { not: null } },
            { umbrellaExpirationDate: { not: null } },
            { autoExpirationDate: { not: null } },
            { wcExpirationDate: { not: null } },
          ],
        },
        include: {
          project: true,
          subcontractor: true,
          assignedAdmin: true,
        },
      });

      let totalReminders = 0;

      // Process each COI
      for (const coi of activeCOIs) {
        // Check GL policy
        if (coi.glExpirationDate) {
          const sent = await this.checkAndSendReminder(
            coi.id,
            'GL',
            coi.glExpirationDate,
            [...new Set([coi.brokerGlEmail, coi.brokerEmail, coi.assignedAdminEmail, this.ADMIN_EMAIL].filter(Boolean))],
            coi,
          );
          if (sent) totalReminders++;
        }

        // Check Umbrella policy
        if (coi.umbrellaExpirationDate) {
          const sent = await this.checkAndSendReminder(
            coi.id,
            'UMBRELLA',
            coi.umbrellaExpirationDate,
            [...new Set([coi.brokerUmbrellaEmail, coi.brokerEmail, coi.assignedAdminEmail, this.ADMIN_EMAIL].filter(Boolean))],
            coi,
          );
          if (sent) totalReminders++;
        }

        // Check Auto policy
        if (coi.autoExpirationDate) {
          const sent = await this.checkAndSendReminder(
            coi.id,
            'AUTO',
            coi.autoExpirationDate,
            [...new Set([coi.brokerAutoEmail, coi.brokerEmail, coi.assignedAdminEmail, this.ADMIN_EMAIL].filter(Boolean))],
            coi,
          );
          if (sent) totalReminders++;
        }

        // Check WC policy
        if (coi.wcExpirationDate) {
          const sent = await this.checkAndSendReminder(
            coi.id,
            'WC',
            coi.wcExpirationDate,
            [...new Set([coi.brokerWcEmail, coi.brokerEmail, coi.assignedAdminEmail, this.ADMIN_EMAIL].filter(Boolean))],
            coi,
          );
          if (sent) totalReminders++;
        }
      }

      this.logger.log({
        message: 'Completed automated expiration reminder check',
        context: 'RemindersService',
        totalCOIsChecked: activeCOIs.length,
        remindersSent: totalReminders,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error({
        message: 'Failed to check expiring policies',
        context: 'RemindersService',
        error: errorMessage,
      });
    }
  }

  /**
   * Check if a specific policy needs a reminder and send it
   */
  private async checkAndSendReminder(
    coiId: string,
    policyType: string,
    expirationDate: Date,
    recipients: string[],
    coiData: any,
  ): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expDate = new Date(expirationDate);
    expDate.setHours(0, 0, 0, 0);

    const daysUntilExpiry = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Determine which reminder type to send
    let reminderType: ReminderType | null = null;
    let daysBeforeExpiry = 0;

    if (daysUntilExpiry === this.REMINDER_THRESHOLDS.DAYS_30) {
      reminderType = ReminderType.DAYS_30;
      daysBeforeExpiry = 30;
    } else if (daysUntilExpiry === this.REMINDER_THRESHOLDS.DAYS_14) {
      reminderType = ReminderType.DAYS_14;
      daysBeforeExpiry = 14;
    } else if (daysUntilExpiry === this.REMINDER_THRESHOLDS.DAYS_7) {
      reminderType = ReminderType.DAYS_7;
      daysBeforeExpiry = 7;
    } else if (daysUntilExpiry === this.REMINDER_THRESHOLDS.DAYS_2) {
      reminderType = ReminderType.DAYS_2;
      daysBeforeExpiry = 2;
    } else if (daysUntilExpiry === 0) {
      reminderType = ReminderType.EXPIRED;
      daysBeforeExpiry = 0;
    } else if (daysUntilExpiry < 0) {
      // Policy is already expired - check if we should send every-2-days reminder
      const daysSinceExpiry = Math.abs(daysUntilExpiry);
      
      // Send reminder every 2 days after expiration
      if (daysSinceExpiry % 2 === 0) {
        reminderType = ReminderType.EVERY_2_DAYS;
        daysBeforeExpiry = daysUntilExpiry; // Negative value
      }
    }

    if (!reminderType) {
      return false; // No reminder needed today
    }

    // Check if we already sent this reminder today
    const existingReminder = await this.prisma.expirationReminder.findFirst({
      where: {
        coiId,
        policyType,
        reminderType,
        sentAt: {
          gte: today,
        },
      },
    });

    if (existingReminder) {
      this.logger.debug({
        message: 'Reminder already sent today',
        context: 'RemindersService',
        coiId,
        policyType,
        reminderType,
      });
      return false;
    }

    // Create reminder notification
    await this.sendReminderNotification(
      coiId,
      policyType,
      expirationDate,
      daysUntilExpiry,
      reminderType,
      recipients,
      coiData,
    );

    // Record the reminder in database
    await this.prisma.expirationReminder.create({
      data: {
        coiId,
        policyType,
        expirationDate,
        daysBeforeExpiry,
        reminderType,
        sentTo: recipients,
        emailSubject: this.buildEmailSubject(reminderType, policyType, daysUntilExpiry),
        emailBody: this.buildEmailBody(reminderType, policyType, daysUntilExpiry, coiData),
      },
    });

    this.logger.log({
      message: 'Sent expiration reminder',
      context: 'RemindersService',
      coiId,
      policyType,
      reminderType,
      daysUntilExpiry,
      recipients: recipients.length,
    });

    return true;
  }

  /**
   * Send the actual reminder notification (email, SMS, etc.)
   */
  private async sendReminderNotification(
    coiId: string,
    policyType: string,
    expirationDate: Date,
    daysUntilExpiry: number,
    reminderType: ReminderType,
    recipients: string[],
    coiData: any,
  ): Promise<void> {
    const subject = this.buildEmailSubject(reminderType, policyType, daysUntilExpiry);
    const body = this.buildEmailBody(reminderType, policyType, daysUntilExpiry, coiData);

    // Convert plain text body to HTML
    const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${body}</pre></div>`;

    this.logger.log({
      message: 'Sending reminder notification',
      context: 'RemindersService',
      subject,
      recipients: recipients.length,
      coiId,
      policyType,
    });

    const emailSent = await this.emailService.sendEmail({
      to: recipients,
      subject,
      html,
    });

    if (!emailSent) {
      throw new Error(`Failed to send reminder notification email for COI ${coiId}, policy ${policyType} to recipients: ${recipients.join(', ')}`);
    }
  }

  /**
   * Build email subject based on reminder type
   */
  private buildEmailSubject(reminderType: ReminderType, policyType: string, daysUntilExpiry: number): string {
    const policyName = this.getPolicyName(policyType);

    switch (reminderType) {
      case ReminderType.DAYS_30:
        return `[30 Days] ${policyName} Policy Expiring Soon`;
      case ReminderType.DAYS_14:
        return `[14 Days] ${policyName} Policy Expiring Soon - Action Required`;
      case ReminderType.DAYS_7:
        return `[7 Days] URGENT: ${policyName} Policy Expiring Soon`;
      case ReminderType.DAYS_2:
        return `[2 Days] CRITICAL: ${policyName} Policy Expiring Imminently`;
      case ReminderType.EXPIRED:
        return `[EXPIRED] ${policyName} Policy Expired Today`;
      case ReminderType.EVERY_2_DAYS:
        return `[OVERDUE ${Math.abs(daysUntilExpiry)} Days] ${policyName} Policy Expired - Immediate Action Required`;
      default:
        return `${policyName} Policy Expiration Notice`;
    }
  }

  /**
   * Build email body based on reminder type
   */
  private buildEmailBody(reminderType: ReminderType, policyType: string, daysUntilExpiry: number, coiData: any): string {
    const policyName = this.getPolicyName(policyType);
    const projectName = coiData.project?.name || 'Unknown Project';
    const subcontractorName = coiData.subcontractor?.name || 'Unknown Subcontractor';

    let urgencyLevel = '';
    let actionRequired = '';

    switch (reminderType) {
      case ReminderType.DAYS_30:
        urgencyLevel = 'NOTICE';
        actionRequired = 'Please begin the renewal process for this policy.';
        break;
      case ReminderType.DAYS_14:
        urgencyLevel = 'IMPORTANT';
        actionRequired = 'Immediate action required to renew this policy.';
        break;
      case ReminderType.DAYS_7:
        urgencyLevel = 'URGENT';
        actionRequired = 'This policy must be renewed within the next week.';
        break;
      case ReminderType.DAYS_2:
        urgencyLevel = 'CRITICAL';
        actionRequired = 'This policy will expire in 2 days. Renew immediately!';
        break;
      case ReminderType.EXPIRED:
        urgencyLevel = 'EXPIRED';
        actionRequired = 'This policy has expired. Work may not proceed without valid coverage.';
        break;
      case ReminderType.EVERY_2_DAYS:
        urgencyLevel = 'OVERDUE';
        actionRequired = `This policy has been expired for ${Math.abs(daysUntilExpiry)} days. Immediate renewal required.`;
        break;
    }

    return `
${urgencyLevel}: ${policyName} Policy Expiration Reminder

Project: ${projectName}
Subcontractor: ${subcontractorName}
Policy Type: ${policyName}
Expiration Date: ${new Date(coiData[`${policyType.toLowerCase()}ExpirationDate`] || new Date()).toLocaleDateString()}
Days Until Expiry: ${daysUntilExpiry}

${actionRequired}

Please log in to the Compliant platform to upload the renewed policy documentation.

If you have any questions, please contact your administrator.

---
This is an automated reminder from the Compliant Insurance Tracking Platform.
    `.trim();
  }

  /**
   * Get human-readable policy name
   */
  private getPolicyName(policyType: string): string {
    const names = {
      GL: 'General Liability',
      UMBRELLA: 'Umbrella',
      AUTO: 'Auto Liability',
      WC: 'Workers Compensation',
    };
    return names[policyType] || policyType;
  }

  /**
   * Get reminder history for a specific COI
   */
  async getReminderHistory(coiId: string) {
    return this.prisma.expirationReminder.findMany({
      where: { coiId },
      orderBy: { sentAt: 'desc' },
    });
  }

  /**
   * Get all pending reminders (unacknowledged)
   */
  async getPendingReminders() {
    return this.prisma.expirationReminder.findMany({
      where: {
        acknowledged: false,
      },
      include: {
        coi: {
          include: {
            project: true,
            subcontractor: true,
          },
        },
      },
      orderBy: { sentAt: 'desc' },
    });
  }

  /**
   * Acknowledge a reminder
   */
  async acknowledgeReminder(reminderId: string, acknowledgedBy: string) {
    return this.prisma.expirationReminder.update({
      where: { id: reminderId },
      data: {
        acknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedBy,
      },
    });
  }

  /**
   * Get reminder statistics
   */
  async getReminderStats() {
    const totalReminders = await this.prisma.expirationReminder.count();
    const acknowledgedReminders = await this.prisma.expirationReminder.count({
      where: { acknowledged: true },
    });
    const pendingReminders = await this.prisma.expirationReminder.count({
      where: { acknowledged: false },
    });

    const remindersByType = await this.prisma.expirationReminder.groupBy({
      by: ['reminderType'],
      _count: true,
    });

    return {
      total: totalReminders,
      acknowledged: acknowledgedReminders,
      pending: pendingReminders,
      byType: remindersByType,
    };
  }
}
