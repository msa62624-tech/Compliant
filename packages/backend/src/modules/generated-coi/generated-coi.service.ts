import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCOIDto } from './dto/create-coi.dto';
import { UpdateBrokerInfoDto } from './dto/update-broker-info.dto';
import { UploadPoliciesDto } from './dto/upload-policies.dto';
import { SignPoliciesDto } from './dto/sign-policies.dto';
import { ReviewCOIDto } from './dto/review-coi.dto';
import { COIStatus } from '@prisma/client';

@Injectable()
export class GeneratedCOIService {
  constructor(private prisma: PrismaService) {}

  async create(createCOIDto: CreateCOIDto, currentUserEmail?: string) {
    // Create COI with initial status AWAITING_BROKER_INFO
    return this.prisma.generatedCOI.create({
      data: {
        projectId: createCOIDto.projectId,
        subcontractorId: createCOIDto.subcontractorId,
        assignedAdminEmail: createCOIDto.assignedAdminEmail,
        status: COIStatus.AWAITING_BROKER_INFO,
        createdBy: currentUserEmail,
      },
      include: {
        project: true,
        subcontractor: true,
      },
    });
  }

  async findAll(currentUser?: { role: string; email: string }) {
    // Super Admin sees all COIs
    // Assistant Admin only sees COIs assigned to them
    const where =
      currentUser?.role === 'SUPER_ADMIN'
        ? {}
        : currentUser?.role === 'ADMIN'
        ? {
            OR: [
              { assignedAdminEmail: currentUser.email },
              { assignedAdminEmail: null },
            ],
          }
        : {};

    return this.prisma.generatedCOI.findMany({
      where,
      include: {
        project: true,
        subcontractor: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const coi = await this.prisma.generatedCOI.findUnique({
      where: { id },
      include: {
        project: true,
        subcontractor: true,
      },
    });

    if (!coi) {
      throw new NotFoundException(`COI with ID ${id} not found`);
    }

    return coi;
  }

  async updateBrokerInfo(id: string, updateBrokerInfoDto: UpdateBrokerInfoDto) {
    const coi = await this.findOne(id);

    if (coi.status !== COIStatus.AWAITING_BROKER_INFO) {
      throw new BadRequestException(
        `Cannot update broker info. Current status: ${coi.status}`,
      );
    }

    return this.prisma.generatedCOI.update({
      where: { id },
      data: {
        ...updateBrokerInfoDto,
        status: COIStatus.AWAITING_BROKER_UPLOAD,
      },
    });
  }

  async uploadPolicies(id: string, uploadPoliciesDto: UploadPoliciesDto) {
    const coi = await this.findOne(id);

    if (coi.status !== COIStatus.AWAITING_BROKER_UPLOAD) {
      throw new BadRequestException(
        `Cannot upload policies. Current status: ${coi.status}`,
      );
    }

    return this.prisma.generatedCOI.update({
      where: { id },
      data: {
        ...uploadPoliciesDto,
        status: COIStatus.AWAITING_BROKER_SIGNATURE,
      },
    });
  }

  async signPolicies(id: string, signPoliciesDto: SignPoliciesDto) {
    const coi = await this.findOne(id);

    if (coi.status !== COIStatus.AWAITING_BROKER_SIGNATURE) {
      throw new BadRequestException(
        `Cannot sign policies. Current status: ${coi.status}`,
      );
    }

    return this.prisma.generatedCOI.update({
      where: { id },
      data: {
        ...signPoliciesDto,
        status: COIStatus.AWAITING_ADMIN_REVIEW,
      },
    });
  }

  async reviewCOI(id: string, reviewCOIDto: ReviewCOIDto, reviewerEmail: string) {
    const coi = await this.findOne(id);

    if (coi.status !== COIStatus.AWAITING_ADMIN_REVIEW) {
      throw new BadRequestException(
        `Cannot review COI. Current status: ${coi.status}`,
      );
    }

    const newStatus = reviewCOIDto.approved
      ? COIStatus.ACTIVE
      : COIStatus.DEFICIENCY_PENDING;

    return this.prisma.generatedCOI.update({
      where: { id },
      data: {
        status: newStatus,
        deficiencyNotes: reviewCOIDto.deficiencyNotes,
        holdHarmlessCompliant: reviewCOIDto.holdHarmlessCompliant,
        holdHarmlessNotes: reviewCOIDto.holdHarmlessNotes,
        reviewedBy: reviewerEmail,
        reviewedAt: new Date(),
      },
    });
  }

  async findExpiring(days: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.prisma.generatedCOI.findMany({
      where: {
        status: COIStatus.ACTIVE,
        expirationDate: {
          lte: futureDate,
          gte: new Date(),
        },
      },
      include: {
        project: true,
        subcontractor: true,
      },
      orderBy: { expirationDate: 'asc' },
    });
  }
}
