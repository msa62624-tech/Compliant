import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { Prisma, ContractorType } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto, userId: string) {
    const projectData: Prisma.ProjectCreateInput = {
      name: createProjectDto.name,
      description: createProjectDto.description,
      address: createProjectDto.address,
      startDate: new Date(createProjectDto.startDate),
      endDate: createProjectDto.endDate ? new Date(createProjectDto.endDate) : undefined,
      status: createProjectDto.status || 'PLANNING',
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

  async findAll(userId?: string) {
    return this.prisma.project.findMany({
      where: userId ? { createdById: userId } : undefined,
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
        createdAt: 'desc',
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
        createdAt: 'desc',
      },
    });

    return projects;
  }
}
