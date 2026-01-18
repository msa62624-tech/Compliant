import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";
import { HoldHarmlessStatus } from "@prisma/client";
import { randomBytes } from "crypto";
import { EmailService } from "../email/email.service";

/**
 * Service for managing hold harmless agreements with signature workflow
 *
 * Workflow:
 * 1. When all COI policies are approved, hold harmless is auto-generated
 * 2. System fills in address and additional insureds from project/COI data
 * 3. Automatically sent to subcontractor with signature link
 * 4. Once sub signs, automatically sent to GC with signature link
 * 5. Once GC signs, saved and all parties notified (except broker)
 */
@Injectable()
export class HoldHarmlessService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  /**
   * Auto-generate hold harmless when COI is fully approved
   * This is called automatically when COI status changes to ACTIVE
   */
  async autoGenerateOnCOIApproval(coiId: string) {
    // Get COI with all related data
    const coi = await this.prisma.generatedCOI.findUnique({
      where: { id: coiId },
      include: {
        project: {
          include: {
            programs: {
              include: {
                program: true,
              },
            },
          },
        },
        subcontractor: true,
      },
    });

    if (!coi) {
      throw new NotFoundException(`COI with ID ${coiId} not found`);
    }

    // Check if hold harmless already exists
    const existing = await this.prisma.holdHarmless.findUnique({
      where: { coiId },
    });

    if (existing) {
      console.log(
        `Hold harmless already exists for COI ${coiId}, skipping generation`,
      );
      return existing;
    }

    // Get program with hold harmless template
    const program = coi.project.programs?.[0]?.program;

    if (!program?.requiresHoldHarmless) {
      console.log(`Program does not require hold harmless for COI ${coiId}`);
      return null;
    }

    if (!program.holdHarmlessTemplateUrl) {
      throw new BadRequestException(
        "Program requires hold harmless but no template is configured",
      );
    }

    // Generate unique signature token for subcontractor
    const subSignatureToken = this.generateSignatureToken();

    // Create hold harmless with auto-filled data
    const holdHarmless = await this.prisma.holdHarmless.create({
      data: {
        coiId,
        programId: program.id,
        templateUrl: program.holdHarmlessTemplateUrl,
        status: HoldHarmlessStatus.PENDING_SUB_SIGNATURE,

        // Auto-fill from project/COI data
        projectAddress: coi.project.address || "",
        gcName: coi.project.gcName || coi.gcName || "",
        gcEmail: coi.project.contactEmail || "",
        ownersEntity: coi.project.entity || "",
        additionalInsureds: this.extractAdditionalInsureds(coi.project),
        subcontractorName: coi.subcontractor.name,
        subcontractorEmail: coi.subcontractor.email,

        subSignatureToken,
        generatedAt: new Date(),
      },
    });

    // Update COI status
    await this.prisma.generatedCOI.update({
      where: { id: coiId },
      data: {
        holdHarmlessStatus: HoldHarmlessStatus.PENDING_SUB_SIGNATURE,
      },
    });

    // Send signature link to subcontractor
    await this.sendSignatureLinkToSubcontractor(holdHarmless);

    return holdHarmless;
  }

  /**
   * Extract additional insureds from project data
   */
  private extractAdditionalInsureds(project: any): string[] {
    const insureds: string[] = [];

    if (project.gcName) insureds.push(project.gcName);
    if (project.entity) insureds.push(project.entity);
    if (project.additionalInsureds) {
      // Parse if it's a string, otherwise assume it's already an array
      const parsed =
        typeof project.additionalInsureds === "string"
          ? project.additionalInsureds.split(",").map((s: string) => s.trim())
          : Array.isArray(project.additionalInsureds)
            ? project.additionalInsureds
            : [];
      insureds.push(...parsed);
    }

    return [...new Set(insureds)]; // Remove duplicates
  }

  /**
   * Generate a unique signature token
   */
  private generateSignatureToken(): string {
    return randomBytes(32).toString("hex");
  }

  /**
   * Send signature notification to subcontractor (authenticated access)
   */
  private async sendSignatureLinkToSubcontractor(holdHarmless: any) {
    const signatureUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/subcontractor/hold-harmless/${holdHarmless.id}`;

    const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #7c3aed;">Hold Harmless Agreement - Signature Required</h2>
      <p>Hello,</p>
      <p>A hold harmless agreement is ready for your signature.</p>
      <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <p>Please log in to the Compliant Platform to review and sign the hold harmless agreement:</p>
        <p style="margin: 20px 0;">
          <a href="${signatureUrl}" style="display: inline-block; padding: 12px 24px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Log In and Sign Agreement</a>
        </p>
      </div>
      <p>If you have any questions, please contact your general contractor.</p>
      <p>Best regards,<br>Compliant Platform Team</p>
    </div>`;

    const emailSent = await this.emailService.sendEmail({
      to: holdHarmless.subcontractorEmail,
      subject: "Hold Harmless Agreement - Signature Required",
      html,
    });

    if (!emailSent) {
      throw new Error(
        `Failed to send signature notification email to subcontractor: ${holdHarmless.subcontractorEmail}`,
      );
    }

    await this.prisma.holdHarmless.update({
      where: { id: holdHarmless.id },
      data: {
        subSignatureLinkSentAt: new Date(),
      },
    });
  }

  /**
   * Get hold harmless by ID (authenticated endpoint)
   */
  async getById(id: string) {
    const holdHarmless = await this.prisma.holdHarmless.findUnique({
      where: { id },
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
      throw new NotFoundException(`Hold harmless with ID ${id} not found`);
    }

    return holdHarmless;
  }

  /**
   * Process subcontractor signature (authenticated)
   */
  async processSubcontractorSignature(
    id: string,
    signatureData: { signatureUrl: string; signedBy: string },
  ) {
    const holdHarmless = await this.prisma.holdHarmless.findUnique({
      where: { id },
    });

    if (!holdHarmless) {
      throw new NotFoundException(`Hold harmless with ID ${id} not found`);
    }

    if (holdHarmless.status !== HoldHarmlessStatus.PENDING_SUB_SIGNATURE) {
      throw new BadRequestException(
        "Hold harmless is not in the correct state for subcontractor signature",
      );
    }

    // Update with sub signature and move to GC signature pending
    const updated = await this.prisma.holdHarmless.update({
      where: { id: holdHarmless.id },
      data: {
        subSignatureUrl: signatureData.signatureUrl,
        subSignedAt: new Date(),
        subSignedBy: signatureData.signedBy,
        status: HoldHarmlessStatus.PENDING_GC_SIGNATURE,
      },
    });

    // Update COI status
    await this.prisma.generatedCOI.update({
      where: { id: holdHarmless.coiId },
      data: {
        holdHarmlessStatus: HoldHarmlessStatus.PENDING_GC_SIGNATURE,
      },
    });

    // Notify GC via email (not sending link, they'll access via authenticated portal)
    await this.notifyGCToSign(updated);

    return updated;
  }

  /**
   * Notify GC to sign (without token link)
   */
  private async notifyGCToSign(holdHarmless: any) {
    const signatureUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/gc/hold-harmless/${holdHarmless.id}`;

    const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Hold Harmless Agreement - GC Signature Required</h2>
      <p>Hello,</p>
      <p>The subcontractor has signed the hold harmless agreement. Your signature is now required to complete the process.</p>
      <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <p>Please log in to the Compliant Platform to review and sign the hold harmless agreement:</p>
        <p style="margin: 20px 0;">
          <a href="${signatureUrl}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Log In and Sign Agreement</a>
        </p>
      </div>
      <p>If you have any questions, please contact support.</p>
      <p>Best regards,<br>Compliant Platform Team</p>
    </div>`;

    const emailSent = await this.emailService.sendEmail({
      to: holdHarmless.gcEmail,
      subject: "Hold Harmless Agreement - GC Signature Required",
      html,
    });

    if (!emailSent) {
      throw new Error(
        `Failed to send notification email to GC: ${holdHarmless.gcEmail}`,
      );
    }

    await this.prisma.holdHarmless.update({
      where: { id: holdHarmless.id },
      data: {
        gcSignatureLinkSentAt: new Date(),
      },
    });
  }

  /**
   * Process GC signature (authenticated)
   */
  async processGCSignature(
    id: string,
    signatureData: {
      signatureUrl: string;
      signedBy: string;
      finalDocUrl: string;
    },
  ) {
    const holdHarmless = await this.prisma.holdHarmless.findUnique({
      where: { id },
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
      throw new NotFoundException(`Hold harmless with ID ${id} not found`);
    }

    if (holdHarmless.status !== HoldHarmlessStatus.PENDING_GC_SIGNATURE) {
      throw new BadRequestException(
        "Hold harmless is not in the correct state for GC signature",
      );
    }

    // Update with GC signature and mark as completed
    const updated = await this.prisma.holdHarmless.update({
      where: { id: holdHarmless.id },
      data: {
        gcSignatureUrl: signatureData.signatureUrl,
        gcSignedAt: new Date(),
        gcSignedBy: signatureData.signedBy,
        finalDocUrl: signatureData.finalDocUrl,
        status: HoldHarmlessStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    // Update COI status
    await this.prisma.generatedCOI.update({
      where: { id: holdHarmless.coiId },
      data: {
        holdHarmlessStatus: HoldHarmlessStatus.COMPLETED,
        holdHarmlessDocumentUrl: signatureData.finalDocUrl,
      },
    });

    // Notify all parties (except broker)
    await this.notifyAllParties(updated);

    return updated;
  }

  /**
   * Notify all parties when hold harmless is complete
   */
  private async notifyAllParties(holdHarmless: any) {
    const recipients = [
      holdHarmless.subcontractorEmail,
      holdHarmless.gcEmail,
    ].filter(Boolean);

    // Send completion notification email to all parties
    const subSignedDate = holdHarmless.subSignedAt
      ? new Date(holdHarmless.subSignedAt).toLocaleString()
      : "N/A";
    const gcSignedDate = holdHarmless.gcSignedAt
      ? new Date(holdHarmless.gcSignedAt).toLocaleString()
      : "N/A";

    const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">✓ Hold Harmless Agreement Completed</h2>
      <p>Good news! The hold harmless agreement has been fully executed with signatures from all parties.</p>
      <div style="background-color: #ecfdf5; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981;">
        <h3 style="margin-top: 0;">Agreement Status:</h3>
        <p><strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">COMPLETED</span></p>
        <p><strong>Subcontractor Signed:</strong> ${subSignedDate}</p>
        <p><strong>GC Signed:</strong> ${gcSignedDate}</p>
      </div>
      <p>The final signed document is available in the Compliant Platform.</p>
      <p>Best regards,<br>Compliant Platform Team</p>
    </div>`;

    const emailSent = await this.emailService.sendEmail({
      to: recipients,
      subject: "✓ Hold Harmless Agreement Completed",
      html,
    });

    if (!emailSent) {
      throw new Error(
        `Failed to send completion notification email to recipients: ${recipients.join(", ")}`,
      );
    }

    // Only update notification records if email was successfully sent
    await this.prisma.holdHarmless.update({
      where: { id: holdHarmless.id },
      data: {
        notificationsSent: recipients,
        notifiedAt: new Date(),
      },
    });
  }

  /**
   * Get hold harmless by signature token (for signature page)
   */
  async getByToken(token: string) {
    const holdHarmless = await this.prisma.holdHarmless.findFirst({
      where: {
        OR: [{ subSignatureToken: token }, { gcSignatureToken: token }],
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

    if (!holdHarmless) {
      throw new NotFoundException("Invalid signature token");
    }

    // Determine which party should sign
    const signingParty =
      token === holdHarmless.subSignatureToken ? "SUBCONTRACTOR" : "GC";

    return {
      ...holdHarmless,
      signingParty,
      canSign: this.canSign(holdHarmless, signingParty),
    };
  }

  /**
   * Check if a party can sign based on current status
   */
  private canSign(holdHarmless: any, party: "SUBCONTRACTOR" | "GC"): boolean {
    if (party === "SUBCONTRACTOR") {
      return holdHarmless.status === HoldHarmlessStatus.PENDING_SUB_SIGNATURE;
    }

    if (party === "GC") {
      return holdHarmless.status === HoldHarmlessStatus.PENDING_GC_SIGNATURE;
    }

    return false;
  }

  /**
   * Get hold harmless for a COI
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
      throw new NotFoundException(
        `Hold harmless agreement for COI ${coiId} not found`,
      );
    }

    return holdHarmless;
  }

  /**
   * Get all hold harmless agreements with filtering
   */
  async getAllHoldHarmless(filters?: {
    status?: HoldHarmlessStatus;
    pendingSignature?: boolean;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.pendingSignature) {
      where.status = {
        in: [
          HoldHarmlessStatus.PENDING_SUB_SIGNATURE,
          HoldHarmlessStatus.PENDING_GC_SIGNATURE,
        ],
      };
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
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Resend signature link
   */
  async resendSignatureLink(holdHarmlessId: string, party: "SUB" | "GC") {
    const holdHarmless = await this.prisma.holdHarmless.findUnique({
      where: { id: holdHarmlessId },
    });

    if (!holdHarmless) {
      throw new NotFoundException("Hold harmless not found");
    }

    if (party === "SUB") {
      if (holdHarmless.status !== HoldHarmlessStatus.PENDING_SUB_SIGNATURE) {
        throw new BadRequestException("Subcontractor signature is not pending");
      }
      await this.sendSignatureLinkToSubcontractor(holdHarmless);
    } else {
      if (holdHarmless.status !== HoldHarmlessStatus.PENDING_GC_SIGNATURE) {
        throw new BadRequestException("GC signature is not pending");
      }
      await this.notifyGCToSign(holdHarmless);
    }

    return { message: `Signature notification resent to ${party}` };
  }

  /**
   * Get hold harmless statistics
   */
  async getStatistics() {
    const total = await this.prisma.holdHarmless.count();
    const pendingSubSignature = await this.prisma.holdHarmless.count({
      where: { status: HoldHarmlessStatus.PENDING_SUB_SIGNATURE },
    });
    const pendingGCSignature = await this.prisma.holdHarmless.count({
      where: { status: HoldHarmlessStatus.PENDING_GC_SIGNATURE },
    });
    const completed = await this.prisma.holdHarmless.count({
      where: { status: HoldHarmlessStatus.COMPLETED },
    });
    const rejected = await this.prisma.holdHarmless.count({
      where: { status: HoldHarmlessStatus.REJECTED },
    });

    return {
      total,
      pendingSubSignature,
      pendingGCSignature,
      completed,
      rejected,
      pendingTotal: pendingSubSignature + pendingGCSignature,
    };
  }
}
