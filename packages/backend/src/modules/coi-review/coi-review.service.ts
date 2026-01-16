import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class COIReviewService {
  private readonly logger = new Logger(COIReviewService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async submitReview(
    contractorId: string,
    documentId: string,
    submittedBy: string,
    priority: string = 'NORMAL',
    dueDate?: Date,
  ): Promise<any> {
    try {
      // Calculate due date if not provided (default: 3 business days)
      if (!dueDate) {
        dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 3);
      }

      const review = await this.prisma.cOIReview.create({
        data: {
          contractorId,
          documentId,
          submittedBy,
          status: 'PENDING',
          priority: priority as any,
          dueDate,
        },
        include: {
          contractor: true,
          submitter: true,
        },
      });

      this.logger.log(`COI review submitted: ${review.id}`);

      // TODO: Notify reviewers about new submission
      return review;
    } catch (error) {
      this.logger.error(`Failed to submit review: ${error.message}`);
      throw error;
    }
  }

  async assignReviewer(reviewId: string, reviewerId: string): Promise<any> {
    const review = await this.prisma.cOIReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.status !== 'PENDING') {
      throw new BadRequestException('Review is not in pending status');
    }

    const updated = await this.prisma.cOIReview.update({
      where: { id: reviewId },
      data: {
        assignedTo: reviewerId,
        status: 'IN_REVIEW',
      },
      include: {
        reviewer: true,
      },
    });

    this.logger.log(`Review ${reviewId} assigned to ${reviewerId}`);

    // Send notification to reviewer
    if (updated.reviewer) {
      await this.emailService.sendEmail({
        to: updated.reviewer.email,
        subject: 'New COI Review Assigned',
        template: 'default',
        variables: {
          message: `You have been assigned a new COI review (${reviewId}). Please review by ${review.dueDate?.toDateString()}.`,
        },
      });
    }

    return updated;
  }

  async submitDecision(
    reviewId: string,
    reviewerId: string,
    decision: string,
    notes?: string,
  ): Promise<any> {
    const review = await this.prisma.cOIReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.assignedTo !== reviewerId) {
      throw new BadRequestException('You are not assigned to this review');
    }

    const status = decision === 'APPROVED' ? 'APPROVED' : 
                   decision === 'REJECTED' ? 'REJECTED' : 'REQUIRES_CHANGES';

    const updated = await this.prisma.cOIReview.update({
      where: { id: reviewId },
      data: {
        status: status as any,
        decision: decision as any,
        notes,
        reviewedAt: new Date(),
      },
      include: {
        contractor: true,
        submitter: true,
      },
    });

    this.logger.log(`Review ${reviewId} decision: ${decision}`);

    // Notify submitter about decision
    await this.emailService.sendEmail({
      to: updated.submitter.email,
      subject: `COI Review ${decision}`,
      template: 'default',
      variables: {
        message: `Your COI review for ${updated.contractor.name} has been ${decision.toLowerCase()}.${notes ? ` Notes: ${notes}` : ''}`,
      },
    });

    return updated;
  }

  async getReviewQueue(reviewerId?: string, status?: string): Promise<any[]> {
    const where: any = {};

    if (reviewerId) {
      where.assignedTo = reviewerId;
    }

    if (status) {
      where.status = status;
    }

    return this.prisma.cOIReview.findMany({
      where,
      include: {
        contractor: true,
        submitter: true,
        reviewer: true,
        deficiencies: true,
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
    });
  }

  async getReview(reviewId: string): Promise<any> {
    const review = await this.prisma.cOIReview.findUnique({
      where: { id: reviewId },
      include: {
        contractor: true,
        submitter: true,
        reviewer: true,
        deficiencies: {
          include: {
            reminders: true,
          },
        },
        approvals: {
          include: {
            approver: true,
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async getOverdueReviews(): Promise<any[]> {
    return this.prisma.cOIReview.findMany({
      where: {
        status: {
          in: ['PENDING', 'IN_REVIEW'],
        },
        dueDate: {
          lt: new Date(),
        },
      },
      include: {
        contractor: true,
        reviewer: true,
      },
      orderBy: { dueDate: 'asc' },
    });
  }
}
