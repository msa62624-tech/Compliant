import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { EmailService } from '../email/email.service';
import { DEFICIENCY_TEMPLATES } from './templates/deficiency-templates';

@Injectable()
export class DeficienciesService {
  private readonly logger = new Logger(DeficienciesService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async createDeficiency(
    reviewId: string,
    category: string,
    severity: string,
    description: string,
    requiredAction: string,
    dueDate: Date,
  ): Promise<any> {
    const deficiency = await this.prisma.deficiency.create({
      data: {
        reviewId,
        category: category as any,
        severity: severity as any,
        description,
        requiredAction,
        dueDate,
        status: 'OPEN',
      },
      include: {
        review: {
          include: {
            contractor: true,
          },
        },
      },
    });

    this.logger.log(`Deficiency created: ${deficiency.id} for review ${reviewId}`);

    // Send notification about deficiency
    // TODO: Implement notification logic

    return deficiency;
  }

  async resolveDeficiency(deficiencyId: string, resolvedBy: string, resolutionNotes: string): Promise<any> {
    const deficiency = await this.prisma.deficiency.findUnique({
      where: { id: deficiencyId },
    });

    if (!deficiency) {
      throw new NotFoundException('Deficiency not found');
    }

    return this.prisma.deficiency.update({
      where: { id: deficiencyId },
      data: {
        status: 'RESOLVED',
        resolvedBy,
        resolvedAt: new Date(),
        resolutionNotes,
      },
    });
  }

  async getDeficiencies(reviewId?: string, status?: string): Promise<any[]> {
    const where: any = {};

    if (reviewId) {
      where.reviewId = reviewId;
    }

    if (status) {
      where.status = status;
    }

    return this.prisma.deficiency.findMany({
      where,
      include: {
        review: {
          include: {
            contractor: true,
          },
        },
        resolver: true,
        reminders: true,
      },
      orderBy: [
        { severity: 'desc' },
        { dueDate: 'asc' },
      ],
    });
  }

  getTemplates() {
    return DEFICIENCY_TEMPLATES;
  }

  async getOverdueDeficiencies(): Promise<any[]> {
    return this.prisma.deficiency.findMany({
      where: {
        status: {
          in: ['OPEN', 'IN_PROGRESS'],
        },
        dueDate: {
          lt: new Date(),
        },
      },
      include: {
        review: {
          include: {
            contractor: true,
          },
        },
      },
      orderBy: [
        { severity: 'desc' },
        { dueDate: 'asc' },
      ],
    });
  }

  async sendReminder(deficiencyId: string, sentTo: string): Promise<any> {
    const deficiency = await this.prisma.deficiency.findUnique({
      where: { id: deficiencyId },
      include: {
        review: {
          include: {
            contractor: true,
          },
        },
      },
    });

    if (!deficiency) {
      throw new NotFoundException('Deficiency not found');
    }

    const reminder = await this.prisma.reminder.create({
      data: {
        deficiencyId,
        sentTo,
      },
    });

    // Send reminder email
    const user = await this.prisma.user.findUnique({
      where: { id: sentTo },
    });

    if (user) {
      await this.emailService.sendEmail({
        to: user.email,
        subject: 'Deficiency Reminder',
        template: 'default',
        variables: {
          message: `Reminder: Deficiency for ${deficiency.review.contractor.name} is due on ${deficiency.dueDate.toDateString()}. ${deficiency.description}`,
        },
      });
    }

    return reminder;
  }
}
