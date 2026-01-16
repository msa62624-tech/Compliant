import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AssignContractorDto } from './dto/assign-contractor.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto, userId: string) {
    const project = await this.prisma.project.create({
      data: {
        ...createProjectDto,
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

    return project;
  }

  async findAll(page = 1, limit = 10, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { status: status as any } : {};

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
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
          projectContractors: {
            include: {
              contractor: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  status: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
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
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto) {
    await this.findOne(id);

    const project = await this.prisma.project.update({
      where: { id },
      data: updateProjectDto,
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

    return project;
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.project.delete({
      where: { id },
    });

    return { message: 'Project deleted successfully' };
  }

  async assignContractor(id: string, assignContractorDto: AssignContractorDto) {
    const project = await this.findOne(id);
    
    // Check if contractor exists
    const contractor = await this.prisma.contractor.findUnique({
      where: { id: assignContractorDto.contractorId },
    });

    if (!contractor) {
      throw new NotFoundException(`Contractor with ID ${assignContractorDto.contractorId} not found`);
    }

    // Check if already assigned
    const existing = await this.prisma.projectContractor.findUnique({
      where: {
        projectId_contractorId: {
          projectId: id,
          contractorId: assignContractorDto.contractorId,
        },
      },
    });

    if (existing) {
      return { message: 'Contractor already assigned to this project' };
    }

    const assignment = await this.prisma.projectContractor.create({
      data: {
        projectId: id,
        contractorId: assignContractorDto.contractorId,
        role: assignContractorDto.role,
      },
      include: {
        contractor: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
      },
    });

    return assignment;
  }

  async removeContractor(id: string, contractorId: string) {
    await this.findOne(id);

    const assignment = await this.prisma.projectContractor.findUnique({
      where: {
        projectId_contractorId: {
          projectId: id,
          contractorId: contractorId,
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Contractor not assigned to this project');
    }

    await this.prisma.projectContractor.delete({
      where: {
        id: assignment.id,
      },
    });

    return { message: 'Contractor removed from project successfully' };
  }

  async getProjectContractors(id: string) {
    await this.findOne(id);

    const contractors = await this.prisma.projectContractor.findMany({
      where: { projectId: id },
      include: {
        contractor: true,
      },
    });

    return contractors;
  }
}
