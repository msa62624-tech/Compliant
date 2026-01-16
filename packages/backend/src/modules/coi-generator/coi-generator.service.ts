import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../config/prisma.service';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';

@Injectable()
export class COIGeneratorService {
  private readonly logger = new Logger(COIGeneratorService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  private generateCertificateNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = randomBytes(4).toString('hex').toUpperCase();
    return `COI-${timestamp}-${random}`;
  }

  async generateCOI(data: any, generatedBy: string): Promise<any> {
    try {
      const certificateNumber = this.generateCertificateNumber();

      // Create COI record in database with PENDING_APPROVAL status
      const coi = await this.prisma.generatedCOI.create({
        data: {
          contractorId: data.contractorId,
          projectId: data.projectId,
          certificateNumber,
          producer: data.producer,
          insured: data.insured,
          address: data.address,
          coverages: data.coverages,
          effectiveDate: new Date(data.effectiveDate),
          expirationDate: new Date(data.expirationDate),
          certificateHolder: data.certificateHolder,
          description: data.description,
          generatedBy,
          status: 'PENDING_APPROVAL',
        },
        include: {
          contractor: true,
        },
      });

      this.logger.log(`COI generated (pending approval): ${certificateNumber}`);

      return coi;
    } catch (error) {
      this.logger.error(`Failed to generate COI: ${error.message}`);
      throw error;
    }
  }

  async approveCOI(id: string, approvalId: string): Promise<any> {
    try {
      // Update COI status to ISSUED and link approval
      const coi = await this.prisma.generatedCOI.update({
        where: { id },
        data: {
          status: 'ISSUED',
          approvalId,
        },
        include: {
          contractor: true,
          approval: true,
        },
      });

      // Generate PDF now that it's approved
      const pdfPath = await this.generatePDF(coi);

      this.logger.log(`COI approved and issued: ${coi.certificateNumber}`);

      return {
        ...coi,
        pdfPath,
      };
    } catch (error) {
      this.logger.error(`Failed to approve COI: ${error.message}`);
      throw error;
    }
  }

  async rejectCOI(id: string, reason: string): Promise<any> {
    return this.prisma.generatedCOI.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });
  }

  private async generatePDF(coi: any): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const uploadsDir = path.join(process.cwd(), 'uploads', 'cois');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filename = `${coi.certificateNumber}.pdf`;
        const filepath = path.join(uploadsDir, filename);

        const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
        const stream = fs.createWriteStream(filepath);

        doc.pipe(stream);

        // Header
        doc.fontSize(20).text('CERTIFICATE OF LIABILITY INSURANCE', { align: 'center' });
        doc.moveDown();

        // Certificate Number
        doc.fontSize(10).text(`Certificate Number: ${coi.certificateNumber}`, { align: 'right' });
        doc.text(`Date Issued: ${new Date().toLocaleDateString()}`, { align: 'right' });
        doc.moveDown();

        // Producer Information
        doc.fontSize(12).text('PRODUCER', { underline: true });
        doc.fontSize(10).text(coi.producer);
        doc.moveDown();

        // Insured Information
        doc.fontSize(12).text('INSURED', { underline: true });
        doc.fontSize(10).text(coi.insured);
        doc.text(coi.address);
        doc.moveDown();

        // Coverages
        doc.fontSize(12).text('COVERAGES', { underline: true });
        doc.fontSize(10);

        if (coi.coverages.generalLiability) {
          doc.text('GENERAL LIABILITY:');
          doc.text(`  Per Occurrence: $${coi.coverages.generalLiability.perOccurrence?.toLocaleString() || 'N/A'}`);
          doc.text(`  General Aggregate: $${coi.coverages.generalLiability.aggregate?.toLocaleString() || 'N/A'}`);
        }

        if (coi.coverages.workersCompensation) {
          doc.text('WORKERS COMPENSATION:');
          doc.text(`  Each Accident: $${coi.coverages.workersCompensation.eachAccident?.toLocaleString() || 'N/A'}`);
          doc.text(`  Disease - Policy Limit: $${coi.coverages.workersCompensation.policyLimit?.toLocaleString() || 'N/A'}`);
        }

        if (coi.coverages.auto) {
          doc.text('AUTOMOBILE LIABILITY:');
          doc.text(`  Combined Single Limit: $${coi.coverages.auto.combinedSingleLimit?.toLocaleString() || 'N/A'}`);
        }

        doc.moveDown();

        // Policy Period
        doc.fontSize(12).text('POLICY PERIOD', { underline: true });
        doc.fontSize(10).text(`Effective: ${new Date(coi.effectiveDate).toLocaleDateString()}`);
        doc.text(`Expiration: ${new Date(coi.expirationDate).toLocaleDateString()}`);
        doc.moveDown();

        // Certificate Holder
        doc.fontSize(12).text('CERTIFICATE HOLDER', { underline: true });
        doc.fontSize(10).text(coi.certificateHolder);
        doc.moveDown();

        // Description
        if (coi.description) {
          doc.fontSize(12).text('DESCRIPTION OF OPERATIONS', { underline: true });
          doc.fontSize(10).text(coi.description);
        }

        // Footer
        doc.moveDown(2);
        doc.fontSize(8).text('This certificate is issued as a matter of information only and confers no rights upon the certificate holder.', { align: 'center' });

        doc.end();

        stream.on('finish', () => {
          this.logger.log(`PDF generated: ${filepath}`);
          resolve(filepath);
        });

        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  async getCOIs(contractorId?: string, status?: string): Promise<any[]> {
    const where: any = {};

    if (contractorId) {
      where.contractorId = contractorId;
    }

    if (status) {
      where.status = status;
    }

    return this.prisma.generatedCOI.findMany({
      where,
      include: {
        contractor: true,
      },
      orderBy: { generatedAt: 'desc' },
    });
  }

  async getCOI(id: string): Promise<any> {
    return this.prisma.generatedCOI.findUnique({
      where: { id },
      include: {
        contractor: true,
      },
    });
  }

  async updateCOIStatus(id: string, status: string): Promise<any> {
    return this.prisma.generatedCOI.update({
      where: { id },
      data: { status: status as any },
    });
  }

  async getExpiringCOIs(daysAhead: number = 30): Promise<any[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return this.prisma.generatedCOI.findMany({
      where: {
        status: 'ISSUED',
        expirationDate: {
          lte: futureDate,
          gte: new Date(),
        },
      },
      include: {
        contractor: true,
      },
      orderBy: { expirationDate: 'asc' },
    });
  }
}
