import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";
import { User, UserRole } from "@prisma/client";

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalContractors: number;
  compliantContractors: number;
  pendingCOIs: number;
  expiringSoon: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentProjects: Project[];
  recentContractors: Contractor[];
  recentCOIs: GeneratedCOI[];
}

export interface Project {
  id: string;
  name: string;
  status: string;
  startDate: Date;
  address: string | null;
  createdAt: Date;
}

export interface Contractor {
  id: string;
  name: string;
  email: string;
  company: string | null;
  contractorType: string;
  status: string;
  insuranceStatus: string;
  trades: string[];
  createdAt: Date;
}

export interface GeneratedCOI {
  id: string;
  projectName: string | null;
  subcontractorName: string | null;
  status: string;
  createdAt: Date;
  glExpirationDate: Date | null;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get dashboard data for the current user based on their role
   */
  async getDashboardData(user: User): Promise<DashboardData> {
    this.logger.log(
      `Getting dashboard data for user ${user.email} with role ${user.role}`,
    );

    // Build filter based on user role
    const filter = this.buildFilterForUser(user);

    // Get statistics
    const stats = await this.getStats(filter, user);

    // Get recent items
    const recentProjects = await this.getRecentProjects(filter, user);
    const recentContractors = await this.getRecentContractors(filter, user);
    const recentCOIs = await this.getRecentCOIs(filter, user);

    return {
      stats,
      recentProjects,
      recentContractors,
      recentCOIs,
    };
  }

  /**
   * Build Prisma filter based on user role and permissions
   */
  private buildFilterForUser(user: User): Record<string, unknown> {
    // Super admins see everything
    if (user.role === UserRole.SUPER_ADMIN) {
      return {};
    }

    // Regular admins are filtered by assigned admin email
    if (user.role === UserRole.ADMIN) {
      return { assignedAdminEmail: user.email };
    }

    // Contractors/GCs see only their own data
    if (user.role === UserRole.CONTRACTOR) {
      return { createdById: user.id };
    }

    // Default: user-specific data
    return { createdById: user.id };
  }

  /**
   * Get statistics for the dashboard
   */
  private async getStats(
    filter: Record<string, unknown>,
    _user: User,
  ): Promise<DashboardStats> {
    // Count total projects with correct field name
    const totalProjects = await this.prisma.project.count({
      where: filter,
    });

    // Count active projects using correct status enum field
    const activeProjects = await this.prisma.project.count({
      where: {
        ...filter,
        status: "ACTIVE",
      },
    });

    // Count total contractors
    const totalContractors = await this.prisma.contractor.count({
      where: filter,
    });

    // Count compliant contractors using correct insuranceStatus field
    const compliantContractors = await this.prisma.contractor.count({
      where: {
        ...filter,
        insuranceStatus: "COMPLIANT",
      },
    });

    // Count pending COIs using correct status field
    const pendingCOIs = await this.prisma.generatedCOI.count({
      where: {
        status: "AWAITING_BROKER_INFO",
      },
    });

    // Count expiring soon (within 30 days) using correct date field
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringSoon = await this.prisma.generatedCOI.count({
      where: {
        glExpirationDate: {
          lte: thirtyDaysFromNow,
          gte: new Date(),
        },
      },
    });

    return {
      totalProjects,
      activeProjects,
      totalContractors,
      compliantContractors,
      pendingCOIs,
      expiringSoon,
    };
  }

  /**
   * Get recent projects
   */
  private async getRecentProjects(
    filter: Record<string, unknown>,
    _user: User,
  ): Promise<Project[]> {
    return this.prisma.project.findMany({
      where: filter,
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        address: true,
        createdAt: true,
      },
    });
  }

  /**
   * Get recent contractors
   */
  private async getRecentContractors(
    filter: Record<string, unknown>,
    _user: User,
  ): Promise<Contractor[]> {
    return this.prisma.contractor.findMany({
      where: filter,
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        contractorType: true,
        status: true,
        insuranceStatus: true,
        trades: true,
        createdAt: true,
      },
    });
  }

  /**
   * Get recent COIs
   */
  private async getRecentCOIs(
    _filter: Record<string, unknown>,
    _user: User,
  ): Promise<GeneratedCOI[]> {
    return this.prisma.generatedCOI.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        projectName: true,
        subcontractorName: true,
        status: true,
        createdAt: true,
        glExpirationDate: true,
      },
    });
  }

  /**
   * Get filtered projects with search and pagination
   */
  async getFilteredProjects(
    user: User,
    status?: string,
    search?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: Project[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const filter = this.buildFilterForUser(user);
    const where: Record<string, unknown> = { ...filter };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
        { gcName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          status: true,
          startDate: true,
          endDate: true,
          address: true,
          gcName: true,
          createdAt: true,
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: projects,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get filtered contractors with search and pagination
   */
  async getFilteredContractors(
    user: User,
    status?: string,
    insuranceStatus?: string,
    search?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: Contractor[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const filter = this.buildFilterForUser(user);
    const where: Record<string, unknown> = { ...filter };

    if (status) {
      where.status = status;
    }

    if (insuranceStatus) {
      where.insuranceStatus = insuranceStatus;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
      ];
    }

    const [contractors, total] = await Promise.all([
      this.prisma.contractor.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
          contractorType: true,
          status: true,
          insuranceStatus: true,
          trades: true,
          createdAt: true,
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
}
