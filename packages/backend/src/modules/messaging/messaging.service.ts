import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async sendMessage(senderId: string, receiverId: string, subject: string, body: string): Promise<any> {
    try {
      const message = await this.prisma.message.create({
        data: {
          senderId,
          receiverId,
          subject,
          body,
        },
        include: {
          sender: { select: { id: true, email: true, firstName: true, lastName: true } },
          receiver: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });

      // Send email notification
      await this.emailService.sendEmail({
        to: message.receiver.email,
        subject: `New Message: ${subject}`,
        template: 'message-notification',
        context: {
          senderName: `${message.sender.firstName} ${message.sender.lastName}`,
          subject,
          body,
        },
      });

      this.logger.log(`Message sent from ${senderId} to ${receiverId}`);
      return message;
    } catch (error) {
      this.logger.error(`Failed to send message: ${error.message}`);
      throw error;
    }
  }

  async getMessages(userId: string, type: 'sent' | 'received' | 'all' = 'all'): Promise<any[]> {
    const where: any = {};

    if (type === 'sent') {
      where.senderId = userId;
    } else if (type === 'received') {
      where.receiverId = userId;
    } else {
      where.OR = [{ senderId: userId }, { receiverId: userId }];
    }

    return this.prisma.message.findMany({
      where,
      include: {
        sender: { select: { id: true, email: true, firstName: true, lastName: true } },
        receiver: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.message.count({
      where: {
        receiverId: userId,
        read: false,
      },
    });
  }

  async markAsRead(messageId: string, userId: string): Promise<any> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.receiverId !== userId) {
      throw new Error('Unauthorized to mark this message as read');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  async deleteMessage(messageId: string, userId: string): Promise<any> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId && message.receiverId !== userId) {
      throw new Error('Unauthorized to delete this message');
    }

    return this.prisma.message.delete({
      where: { id: messageId },
    });
  }
}
