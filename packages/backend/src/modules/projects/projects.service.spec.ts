import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { ProjectsService } from "./projects.service";
import { PrismaService } from "../../config/prisma.service";
import { CacheService } from "../cache/cache.service";
import { ProjectStatus } from "@prisma/client";

describe("ProjectsService", () => {
  let service: ProjectsService;
  let prisma: jest.Mocked<PrismaService>;
  let cacheService: jest.Mocked<CacheService>;

  const mockProject = {
    id: "project-123",
    name: "Test Project",
    description: "Test description",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31"),
    status: ProjectStatus.ACTIVE,
    location: "Test Location",
    gcName: "Test GC",
    contractorId: "contractor-123",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: PrismaService,
          useValue: {
            project: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            projectContractor: {
              create: jest.fn(),
              findMany: jest.fn(),
              delete: jest.fn(),
            },
            contractor: {
              findFirst: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            invalidate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    cacheService = module.get(CacheService) as jest.Mocked<CacheService>;
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a new project", async () => {
      const createDto = {
        name: "New Project",
        description: "New description",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        status: ProjectStatus.ACTIVE,
        location: "New Location",
        gcName: "New GC",
      };

      (prisma.project.create as jest.Mock).mockResolvedValue(mockProject);

      const result = await service.create(createDto, "contractor-123");

      expect(result).toEqual(mockProject);
      expect(prisma.project.create).toHaveBeenCalled();
    });
  });

  describe("findAll", () => {
    it("should return an array of projects", async () => {
      const mockProjects = [mockProject];
      (prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects);

      const result = await service.findAll();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(mockProjects);
    });
  });

  describe("findOne", () => {
    it("should return a project by id", async () => {
      const mockProjectWithRelations = {
        ...mockProject,
        contractor: {
          id: "contractor-123",
          name: "Test Contractor",
          email: "contractor@test.com",
        },
        projectContractors: [],
      };

      cacheService.get.mockResolvedValue(null);
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(
        mockProjectWithRelations,
      );

      const result = await service.findOne("project-123");

      expect(result).toEqual(mockProjectWithRelations);
      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: "project-123" },
        include: expect.any(Object),
      });
    });

    it("should throw NotFoundException when project not found", async () => {
      cacheService.get.mockResolvedValue(null);
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne("nonexistent-id")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should use cached project if available", async () => {
      const cachedProject = { ...mockProject };
      cacheService.get.mockResolvedValue(cachedProject);
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(cachedProject);

      const result = await service.findOne("project-123");

      expect(result).toEqual(cachedProject);
    });
  });

  describe("findByContractor", () => {
    it("should return projects for a specific contractor", async () => {
      const mockProjects = [
        {
          ...mockProject,
          projectContractors: [
            {
              id: "pc-1",
              projectId: mockProject.id,
              contractorId: "contractor-123",
              contractor: {
                id: "contractor-123",
                name: "Test Contractor",
                email: "contractor@test.com",
              },
            },
          ],
        },
      ];

      (prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects);

      const result = await service.findByContractor("contractor-123");

      expect(result).toEqual(mockProjects);
      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: {
          projectContractors: {
            some: {
              contractorId: "contractor-123",
            },
          },
        },
        include: expect.any(Object),
        orderBy: {
          createdAt: "desc",
        },
      });
    });

    it("should return empty array when contractor has no projects", async () => {
      (prisma.project.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findByContractor(
        "contractor-with-no-projects",
      );

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should include project relations in results", async () => {
      const mockProjects = [
        {
          ...mockProject,
          createdBy: {
            id: "user-123",
            email: "creator@example.com",
            firstName: "Creator",
            lastName: "User",
          },
          projectContractors: [],
        },
      ];

      (prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects);

      await service.findByContractor("contractor-123");

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            createdBy: expect.any(Object),
            projectContractors: expect.any(Object),
          }),
        }),
      );
    });
  });

  describe("findAll - role-based access control", () => {
    const mockUser = {
      id: "user-123",
      email: "user@example.com",
      firstName: "Test",
      lastName: "User",
      role: "USER" as const,
      isActive: true,
      password: "hashed",
      resetToken: null,
      resetTokenExpiry: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockContractor = {
      id: "contractor-123",
      email: "contractor@example.com",
    };

    beforeEach(() => {
      (prisma.project.findMany as jest.Mock).mockResolvedValue([mockProject]);
    });

    it("should allow SUPER_ADMIN to see all projects", async () => {
      const superAdminUser = { ...mockUser, role: "SUPER_ADMIN" as const };

      await service.findAll(superAdminUser);

      const whereClause = (prisma.project.findMany as jest.Mock).mock
        .calls[0][0].where;
      // Super admin should have no restrictions - empty where
      expect(whereClause).toEqual({});
    });

    it("should filter projects for ADMIN to only projects they created", async () => {
      const adminUser = { ...mockUser, role: "ADMIN" as const };

      await service.findAll(adminUser);

      const whereClause = (prisma.project.findMany as jest.Mock).mock
        .calls[0][0].where;
      expect(whereClause.createdById).toBe(adminUser.id);
    });

    it("should filter projects for CONTRACTOR to only projects where they are GC", async () => {
      const contractorUser = { ...mockUser, role: "CONTRACTOR" as const };

      await service.findAll(contractorUser);

      const whereClause = (prisma.project.findMany as jest.Mock).mock
        .calls[0][0].where;
      expect(whereClause.contactEmail).toBe(contractorUser.email);
    });

    it("should filter projects for SUBCONTRACTOR to only assigned projects", async () => {
      const subcontractorUser = {
        ...mockUser,
        role: "SUBCONTRACTOR" as const,
      };

      (prisma.contractor.findFirst as jest.Mock).mockResolvedValue(
        mockContractor,
      );
      (prisma.projectContractor.findMany as jest.Mock).mockResolvedValue([
        { projectId: "project-1" },
        { projectId: "project-2" },
      ]);

      await service.findAll(subcontractorUser);

      const whereClause = (prisma.project.findMany as jest.Mock).mock
        .calls[0][0].where;
      expect(whereClause.id).toEqual({ in: ["project-1", "project-2"] });
    });

    it("should handle SUBCONTRACTOR with no contractor record", async () => {
      const subcontractorUser = {
        ...mockUser,
        role: "SUBCONTRACTOR" as const,
      };

      (prisma.contractor.findFirst as jest.Mock).mockResolvedValue(null);

      await service.findAll(subcontractorUser);

      const whereClause = (prisma.project.findMany as jest.Mock).mock
        .calls[0][0].where;
      expect(whereClause.id).toBe("non-existent-id");
    });

    it("should filter projects for BROKER to only projects with their contractors", async () => {
      const brokerUser = { ...mockUser, role: "BROKER" as const };

      (prisma.contractor.findMany as jest.Mock).mockResolvedValue([
        { id: "contractor-1" },
        { id: "contractor-2" },
      ]);
      (prisma.projectContractor.findMany as jest.Mock).mockResolvedValue([
        { projectId: "project-1" },
        { projectId: "project-2" },
      ]);

      await service.findAll(brokerUser);

      const whereClause = (prisma.project.findMany as jest.Mock).mock
        .calls[0][0].where;
      expect(whereClause.id).toEqual({ in: ["project-1", "project-2"] });
    });

    it("should handle BROKER with no contractors", async () => {
      const brokerUser = { ...mockUser, role: "BROKER" as const };

      (prisma.contractor.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll(brokerUser);

      const whereClause = (prisma.project.findMany as jest.Mock).mock
        .calls[0][0].where;
      expect(whereClause.id).toBe("non-existent-id");
    });

    it("should apply search filter with role-based filtering", async () => {
      const adminUser = { ...mockUser, role: "ADMIN" as const };

      await service.findAll(adminUser, "test search");

      const whereClause = (prisma.project.findMany as jest.Mock).mock
        .calls[0][0].where;
      // Should have OR condition for search
      expect(whereClause.OR).toBeDefined();
      expect(whereClause.OR.length).toBeGreaterThan(0);
    });

    it("should apply status filter", async () => {
      await service.findAll(undefined, undefined, "ACTIVE");

      const whereClause = (prisma.project.findMany as jest.Mock).mock
        .calls[0][0].where;
      expect(whereClause.status).toBe("ACTIVE");
    });

    it("should combine search and status filters", async () => {
      const adminUser = { ...mockUser, role: "ADMIN" as const };

      await service.findAll(adminUser, "test", "ACTIVE");

      const whereClause = (prisma.project.findMany as jest.Mock).mock
        .calls[0][0].where;
      expect(whereClause.status).toBe("ACTIVE");
      expect(whereClause.OR).toBeDefined();
    });

    it("should default to no access for unknown roles", async () => {
      const unknownRoleUser = { ...mockUser, role: "USER" as const };

      await service.findAll(unknownRoleUser);

      const whereClause = (prisma.project.findMany as jest.Mock).mock
        .calls[0][0].where;
      expect(whereClause.id).toBe("non-existent-id");
    });
  });
});
