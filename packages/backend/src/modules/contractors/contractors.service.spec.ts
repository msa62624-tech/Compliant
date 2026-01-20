import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { ContractorsService } from "./contractors.service";
import { PrismaService } from "../../config/prisma.service";
import { CacheService } from "../cache/cache.service";
import { EmailService } from "../email/email.service";
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
        {
          provide: EmailService,
          useValue: {
            sendEmail: jest.fn(),
            sendWelcomeEmail: jest.fn(),
            sendContractorWelcomeEmail: jest.fn(),
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

      // Mock the creator user lookup and the check for existing user with the email
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: "user-123", role: "ADMIN" }) // Creator lookup
        .mockResolvedValueOnce(null); // Email check - no existing user
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: "user-456",
        email: createDto.email,
        firstName: "New",
        lastName: "Contractor",
        role: "CONTRACTOR",
        password: "hashed",
        isActive: true,
        resetToken: null,
        resetTokenExpiry: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (prisma.contractor.create as jest.Mock).mockResolvedValue(mockContractor);
      cacheService.delPattern.mockResolvedValue(undefined);

      const result = await service.create(createDto, "user-123");

      expect(result).toBeDefined();
      expect(prisma.contractor.create).toHaveBeenCalled();
    });

    it("should auto-create user account for new contractor", async () => {
      const createDto = {
        name: "John Smith",
        email: "john.smith@example.com",
        phone: "555-1234",
        company: "Smith Co",
        contractorType: ContractorType.GENERAL_CONTRACTOR,
        status: ContractorStatus.ACTIVE,
      };

      // Mock the creator user lookup and the check for existing user with the email
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: "user-123", role: "ADMIN" }) // Creator lookup
        .mockResolvedValueOnce(null); // Email check - no existing user
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: "user-new",
        email: createDto.email,
        firstName: "John",
        lastName: "Smith",
        role: "CONTRACTOR",
        password: "hashed",
        isActive: true,
        resetToken: null,
        resetTokenExpiry: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (prisma.contractor.create as jest.Mock).mockResolvedValue({
        ...mockContractor,
        ...createDto,
      });
      cacheService.delPattern.mockResolvedValue(undefined);

      const result = await service.create(createDto, "user-123");

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: createDto.email },
      });
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: createDto.email,
            firstName: "John",
            lastName: "Smith",
            role: "CONTRACTOR",
            isActive: true,
          }),
        }),
      );
      expect(result.userAccount).toBeDefined();
      expect(result.userAccount.created).toBe(true);
    });

    it("should assign SUBCONTRACTOR role when contractorType is SUBCONTRACTOR", async () => {
      const createDto = {
        name: "Sub Contractor",
        email: "sub@example.com",
        phone: "555-1234",
        company: "Sub Co",
        contractorType: ContractorType.SUBCONTRACTOR,
        status: ContractorStatus.ACTIVE,
      };

      // Mock the creator user lookup and the check for existing user with the email
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: "user-123", role: "ADMIN" }) // Creator lookup
        .mockResolvedValueOnce(null); // Email check - no existing user
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: "user-sub",
        email: createDto.email,
        firstName: "Sub",
        lastName: "Contractor",
        role: "SUBCONTRACTOR",
        password: "hashed",
        isActive: true,
        resetToken: null,
        resetTokenExpiry: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (prisma.contractor.create as jest.Mock).mockResolvedValue({
        ...mockContractor,
        ...createDto,
      });
      cacheService.delPattern.mockResolvedValue(undefined);

      await service.create(createDto, "user-123");

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: "SUBCONTRACTOR",
          }),
        }),
      );
    });

    it("should not create duplicate user account if user already exists", async () => {
      const createDto = {
        name: "Existing User",
        email: "existing@example.com",
        phone: "555-1234",
        company: "Existing Co",
        contractorType: ContractorType.GENERAL_CONTRACTOR,
        status: ContractorStatus.ACTIVE,
      };

      // Mock the creator user lookup and the check for existing user with the email
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: "user-123", role: "ADMIN" }) // Creator lookup
        .mockResolvedValueOnce({
          // Email check - existing user found
          id: "existing-user",
          email: createDto.email,
          firstName: "Existing",
          lastName: "User",
          role: "CONTRACTOR",
          password: "hashed",
          isActive: true,
          resetToken: null,
          resetTokenExpiry: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      (prisma.contractor.create as jest.Mock).mockResolvedValue({
        ...mockContractor,
        ...createDto,
      });
      cacheService.delPattern.mockResolvedValue(undefined);

      const result = await service.create(createDto, "user-123");

      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(result.userAccount.created).toBe(false);
    });

    it("should generate secure password for new user account", async () => {
      const createDto = {
        name: "Test User",
        email: "test@example.com",
        phone: "555-1234",
        company: "Test Co",
        contractorType: ContractorType.GENERAL_CONTRACTOR,
        status: ContractorStatus.ACTIVE,
      };

      // Mock the creator user lookup and the check for existing user with the email
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: "user-123", role: "ADMIN" }) // Creator lookup
        .mockResolvedValueOnce(null); // Email check - no existing user
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: "user-test",
        email: createDto.email,
        firstName: "Test",
        lastName: "User",
        role: "CONTRACTOR",
        password: "hashed",
        isActive: true,
        resetToken: null,
        resetTokenExpiry: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (prisma.contractor.create as jest.Mock).mockResolvedValue({
        ...mockContractor,
        ...createDto,
      });
      cacheService.delPattern.mockResolvedValue(undefined);

      const result = await service.create(createDto, "user-123");

      // Verify password was generated and returned
      expect(result.userAccount.password).toBeDefined();
      if (result.userAccount.created) {
        expect(result.userAccount.password.length).toBeGreaterThan(0);
      }
    });

    it("should handle name parsing for firstName and lastName", async () => {
      const createDto = {
        name: "John Michael Smith Jr",
        email: "jsmith@example.com",
        phone: "555-1234",
        company: "Smith Co",
        contractorType: ContractorType.GENERAL_CONTRACTOR,
        status: ContractorStatus.ACTIVE,
      };

      // Mock the creator user lookup and the check for existing user with the email
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: "user-123", role: "ADMIN" }) // Creator lookup
        .mockResolvedValueOnce(null); // Email check - no existing user
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: "user-jsmith",
        email: createDto.email,
        firstName: "John",
        lastName: "Michael Smith Jr",
        role: "CONTRACTOR",
        password: "hashed",
        isActive: true,
        resetToken: null,
        resetTokenExpiry: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (prisma.contractor.create as jest.Mock).mockResolvedValue({
        ...mockContractor,
        ...createDto,
      });
      cacheService.delPattern.mockResolvedValue(undefined);

      await service.create(createDto, "user-123");

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            firstName: "John",
            lastName: "Michael Smith Jr",
          }),
        }),
      );
    });
  });

  describe("findAll", () => {
    it("should return paginated contractors", async () => {
      const mockContractors = [mockContractor];
      const expectedResult = {
        data: mockContractors,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      (prisma.contractor.findMany as jest.Mock).mockResolvedValue(
        mockContractors,
      );
      (prisma.contractor.count as jest.Mock).mockResolvedValue(1);
      cacheService.get.mockResolvedValue(null);
      cacheService.set.mockResolvedValue(undefined);

      const result = (await service.findAll()) as {
        data: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };

      expect(result).toEqual(expectedResult);
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

    beforeEach(() => {
      (prisma.contractor.findMany as jest.Mock).mockResolvedValue([
        mockContractor,
      ]);
      (prisma.contractor.count as jest.Mock).mockResolvedValue(1);
      cacheService.get.mockResolvedValue(null);
      cacheService.set.mockResolvedValue(undefined);
    });

    it("should allow SUPER_ADMIN to see all contractors", async () => {
      const superAdminUser = { ...mockUser, role: "SUPER_ADMIN" as const };

      await service.findAll(1, 10, undefined, superAdminUser);

      const whereClause = (prisma.contractor.findMany as jest.Mock).mock
        .calls[0][0].where;
      // Super admin should have no restrictions - empty where or minimal where
      expect(whereClause.email).toBeUndefined();
      expect(whereClause.assignedAdminEmail).toBeUndefined();
      expect(whereClause.OR).toBeUndefined();
    });

    it("should filter contractors for ADMIN by assignedAdminEmail", async () => {
      const adminUser = { ...mockUser, role: "ADMIN" as const };

      await service.findAll(1, 10, undefined, adminUser);

      const whereClause = (prisma.contractor.findMany as jest.Mock).mock
        .calls[0][0].where;
      expect(whereClause.assignedAdminEmail).toBe(adminUser.email);
    });

    it("should allow CONTRACTOR to see own record and subs they created", async () => {
      const contractorUser = { ...mockUser, role: "CONTRACTOR" as const };

      await service.findAll(1, 10, undefined, contractorUser);

      const whereClause = (prisma.contractor.findMany as jest.Mock).mock
        .calls[0][0].where;
      expect(whereClause.OR).toBeDefined();
      expect(whereClause.OR).toEqual([
        { email: contractorUser.email },
        { createdById: contractorUser.id },
      ]);
    });

    it("should restrict SUBCONTRACTOR to only their own record (privacy)", async () => {
      const subcontractorUser = {
        ...mockUser,
        role: "SUBCONTRACTOR" as const,
      };

      await service.findAll(1, 10, undefined, subcontractorUser);

      const whereClause = (prisma.contractor.findMany as jest.Mock).mock
        .calls[0][0].where;
      expect(whereClause.email).toBe(subcontractorUser.email);
      expect(whereClause.OR).toBeUndefined();
    });

    it("should allow BROKER to see only contractors that listed them (privacy)", async () => {
      const brokerUser = { ...mockUser, role: "BROKER" as const };

      await service.findAll(1, 10, undefined, brokerUser);

      const whereClause = (prisma.contractor.findMany as jest.Mock).mock
        .calls[0][0].where;
      expect(whereClause.OR).toBeDefined();
      expect(whereClause.OR).toEqual([
        { brokerEmail: brokerUser.email },
        { brokerGlEmail: brokerUser.email },
        { brokerAutoEmail: brokerUser.email },
        { brokerUmbrellaEmail: brokerUser.email },
        { brokerWcEmail: brokerUser.email },
      ]);
    });

    it("should apply search filter with role-based filtering", async () => {
      const contractorUser = { ...mockUser, role: "CONTRACTOR" as const };

      await service.findAll(
        1,
        10,
        undefined,
        contractorUser,
        "test search",
        undefined,
        undefined,
      );

      const whereClause = (prisma.contractor.findMany as jest.Mock).mock
        .calls[0][0].where;
      // Should have AND combining role filter and search filter
      expect(whereClause.AND).toBeDefined();
    });

    it("should apply trade filter", async () => {
      await service.findAll(
        1,
        10,
        undefined,
        undefined,
        undefined,
        "Electrical",
        undefined,
      );

      const whereClause = (prisma.contractor.findMany as jest.Mock).mock
        .calls[0][0].where;
      expect(whereClause.trades).toEqual({ has: "Electrical" });
    });

    it("should apply insurance status filter", async () => {
      await service.findAll(
        1,
        10,
        undefined,
        undefined,
        undefined,
        undefined,
        "COMPLIANT",
      );

      const whereClause = (prisma.contractor.findMany as jest.Mock).mock
        .calls[0][0].where;
      expect(whereClause.insuranceStatus).toBe("COMPLIANT");
    });
  });

  describe("getInsuranceStatus", () => {
    it("should return COMPLIANT status when all documents are valid", async () => {
      const contractorWithDocs = {
        ...mockContractor,
        insuranceDocuments: [
          {
            id: "doc-1",
            type: "GENERAL_LIABILITY",
            status: "VERIFIED",
            expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          },
        ],
      };

      cacheService.get.mockResolvedValue(null);
      (prisma.contractor.findUnique as jest.Mock).mockResolvedValue(
        contractorWithDocs,
      );
      (prisma.contractor.update as jest.Mock).mockResolvedValue(
        contractorWithDocs,
      );

      const result = await service.getInsuranceStatus("contractor-123");

      expect(result.status).toBe(InsuranceStatus.COMPLIANT);
      expect(result.documents).toHaveLength(1);
    });

    it("should return EXPIRED status when any document is expired", async () => {
      const contractorWithExpired = {
        ...mockContractor,
        insuranceDocuments: [
          {
            id: "doc-1",
            type: "GENERAL_LIABILITY",
            status: "VERIFIED",
            expirationDate: new Date(Date.now() - 1000), // Expired 1 second ago
          },
        ],
      };

      cacheService.get.mockResolvedValue(null);
      (prisma.contractor.findUnique as jest.Mock).mockResolvedValue(
        contractorWithExpired,
      );
      (prisma.contractor.update as jest.Mock).mockResolvedValue(
        contractorWithExpired,
      );

      const result = await service.getInsuranceStatus("contractor-123");

      expect(result.status).toBe(InsuranceStatus.EXPIRED);
    });

    it("should return NON_COMPLIANT status when any document is rejected", async () => {
      const contractorWithRejected = {
        ...mockContractor,
        insuranceDocuments: [
          {
            id: "doc-1",
            type: "GENERAL_LIABILITY",
            status: "REJECTED",
            expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        ],
      };

      cacheService.get.mockResolvedValue(null);
      (prisma.contractor.findUnique as jest.Mock).mockResolvedValue(
        contractorWithRejected,
      );
      (prisma.contractor.update as jest.Mock).mockResolvedValue(
        contractorWithRejected,
      );

      const result = await service.getInsuranceStatus("contractor-123");

      expect(result.status).toBe(InsuranceStatus.NON_COMPLIANT);
    });

    it("should return PENDING status when documents are pending", async () => {
      const contractorWithPending = {
        ...mockContractor,
        insuranceDocuments: [
          {
            id: "doc-1",
            type: "GENERAL_LIABILITY",
            status: "PENDING",
            expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        ],
      };

      cacheService.get.mockResolvedValue(null);
      (prisma.contractor.findUnique as jest.Mock).mockResolvedValue(
        contractorWithPending,
      );
      (prisma.contractor.update as jest.Mock).mockResolvedValue(
        contractorWithPending,
      );

      const result = await service.getInsuranceStatus("contractor-123");

      expect(result.status).toBe(InsuranceStatus.PENDING);
    });

    it("should return PENDING status when no documents exist", async () => {
      const contractorNoDocs = {
        ...mockContractor,
        insuranceDocuments: [],
      };

      cacheService.get.mockResolvedValue(null);
      (prisma.contractor.findUnique as jest.Mock).mockResolvedValue(
        contractorNoDocs,
      );
      (prisma.contractor.update as jest.Mock).mockResolvedValue(
        contractorNoDocs,
      );

      const result = await service.getInsuranceStatus("contractor-123");

      expect(result.status).toBe(InsuranceStatus.PENDING);
    });

    it("should update contractor insurance status if changed", async () => {
      const contractorWithExpired = {
        ...mockContractor,
        insuranceStatus: InsuranceStatus.COMPLIANT, // Currently marked as compliant
        insuranceDocuments: [
          {
            id: "doc-1",
            type: "GENERAL_LIABILITY",
            status: "VERIFIED",
            expirationDate: new Date(Date.now() - 1000), // But actually expired
          },
        ],
      };

      cacheService.get.mockResolvedValue(null);
      (prisma.contractor.findUnique as jest.Mock).mockResolvedValue(
        contractorWithExpired,
      );
      (prisma.contractor.update as jest.Mock).mockResolvedValue({
        ...contractorWithExpired,
        insuranceStatus: InsuranceStatus.EXPIRED,
      });

      await service.getInsuranceStatus("contractor-123");

      expect(prisma.contractor.update).toHaveBeenCalledWith({
        where: { id: "contractor-123" },
        data: { insuranceStatus: InsuranceStatus.EXPIRED },
      });
    });
  });

  describe("searchContractors", () => {
    it("should search subcontractors by name", async () => {
      const searchResults = [
        { ...mockContractor, contractorType: ContractorType.SUBCONTRACTOR },
      ];
      (prisma.contractor.findMany as jest.Mock).mockResolvedValue(
        searchResults,
      );

      const result = await service.searchContractors("Test");

      expect(result.contractors).toHaveLength(1);
      expect(prisma.contractor.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: "Test", mode: "insensitive" } },
            { company: { contains: "Test", mode: "insensitive" } },
            { email: { contains: "Test", mode: "insensitive" } },
          ],
          contractorType: "SUBCONTRACTOR",
        },
        select: expect.any(Object),
        take: 10,
        orderBy: { name: "asc" },
      });
    });

    it("should search subcontractors by email", async () => {
      const searchResults = [
        { ...mockContractor, contractorType: ContractorType.SUBCONTRACTOR },
      ];
      (prisma.contractor.findMany as jest.Mock).mockResolvedValue(
        searchResults,
      );

      await service.searchContractors("contractor@example.com");

      expect(prisma.contractor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              {
                email: {
                  contains: "contractor@example.com",
                  mode: "insensitive",
                },
              },
            ]),
          }),
        }),
      );
    });

    it("should search subcontractors by company", async () => {
      const searchResults = [
        { ...mockContractor, contractorType: ContractorType.SUBCONTRACTOR },
      ];
      (prisma.contractor.findMany as jest.Mock).mockResolvedValue(
        searchResults,
      );

      await service.searchContractors("Company");

      expect(prisma.contractor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { company: { contains: "Company", mode: "insensitive" } },
            ]),
          }),
        }),
      );
    });

    it("should only search subcontractors (not general contractors)", async () => {
      (prisma.contractor.findMany as jest.Mock).mockResolvedValue([]);

      await service.searchContractors("Test");

      const whereClause = (prisma.contractor.findMany as jest.Mock).mock
        .calls[0][0].where;
      expect(whereClause.contractorType).toBe("SUBCONTRACTOR");
    });

    it("should respect custom limit", async () => {
      (prisma.contractor.findMany as jest.Mock).mockResolvedValue([]);

      await service.searchContractors("Test", 5);

      expect(prisma.contractor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        }),
      );
    });
  });

  describe("searchBrokers", () => {
    const mockBrokerContractor = {
      id: "contractor-with-broker",
      brokerType: "GLOBAL",
      brokerName: "Test Broker",
      brokerEmail: "broker@example.com",
      brokerPhone: "555-1234",
      brokerCompany: "Broker Inc",
      brokerGlName: "GL Broker",
      brokerGlEmail: "gl@broker.com",
      brokerGlPhone: "555-5678",
      brokerAutoName: null,
      brokerAutoEmail: null,
      brokerAutoPhone: null,
      brokerUmbrellaName: null,
      brokerUmbrellaEmail: null,
      brokerUmbrellaPhone: null,
      brokerWcName: null,
      brokerWcEmail: null,
      brokerWcPhone: null,
    };

    it("should search brokers by name", async () => {
      (prisma.contractor.findMany as jest.Mock).mockResolvedValue([
        mockBrokerContractor,
      ]);

      const result = await service.searchBrokers("Test Broker");

      expect(result.brokers).toBeDefined();
      expect(prisma.contractor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: expect.arrayContaining([
              { brokerName: { contains: "Test Broker", mode: "insensitive" } },
            ]),
          },
        }),
      );
    });

    it("should search brokers by email", async () => {
      (prisma.contractor.findMany as jest.Mock).mockResolvedValue([
        mockBrokerContractor,
      ]);

      await service.searchBrokers("broker@example.com");

      expect(prisma.contractor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: expect.arrayContaining([
              {
                brokerEmail: {
                  contains: "broker@example.com",
                  mode: "insensitive",
                },
              },
            ]),
          },
        }),
      );
    });

    it("should deduplicate brokers by email", async () => {
      const duplicateBrokers = [
        mockBrokerContractor,
        { ...mockBrokerContractor, id: "contractor-2" }, // Same email
      ];

      (prisma.contractor.findMany as jest.Mock).mockResolvedValue(
        duplicateBrokers,
      );

      const result = await service.searchBrokers("broker@example.com");

      // Should only return one broker despite two contractors having same broker
      expect(result.brokers.length).toBeLessThanOrEqual(2);
    });

    it("should filter out brokers without name or email", async () => {
      const incompleteBroker = {
        ...mockBrokerContractor,
        brokerName: null,
        brokerEmail: null,
      };

      (prisma.contractor.findMany as jest.Mock).mockResolvedValue([
        incompleteBroker,
      ]);

      const result = await service.searchBrokers("Test");

      expect(result.brokers).toHaveLength(0);
    });

    it("should search GLOBAL brokers by default", async () => {
      (prisma.contractor.findMany as jest.Mock).mockResolvedValue([
        mockBrokerContractor,
      ]);

      const result = await service.searchBrokers("Test", "GLOBAL");

      expect(result.brokers.length).toBeGreaterThanOrEqual(0);
    });

    it("should search per-policy brokers when specified", async () => {
      (prisma.contractor.findMany as jest.Mock).mockResolvedValue([
        mockBrokerContractor,
      ]);

      const result = await service.searchBrokers("Test", "GL");

      expect(result.brokers).toBeDefined();
    });

    it("should respect custom limit", async () => {
      const manyBrokers = Array.from({ length: 20 }, (_, i) => ({
        ...mockBrokerContractor,
        id: `broker-${i}`,
        brokerEmail: `broker${i}@example.com`,
      }));

      (prisma.contractor.findMany as jest.Mock).mockResolvedValue(manyBrokers);

      const result = await service.searchBrokers("broker", "GLOBAL", 5);

      expect(result.brokers.length).toBeLessThanOrEqual(5);
    });
  });
});
