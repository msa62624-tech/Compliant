import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";
import { CacheService } from "../cache/cache.service";
import { EmailService } from "../email/email.service";
import { CreateContractorDto } from "./dto/create-contractor.dto";
import { UpdateContractorDto } from "./dto/update-contractor.dto";
import { InsuranceStatus } from "@compliant/shared";
import { Prisma, UserRole, User } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { randomBytes } from "crypto";

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
  private readonly logger = new Logger(ContractorsService.name);
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly CACHE_PREFIX = "contractor:";

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private emailService: EmailService,
  ) {}

  /**
   * Generate a secure permanent password
   * PRODUCTION: This password is permanent (not temporary)
   * Users can change it later if needed via password reset
   */
  private generateSecurePassword(): string {
    // Generate a secure random password: 12 characters with uppercase, lowercase, numbers, special chars
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
   * Auto-create user account for contractor/subcontractor
   * PRODUCTION: This happens automatically when contractor is added
   * Password is PERMANENT - user receives it once and keeps using it
   * Same credentials work for all links/emails sent to this user
   */
  private async autoCreateUserAccount(
    email: string,
    name: string,
    contractorType: string,
  ): Promise<{ email: string; password: string; created: boolean }> {
    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        this.logger.log(
          `User account already exists for ${email} - using existing credentials`,
        );
        return { email, password: "", created: false };
      }

      // Generate PERMANENT password
      const password = this.generateSecurePassword();
      const hashedPassword = await bcrypt.hash(password, 10);

      // Determine role based on contractor type
      const role: UserRole =
        contractorType === "SUBCONTRACTOR"
          ? UserRole.SUBCONTRACTOR
          : UserRole.CONTRACTOR;

      // Extract first/last name from full name
      const nameParts = name.split(" ");
      const firstName = nameParts[0] || "User";
      const lastName = nameParts.slice(1).join(" ") || "Account";

      // Create user account with PERMANENT password
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

      this.logger.log(
        `✓ Auto-created user account for ${email} with role ${role}`,
      );
      this.logger.log(`  Email: ${email}`);
      this.logger.log(`  Password: ${password} (PERMANENT - save this!)`);
      this.logger.log(`  Note: User can change password later if forgotten`);

      // Send welcome email with permanent credentials
      try {
        await this.emailService.sendContractorWelcomeEmail(
          email,
          name,
          password,
          contractorType,
        );
        this.logger.log(`✓ Welcome email sent to ${email}`);
      } catch (emailError) {
        this.logger.error(
          `Failed to send welcome email to ${email}:`,
          emailError,
        );
        // Don't fail contractor creation if email fails
      }

      return { email, password, created: true };
    } catch (error) {
      this.logger.error(
        `Failed to auto-create user account for ${email}:`,
        error,
      );
      // Don't throw - contractor creation should succeed even if user creation fails
      return { email, password: "", created: false };
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
   * PRODUCTION: Data isolation + PRIVACY + search functionality
   * - SUPER_ADMIN: sees everything
   * - ADMIN: sees contractors assigned to them
   * - CONTRACTOR/GC: sees only themselves + can search their subs
   * - SUBCONTRACTOR: sees ONLY themselves (PRIVACY: NOT other subs)
   * - BROKER: sees ONLY subs that entered their broker info (PRIVACY: NOT all subs)
   *
   * PRIVACY RULES:
   * ✓ Subs CANNOT see other subs on the same project
   * ✓ Brokers can ONLY see subs that listed them as broker
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
    user?: User,
    search?: string,
    trade?: string,
    insuranceStatus?: string,
  ) {
    // Build where clause based on user role
    const where: Prisma.ContractorWhereInput = status
      ? { status: status as Prisma.EnumContractorStatusFilter }
      : {};

    if (user) {
      switch (user.role) {
        case "SUPER_ADMIN":
          // Super admin sees everything - no filter
          break;

        case "ADMIN":
          // Admin sees only contractors assigned to them
          if (user.email) {
            where.assignedAdminEmail = user.email;
          }
          break;

        case "CONTRACTOR":
          // GC/Contractor sees only their own record OR subcontractors they created
          if (user.id) {
            where.OR = [
              { email: user.email }, // Their own record
              { createdById: user.id }, // Subs they created
            ];
          }
          break;

        case "SUBCONTRACTOR":
          // PRIVACY: Subcontractor sees ONLY their own record
          // CANNOT see other subs on the same project
          where.email = user.email;
          break;

        case "BROKER":
          // PRIVACY: Broker sees ONLY contractors that entered their broker info
          // where broker email matches ANY broker field (global or per-policy)
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
          where.id = "non-existent-id";
      }
    }

    // Add search filter
    if (search) {
      const searchCondition = {
        OR: [
          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { company: { contains: search, mode: Prisma.QueryMode.insensitive } },
        ],
      };

      if (where.OR) {
        // If there's already an OR condition (like for CONTRACTOR), combine them
        where.AND = [{ OR: where.OR }, searchCondition];
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
      where.insuranceStatus =
        insuranceStatus as Prisma.EnumInsuranceStatusFilter;
    }

    // Cache key includes all filter parameters
    const cacheKey = `${this.CACHE_PREFIX}list:${page}:${limit}:${status || "all"}:${user?.role}:${user?.email}:${search || ""}:${trade || ""}:${insuranceStatus || ""}`;

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
          createdAt: "desc",
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

    return { message: "Contractor deleted successfully" };
  }

  async getInsuranceStatus(id: string) {
    const contractor = await this.findOne(id);

    // Now we can safely access insuranceDocuments without type assertion
    const insuranceDocs = contractor.insuranceDocuments || [];
    const now = new Date();

    const hasExpired = insuranceDocs.some(
      (doc) => new Date(doc.expirationDate) < now,
    );
    const hasNonCompliant = insuranceDocs.some(
      (doc) => doc.status === "REJECTED",
    );
    const hasPending = insuranceDocs.some((doc) => doc.status === "PENDING");

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
          { name: { contains: query, mode: "insensitive" } },
          { company: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
        contractorType: "SUBCONTRACTOR", // Only search subcontractors
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
        name: "asc",
      },
    });

    return { contractors };
  }

  /**
   * Search brokers from all contractors
   * Extracts broker information from contractors who have broker details
   */
  async searchBrokers(
    query: string,
    policyType: string = "GLOBAL",
    limit = 10,
  ) {
    const contractors = await this.prisma.contractor.findMany({
      where: {
        OR: [
          // Global broker search
          { brokerName: { contains: query, mode: "insensitive" } },
          { brokerEmail: { contains: query, mode: "insensitive" } },
          { brokerCompany: { contains: query, mode: "insensitive" } },
          // Per-policy broker search
          { brokerGlName: { contains: query, mode: "insensitive" } },
          { brokerGlEmail: { contains: query, mode: "insensitive" } },
          { brokerAutoName: { contains: query, mode: "insensitive" } },
          { brokerAutoEmail: { contains: query, mode: "insensitive" } },
          { brokerUmbrellaName: { contains: query, mode: "insensitive" } },
          { brokerUmbrellaEmail: { contains: query, mode: "insensitive" } },
          { brokerWcName: { contains: query, mode: "insensitive" } },
          { brokerWcEmail: { contains: query, mode: "insensitive" } },
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
      if (contractor.brokerEmail && (policyType === "GLOBAL" || !policyType)) {
        const key = contractor.brokerEmail.toLowerCase();
        if (!brokersMap.has(key)) {
          brokersMap.set(key, {
            id: `${contractor.id}-global`,
            name: contractor.brokerName,
            email: contractor.brokerEmail,
            phone: contractor.brokerPhone,
            company: contractor.brokerCompany,
            brokerType: contractor.brokerType || "GLOBAL",
          });
        }
      }

      // Add per-policy brokers if requested
      if (policyType === "GL" || policyType === "PER_POLICY") {
        if (contractor.brokerGlEmail) {
          const key = contractor.brokerGlEmail.toLowerCase();
          if (!brokersMap.has(key)) {
            brokersMap.set(key, {
              id: `${contractor.id}-gl`,
              name: contractor.brokerGlName,
              email: contractor.brokerGlEmail,
              phone: contractor.brokerGlPhone,
              company: contractor.brokerCompany,
              brokerType: "PER_POLICY",
            });
          }
        }
      }

      if (policyType === "AUTO" || policyType === "PER_POLICY") {
        if (contractor.brokerAutoEmail) {
          const key = contractor.brokerAutoEmail.toLowerCase();
          if (!brokersMap.has(key)) {
            brokersMap.set(key, {
              id: `${contractor.id}-auto`,
              name: contractor.brokerAutoName,
              email: contractor.brokerAutoEmail,
              phone: contractor.brokerAutoPhone,
              company: contractor.brokerCompany,
              brokerType: "PER_POLICY",
            });
          }
        }
      }

      if (policyType === "UMBRELLA" || policyType === "PER_POLICY") {
        if (contractor.brokerUmbrellaEmail) {
          const key = contractor.brokerUmbrellaEmail.toLowerCase();
          if (!brokersMap.has(key)) {
            brokersMap.set(key, {
              id: `${contractor.id}-umbrella`,
              name: contractor.brokerUmbrellaName,
              email: contractor.brokerUmbrellaEmail,
              phone: contractor.brokerUmbrellaPhone,
              company: contractor.brokerCompany,
              brokerType: "PER_POLICY",
            });
          }
        }
      }

      if (policyType === "WC" || policyType === "PER_POLICY") {
        if (contractor.brokerWcEmail) {
          const key = contractor.brokerWcEmail.toLowerCase();
          if (!brokersMap.has(key)) {
            brokersMap.set(key, {
              id: `${contractor.id}-wc`,
              name: contractor.brokerWcName,
              email: contractor.brokerWcEmail,
              phone: contractor.brokerWcPhone,
              company: contractor.brokerCompany,
              brokerType: "PER_POLICY",
            });
          }
        }
      }
    });

    // Convert map to array and limit results
    const brokers = Array.from(brokersMap.values())
      .filter((broker) => broker.name && broker.email) // Only valid brokers
      .slice(0, limit);

    return { brokers };
  }
}
