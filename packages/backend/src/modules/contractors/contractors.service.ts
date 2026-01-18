import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CacheService } from '../cache/cache.service';
import { CreateContractorDto } from './dto/create-contractor.dto';
import { UpdateContractorDto } from './dto/update-contractor.dto';
import { InsuranceStatus } from '@compliant/shared';
import { Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

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

  /**
   * Generate a secure temporary password
   */
  private generateTempPassword(): string {
    // Generate a secure random password: 12 characters with uppercase, lowercase, numbers, special chars
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    const bytes = randomBytes(12);
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars[bytes[i] % chars.length];
    }
    return password;
  }

  /**
   * Auto-create user account for contractor/subcontractor
   * PRODUCTION: This happens automatically when contractor is added
   */
  private async autoCreateUserAccount(
    email: string,
    name: string,
    contractorType: string,
  ): Promise<{ email: string; tempPassword: string; created: boolean }> {
    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        console.log(`User account already exists for ${email}`);
        return { email, tempPassword: '', created: false };
      }

      // Generate temporary password
      const tempPassword = this.generateTempPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Determine role based on contractor type
      const role: UserRole = contractorType === 'SUBCONTRACTOR' 
        ? UserRole.SUBCONTRACTOR 
        : UserRole.CONTRACTOR;

      // Extract first/last name from full name
      const nameParts = name.split(' ');
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || 'Account';

      // Create user account
      await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role,
          isActive: true,
        },
      });

      console.log(`✓ Auto-created user account for ${email} with role ${role}`);
      
      // TODO: Send welcome email with temporary password
      // await this.emailService.sendWelcomeEmail(email, firstName, tempPassword);

      return { email, tempPassword, created: true };
    } catch (error) {
      console.error(`Failed to auto-create user account for ${email}:`, error);
      // Don't throw - contractor creation should succeed even if user creation fails
      return { email, tempPassword: '', created: false };
    }
  }

  async create(createContractorDto: CreateContractorDto, userId: string) {
    // Create contractor record
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

    // PRODUCTION: Automatically create user account
    const userCreationResult = await this.autoCreateUserAccount(
      contractor.email,
      contractor.name,
      contractor.contractorType,
    );

    // Invalidate list cache when creating a new contractor
    await this.cacheService.delPattern(`${this.CACHE_PREFIX}list:*`);

    return {
      ...contractor,
      userAccount: userCreationResult,
    };
  }

  /**
   * Find all contractors with role-based filtering and search
   * PRODUCTION: Data isolation + search functionality
   * - SUPER_ADMIN: sees everything
   * - ADMIN: sees contractors assigned to them
   * - CONTRACTOR/GC: sees only themselves + can search their subs
   * - SUBCONTRACTOR: sees only themselves
   * - BROKER: sees contractors they serve
   * 
   * Search parameters:
   * - search: search by name, email, company
   * - trade: filter by trade type
   * - insuranceStatus: filter by insurance status
   * - status: filter by contractor status
   */
  async findAll(
    page = 1, 
    limit = 10, 
    status?: string, 
    user?: any,
    search?: string,
    trade?: string,
    insuranceStatus?: string,
  ) {
    // Build where clause based on user role
    const where: any = status ? { status: status as any } : {};
    
    if (user) {
      switch (user.role) {
        case 'SUPER_ADMIN':
          // Super admin sees everything - no filter
          break;
          
        case 'ADMIN':
          // Admin sees only contractors assigned to them
          if (user.email) {
            where.assignedAdminEmail = user.email;
          }
          break;
          
        case 'CONTRACTOR':
          // GC/Contractor sees only their own record OR subcontractors they created
          if (user.id) {
            where.OR = [
              { email: user.email }, // Their own record
              { createdById: user.id }, // Subs they created
            ];
          }
          break;
          
        case 'SUBCONTRACTOR':
          // Subcontractor sees only their own record
          where.email = user.email;
          break;
          
        case 'BROKER':
          // Broker sees contractors they serve (where broker email matches)
          where.OR = [
            { brokerEmail: user.email },
            { brokerGlEmail: user.email },
            { brokerAutoEmail: user.email },
            { brokerUmbrellaEmail: user.email },
            { brokerWcEmail: user.email },
          ];
          break;
          
        default:
          // Default: see nothing
          where.id = 'non-existent-id';
      }
    }

    // Add search filter
    if (search) {
      const searchCondition = {
        OR: [
          { name: { contains: search, mode: 'insensitive' as any } },
          { email: { contains: search, mode: 'insensitive' as any } },
          { company: { contains: search, mode: 'insensitive' as any } },
        ],
      };
      
      if (where.OR) {
        // If there's already an OR condition (like for CONTRACTOR), combine them
        where.AND = [
          { OR: where.OR },
          searchCondition,
        ];
        delete where.OR;
      } else {
        where.OR = searchCondition.OR;
      }
    }

    // Add trade filter
    if (trade) {
      where.trades = {
        has: trade,
      };
    }

    // Add insurance status filter
    if (insuranceStatus) {
      where.insuranceStatus = insuranceStatus;
    }

    // Cache key includes all filter parameters
    const cacheKey = `${this.CACHE_PREFIX}list:${page}:${limit}:${status || 'all'}:${user?.role}:${user?.email}:${search || ''}:${trade || ''}:${insuranceStatus || ''}`;
    
    // Try to get from cache first
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const skip = (page - 1) * limit;

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
}
