import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { HoldHarmlessStatus } from '@prisma/client';

/**
 * Service for managing hold harmless agreements
 * Handles upload, tracking, and compliance verification
 */
@Injectable()
export class HoldHarmlessService {
  constructor(private prisma: PrismaService) {}

  /**
   * Upload hold harmless document for a COI
   */
  async uploadHoldHarmless(
    coiId: string,
    documentUrl: string,
    uploadedBy: string,
    metadata?: {
      agreementType?: string;
      parties?: string[];
      effectiveDate?: Date;
      expirationDate?: Date;
    },
  ) {
    // Check if COI exists
    const coi = await this.prisma.generatedCOI.findUnique({
      where: { id: coiId },
    });

    if (!coi) {
      throw new NotFoundException(`COI with ID ${coiId} not found`);
    }

    // Check if hold harmless already exists
    const existing = await this.prisma.holdHarmless.findUnique({
      where: { coiId },
    });

    if (existing) {
      // Update existing
      const updated = await this.prisma.holdHarmless.update({
        where: { coiId },
        data: {
          documentUrl,
          uploadedBy,
          uploadedAt: new Date(),
          status: HoldHarmlessStatus.UPLOADED,
          agreementType: metadata?.agreementType,
          parties: metadata?.parties || [],
          effectiveDate: metadata?.effectiveDate,
          expirationDate: metadata?.expirationDate,
        },
      });

      // Update COI status
      await this.prisma.generatedCOI.update({
        where: { id: coiId },
        data: {
          holdHarmlessDocumentUrl: documentUrl,
          holdHarmlessUploadedAt: new Date(),
          holdHarmlessStatus: HoldHarmlessStatus.UPLOADED,
        },
      });

      return updated;
    }

    // Create new
    const created = await this.prisma.holdHarmless.create({
      data: {
        coiId,
        documentUrl,
        uploadedBy,
        status: HoldHarmlessStatus.UPLOADED,
        agreementType: metadata?.agreementType,
        parties: metadata?.parties || [],
        effectiveDate: metadata?.effectiveDate,
        expirationDate: metadata?.expirationDate,
      },
    });

    // Update COI status
    await this.prisma.generatedCOI.update({
      where: { id: coiId },
      data: {
        holdHarmlessDocumentUrl: documentUrl,
        holdHarmlessUploadedAt: new Date(),
        holdHarmlessStatus: HoldHarmlessStatus.UPLOADED,
      },
    });

    return created;
  }

  /**
   * Get hold harmless agreement for a COI
   */
  async getHoldHarmless(coiId: string) {
    const holdHarmless = await this.prisma.holdHarmless.findUnique({
      where: { coiId },
      include: {
        coi: {
          include: {
            project: true,
            subcontractor: true,
          },
        },
      },
    });

    if (!holdHarmless) {
      throw new NotFoundException(`Hold harmless agreement for COI ${coiId} not found`);
    }

    return holdHarmless;
  }

  /**
   * Review and approve/reject hold harmless agreement
   */
  async reviewHoldHarmless(
    id: string,
    reviewedBy: string,
    status: HoldHarmlessStatus,
    reviewNotes?: string,
    meetsRequirements?: boolean,
    deficiencies?: string[],
  ) {
    const holdHarmless = await this.prisma.holdHarmless.findUnique({
      where: { id },
    });

    if (!holdHarmless) {
      throw new NotFoundException(`Hold harmless agreement ${id} not found`);
    }

    // Update hold harmless
    const updated = await this.prisma.holdHarmless.update({
      where: { id },
      data: {
        status,
        reviewedBy,
        reviewedAt: new Date(),
        reviewNotes,
        meetsRequirements: meetsRequirements ?? false,
        deficiencies: deficiencies || [],
        rejectionReason: status === HoldHarmlessStatus.REJECTED ? reviewNotes : null,
      },
    });

    // Update COI status
    await this.prisma.generatedCOI.update({
      where: { id: holdHarmless.coiId },
      data: {
        holdHarmlessStatus: status,
      },
    });

    return updated;
  }

  /**
   * Get all hold harmless agreements with filtering
   */
  async getAllHoldHarmless(filters?: {
    status?: HoldHarmlessStatus;
    expired?: boolean;
    needsReview?: boolean;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.expired) {
      where.expirationDate = {
        lt: new Date(),
      };
    }

    if (filters?.needsReview) {
      where.status = HoldHarmlessStatus.UPLOADED;
      where.reviewedAt = null;
    }

    return this.prisma.holdHarmless.findMany({
      where,
      include: {
        coi: {
          include: {
            project: true,
            subcontractor: true,
          },
        },
      },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  /**
   * Check if hold harmless is expiring soon
   */
  async checkExpiringHoldHarmless(daysThreshold: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysThreshold);

    return this.prisma.holdHarmless.findMany({
      where: {
        expirationDate: {
          lte: futureDate,
          gte: new Date(),
        },
        status: HoldHarmlessStatus.APPROVED,
      },
      include: {
        coi: {
          include: {
            project: true,
            subcontractor: true,
          },
        },
      },
    });
  }

  /**
   * Delete hold harmless agreement
   */
  async deleteHoldHarmless(id: string) {
    const holdHarmless = await this.prisma.holdHarmless.findUnique({
      where: { id },
    });

    if (!holdHarmless) {
      throw new NotFoundException(`Hold harmless agreement ${id} not found`);
    }

    // Update COI status before deleting
    await this.prisma.generatedCOI.update({
      where: { id: holdHarmless.coiId },
      data: {
        holdHarmlessDocumentUrl: null,
        holdHarmlessUploadedAt: null,
        holdHarmlessStatus: HoldHarmlessStatus.NOT_UPLOADED,
      },
    });

    return this.prisma.holdHarmless.delete({
      where: { id },
    });
  }

  /**
   * Get hold harmless statistics
   */
  async getStatistics() {
    const total = await this.prisma.holdHarmless.count();
    const approved = await this.prisma.holdHarmless.count({
      where: { status: HoldHarmlessStatus.APPROVED },
    });
    const rejected = await this.prisma.holdHarmless.count({
      where: { status: HoldHarmlessStatus.REJECTED },
    });
    const pending = await this.prisma.holdHarmless.count({
      where: { status: HoldHarmlessStatus.UPLOADED, reviewedAt: null },
    });
    const expired = await this.prisma.holdHarmless.count({
      where: {
        status: HoldHarmlessStatus.EXPIRED,
      },
    });

    return {
      total,
      approved,
      rejected,
      pending,
      expired,
    };
  }
}
