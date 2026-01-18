import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";
import { CreateCOIDto } from "./dto/create-coi.dto";
import { UpdateBrokerInfoDto } from "./dto/update-broker-info.dto";
import { UploadPoliciesDto } from "./dto/upload-policies.dto";
import { SignPoliciesDto } from "./dto/sign-policies.dto";
import { ReviewCOIDto } from "./dto/review-coi.dto";
import { COIStatus, UserRole } from "@prisma/client";
import { HoldHarmlessService } from "../hold-harmless/hold-harmless.service";
import * as bcrypt from "bcrypt";
import { randomBytes } from "crypto";

@Injectable()
export class GeneratedCOIService {
  private readonly logger = new Logger(GeneratedCOIService.name);

  constructor(
    private prisma: PrismaService,
    private holdHarmlessService: HoldHarmlessService,
  ) {}

  /**
   * Generate a secure permanent password
   * PRODUCTION: This password is permanent (not temporary)
   * Users can change it later if needed via password reset
   */
  private generateSecurePassword(): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    const bytes = randomBytes(12);
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars[bytes[i] % chars.length];
    }
    return password;
  }

  /**
   * Auto-create broker user account
   * PRODUCTION: This happens automatically when broker info is added
   * Password is PERMANENT - broker receives it once and keeps using it
   * Same credentials work for all links/emails sent to this broker
   */
  private async autoCreateBrokerAccount(
    email: string,
    name: string,
  ): Promise<{ email: string; password: string; created: boolean }> {
    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        this.logger.log(
          `Broker account already exists for ${email} - using existing credentials`,
        );
        return { email, password: "", created: false };
      }

      // Generate PERMANENT password
      const password = this.generateSecurePassword();
      const hashedPassword = await bcrypt.hash(password, 10);

      // Extract first/last name from full name
      const nameParts = name.split(" ");
      const firstName = nameParts[0] || "Broker";
      const lastName = nameParts.slice(1).join(" ") || "User";

      // Create broker user account with PERMANENT password
      await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: UserRole.BROKER,
          isActive: true,
        },
      });

      this.logger.log(`✓ Auto-created broker account for ${email}`);
      this.logger.log(`  Email: ${email}`);
      this.logger.log(`  Password: ${password} (PERMANENT - save this!)`);
      this.logger.log(`  Note: Broker can change password later if forgotten`);

      // TODO: Send welcome email with permanent credentials
      // await this.emailService.sendBrokerWelcomeEmail(email, firstName, password);
      // Email should say: "These are your permanent credentials. Keep them safe. You can change your password anytime."

      return { email, password, created: true };
    } catch (error) {
      this.logger.error(
        `Failed to auto-create broker account for ${email}:`,
        error,
      );
      return { email, password: "", created: false };
    }
  }

  async create(createCOIDto: CreateCOIDto, _currentUserEmail?: string) {
    // PRODUCTION RULE: ACORD 25 follows exactly the first ACORD uploaded for this sub
    // EXCEPT for: Additional Insureds and Project Location
    // Additional Insureds = GC + Owner + Additional Insured Entities from the new project

    // Get the new project details for additional insureds and location
    const newProject = await this.prisma.project.findUnique({
      where: { id: createCOIDto.projectId },
      include: {
        programs: {
          include: {
            program: true,
          },
        },
      },
    });

    if (!newProject) {
      throw new NotFoundException(
        `Project with ID ${createCOIDto.projectId} not found`,
      );
    }

    // Extract additional insureds from new project
    const additionalInsureds: string[] = [];
    if (newProject.gcName) additionalInsureds.push(newProject.gcName);
    if (newProject.entity) additionalInsureds.push(newProject.entity);
    if (newProject.additionalInsureds) {
      // Parse additional insureds (could be comma-separated string or array)
      const parsed =
        typeof newProject.additionalInsureds === "string"
          ? newProject.additionalInsureds
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : Array.isArray(newProject.additionalInsureds)
            ? newProject.additionalInsureds
            : [];
      additionalInsureds.push(...parsed);
    }

    // Remove duplicates
    const uniqueAdditionalInsureds = [...new Set(additionalInsureds)];

    this.logger.log(
      `Creating ACORD 25 for subcontractor ${createCOIDto.subcontractorId}`,
    );
    this.logger.log(
      `Additional Insureds: ${uniqueAdditionalInsureds.join(", ")}`,
    );
    this.logger.log(`Project Location: ${newProject.address || "N/A"}`);

    // Check if subcontractor already has an ACTIVE COI from FIRST project
    // This is the MASTER ACORD 25 template that all future COIs will follow
    const firstCOI = await this.prisma.generatedCOI.findFirst({
      where: {
        subcontractorId: createCOIDto.subcontractorId,
        status: COIStatus.ACTIVE,
      },
      include: {
        project: true,
        subcontractor: true,
      },
      orderBy: {
        createdAt: "asc", // Get the FIRST one
      },
    });

    // If subcontractor has first ACORD 25, copy ALL data except additional insureds and location
    if (firstCOI) {
      this.logger.log(
        `Found first ACORD 25 (ID: ${firstCOI.id}) - copying all data except additional insureds and location`,
      );

      return this.prisma.generatedCOI.create({
        data: {
          projectId: createCOIDto.projectId,
          subcontractorId: createCOIDto.subcontractorId,
          assignedAdminEmail: createCOIDto.assignedAdminEmail,
          status: COIStatus.AWAITING_ADMIN_REVIEW, // Skip broker steps - using existing data

          // COPY FROM FIRST ACORD 25: Broker info
          brokerName: firstCOI.brokerName,
          brokerEmail: firstCOI.brokerEmail,
          brokerPhone: firstCOI.brokerPhone,
          brokerCompany: firstCOI.brokerCompany,
          brokerGlName: firstCOI.brokerGlName,
          brokerGlEmail: firstCOI.brokerGlEmail,
          brokerGlPhone: firstCOI.brokerGlPhone,
          brokerUmbrellaName: firstCOI.brokerUmbrellaName,
          brokerUmbrellaEmail: firstCOI.brokerUmbrellaEmail,
          brokerUmbrellaPhone: firstCOI.brokerUmbrellaPhone,
          brokerAutoName: firstCOI.brokerAutoName,
          brokerAutoEmail: firstCOI.brokerAutoEmail,
          brokerAutoPhone: firstCOI.brokerAutoPhone,
          brokerWcName: firstCOI.brokerWcName,
          brokerWcEmail: firstCOI.brokerWcEmail,
          brokerWcPhone: firstCOI.brokerWcPhone,

          // COPY FROM FIRST ACORD 25: Policy URLs and signatures
          firstCOIUrl: firstCOI.firstCOIUrl,
          firstCOIUploaded: firstCOI.firstCOIUploaded,
          glPolicyUrl: firstCOI.glPolicyUrl,
          umbrellaPolicyUrl: firstCOI.umbrellaPolicyUrl,
          autoPolicyUrl: firstCOI.autoPolicyUrl,
          wcPolicyUrl: firstCOI.wcPolicyUrl,
          glBrokerSignatureUrl: firstCOI.glBrokerSignatureUrl,
          umbrellaBrokerSignatureUrl: firstCOI.umbrellaBrokerSignatureUrl,
          autoBrokerSignatureUrl: firstCOI.autoBrokerSignatureUrl,
          wcBrokerSignatureUrl: firstCOI.wcBrokerSignatureUrl,

          // COPY FROM FIRST ACORD 25: Expiration dates
          glExpirationDate: firstCOI.glExpirationDate,
          umbrellaExpirationDate: firstCOI.umbrellaExpirationDate,
          autoExpirationDate: firstCOI.autoExpirationDate,
          wcExpirationDate: firstCOI.wcExpirationDate,

          // COPY FROM FIRST ACORD 25: GC details
          gcName: firstCOI.gcName,

          // NEW FOR THIS PROJECT: Project name (location in description)
          projectName: newProject.name,
          subcontractorName: firstCOI.subcontractorName,

          // Notes about the copy
          deficiencyNotes: `ACORD 25 auto-generated from first ACORD (ID: ${firstCOI.id}) for new project.`,
        },
        include: {
          project: true,
          subcontractor: true,
        },
      });
    }

    // No existing COI - create new one (first time for this subcontractor)
    // This will become the MASTER ACORD 25 template for all future projects
    this.logger.log(
      `No existing ACORD 25 found - creating FIRST (master) ACORD 25 for subcontractor`,
    );

    return this.prisma.generatedCOI.create({
      data: {
        projectId: createCOIDto.projectId,
        subcontractorId: createCOIDto.subcontractorId,
        assignedAdminEmail: createCOIDto.assignedAdminEmail,
        status: COIStatus.AWAITING_BROKER_INFO,

        // Set initial project info for first ACORD
        projectName: newProject.name,
        gcName: newProject.gcName,
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
      currentUser?.role === "SUPER_ADMIN"
        ? {}
        : currentUser?.role === "ADMIN"
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
      orderBy: { createdAt: "desc" },
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

    // PRODUCTION: Auto-create broker user account(s)
    const brokerAccounts: any[] = [];

    // If GLOBAL broker type, create one account
    if (updateBrokerInfoDto.brokerEmail && updateBrokerInfoDto.brokerName) {
      const result = await this.autoCreateBrokerAccount(
        updateBrokerInfoDto.brokerEmail,
        updateBrokerInfoDto.brokerName,
      );
      brokerAccounts.push(result);
    }

    // If PER_POLICY broker type, create separate accounts for each
    if (updateBrokerInfoDto.brokerGlEmail && updateBrokerInfoDto.brokerGlName) {
      const result = await this.autoCreateBrokerAccount(
        updateBrokerInfoDto.brokerGlEmail,
        updateBrokerInfoDto.brokerGlName,
      );
      brokerAccounts.push(result);
    }

    if (
      updateBrokerInfoDto.brokerAutoEmail &&
      updateBrokerInfoDto.brokerAutoName
    ) {
      const result = await this.autoCreateBrokerAccount(
        updateBrokerInfoDto.brokerAutoEmail,
        updateBrokerInfoDto.brokerAutoName,
      );
      brokerAccounts.push(result);
    }

    if (
      updateBrokerInfoDto.brokerUmbrellaEmail &&
      updateBrokerInfoDto.brokerUmbrellaName
    ) {
      const result = await this.autoCreateBrokerAccount(
        updateBrokerInfoDto.brokerUmbrellaEmail,
        updateBrokerInfoDto.brokerUmbrellaName,
      );
      brokerAccounts.push(result);
    }

    if (updateBrokerInfoDto.brokerWcEmail && updateBrokerInfoDto.brokerWcName) {
      const result = await this.autoCreateBrokerAccount(
        updateBrokerInfoDto.brokerWcEmail,
        updateBrokerInfoDto.brokerWcName,
      );
      brokerAccounts.push(result);
    }

    const updatedCoi = await this.prisma.generatedCOI.update({
      where: { id },
      data: {
        ...updateBrokerInfoDto,
        status: COIStatus.AWAITING_BROKER_UPLOAD,
      },
    });

    return {
      ...updatedCoi,
      brokerAccounts, // Return info about created broker accounts
    };
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
    // signPoliciesDto contains glBrokerSignatureUrl, umbrellaBrokerSignatureUrl, etc.
    // These are Adobe eSign agreement IDs or signed document URLs from Adobe API
    // The broker portal UI calls Adobe eSign widget, broker signs electronically,
    // Adobe returns signed document URL which is saved here
    return this.prisma.generatedCOI.update({
      where: { id },
      data: {
        ...signPoliciesDto,
        status: COIStatus.AWAITING_ADMIN_REVIEW,
      },
    });
  }

  async reviewCOI(
    id: string,
    reviewCOIDto: ReviewCOIDto,
    _reviewerEmail: string,
  ) {
    const coi = await this.findOne(id);

    if (coi.status !== COIStatus.AWAITING_ADMIN_REVIEW) {
      throw new BadRequestException(
        `Cannot review COI. Current status: ${coi.status}`,
      );
    }

    const newStatus = reviewCOIDto.approved
      ? COIStatus.ACTIVE
      : COIStatus.DEFICIENCY_PENDING;

    const updatedCOI = await this.prisma.generatedCOI.update({
      where: { id },
      data: {
        status: newStatus,
        deficiencyNotes: reviewCOIDto.deficiencyNotes,
      },
    });

    // Trigger hold harmless auto-generation when COI is approved (status changes to ACTIVE)
    if (newStatus === COIStatus.ACTIVE) {
      try {
        await this.holdHarmlessService.autoGenerateOnCOIApproval(id);
      } catch (error) {
        // Log error with detailed information for monitoring/alerting
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        const errorStack = error instanceof Error ? error.stack : undefined;

        this.logger.error(
          `CRITICAL: Failed to auto-generate hold harmless for COI ${id}. ` +
            `This creates an inconsistent state where COI is ACTIVE but hold harmless record may be missing. ` +
            `Error: ${errorMessage}`,
          errorStack,
        );

        // Rollback COI status to prevent inconsistent state
        this.logger.warn(
          `Rolling back COI ${id} status to AWAITING_ADMIN_REVIEW due to hold harmless generation failure`,
        );

        const rollbackMessage =
          "Auto-rollback: Hold harmless generation failed - please retry approval.";
        await this.prisma.generatedCOI.update({
          where: { id },
          data: {
            status: COIStatus.AWAITING_ADMIN_REVIEW,
            deficiencyNotes: reviewCOIDto.deficiencyNotes
              ? `${reviewCOIDto.deficiencyNotes}\n\n${rollbackMessage}`
              : rollbackMessage,
          },
        });

        // Re-throw the error to inform the caller of the failure
        throw new BadRequestException(
          `COI approval failed: Unable to generate hold harmless agreement. ${errorMessage}`,
        );
      }
    }

    return updatedCOI;
  }

  async findExpiring(days: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.prisma.generatedCOI.findMany({
      where: {
        status: COIStatus.ACTIVE,
        OR: [
          {
            glExpirationDate: {
              lte: futureDate,
              gte: new Date(),
            },
          },
          {
            umbrellaExpirationDate: {
              lte: futureDate,
              gte: new Date(),
            },
          },
          {
            autoExpirationDate: {
              lte: futureDate,
              gte: new Date(),
            },
          },
          {
            wcExpirationDate: {
              lte: futureDate,
              gte: new Date(),
            },
          },
        ],
      },
      include: {
        project: true,
        subcontractor: true,
      },
      orderBy: { glExpirationDate: "asc" },
    });
  }

  async renewCOI(id: string, _currentUserEmail?: string) {
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
        // Copy broker info from expired COI
        brokerName: expiredCOI.brokerName,
        brokerEmail: expiredCOI.brokerEmail,
        brokerPhone: expiredCOI.brokerPhone,
        brokerCompany: expiredCOI.brokerCompany,
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
