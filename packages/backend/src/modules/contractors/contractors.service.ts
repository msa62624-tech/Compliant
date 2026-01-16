import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CacheService } from '../cache/cache.service';
import { CreateContractorDto } from './dto/create-contractor.dto';
import { UpdateContractorDto } from './dto/update-contractor.dto';
import { InsuranceStatus } from '@compliant/shared';

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

  async findOne(id: string) {
    const cacheKey = `${this.CACHE_PREFIX}${id}`;
    
    // Try to get from cache first
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
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
    
    // Type assertion since we know findOne returns a contractor with insuranceDocuments
    const insuranceDocs = (contractor as any).insuranceDocuments || [];
    const now = new Date();

    const hasExpired = insuranceDocs.some((doc: any) => new Date(doc.expirationDate) < now);
    const hasNonCompliant = insuranceDocs.some((doc: any) => doc.status === 'REJECTED');
    const hasPending = insuranceDocs.some((doc: any) => doc.status === 'PENDING');

    let insuranceStatus = InsuranceStatus.COMPLIANT;
    if (hasExpired) {
      insuranceStatus = InsuranceStatus.EXPIRED;
    } else if (hasNonCompliant) {
      insuranceStatus = InsuranceStatus.NON_COMPLIANT;
    } else if (hasPending || insuranceDocs.length === 0) {
      insuranceStatus = InsuranceStatus.PENDING;
    }

    // Update contractor insurance status if changed
    if (insuranceStatus !== (contractor as any).insuranceStatus) {
      await this.prisma.contractor.update({
        where: { id },
        data: { insuranceStatus: insuranceStatus as any },
      });
    }

    return {
      status: insuranceStatus,
      documents: insuranceDocs,
    };
  }
}
