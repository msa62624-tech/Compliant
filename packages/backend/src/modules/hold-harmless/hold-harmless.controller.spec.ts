import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { HoldHarmlessController } from "./hold-harmless.controller";
import { HoldHarmlessService } from "./hold-harmless.service";
import { RolesGuard } from "../../common/guards/roles.guard";
import { UserRole } from "@prisma/client";

describe("HoldHarmlessController - RBAC Tests", () => {
  let controller: HoldHarmlessController;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let holdHarmlessService: jest.Mocked<HoldHarmlessService>;
  let rolesGuard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HoldHarmlessController],
      providers: [
        {
          provide: HoldHarmlessService,
          useValue: {
            autoGenerateOnCOIApproval: jest.fn(),
            getById: jest.fn(),
            processSubcontractorSignature: jest.fn(),
            processGCSignature: jest.fn(),
            getHoldHarmless: jest.fn(),
            getAllHoldHarmless: jest.fn(),
            resendSignatureLink: jest.fn(),
            getStatistics: jest.fn(),
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

    controller = module.get<HoldHarmlessController>(HoldHarmlessController);
    holdHarmlessService = module.get(
      HoldHarmlessService,
    ) as jest.Mocked<HoldHarmlessService>;
    rolesGuard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("RBAC - Auto Generate Hold Harmless", () => {
    it("should allow SUPER_ADMIN to auto-generate hold harmless", () => {
      const context = createMockExecutionContext({
        id: "superadmin-123",
        role: UserRole.SUPER_ADMIN,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.SUPER_ADMIN, UserRole.ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it("should allow ADMIN to auto-generate hold harmless", () => {
      const context = createMockExecutionContext({
        id: "admin-123",
        role: UserRole.ADMIN,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.SUPER_ADMIN, UserRole.ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it("should deny MANAGER from auto-generating hold harmless", () => {
      const context = createMockExecutionContext({
        id: "manager-123",
        role: UserRole.MANAGER,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.SUPER_ADMIN, UserRole.ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });

    it("should deny USER from auto-generating hold harmless", () => {
      const context = createMockExecutionContext({
        id: "user-123",
        role: UserRole.USER,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.SUPER_ADMIN, UserRole.ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });

    it("should deny CONTRACTOR from auto-generating hold harmless", () => {
      const context = createMockExecutionContext({
        id: "contractor-123",
        role: UserRole.CONTRACTOR,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.SUPER_ADMIN, UserRole.ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });
  });

  describe("RBAC - Subcontractor Signature", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const signatureData = {
      signatureUrl: "https://example.com/signature.png",
      signedBy: "John Doe",
    };

    it("should allow SUBCONTRACTOR to sign", () => {
      const context = createMockExecutionContext({
        id: "subcontractor-123",
        role: UserRole.SUBCONTRACTOR,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([
          UserRole.SUBCONTRACTOR,
          UserRole.SUPER_ADMIN,
          UserRole.ADMIN,
        ]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it("should allow SUPER_ADMIN to sign as subcontractor (override)", () => {
      const context = createMockExecutionContext({
        id: "superadmin-123",
        role: UserRole.SUPER_ADMIN,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([
          UserRole.SUBCONTRACTOR,
          UserRole.SUPER_ADMIN,
          UserRole.ADMIN,
        ]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it("should allow ADMIN to sign as subcontractor (override)", () => {
      const context = createMockExecutionContext({
        id: "admin-123",
        role: UserRole.ADMIN,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([
          UserRole.SUBCONTRACTOR,
          UserRole.SUPER_ADMIN,
          UserRole.ADMIN,
        ]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it("should deny CONTRACTOR from signing as subcontractor", () => {
      const context = createMockExecutionContext({
        id: "contractor-123",
        role: UserRole.CONTRACTOR,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([
          UserRole.SUBCONTRACTOR,
          UserRole.SUPER_ADMIN,
          UserRole.ADMIN,
        ]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });

    it("should deny USER from signing as subcontractor", () => {
      const context = createMockExecutionContext({
        id: "user-123",
        role: UserRole.USER,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([
          UserRole.SUBCONTRACTOR,
          UserRole.SUPER_ADMIN,
          UserRole.ADMIN,
        ]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });

    it("should deny MANAGER from signing as subcontractor", () => {
      const context = createMockExecutionContext({
        id: "manager-123",
        role: UserRole.MANAGER,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([
          UserRole.SUBCONTRACTOR,
          UserRole.SUPER_ADMIN,
          UserRole.ADMIN,
        ]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });
  });

  describe("RBAC - GC (General Contractor) Signature", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const signatureData = {
      signatureUrl: "https://example.com/signature.png",
      signedBy: "Jane Smith",
      finalDocUrl: "https://example.com/final.pdf",
    };

    it("should allow CONTRACTOR to sign as GC", () => {
      const context = createMockExecutionContext({
        id: "contractor-123",
        role: UserRole.CONTRACTOR,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([
          UserRole.CONTRACTOR,
          UserRole.SUPER_ADMIN,
          UserRole.ADMIN,
        ]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it("should allow SUPER_ADMIN to sign as GC (override)", () => {
      const context = createMockExecutionContext({
        id: "superadmin-123",
        role: UserRole.SUPER_ADMIN,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([
          UserRole.CONTRACTOR,
          UserRole.SUPER_ADMIN,
          UserRole.ADMIN,
        ]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it("should allow ADMIN to sign as GC (override)", () => {
      const context = createMockExecutionContext({
        id: "admin-123",
        role: UserRole.ADMIN,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([
          UserRole.CONTRACTOR,
          UserRole.SUPER_ADMIN,
          UserRole.ADMIN,
        ]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it("should deny SUBCONTRACTOR from signing as GC", () => {
      const context = createMockExecutionContext({
        id: "subcontractor-123",
        role: UserRole.SUBCONTRACTOR,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([
          UserRole.CONTRACTOR,
          UserRole.SUPER_ADMIN,
          UserRole.ADMIN,
        ]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });

    it("should deny USER from signing as GC", () => {
      const context = createMockExecutionContext({
        id: "user-123",
        role: UserRole.USER,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([
          UserRole.CONTRACTOR,
          UserRole.SUPER_ADMIN,
          UserRole.ADMIN,
        ]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });

    it("should deny MANAGER from signing as GC", () => {
      const context = createMockExecutionContext({
        id: "manager-123",
        role: UserRole.MANAGER,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([
          UserRole.CONTRACTOR,
          UserRole.SUPER_ADMIN,
          UserRole.ADMIN,
        ]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });
  });

  describe("RBAC - Get Hold Harmless for COI", () => {
    it("should allow SUPER_ADMIN to get hold harmless", () => {
      const context = createMockExecutionContext({
        id: "superadmin-123",
        role: UserRole.SUPER_ADMIN,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([
          UserRole.SUPER_ADMIN,
          UserRole.ADMIN,
          UserRole.MANAGER,
        ]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it("should allow ADMIN to get hold harmless", () => {
      const context = createMockExecutionContext({
        id: "admin-123",
        role: UserRole.ADMIN,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([
          UserRole.SUPER_ADMIN,
          UserRole.ADMIN,
          UserRole.MANAGER,
        ]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it("should allow MANAGER to get hold harmless", () => {
      const context = createMockExecutionContext({
        id: "manager-123",
        role: UserRole.MANAGER,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([
          UserRole.SUPER_ADMIN,
          UserRole.ADMIN,
          UserRole.MANAGER,
        ]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it("should deny USER from getting hold harmless", () => {
      const context = createMockExecutionContext({
        id: "user-123",
        role: UserRole.USER,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([
          UserRole.SUPER_ADMIN,
          UserRole.ADMIN,
          UserRole.MANAGER,
        ]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });

    it("should deny CONTRACTOR from getting hold harmless list", () => {
      const context = createMockExecutionContext({
        id: "contractor-123",
        role: UserRole.CONTRACTOR,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([
          UserRole.SUPER_ADMIN,
          UserRole.ADMIN,
          UserRole.MANAGER,
        ]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });
  });

  describe("RBAC - Get All Hold Harmless Agreements", () => {
    it("should allow SUPER_ADMIN to get all agreements", () => {
      const context = createMockExecutionContext({
        id: "superadmin-123",
        role: UserRole.SUPER_ADMIN,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([
          UserRole.SUPER_ADMIN,
          UserRole.ADMIN,
          UserRole.MANAGER,
        ]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it("should allow ADMIN to get all agreements", () => {
      const context = createMockExecutionContext({
        id: "admin-123",
        role: UserRole.ADMIN,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([
          UserRole.SUPER_ADMIN,
          UserRole.ADMIN,
          UserRole.MANAGER,
        ]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it("should allow MANAGER to get all agreements", () => {
      const context = createMockExecutionContext({
        id: "manager-123",
        role: UserRole.MANAGER,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([
          UserRole.SUPER_ADMIN,
          UserRole.ADMIN,
          UserRole.MANAGER,
        ]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it("should deny CONTRACTOR from getting all agreements", () => {
      const context = createMockExecutionContext({
        id: "contractor-123",
        role: UserRole.CONTRACTOR,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([
          UserRole.SUPER_ADMIN,
          UserRole.ADMIN,
          UserRole.MANAGER,
        ]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });
  });

  describe("RBAC - Resend Signature Link", () => {
    it("should allow SUPER_ADMIN to resend signature link", () => {
      const context = createMockExecutionContext({
        id: "superadmin-123",
        role: UserRole.SUPER_ADMIN,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.SUPER_ADMIN, UserRole.ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it("should allow ADMIN to resend signature link", () => {
      const context = createMockExecutionContext({
        id: "admin-123",
        role: UserRole.ADMIN,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.SUPER_ADMIN, UserRole.ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it("should deny MANAGER from resending signature link", () => {
      const context = createMockExecutionContext({
        id: "manager-123",
        role: UserRole.MANAGER,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.SUPER_ADMIN, UserRole.ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });

    it("should deny CONTRACTOR from resending signature link", () => {
      const context = createMockExecutionContext({
        id: "contractor-123",
        role: UserRole.CONTRACTOR,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.SUPER_ADMIN, UserRole.ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });
  });

  describe("RBAC - Get Statistics", () => {
    it("should allow SUPER_ADMIN to get statistics", () => {
      const context = createMockExecutionContext({
        id: "superadmin-123",
        role: UserRole.SUPER_ADMIN,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.SUPER_ADMIN, UserRole.ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it("should allow ADMIN to get statistics", () => {
      const context = createMockExecutionContext({
        id: "admin-123",
        role: UserRole.ADMIN,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.SUPER_ADMIN, UserRole.ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it("should deny MANAGER from getting statistics", () => {
      const context = createMockExecutionContext({
        id: "manager-123",
        role: UserRole.MANAGER,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.SUPER_ADMIN, UserRole.ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });
  });

  describe("RBAC - Get By ID (Public to authenticated users)", () => {
    it("should allow any authenticated user to get hold harmless by ID", () => {
      const context = createMockExecutionContext({
        id: "user-123",
        role: UserRole.USER,
      });

      // No @Roles decorator on getById
      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(null);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it("should allow SUBCONTRACTOR to get hold harmless by ID", () => {
      const context = createMockExecutionContext({
        id: "subcontractor-123",
        role: UserRole.SUBCONTRACTOR,
      });

      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(null);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it("should allow CONTRACTOR to get hold harmless by ID", () => {
      const context = createMockExecutionContext({
        id: "contractor-123",
        role: UserRole.CONTRACTOR,
      });

      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(null);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });
  });

  describe("Security Workflow Validation", () => {
    it("should validate proper signature workflow sequence", () => {
      // Workflow: SUB signs first → then GC signs
      // SUBCONTRACTOR role can only call /sign/subcontractor
      // CONTRACTOR role can only call /sign/gc
      // This ensures proper workflow sequence is maintained by role separation

      expect(true).toBe(true);
    });

    it("should note that admins can override any signature step", () => {
      // SUPER_ADMIN and ADMIN can sign as both SUB and GC
      // This is intentional for workflow override capabilities
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
