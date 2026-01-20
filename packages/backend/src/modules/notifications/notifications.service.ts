import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";
import { User } from "@prisma/client";
import { EmailService } from "../email/email.service";

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  parentId?: string;
  threadId?: string;
  fromUserId?: string;
  fromUserName?: string;
}

export interface CreateNotificationDto {
  userId: string;
  type: string;
  title: string;
  message: string;
  parentId?: string;
  threadId?: string;
}

export interface ReplyToNotificationDto {
  message: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  // In-memory storage for notifications (in production, would use a database table)
  private notifications: Map<string, Notification> = new Map();

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  /**
   * Create a new notification
   */
  async createNotification(data: CreateNotificationDto): Promise<Notification> {
    const id = this.generateId();
    const notification: Notification = {
      id,
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      read: false,
      createdAt: new Date(),
      parentId: data.parentId,
      threadId: data.threadId || data.parentId || id,
    };

    this.notifications.set(id, notification);
    this.logger.log(`Created notification ${id} for user ${data.userId}`);

    return notification;
  }

  /**
   * Get all notifications for a user
   */
  async getNotifications(
    userId: string,
    unreadOnly: boolean = false,
  ): Promise<Notification[]> {
    const userNotifications = Array.from(this.notifications.values())
      .filter((n) => n.userId === userId)
      .filter((n) => !unreadOnly || !n.read)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return userNotifications;
  }

  /**
   * Get a single notification by ID
   */
  async getNotification(id: string, userId: string): Promise<Notification> {
    const notification = this.notifications.get(id);

    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }

    if (notification.userId !== userId) {
      throw new NotFoundException(`Notification ${id} not found`);
    }

    return notification;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.getNotification(id, userId);
    notification.read = true;
    this.notifications.set(id, notification);
    return notification;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    const userNotifications = Array.from(this.notifications.values()).filter(
      (n) => n.userId === userId,
    );

    userNotifications.forEach((n) => {
      n.read = true;
      this.notifications.set(n.id, n);
    });
  }

  /**
   * Reply to a notification (creates a threaded notification)
   */
  async replyToNotification(
    notificationId: string,
    currentUser: User,
    replyData: ReplyToNotificationDto,
  ): Promise<Notification> {
    // Get the original notification
    const originalNotification = this.notifications.get(notificationId);

    if (!originalNotification) {
      throw new NotFoundException(`Notification ${notificationId} not found`);
    }

    // Get the thread ID (use original's threadId or the notificationId itself)
    const threadId = originalNotification.threadId || notificationId;

    // Create reply notification
    const reply = await this.createNotification({
      userId: originalNotification.userId,
      type: "REPLY",
      title: `Reply to: ${originalNotification.title}`,
      message: replyData.message,
      parentId: notificationId,
      threadId,
    });

    // Add sender info
    reply.fromUserId = currentUser.id;
    reply.fromUserName = `${currentUser.firstName} ${currentUser.lastName}`;
    this.notifications.set(reply.id, reply);

    this.logger.log(
      `User ${currentUser.id} replied to notification ${notificationId}`,
    );

    return reply;
  }

  /**
   * Get all notifications in a thread
   */
  async getThread(threadId: string, userId: string): Promise<Notification[]> {
    const threadNotifications = Array.from(this.notifications.values())
      .filter((n) => n.threadId === threadId)
      .filter((n) => n.userId === userId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    if (threadNotifications.length === 0) {
      throw new NotFoundException(`Thread ${threadId} not found`);
    }

    return threadNotifications;
  }

  /**
   * Delete a notification
   */
  async deleteNotification(id: string, userId: string): Promise<void> {
    // Verify notification exists and belongs to user
    await this.getNotification(id, userId);
    this.notifications.delete(id);
    this.logger.log(`Deleted notification ${id}`);
  }

  /**
   * Send a project assignment notification
   */
  async sendProjectAssignmentNotification(
    projectId: string,
    contractorId: string,
  ): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    const contractor = await this.prisma.contractor.findUnique({
      where: { id: contractorId },
    });

    if (!project || !contractor) {
      throw new NotFoundException("Project or contractor not found");
    }

    // Find the contractor's user account
    const user = await this.prisma.user.findUnique({
      where: { email: contractor.email },
    });

    if (user) {
      await this.createNotification({
        userId: user.id,
        type: "PROJECT_ASSIGNMENT",
        title: "New Project Assignment",
        message: `You have been assigned to project: ${project.name}`,
      });

      // Email notification would be sent here in production
      this.logger.log(
        `Project assignment notification sent for project ${project.name} to ${contractor.email}`,
      );
    }
  }

  /**
   * Send COI status update notification
   */
  async sendCOIStatusNotification(
    coiId: string,
    status: string,
  ): Promise<void> {
    const coi = await this.prisma.generatedCOI.findUnique({
      where: { id: coiId },
      include: {
        subcontractor: true,
      },
    });

    if (!coi) {
      throw new NotFoundException("COI not found");
    }

    // Find the subcontractor's user account
    const user = await this.prisma.user.findUnique({
      where: { email: coi.subcontractor.email },
    });

    if (user) {
      await this.createNotification({
        userId: user.id,
        type: "COI_STATUS_UPDATE",
        title: "COI Status Update",
        message: `COI for ${coi.projectName} status: ${status}`,
      });
    }
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}
