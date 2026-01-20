import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { DashboardFilterDto, FilterType } from '../../common/dto/dashboard-filter.dto';

export interface DashboardItem {
  id: string;
  name: string;
  type: 'gc' | 'project' | 'coi' | 'compliance';
  status: string;
  date: string;
  description: string;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private prisma: PrismaService) {}

  async getDashboardItems(
    userId: string,
    filters: DashboardFilterDto,
  ): Promise<DashboardItem[]> {
    this.logger.log(`Fetching dashboard items for user ${userId} with filters: ${JSON.stringify(filters)}`);

    const items: DashboardItem[] = [];

    // Fetch GCs if filter allows
    if (filters.type === FilterType.ALL || filters.type === FilterType.GC) {
      const gcs = await this.getGeneralContractors(filters);
      items.push(...gcs);
    }

    // Fetch Projects if filter allows
    if (filters.type === FilterType.ALL || filters.type === FilterType.PROJECT) {
      const projects = await this.getProjects(filters);
      items.push(...projects);
    }

    // Fetch COI Reviews if filter allows
    if (filters.type === FilterType.ALL || filters.type === FilterType.COI) {
      const cois = await this.getCOIReviews(filters);
      items.push(...cois);
    }

    // Fetch Compliance items if filter allows
    if (filters.type === FilterType.ALL || filters.type === FilterType.COMPLIANCE) {
      const compliance = await this.getComplianceItems(filters);
      items.push(...compliance);
    }

    // Sort by date descending
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return items;
  }

  private async getGeneralContractors(filters: DashboardFilterDto): Promise<DashboardItem[]> {
    const where: any = {};
    
    if (filters.search) {
      where.OR = [
        { companyName: { contains: filters.search, mode: 'insensitive' } },
        { contactName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const gcs = await this.prisma.contractor.findMany({
      where: {
        ...where,
        contractorType: 'GENERAL_CONTRACTOR',
      },
      include: {
        _count: {
          select: { projectContractors: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return gcs.map((gc: any) => ({
      id: gc.id,
      name: gc.name || gc.company,
      type: 'gc' as const,
      status: 'active',
      date: gc.createdAt.toISOString(),
      description: `General Contractor with ${gc._count.projectContractors} project(s)`,
    }));
  }

  private async getProjects(filters: DashboardFilterDto): Promise<DashboardItem[]> {
    const where: any = {};

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const projects = await this.prisma.project.findMany({
      where,
      include: {
        projectContractors: {
          include: {
            contractor: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return projects.map((project: any) => ({
      id: project.id,
      name: project.name,
      type: 'project' as const,
      status: project.status.toLowerCase(),
      date: project.createdAt.toISOString(),
      description: `${project.generalContractor.companyName} - ${project.location || 'No location'}`,
    }));
  }

  private async getCOIReviews(filters: DashboardFilterDto): Promise<DashboardItem[]> {
    const where: any = {
      status: 'AWAITING_ADMIN_REVIEW',
    };

    if (filters.search) {
      where.OR = [
        { subcontractor: { companyName: { contains: filters.search, mode: 'insensitive' } } },
        { subcontractor: { contactName: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const cois = await this.prisma.generatedCOI.findMany({
      where,
      include: {
        subcontractor: true,
        project: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return cois.map((coi: any) => ({
      id: coi.id,
      name: `${coi.subcontractor.companyName} COI`,
      type: 'coi' as const,
      status: 'pending',
      date: coi.createdAt.toISOString(),
      description: `COI for ${coi.project?.name || 'project'} awaiting review`,
    }));
  }

  private async getComplianceItems(filters: DashboardFilterDto): Promise<DashboardItem[]> {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const where: any = {
      contractorType: 'SUBCONTRACTOR',
      insuranceDocuments: {
        some: {
          expirationDate: {
            lte: thirtyDaysFromNow,
          },
        },
      },
    };

    if (filters.search) {
      where.name = { contains: filters.search, mode: 'insensitive' };
    }

    const subcontractors = await this.prisma.contractor.findMany({
      where,
      include: {
        insuranceDocuments: {
          where: {
            expirationDate: {
              lte: thirtyDaysFromNow,
            },
          },
          orderBy: {
            expirationDate: 'asc',
          },
          take: 1,
        },
      },
      take: 10,
    });

    return subcontractors.map((sub: any) => {
      const policy = sub.policies[0];
      const daysUntilExpiration = policy
        ? Math.ceil(
            (new Date(policy.expirationDate).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 0;

      return {
        id: sub.id,
        name: sub.name || sub.company,
        type: 'compliance' as const,
        status: daysUntilExpiration <= 0 ? 'expired' : 'expiring',
        date: policy?.expirationDate.toISOString() || new Date().toISOString(),
        description: `Insurance ${daysUntilExpiration <= 0 ? 'expired' : `expiring in ${daysUntilExpiration} days`}`,
      };
    });
  }

  async getDashboardStats(userId: string) {
    this.logger.log(`Fetching dashboard stats for user ${userId}`);

    const [gcCount, projectCount, pendingCOIs, complianceRate] = await Promise.all([
      this.prisma.contractor.count({ where: { contractorType: 'GENERAL_CONTRACTOR' } }),
      this.prisma.project.count({ where: { status: 'ACTIVE' } }),
      this.prisma.generatedCOI.count({ where: { status: 'AWAITING_ADMIN_REVIEW' } }),
      this.calculateComplianceRate(),
    ]);

    return {
      generalContractors: gcCount,
      activeProjects: projectCount,
      pendingCOIReviews: pendingCOIs,
      complianceRate,
    };
  }

  private async calculateComplianceRate(): Promise<number> {
    const totalSubcontractors = await this.prisma.contractor.count({
      where: { contractorType: 'SUBCONTRACTOR' },
    });
    if (totalSubcontractors === 0) return 100;

    const compliantSubcontractors = await this.prisma.contractor.count({
      where: {
        contractorType: 'SUBCONTRACTOR',
        insuranceStatus: 'COMPLIANT',
      },
    });

    return Math.round((compliantSubcontractors / totalSubcontractors) * 100);
  }
}
