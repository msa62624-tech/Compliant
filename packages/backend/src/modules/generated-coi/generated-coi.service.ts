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
    // Check if subcontractor already has an ACTIVE COI from another project
    const existingActiveCOI = await this.prisma.generatedCOI.findFirst({
      where: {
        subcontractorId: createCOIDto.subcontractorId,
        status: COIStatus.ACTIVE,
      },
      include: {
        project: true,
      },
    });

    // If subcontractor has active COI, copy broker info and policy data
    if (existingActiveCOI) {
      return this.prisma.generatedCOI.create({
        data: {
          projectId: createCOIDto.projectId,
          subcontractorId: createCOIDto.subcontractorId,
          assignedAdminEmail: createCOIDto.assignedAdminEmail,
          status: COIStatus.AWAITING_ADMIN_REVIEW, // Skip broker steps if copying
          createdBy: currentUserEmail,
          // Copy broker info from existing COI
          brokerType: existingActiveCOI.brokerType,
          brokerGlobalName: existingActiveCOI.brokerGlobalName,
          brokerGlobalEmail: existingActiveCOI.brokerGlobalEmail,
          brokerGlobalPhone: existingActiveCOI.brokerGlobalPhone,
          brokerGlName: existingActiveCOI.brokerGlName,
          brokerGlEmail: existingActiveCOI.brokerGlEmail,
          brokerGlPhone: existingActiveCOI.brokerGlPhone,
          brokerUmbrellaName: existingActiveCOI.brokerUmbrellaName,
          brokerUmbrellaEmail: existingActiveCOI.brokerUmbrellaEmail,
          brokerUmbrellaPhone: existingActiveCOI.brokerUmbrellaPhone,
          brokerAutoName: existingActiveCOI.brokerAutoName,
          brokerAutoEmail: existingActiveCOI.brokerAutoEmail,
          brokerAutoPhone: existingActiveCOI.brokerAutoPhone,
          brokerWcName: existingActiveCOI.brokerWcName,
          brokerWcEmail: existingActiveCOI.brokerWcEmail,
          brokerWcPhone: existingActiveCOI.brokerWcPhone,
          // Copy policy URLs (admin will review if still valid)
          policyGlUrl: existingActiveCOI.policyGlUrl,
          policyUmbrellaUrl: existingActiveCOI.policyUmbrellaUrl,
          policyAutoUrl: existingActiveCOI.policyAutoUrl,
          policyWcUrl: existingActiveCOI.policyWcUrl,
          signatureGlUrl: existingActiveCOI.signatureGlUrl,
          signatureUmbrellaUrl: existingActiveCOI.signatureUmbrellaUrl,
          signatureAutoUrl: existingActiveCOI.signatureAutoUrl,
          signatureWcUrl: existingActiveCOI.signatureWcUrl,
          // Copy extracted policy data
          policyGlNumber: existingActiveCOI.policyGlNumber,
          policyGlEffectiveDate: existingActiveCOI.policyGlEffectiveDate,
          policyGlExpirationDate: existingActiveCOI.policyGlExpirationDate,
          policyGlLimit: existingActiveCOI.policyGlLimit,
          policyGlAggregate: existingActiveCOI.policyGlAggregate,
          policyUmbrellaNumber: existingActiveCOI.policyUmbrellaNumber,
          policyUmbrellaEffectiveDate: existingActiveCOI.policyUmbrellaEffectiveDate,
          policyUmbrellaExpirationDate: existingActiveCOI.policyUmbrellaExpirationDate,
          policyUmbrellaLimit: existingActiveCOI.policyUmbrellaLimit,
          policyAutoNumber: existingActiveCOI.policyAutoNumber,
          policyAutoEffectiveDate: existingActiveCOI.policyAutoEffectiveDate,
          policyAutoExpirationDate: existingActiveCOI.policyAutoExpirationDate,
          policyAutoLimit: existingActiveCOI.policyAutoLimit,
          policyWcNumber: existingActiveCOI.policyWcNumber,
          policyWcEffectiveDate: existingActiveCOI.policyWcEffectiveDate,
          policyWcExpirationDate: existingActiveCOI.policyWcExpirationDate,
          policyWcLimit: existingActiveCOI.policyWcLimit,
        },
        include: {
          project: true,
          subcontractor: true,
        },
      });
    }

    // New subcontractor - start from AWAITING_BROKER_INFO
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

    // Broker signs COI in-system using Adobe eSign integration
    // signPoliciesDto contains signatureGlUrl, signatureUmbrellaUrl, etc.
    // These are Adobe eSign agreement IDs or signed document URLs from Adobe API
    // The broker portal UI calls Adobe eSign widget, broker signs electronically,
    // Adobe returns signed document URL which is saved here
    return this.prisma.generatedCOI.update({
      where: { id },
      data: {
        ...signPoliciesDto,
        status: COIStatus.AWAITING_ADMIN_REVIEW,
        signedAt: new Date(), // Record when broker signed in system
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

  async renewCOI(id: string, currentUserEmail?: string) {
    const expiredCOI = await this.findOne(id);

    // Can only renew EXPIRED COIs
    if (expiredCOI.status !== COIStatus.EXPIRED) {
      throw new BadRequestException(
        `Cannot renew COI. Current status: ${expiredCOI.status}. Only EXPIRED COIs can be renewed.`,
      );
    }

    // Create new COI for renewal with copied data
    // Broker will need to upload new policies (status: AWAITING_BROKER_UPLOAD)
    return this.prisma.generatedCOI.create({
      data: {
        projectId: expiredCOI.projectId,
        subcontractorId: expiredCOI.subcontractorId,
        assignedAdminEmail: expiredCOI.assignedAdminEmail,
        status: COIStatus.AWAITING_BROKER_UPLOAD, // Skip broker info since we have it
        createdBy: currentUserEmail,
        // Copy broker info from expired COI
        brokerType: expiredCOI.brokerType,
        brokerGlobalName: expiredCOI.brokerGlobalName,
        brokerGlobalEmail: expiredCOI.brokerGlobalEmail,
        brokerGlobalPhone: expiredCOI.brokerGlobalPhone,
        brokerGlName: expiredCOI.brokerGlName,
        brokerGlEmail: expiredCOI.brokerGlEmail,
        brokerGlPhone: expiredCOI.brokerGlPhone,
        brokerUmbrellaName: expiredCOI.brokerUmbrellaName,
        brokerUmbrellaEmail: expiredCOI.brokerUmbrellaEmail,
        brokerUmbrellaPhone: expiredCOI.brokerUmbrellaPhone,
        brokerAutoName: expiredCOI.brokerAutoName,
        brokerAutoEmail: expiredCOI.brokerAutoEmail,
        brokerAutoPhone: expiredCOI.brokerAutoPhone,
        brokerWcName: expiredCOI.brokerWcName,
        brokerWcEmail: expiredCOI.brokerWcEmail,
        brokerWcPhone: expiredCOI.brokerWcPhone,
        // Don't copy policy URLs - broker must upload new policies
        // Don't copy extracted data - will be extracted from new policies
      },
      include: {
        project: true,
        subcontractor: true,
      },
    });
  }

  async resubmitDeficiency(id: string) {
    const coi = await this.findOne(id);

    // Can only resubmit from DEFICIENCY_PENDING status
    if (coi.status !== COIStatus.DEFICIENCY_PENDING) {
      throw new BadRequestException(
        `Cannot resubmit. Current status: ${coi.status}. Only DEFICIENCY_PENDING COIs can be resubmitted.`,
      );
    }

    // Transition back to AWAITING_BROKER_UPLOAD so broker can replace documents
    return this.prisma.generatedCOI.update({
      where: { id },
      data: {
        status: COIStatus.AWAITING_BROKER_UPLOAD,
        // Clear deficiency notes since broker is addressing them
        deficiencyNotes: null,
      },
    });
  }
}
