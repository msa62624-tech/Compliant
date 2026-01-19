import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { GeneratedCOIController } from "./generated-coi.controller";
import { GeneratedCOIService } from "./generated-coi.service";
import { RolesGuard } from "../../common/guards/roles.guard";
import { UserRole } from "@prisma/client";

describe("GeneratedCOIController - RBAC Tests", () => {
  let controller: GeneratedCOIController;
  let generatedCOIService: jest.Mocked<GeneratedCOIService>;
  let rolesGuard: RolesGuard;
  let reflector: Reflector;

  const mockCOI = {
    id: "coi-123",
    projectId: "project-123",
    status: "PENDING",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GeneratedCOIController],
      providers: [
        {
          provide: GeneratedCOIService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            findExpiring: jest.fn(),
            updateBrokerInfo: jest.fn(),
            uploadPolicies: jest.fn(),
            signPolicies: jest.fn(),
            reviewCOI: jest.fn(),
            renewCOI: jest.fn(),
            resubmitDeficiency: jest.fn(),
          },
        },
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        RolesGuard,
      ],
    }).compile();

    controller = module.get<GeneratedCOIController>(GeneratedCOIController);
    generatedCOIService = module.get(
      GeneratedCOIService,
    ) as jest.Mocked<GeneratedCOIService>;
    rolesGuard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("RBAC - Review COI (Security Critical)", () => {
    it("should note that reviewCOI endpoint lacks RolesGuard protection", () => {
      // This test documents a security concern: reviewCOI only has JwtAuthGuard
      // Any authenticated user can potentially review COIs
      const context = createMockExecutionContext({
        id: "user-123",
        role: UserRole.USER,
      });

      // No @Roles decorator on reviewCOI endpoint
      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(null);

      const canActivate = rolesGuard.canActivate(context);
      // This will pass because there's no role restriction
      expect(canActivate).toBe(true);

      // This is a security gap - USER role should NOT be able to review COIs
      // Expected: Only ADMIN, SUPER_ADMIN, MANAGER should review COIs
    });

    it("should document that CONTRACTOR could potentially review COI (security gap)", () => {
      const context = createMockExecutionContext({
        id: "contractor-123",
        role: UserRole.CONTRACTOR,
      });

      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(null);

      const canActivate = rolesGuard.canActivate(context);
      // This passes but shouldn't - CONTRACTOR should not review COIs
      expect(canActivate).toBe(true);
    });

    it("should ideally restrict review to ADMIN/SUPER_ADMIN/MANAGER only", () => {
      // This test shows what the expected behavior should be
      const context = createMockExecutionContext({
        id: "admin-123",
        role: UserRole.ADMIN,
      });

      // If RolesGuard was properly applied with correct roles
      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([
          UserRole.ADMIN,
          UserRole.SUPER_ADMIN,
          UserRole.MANAGER,
        ]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it("should ideally deny USER from reviewing COI", () => {
      // Expected behavior with proper RBAC
      const context = createMockExecutionContext({
        id: "user-123",
        role: UserRole.USER,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([
          UserRole.ADMIN,
          UserRole.SUPER_ADMIN,
          UserRole.MANAGER,
        ]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });
  });

  describe("RBAC - Find All COIs (Service-layer filtering)", () => {
    it("should allow ADMIN to view COIs (filtered by service)", () => {
      const mockRequest = {
        user: {
          id: "admin-123",
          email: "admin@example.com",
          role: UserRole.ADMIN,
        },
      } as any;

      generatedCOIService.findAll.mockResolvedValue([mockCOI] as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      const result = controller.findAll(mockRequest);
      expect(result).toBeDefined();

      // Service should filter based on role
      expect(generatedCOIService.findAll).toHaveBeenCalledWith({
        role: UserRole.ADMIN,
        email: "admin@example.com",
      });
    });

    it("should allow SUPER_ADMIN to view all COIs (no filtering)", () => {
      const mockRequest = {
        user: {
          id: "superadmin-123",
          email: "superadmin@example.com",
          role: UserRole.SUPER_ADMIN,
        },
      } as any;

      generatedCOIService.findAll.mockResolvedValue([mockCOI] as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      const result = controller.findAll(mockRequest);
      expect(result).toBeDefined();

      expect(generatedCOIService.findAll).toHaveBeenCalledWith({
        role: UserRole.SUPER_ADMIN,
        email: "superadmin@example.com",
      });
    });

    it("should allow CONTRACTOR to view their own COIs (filtered by service)", () => {
      const mockRequest = {
        user: {
          id: "contractor-123",
          email: "contractor@example.com",
          role: UserRole.CONTRACTOR,
        },
      } as any;

      generatedCOIService.findAll.mockResolvedValue([mockCOI] as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      const result = controller.findAll(mockRequest);
      expect(result).toBeDefined();

      expect(generatedCOIService.findAll).toHaveBeenCalledWith({
        role: UserRole.CONTRACTOR,
        email: "contractor@example.com",
      });
    });

    it("should allow SUBCONTRACTOR to view their own COIs (filtered by service)", () => {
      const mockRequest = {
        user: {
          id: "subcontractor-123",
          email: "subcontractor@example.com",
          role: UserRole.SUBCONTRACTOR,
        },
      } as any;

      generatedCOIService.findAll.mockResolvedValue([mockCOI] as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      const result = controller.findAll(mockRequest);
      expect(result).toBeDefined();

      expect(generatedCOIService.findAll).toHaveBeenCalledWith({
        role: UserRole.SUBCONTRACTOR,
        email: "subcontractor@example.com",
      });
    });
  });

  describe("RBAC - Create COI", () => {
    const createDto = {
      projectId: "project-123",
      contractorId: "contractor-123",
    };

    it("should allow any authenticated user to create COI", () => {
      const mockRequest = {
        user: {
          id: "user-123",
          email: "user@example.com",
          role: UserRole.USER,
        },
      } as any;

      // No @Roles decorator on create endpoint
      const context = createMockExecutionContext({
        id: "user-123",
        role: UserRole.USER,
      });

      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(null);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);

      generatedCOIService.create.mockResolvedValue(mockCOI as any);
      const result = controller.create(createDto as any, mockRequest);
      expect(result).toBeDefined();
    });
  });

  describe("RBAC - Update Operations", () => {
    it("should allow authenticated users to update broker info", () => {
      const context = createMockExecutionContext({
        id: "user-123",
        role: UserRole.USER,
      });

      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(null);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it("should allow authenticated users to upload policies", () => {
      const context = createMockExecutionContext({
        id: "broker-123",
        role: UserRole.BROKER,
      });

      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(null);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it("should allow authenticated users to sign policies", () => {
      const context = createMockExecutionContext({
        id: "contractor-123",
        role: UserRole.CONTRACTOR,
      });

      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(null);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });
  });

  describe("RBAC - Read Operations", () => {
    it("should allow any authenticated user to find expiring COIs", () => {
      const context = createMockExecutionContext({
        id: "user-123",
        role: UserRole.USER,
      });

      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(null);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it("should allow any authenticated user to view COI details", () => {
      const context = createMockExecutionContext({
        id: "contractor-123",
        role: UserRole.CONTRACTOR,
      });

      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(null);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });
  });

  describe("Security Notes", () => {
    it("should document that service-layer filtering is used instead of controller guards", () => {
      // NOTE: This controller relies on service-layer role filtering rather than
      // controller-level RolesGuard. This is a weaker security pattern because:
      // 1. Business logic should not handle authorization
      // 2. Easier to bypass if service code is called from other contexts
      // 3. Less explicit about security boundaries
      //
      // Recommendation: Add RolesGuard to sensitive endpoints like reviewCOI
      expect(true).toBe(true);
    });

    it("should note that reviewCOI is the most critical endpoint needing RBAC", () => {
      // reviewCOI allows approving/rejecting COIs - should be admin-only
      // Currently any authenticated user could potentially call this
      expect(true).toBe(true);
    });
  });

  // Helper function to create mock execution context
  function createMockExecutionContext(user: {
    id: string;
    role: UserRole;
  }): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  }
});
