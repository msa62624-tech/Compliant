import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CacheService } from '../cache/cache.service';
import { CreateContractorDto } from './dto/create-contractor.dto';
import { UpdateContractorDto } from './dto/update-contractor.dto';
import { InsuranceStatus } from '@compliant/shared';
import { Prisma } from '@prisma/client';

// Define the return type for findOne including all relations
type ContractorWithRelations = Prisma.ContractorGetPayload<{
  include: {
    createdBy: {
      select: {
        id: true;
        email: true;
        firstName: true;
        lastName: true;
      };
    };
    insuranceDocuments: true;
    projectContractors: {
      include: {
        project: {
          select: {
            id: true;
            name: true;
            status: true;
          };
        };
      };
    };
  };
}>;

@Injectable()
export class ContractorsService {
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly CACHE_PREFIX = 'contractor:';

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

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

    // Invalidate list cache when creating a new contractor
    await this.cacheService.delPattern(`${this.CACHE_PREFIX}list:*`);

    return contractor;
  }

  async findAll(page = 1, limit = 10, status?: string) {
    const cacheKey = `${this.CACHE_PREFIX}list:${page}:${limit}:${status || 'all'}`;
    
    // Try to get from cache first
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const skip = (page - 1) * limit;
    const where = status ? { status: status as any } : {};

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

    const result = {
      data: contractors,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    // Cache the result
    await this.cacheService.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  async findOne(id: string): Promise<ContractorWithRelations> {
    const cacheKey = `${this.CACHE_PREFIX}${id}`;
    
    // Try to get from cache first
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached as ContractorWithRelations;
    }

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

    // Cache the result
    await this.cacheService.set(cacheKey, contractor, this.CACHE_TTL);

    return contractor;
  }

  async update(id: string, updateContractorDto: UpdateContractorDto) {
    await this.findOne(id);

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

    // Invalidate cache for this contractor and list cache
    await this.cacheService.del(`${this.CACHE_PREFIX}${id}`);
    await this.cacheService.delPattern(`${this.CACHE_PREFIX}list:*`);

    return contractor;
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.contractor.delete({
      where: { id },
    });

    // Invalidate cache for this contractor and list cache
    await this.cacheService.del(`${this.CACHE_PREFIX}${id}`);
    await this.cacheService.delPattern(`${this.CACHE_PREFIX}list:*`);

    return { message: 'Contractor deleted successfully' };
  }

  async getInsuranceStatus(id: string) {
    const contractor = await this.findOne(id);
    
    // Now we can safely access insuranceDocuments without type assertion
    const insuranceDocs = contractor.insuranceDocuments || [];
    const now = new Date();

    const hasExpired = insuranceDocs.some((doc) => new Date(doc.expirationDate) < now);
    const hasNonCompliant = insuranceDocs.some((doc) => doc.status === 'REJECTED');
    const hasPending = insuranceDocs.some((doc) => doc.status === 'PENDING');

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

  /**
   * Search contractors by name, company, or email
   */
  async searchContractors(query: string, limit = 10) {
    const contractors = await this.prisma.contractor.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { company: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
        contractorType: 'SUBCONTRACTOR', // Only search subcontractors
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        trades: true,
        insuranceStatus: true,
        contractorType: true,
      },
      take: limit,
      orderBy: {
        name: 'asc',
      },
    });

    return { contractors };
  }

  /**
   * Search brokers from all contractors
   * Extracts broker information from contractors who have broker details
   */
  async searchBrokers(query: string, policyType: string = 'GLOBAL', limit = 10) {
    const contractors = await this.prisma.contractor.findMany({
      where: {
        OR: [
          // Global broker search
          { brokerName: { contains: query, mode: 'insensitive' } },
          { brokerEmail: { contains: query, mode: 'insensitive' } },
          { brokerCompany: { contains: query, mode: 'insensitive' } },
          // Per-policy broker search
          { brokerGlName: { contains: query, mode: 'insensitive' } },
          { brokerGlEmail: { contains: query, mode: 'insensitive' } },
          { brokerAutoName: { contains: query, mode: 'insensitive' } },
          { brokerAutoEmail: { contains: query, mode: 'insensitive' } },
          { brokerUmbrellaName: { contains: query, mode: 'insensitive' } },
          { brokerUmbrellaEmail: { contains: query, mode: 'insensitive' } },
          { brokerWcName: { contains: query, mode: 'insensitive' } },
          { brokerWcEmail: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        brokerType: true,
        brokerName: true,
        brokerEmail: true,
        brokerPhone: true,
        brokerCompany: true,
        brokerGlName: true,
        brokerGlEmail: true,
        brokerGlPhone: true,
        brokerAutoName: true,
        brokerAutoEmail: true,
        brokerAutoPhone: true,
        brokerUmbrellaName: true,
        brokerUmbrellaEmail: true,
        brokerUmbrellaPhone: true,
        brokerWcName: true,
        brokerWcEmail: true,
        brokerWcPhone: true,
      },
      take: limit * 3, // Get more to deduplicate
    });

    // Extract unique brokers
    const brokersMap = new Map();

    contractors.forEach((contractor) => {
      // Add global broker if exists
      if (contractor.brokerEmail && (policyType === 'GLOBAL' || !policyType)) {
        const key = contractor.brokerEmail.toLowerCase();
        if (!brokersMap.has(key)) {
          brokersMap.set(key, {
            id: `${contractor.id}-global`,
            name: contractor.brokerName,
            email: contractor.brokerEmail,
            phone: contractor.brokerPhone,
            company: contractor.brokerCompany,
            brokerType: contractor.brokerType || 'GLOBAL',
          });
        }
      }

      // Add per-policy brokers if requested
      if (policyType === 'GL' || policyType === 'PER_POLICY') {
        if (contractor.brokerGlEmail) {
          const key = contractor.brokerGlEmail.toLowerCase();
          if (!brokersMap.has(key)) {
            brokersMap.set(key, {
              id: `${contractor.id}-gl`,
              name: contractor.brokerGlName,
              email: contractor.brokerGlEmail,
              phone: contractor.brokerGlPhone,
              company: contractor.brokerCompany,
              brokerType: 'PER_POLICY',
            });
          }
        }
      }

      if (policyType === 'AUTO' || policyType === 'PER_POLICY') {
        if (contractor.brokerAutoEmail) {
          const key = contractor.brokerAutoEmail.toLowerCase();
          if (!brokersMap.has(key)) {
            brokersMap.set(key, {
              id: `${contractor.id}-auto`,
              name: contractor.brokerAutoName,
              email: contractor.brokerAutoEmail,
              phone: contractor.brokerAutoPhone,
              company: contractor.brokerCompany,
              brokerType: 'PER_POLICY',
            });
          }
        }
      }

      if (policyType === 'UMBRELLA' || policyType === 'PER_POLICY') {
        if (contractor.brokerUmbrellaEmail) {
          const key = contractor.brokerUmbrellaEmail.toLowerCase();
          if (!brokersMap.has(key)) {
            brokersMap.set(key, {
              id: `${contractor.id}-umbrella`,
              name: contractor.brokerUmbrellaName,
              email: contractor.brokerUmbrellaEmail,
              phone: contractor.brokerUmbrellaPhone,
              company: contractor.brokerCompany,
              brokerType: 'PER_POLICY',
            });
          }
        }
      }

      if (policyType === 'WC' || policyType === 'PER_POLICY') {
        if (contractor.brokerWcEmail) {
          const key = contractor.brokerWcEmail.toLowerCase();
          if (!brokersMap.has(key)) {
            brokersMap.set(key, {
              id: `${contractor.id}-wc`,
              name: contractor.brokerWcName,
              email: contractor.brokerWcEmail,
              phone: contractor.brokerWcPhone,
              company: contractor.brokerCompany,
              brokerType: 'PER_POLICY',
            });
          }
        }
      }
    });

    // Convert map to array and limit results
    const brokers = Array.from(brokersMap.values())
      .filter(broker => broker.name && broker.email) // Only valid brokers
      .slice(0, limit);

    return { brokers };
  }
}
