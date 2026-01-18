import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";
import { CreateProgramDto } from "./dto/create-program.dto";
import { UpdateProgramDto } from "./dto/update-program.dto";
import { AssignProgramDto } from "./dto/assign-program.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class ProgramsService {
  constructor(private prisma: PrismaService) {}

  async create(createProgramDto: CreateProgramDto, userId: string) {
    const programData: Prisma.InsuranceProgramCreateInput = {
      name: createProgramDto.name,
      description: createProgramDto.description,
      isTemplate: createProgramDto.isTemplate ?? true,
      glMinimum: createProgramDto.glMinimum,
      wcMinimum: createProgramDto.wcMinimum,
      autoMinimum: createProgramDto.autoMinimum,
      umbrellaMinimum: createProgramDto.umbrellaMinimum,
      requiresHoldHarmless: createProgramDto.requiresHoldHarmless ?? false,
      holdHarmlessTemplateUrl: createProgramDto.holdHarmlessTemplateUrl,
      requiresAdditionalInsured:
        createProgramDto.requiresAdditionalInsured ?? true,
      requiresWaiverSubrogation:
        createProgramDto.requiresWaiverSubrogation ?? true,
      tierRequirements: createProgramDto.tierRequirements ?? Prisma.JsonNull,
      tradeRequirements: createProgramDto.tradeRequirements ?? Prisma.JsonNull,
      autoApprovalRules: createProgramDto.autoApprovalRules ?? Prisma.JsonNull,
      createdBy: userId,
    };

    return this.prisma.insuranceProgram.create({
      data: programData,
    });
  }

  async findAll(isTemplate?: boolean) {
    const where: Prisma.InsuranceProgramWhereInput = {};

    if (isTemplate !== undefined) {
      where.isTemplate = isTemplate;
    }

    return this.prisma.insuranceProgram.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findOne(id: string) {
    const program = await this.prisma.insuranceProgram.findUnique({
      where: { id },
      include: {
        projects: {
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

    if (!program) {
      throw new NotFoundException(`Insurance program with ID ${id} not found`);
    }

    return program;
  }

  async update(id: string, updateProgramDto: UpdateProgramDto) {
    const existingProgram = await this.prisma.insuranceProgram.findUnique({
      where: { id },
    });

    if (!existingProgram) {
      throw new NotFoundException(`Insurance program with ID ${id} not found`);
    }

    const updateData: Prisma.InsuranceProgramUpdateInput = {
      ...(updateProgramDto.name && { name: updateProgramDto.name }),
      ...(updateProgramDto.description !== undefined && {
        description: updateProgramDto.description,
      }),
      ...(updateProgramDto.isTemplate !== undefined && {
        isTemplate: updateProgramDto.isTemplate,
      }),
      ...(updateProgramDto.glMinimum !== undefined && {
        glMinimum: updateProgramDto.glMinimum,
      }),
      ...(updateProgramDto.wcMinimum !== undefined && {
        wcMinimum: updateProgramDto.wcMinimum,
      }),
      ...(updateProgramDto.autoMinimum !== undefined && {
        autoMinimum: updateProgramDto.autoMinimum,
      }),
      ...(updateProgramDto.umbrellaMinimum !== undefined && {
        umbrellaMinimum: updateProgramDto.umbrellaMinimum,
      }),
      ...(updateProgramDto.requiresHoldHarmless !== undefined && {
        requiresHoldHarmless: updateProgramDto.requiresHoldHarmless,
      }),
      ...(updateProgramDto.requiresAdditionalInsured !== undefined && {
        requiresAdditionalInsured: updateProgramDto.requiresAdditionalInsured,
      }),
      ...(updateProgramDto.requiresWaiverSubrogation !== undefined && {
        requiresWaiverSubrogation: updateProgramDto.requiresWaiverSubrogation,
      }),
      ...(updateProgramDto.tierRequirements !== undefined && {
        tierRequirements: updateProgramDto.tierRequirements ?? Prisma.JsonNull,
      }),
      ...(updateProgramDto.tradeRequirements !== undefined && {
        tradeRequirements:
          updateProgramDto.tradeRequirements ?? Prisma.JsonNull,
      }),
      ...(updateProgramDto.autoApprovalRules !== undefined && {
        autoApprovalRules:
          updateProgramDto.autoApprovalRules ?? Prisma.JsonNull,
      }),
    };

    return this.prisma.insuranceProgram.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    const existingProgram = await this.prisma.insuranceProgram.findUnique({
      where: { id },
      include: {
        projects: true,
      },
    });

    if (!existingProgram) {
      throw new NotFoundException(`Insurance program with ID ${id} not found`);
    }

    if (existingProgram.projects.length > 0) {
      throw new BadRequestException(
        `Cannot delete program. It is assigned to ${existingProgram.projects.length} project(s). Remove assignments first.`,
      );
    }

    return this.prisma.insuranceProgram.delete({
      where: { id },
    });
  }

  async assignToProject(
    programId: string,
    assignProgramDto: AssignProgramDto,
    userId: string,
  ) {
    const program = await this.prisma.insuranceProgram.findUnique({
      where: { id: programId },
    });

    if (!program) {
      throw new NotFoundException(
        `Insurance program with ID ${programId} not found`,
      );
    }

    const project = await this.prisma.project.findUnique({
      where: { id: assignProgramDto.projectId },
    });

    if (!project) {
      throw new NotFoundException(
        `Project with ID ${assignProgramDto.projectId} not found`,
      );
    }

    const existingAssignment = await this.prisma.projectProgram.findUnique({
      where: {
        projectId_programId: {
          projectId: assignProgramDto.projectId,
          programId: programId,
        },
      },
    });

    if (existingAssignment) {
      throw new BadRequestException(
        "This program is already assigned to the project",
      );
    }

    return this.prisma.projectProgram.create({
      data: {
        projectId: assignProgramDto.projectId,
        programId: programId,
        assignedBy: userId,
        customRequirements:
          assignProgramDto.customRequirements ?? Prisma.JsonNull,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        program: true,
      },
    });
  }

  async findByProject(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    return this.prisma.projectProgram.findMany({
      where: { projectId },
      include: {
        program: true,
      },
      orderBy: {
        assignedAt: "desc",
      },
    });
  }

  async getStatistics() {
    const [
      totalPrograms,
      templatePrograms,
      customPrograms,
      programsWithProjects,
    ] = await Promise.all([
      this.prisma.insuranceProgram.count(),
      this.prisma.insuranceProgram.count({ where: { isTemplate: true } }),
      this.prisma.insuranceProgram.count({ where: { isTemplate: false } }),
      this.prisma.insuranceProgram.findMany({
        include: {
          _count: {
            select: { projects: true },
          },
        },
      }),
    ]);

    const totalAssignments = programsWithProjects.reduce(
      (sum, program) => sum + program._count.projects,
      0,
    );

    const mostUsedPrograms = programsWithProjects
      .filter((p) => p._count.projects > 0)
      .sort((a, b) => b._count.projects - a._count.projects)
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        name: p.name,
        projectCount: p._count.projects,
      }));

    return {
      totalPrograms,
      templatePrograms,
      customPrograms,
      totalAssignments,
      averageAssignmentsPerProgram:
        totalPrograms > 0 ? (totalAssignments / totalPrograms).toFixed(2) : 0,
      mostUsedPrograms,
    };
  }
}
