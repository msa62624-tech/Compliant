import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { Prisma, ContractorType } from "@prisma/client";

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto, userId: string) {
    const projectData: Prisma.ProjectCreateInput = {
      name: createProjectDto.name,
      description: createProjectDto.description,
      address: createProjectDto.address,
      startDate: new Date(createProjectDto.startDate),
      endDate: createProjectDto.endDate
        ? new Date(createProjectDto.endDate)
        : undefined,
      status: createProjectDto.status || "PLANNING",
      gcName: createProjectDto.gcName,
      location: createProjectDto.location,
      borough: createProjectDto.borough,
      block: createProjectDto.block,
      lot: createProjectDto.lot,
      buildingHeight: createProjectDto.buildingHeight,
      structureType: createProjectDto.structureType,
      entity: createProjectDto.entity,
      additionalInsureds: createProjectDto.additionalInsureds,
      contactPerson: createProjectDto.contactPerson,
      contactEmail: createProjectDto.contactEmail,
      contactPhone: createProjectDto.contactPhone,
      createdBy: {
        connect: { id: userId },
      },
    };

    const project = await this.prisma.project.create({
      data: projectData,
    });

    // If gcId is provided, create the project-contractor relationship
    if (createProjectDto.gcId) {
      await this.prisma.projectContractor.create({
        data: {
          projectId: project.id,
          contractorId: createProjectDto.gcId,
          role: ContractorType.GENERAL_CONTRACTOR,
        },
      });
    }

    return project;
  }

  /**
   * Find all projects with role-based filtering and search
   * PRODUCTION: Data isolation - GC only sees their own projects
   * - SUPER_ADMIN: sees all projects
   * - ADMIN: sees projects they created or are assigned to
   * - CONTRACTOR/GC: sees only projects where they are the GC
   * - SUBCONTRACTOR: sees only projects where they are assigned
   * - BROKER: sees projects where their contractors are assigned
   *
   * Search parameters:
   * - search: search by project name, address, GC name
   * - status: filter by project status
   */
  async findAll(user?: any, search?: string, status?: string) {
    // Build where clause based on user role
    const where: any = {};

    if (user) {
      switch (user.role) {
        case "SUPER_ADMIN":
          // Super admin sees everything
          break;

        case "ADMIN":
          // Admin sees projects they created or are assigned to
          if (user.id) {
            where.createdById = user.id;
          }
          break;

        case "CONTRACTOR":
          // GC sees only projects where they are listed as GC (by email)
          if (user.email) {
            where.contactEmail = user.email;
          }
          break;

        case "SUBCONTRACTOR":
          // Subcontractor sees only projects where they are assigned
          if (user.email) {
            const contractor = await this.prisma.contractor.findFirst({
              where: { email: user.email },
            });

            if (contractor) {
              const projectContractors =
                await this.prisma.projectContractor.findMany({
                  where: { contractorId: contractor.id },
                  select: { projectId: true },
                });

              const projectIds = projectContractors.map((pc) => pc.projectId);
              where.id = { in: projectIds.length > 0 ? projectIds : ["none"] };
            } else {
              where.id = "non-existent-id";
            }
          }
          break;

        case "BROKER":
          // Broker sees projects where their contractors are assigned
          if (user.email) {
            // Find contractors served by this broker
            const contractors = await this.prisma.contractor.findMany({
              where: {
                OR: [
                  { brokerEmail: user.email },
                  { brokerGlEmail: user.email },
                  { brokerAutoEmail: user.email },
                  { brokerUmbrellaEmail: user.email },
                  { brokerWcEmail: user.email },
                ],
              },
              select: { id: true },
            });

            if (contractors.length > 0) {
              const contractorIds = contractors.map((c) => c.id);
              const projectContractors =
                await this.prisma.projectContractor.findMany({
                  where: { contractorId: { in: contractorIds } },
                  select: { projectId: true },
                });

              const projectIds = projectContractors.map((pc) => pc.projectId);
              where.id = { in: projectIds.length > 0 ? projectIds : ["none"] };
            } else {
              where.id = "non-existent-id";
            }
          }
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
          { name: { contains: search, mode: "insensitive" as any } },
          { address: { contains: search, mode: "insensitive" as any } },
          { gcName: { contains: search, mode: "insensitive" as any } },
          { description: { contains: search, mode: "insensitive" as any } },
        ],
      };

      if (where.OR) {
        where.AND = [{ OR: where.OR }, searchCondition];
        delete where.OR;
      } else {
        where.OR = searchCondition.OR;
      }
    }

    // Add status filter
    if (status) {
      where.status = status;
    }

    return this.prisma.project.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        projectContractors: {
          include: {
            contractor: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
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
        projectContractors: {
          include: {
            contractor: true,
          },
        },
        projectSubcontractors: {
          include: {
            subcontractor: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async findByContractor(contractorId: string) {
    const projects = await this.prisma.project.findMany({
      where: {
        projectContractors: {
          some: {
            contractorId: contractorId,
          },
        },
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
        projectContractors: {
          include: {
            contractor: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return projects;
  }
}
