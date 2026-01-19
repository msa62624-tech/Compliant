import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { ContractorsService } from "./contractors.service";
import { PrismaService } from "../../config/prisma.service";
import { CacheService } from "../cache/cache.service";
import { ContractorStatus, ContractorType } from "@prisma/client";
import { InsuranceStatus } from "@compliant/shared";

describe("ContractorsService", () => {
  let service: ContractorsService;
  let prisma: jest.Mocked<PrismaService>;
  let cacheService: jest.Mocked<CacheService>;

  const mockContractor = {
    id: "contractor-123",
    name: "Test Contractor",
    email: "contractor@example.com",
    phone: "555-1234",
    company: "Test Company",
    contractorType: ContractorType.GENERAL_CONTRACTOR,
    status: ContractorStatus.ACTIVE,
    address: "123 Main St",
    city: "Test City",
    state: "CA",
    zipCode: "12345",
    trades: ["Electrical", "Plumbing"],
    insuranceStatus: InsuranceStatus.COMPLIANT,
    createdById: "user-123",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractorsService,
        {
          provide: PrismaService,
          useValue: {
            contractor: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            delPattern: jest.fn(),
            invalidate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ContractorsService>(ContractorsService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    cacheService = module.get(CacheService) as jest.Mocked<CacheService>;
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a new contractor", async () => {
      const createDto = {
        name: "New Contractor",
        email: "new@example.com",
        phone: "555-5678",
        company: "New Company",
        contractorType: ContractorType.GENERAL_CONTRACTOR,
        status: ContractorStatus.ACTIVE,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: "user-456",
        email: createDto.email,
        firstName: "New",
        lastName: "Contractor",
        role: "CONTRACTOR",
        password: "hashed",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (prisma.contractor.create as jest.Mock).mockResolvedValue(mockContractor);
      cacheService.delPattern.mockResolvedValue(undefined);

      const result = await service.create(createDto, "user-123");

      expect(result).toBeDefined();
      expect(prisma.contractor.create).toHaveBeenCalled();
    });
  });

  describe("findAll", () => {
    it("should return paginated contractors", async () => {
      const mockContractors = [mockContractor];
      (prisma.contractor.findMany as jest.Mock).mockResolvedValue(
        mockContractors,
      );
      (prisma.contractor.count as jest.Mock).mockResolvedValue(1);
      cacheService.get.mockResolvedValue(null);
      cacheService.set.mockResolvedValue(undefined);

      const result = await service.findAll() as {
        data: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.total).toBe(1);
    });
  });

  describe("findOne", () => {
    it("should return a contractor by id", async () => {
      const mockContractorWithRelations = {
        ...mockContractor,
        createdBy: {
          id: "user-123",
          email: "creator@example.com",
          firstName: "Creator",
          lastName: "User",
        },
        insuranceDocuments: [],
        projectContractors: [],
      };

      cacheService.get.mockResolvedValue(null);
      (prisma.contractor.findUnique as jest.Mock).mockResolvedValue(
        mockContractorWithRelations,
      );

      const result = await service.findOne("contractor-123");

      expect(result).toEqual(mockContractorWithRelations);
      expect(prisma.contractor.findUnique).toHaveBeenCalledWith({
        where: { id: "contractor-123" },
        include: expect.any(Object),
      });
    });

    it("should throw NotFoundException when contractor not found", async () => {
      cacheService.get.mockResolvedValue(null);
      (prisma.contractor.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne("nonexistent-id")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should use cached contractor if available", async () => {
      const cachedContractor = { ...mockContractor };
      cacheService.get.mockResolvedValue(cachedContractor);

      const result = await service.findOne("contractor-123");

      expect(result).toEqual(cachedContractor);
      expect(prisma.contractor.findUnique).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("should update a contractor", async () => {
      const updateDto = {
        name: "Updated Name",
        phone: "555-9999",
      };

      const updatedContractor = {
        ...mockContractor,
        ...updateDto,
      };

      (prisma.contractor.findUnique as jest.Mock).mockResolvedValue(
        mockContractor,
      );
      (prisma.contractor.update as jest.Mock).mockResolvedValue(
        updatedContractor,
      );
      cacheService.del.mockResolvedValue(undefined);
      cacheService.delPattern.mockResolvedValue(undefined);

      const result = await service.update("contractor-123", updateDto);

      expect(result).toBeDefined();
      expect(prisma.contractor.update).toHaveBeenCalled();
    });

    it("should throw NotFoundException when updating non-existent contractor", async () => {
      (prisma.contractor.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.update("nonexistent-id", { name: "Test" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should invalidate cache after update", async () => {
      const updateDto = { name: "Updated" };
      (prisma.contractor.findUnique as jest.Mock).mockResolvedValue(
        mockContractor,
      );
      (prisma.contractor.update as jest.Mock).mockResolvedValue({
        ...mockContractor,
        ...updateDto,
      });
      cacheService.del.mockResolvedValue(undefined);
      cacheService.delPattern.mockResolvedValue(undefined);

      await service.update("contractor-123", updateDto);

      expect(cacheService.del).toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("should delete a contractor", async () => {
      (prisma.contractor.findUnique as jest.Mock).mockResolvedValue(
        mockContractor,
      );
      (prisma.contractor.delete as jest.Mock).mockResolvedValue(mockContractor);
      cacheService.del.mockResolvedValue(undefined);
      cacheService.delPattern.mockResolvedValue(undefined);

      await service.remove("contractor-123");

      expect(prisma.contractor.delete).toHaveBeenCalled();
    });

    it("should throw NotFoundException when deleting non-existent contractor", async () => {
      (prisma.contractor.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.remove("nonexistent-id")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should invalidate cache after delete", async () => {
      (prisma.contractor.findUnique as jest.Mock).mockResolvedValue(
        mockContractor,
      );
      (prisma.contractor.delete as jest.Mock).mockResolvedValue(mockContractor);
      cacheService.del.mockResolvedValue(undefined);
      cacheService.delPattern.mockResolvedValue(undefined);

      await service.remove("contractor-123");

      expect(cacheService.del).toHaveBeenCalled();
    });
  });
});
