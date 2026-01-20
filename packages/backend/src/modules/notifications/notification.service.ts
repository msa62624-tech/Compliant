import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { EmailService } from '../email/email.service';

export enum NotificationType {
  COI_APPROVED = 'coi_approved',
  COI_REJECTED = 'coi_rejected',
  POLICY_EXPIRING = 'policy_expiring',
  POLICY_EXPIRED = 'policy_expired',
  DOCUMENT_UPLOADED = 'document_uploaded',
  COMPLIANCE_UPDATE = 'compliance_update',
  SYSTEM_ALERT = 'system_alert',
}

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: any;
  sendEmail?: boolean;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async createNotification(data: CreateNotificationDto) {
    this.logger.log(`Creating notification for user ${data.userId}: ${data.title}`);

    // Store notification in database
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata || {},
        read: false,
      },
    });

    // Send email if requested
    if (data.sendEmail) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: data.userId },
        });

        if (user) {
          await this.emailService.sendEmail({
            to: user.email,
            subject: data.title,
            html: this.generateEmailHtml(data),
            text: data.message,
          });
          this.logger.log(`Email notification sent to ${user.email}`);
        }
      } catch (error: any) {
        this.logger.error(`Failed to send email notification: ${error?.message || 'Unknown error'}`);
      }
    }

    return notification;
  }

  async getUserNotifications(userId: string, unreadOnly: boolean = false) {
    const where: any = { userId };
    if (unreadOnly) {
      where.read = false;
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        read: true,
      },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
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

  async deleteNotification(notificationId: string, userId: string) {
    return this.prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });
  }

  async replyToNotification(
    notificationId: string,
    userId: string,
    replyMessage: string,
    projectId?: string,
    subcontractorId?: string,
    coiId?: string,
  ) {
    this.logger.log(`Creating reply to notification ${notificationId} from user ${userId}`);

    // Get the original notification to extract thread info
    const originalNotification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!originalNotification) {
      throw new Error('Original notification not found');
    }

    // Determine threadId - use existing or create new
    const threadId = originalNotification.threadId || originalNotification.id;

    // Extract entity IDs from original if not provided
    const finalProjectId = projectId || originalNotification.projectId;
    const finalSubcontractorId = subcontractorId || originalNotification.subcontractorId;
    const finalCoiId = coiId || originalNotification.coiId;

    // Create reply notification
    const reply = await this.prisma.notification.create({
      data: {
        userId,
        type: 'reply',
        title: `Re: ${originalNotification.title}`,
        message: replyMessage,
        metadata: {
          originalNotificationId: notificationId,
          ...(typeof originalNotification.metadata === 'object' && originalNotification.metadata !== null 
            ? originalNotification.metadata 
            : {}),
        },
        read: false,
        threadId,
        parentId: notificationId,
        projectId: finalProjectId,
        subcontractorId: finalSubcontractorId,
        coiId: finalCoiId,
      },
    });

    // Update original notification with threadId if it didn't have one
    if (!originalNotification.threadId) {
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          threadId,
          projectId: finalProjectId,
          subcontractorId: finalSubcontractorId,
          coiId: finalCoiId,
        },
      });
    }

    // Save thread to Project if projectId exists
    if (finalProjectId) {
      await this.saveThreadToProject(finalProjectId, threadId);
    }

    // Save thread to ProjectSubcontractor if both IDs exist
    if (finalProjectId && finalSubcontractorId) {
      await this.saveThreadToProjectSubcontractor(finalProjectId, finalSubcontractorId, threadId);
    }

    this.logger.log(`Reply created and saved to entities`);
    return reply;
  }

  private async saveThreadToProject(projectId: string, threadId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (project) {
      const threads = (project.messageThreads as string[]) || [];
      if (!threads.includes(threadId)) {
        threads.push(threadId);
        await this.prisma.project.update({
          where: { id: projectId },
          data: { messageThreads: threads },
        });
        this.logger.log(`Thread ${threadId} saved to project ${projectId}`);
      }
    }
  }

  private async saveThreadToProjectSubcontractor(projectId: string, subcontractorId: string, threadId: string) {
    const projectSub = await this.prisma.projectSubcontractor.findFirst({
      where: {
        projectId,
        subcontractorId,
      },
    });

    if (projectSub) {
      const threads = (projectSub.messageThreads as string[]) || [];
      if (!threads.includes(threadId)) {
        threads.push(threadId);
        await this.prisma.projectSubcontractor.update({
          where: { id: projectSub.id },
          data: { messageThreads: threads },
        });
        this.logger.log(`Thread ${threadId} saved to project-subcontractor relationship`);
      }
    }
  }

  async getThread(threadId: string) {
    return this.prisma.notification.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  // Helper methods for common notification scenarios
  async notifyCOIApproved(userId: string, coiId: string, subcontractorName: string) {
    return this.createNotification({
      userId,
      type: NotificationType.COI_APPROVED,
      title: 'COI Approved',
      message: `Certificate of Insurance for ${subcontractorName} has been approved.`,
      metadata: { coiId, subcontractorName },
      sendEmail: true,
    });
  }

  async notifyCOIRejected(userId: string, coiId: string, subcontractorName: string, reason: string) {
    return this.createNotification({
      userId,
      type: NotificationType.COI_REJECTED,
      title: 'COI Rejected',
      message: `Certificate of Insurance for ${subcontractorName} has been rejected. Reason: ${reason}`,
      metadata: { coiId, subcontractorName, reason },
      sendEmail: true,
    });
  }

  async notifyPolicyExpiring(userId: string, policyType: string, subcontractorName: string, daysUntilExpiration: number) {
    return this.createNotification({
      userId,
      type: NotificationType.POLICY_EXPIRING,
      title: 'Policy Expiring Soon',
      message: `${policyType} policy for ${subcontractorName} expires in ${daysUntilExpiration} days.`,
      metadata: { policyType, subcontractorName, daysUntilExpiration },
      sendEmail: true,
    });
  }

  async notifyDocumentUploaded(userId: string, documentType: string, uploadedBy: string) {
    return this.createNotification({
      userId,
      type: NotificationType.DOCUMENT_UPLOADED,
      title: 'Document Uploaded',
      message: `New ${documentType} has been uploaded by ${uploadedBy}.`,
      metadata: { documentType, uploadedBy },
      sendEmail: false,
    });
  }

  private generateEmailHtml(data: CreateNotificationDto): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; }
            .button { display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>${data.title}</h2>
            </div>
            <div class="content">
              <p>${data.message}</p>
              <a href="https://compliant.team/dashboard" class="button">View Dashboard</a>
            </div>
            <div class="footer">
              <p>Compliant Platform - Insurance Tracking System</p>
              <p>This is an automated notification. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
