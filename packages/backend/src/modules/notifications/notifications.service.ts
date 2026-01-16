import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    link?: string,
  ): Promise<any> {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          type: type as any,
          title,
          message,
          link,
        },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });

      // Send email notification if enabled
      await this.sendEmailNotification(notification);

      this.logger.log(`Notification created for user ${userId}: ${type}`);
      return notification;
    } catch (error) {
      this.logger.error(`Failed to create notification: ${error.message}`);
      throw error;
    }
  }

  private async sendEmailNotification(notification: any): Promise<void> {
    try {
      await this.emailService.sendEmail({
        to: notification.user.email,
        subject: notification.title,
        template: 'notification',
        context: {
          userName: `${notification.user.firstName} ${notification.user.lastName}`,
          title: notification.title,
          message: notification.message,
          link: notification.link,
        },
      });
    } catch (error) {
      this.logger.warn(`Failed to send email notification: ${error.message}`);
    }
  }

  async getNotifications(userId: string, type?: string, read?: boolean): Promise<any[]> {
    const where: any = { userId };

    if (type) {
      where.type = type;
    }

    if (read !== undefined) {
      where.read = read;
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<any> {
    return this.prisma.notification.update({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string): Promise<any> {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  async deleteNotification(notificationId: string, userId: string): Promise<any> {
    return this.prisma.notification.delete({
      where: {
        id: notificationId,
        userId,
      },
    });
  }

  // Helper methods for common notification types
  async notifyCOIExpiring(userId: string, contractorName: string, daysUntilExpiry: number): Promise<void> {
    await this.createNotification(
      userId,
      'COI_EXPIRING',
      'COI Expiring Soon',
      `The COI for ${contractorName} will expire in ${daysUntilExpiry} days.`,
      `/contractors/${contractorName}/insurance`,
    );
  }

  async notifyReviewAssigned(userId: string, reviewId: string, contractorName: string): Promise<void> {
    await this.createNotification(
      userId,
      'REVIEW_ASSIGNED',
      'New Review Assigned',
      `You have been assigned to review the COI for ${contractorName}.`,
      `/reviews/${reviewId}`,
    );
  }

  async notifyDeficiencyCreated(userId: string, deficiencyId: string, category: string): Promise<void> {
    await this.createNotification(
      userId,
      'DEFICIENCY_CREATED',
      'New Deficiency Identified',
      `A ${category} deficiency has been identified.`,
      `/deficiencies/${deficiencyId}`,
    );
  }

  async notifyApprovalRequired(userId: string, reviewId: string, contractorName: string): Promise<void> {
    await this.createNotification(
      userId,
      'APPROVAL_REQUIRED',
      'Approval Required',
      `The COI for ${contractorName} requires your approval.`,
      `/reviews/${reviewId}`,
    );
  }
}
