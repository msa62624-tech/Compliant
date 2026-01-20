import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuditController } from "./audit.controller";
import { AuditService } from "./audit.service";
import { RolesGuard } from "../../common/guards/roles.guard";
import { UserRole } from "@prisma/client";

describe("AuditController - RBAC Tests", () => {
  let controller: AuditController;
  let auditService: jest.Mocked<AuditService>;
  let rolesGuard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        {
          provide: AuditService,
          useValue: {
            getAuditLogs: jest.fn(),
            getResourceAuditLogs: jest.fn(),
            getUserAuditLogs: jest.fn(),
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

    controller = module.get<AuditController>(AuditController);
    auditService = module.get(AuditService) as jest.Mocked<AuditService>;
    rolesGuard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("RBAC - Get Audit Logs", () => {
    const mockAuditLogs = {
      logs: [],
      total: 0,
      skip: 0,
      take: 50,
    };

    it("should allow ADMIN to get audit logs", () => {
      const context = createMockExecutionContext({
        id: "admin-123",
        role: UserRole.ADMIN,
      });

      // Note: Controller uses string literals "ADMIN", "MANAGER"
      // For proper testing, we need to mock with actual UserRole values
      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN, UserRole.MANAGER]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      auditService.getAuditLogs.mockResolvedValue(mockAuditLogs as any);
      const result = controller.getAuditLogs();
      expect(result).toBeDefined();
    });

    it("should allow MANAGER to get audit logs", () => {
      const context = createMockExecutionContext({
        id: "manager-123",
        role: UserRole.MANAGER,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN, UserRole.MANAGER]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it("should deny USER from getting audit logs", () => {
      const context = createMockExecutionContext({
        id: "user-123",
        role: UserRole.USER,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN, UserRole.MANAGER]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });

    it("should deny CONTRACTOR from getting audit logs", () => {
      const context = createMockExecutionContext({
        id: "contractor-123",
        role: UserRole.CONTRACTOR,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN, UserRole.MANAGER]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });

    it("should deny SUBCONTRACTOR from getting audit logs", () => {
      const context = createMockExecutionContext({
        id: "subcontractor-123",
        role: UserRole.SUBCONTRACTOR,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN, UserRole.MANAGER]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });

    it("should deny BROKER from getting audit logs", () => {
      const context = createMockExecutionContext({
        id: "broker-123",
        role: UserRole.BROKER,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN, UserRole.MANAGER]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });

    it("should note that SUPER_ADMIN is not explicitly allowed to get audit logs", () => {
      // NOTE: The controller decorator uses @Roles("ADMIN", "MANAGER")
      // SUPER_ADMIN is intentionally not included, which may be a design choice
      // or an oversight. This test documents the current behavior.
      const context = createMockExecutionContext({
        id: "superadmin-123",
        role: UserRole.SUPER_ADMIN,
      });

      // SUPER_ADMIN should have access too, but it's not in the decorator
      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN, UserRole.MANAGER]);

      const canActivate = rolesGuard.canActivate(context);
      // This will be false because SUPER_ADMIN is not in the allowed roles
      expect(canActivate).toBe(false);

      // RECOMMENDATION: Consider adding UserRole.SUPER_ADMIN to the decorator
      // @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
    });
  });

  describe("RBAC - Get Resource Audit Logs", () => {
    const mockAuditLogs = {
      logs: [],
      total: 0,
      skip: 0,
      take: 50,
    };

    it("should allow ADMIN to get resource audit logs", () => {
      const context = createMockExecutionContext({
        id: "admin-123",
        role: UserRole.ADMIN,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN, UserRole.MANAGER]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      auditService.getResourceAuditLogs.mockResolvedValue(mockAuditLogs as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = controller.getResourceAuditLogs(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "PROJECT" as any,
        "proj-123",
      );
      expect(result).toBeDefined();
    });

    it("should allow MANAGER to get resource audit logs", () => {
      const context = createMockExecutionContext({
        id: "manager-123",
        role: UserRole.MANAGER,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN, UserRole.MANAGER]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it("should deny USER from getting resource audit logs", () => {
      const context = createMockExecutionContext({
        id: "user-123",
        role: UserRole.USER,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN, UserRole.MANAGER]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });

    it("should deny CONTRACTOR from getting resource audit logs", () => {
      const context = createMockExecutionContext({
        id: "contractor-123",
        role: UserRole.CONTRACTOR,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN, UserRole.MANAGER]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });
  });

  describe("RBAC - Get User Audit Logs", () => {
    const mockAuditLogs = {
      logs: [],
      total: 0,
      skip: 0,
      take: 50,
    };

    it("should allow any authenticated user to get their own audit logs", () => {
      const context = createMockExecutionContext({
        id: "user-123",
        role: UserRole.USER,
      });

      // No @Roles decorator on getUserAuditLogs endpoint
      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(null);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      auditService.getUserAuditLogs.mockResolvedValue(mockAuditLogs as any);
      const result = controller.getUserAuditLogs("user-123");
      expect(result).toBeDefined();
    });

    it("should allow CONTRACTOR to get user audit logs", () => {
      const context = createMockExecutionContext({
        id: "contractor-123",
        role: UserRole.CONTRACTOR,
      });

      // No @Roles decorator on getUserAuditLogs endpoint
      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(null);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
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
