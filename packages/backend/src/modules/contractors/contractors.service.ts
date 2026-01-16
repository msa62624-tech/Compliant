import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateContractorDto } from './dto/create-contractor.dto';
import { UpdateContractorDto } from './dto/update-contractor.dto';
import { InsuranceStatus, ContractorStatus } from '@compliant/shared';

@Injectable()
export class ContractorsService {
  constructor(private prisma: PrismaService) {}

  async create(createContractorDto: CreateContractorDto, userId: string) {
    const contractor = await this.prisma.contractor.create({
      data: {
        ...createContractorDto,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return contractor;
  }

  async findAll(page = 1, limit = 10, status?: string) {
    const skip = (page - 1) * limit;
    
    // Validate status against enum if provided
    const where: any = {};
    if (status && Object.values(ContractorStatus).includes(status as ContractorStatus)) {
      where.status = status as ContractorStatus;
    }

    const [contractors, total] = await Promise.all([
      this.prisma.contractor.findMany({
        where,
        skip,
        take: limit,
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          insuranceDocuments: {
            select: {
              id: true,
              type: true,
              status: true,
              expirationDate: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.contractor.count({ where }),
    ]);

    return {
      data: contractors,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const contractor = await this.prisma.contractor.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        insuranceDocuments: true,
        projectContractors: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!contractor) {
      throw new NotFoundException(`Contractor with ID ${id} not found`);
    }

    return contractor;
  }

  async update(id: string, updateContractorDto: UpdateContractorDto) {
    try {
      const contractor = await this.prisma.contractor.update({
        where: { id },
        data: updateContractorDto,
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return contractor;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Contractor with ID ${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.contractor.delete({
        where: { id },
      });

      return { message: 'Contractor deleted successfully' };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Contractor with ID ${id} not found`);
      }
      throw error;
    }
  }

  async getInsuranceStatus(id: string) {
    const contractor = await this.findOne(id);
    
    const insuranceDocs = contractor.insuranceDocuments;
    const now = new Date();

    const hasExpired = insuranceDocs.some(doc => new Date(doc.expirationDate) < now);
    const hasNonCompliant = insuranceDocs.some(doc => doc.status === 'REJECTED');
    const hasPending = insuranceDocs.some(doc => doc.status === 'PENDING');

    let insuranceStatus = InsuranceStatus.COMPLIANT;
    if (hasExpired) {
      insuranceStatus = InsuranceStatus.EXPIRED;
    } else if (hasNonCompliant) {
      insuranceStatus = InsuranceStatus.NON_COMPLIANT;
    } else if (hasPending || insuranceDocs.length === 0) {
      insuranceStatus = InsuranceStatus.PENDING;
    }

    // Update contractor insurance status if changed
    if (insuranceStatus !== contractor.insuranceStatus) {
      await this.prisma.contractor.update({
        where: { id },
        data: { insuranceStatus },
      });
    }

    return {
      status: insuranceStatus,
      documents: insuranceDocs,
    };
  }
}
