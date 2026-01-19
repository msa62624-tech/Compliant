import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RemindersController } from "./reminders.controller";
import { RemindersService } from "./reminders.service";
import { RolesGuard } from "../../common/guards/roles.guard";
import { UserRole } from "@prisma/client";

describe("RemindersController - RBAC Tests", () => {
  let controller: RemindersController;
  let rolesGuard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RemindersController],
      providers: [
        {
          provide: RemindersService,
          useValue: {
            getReminderHistory: jest.fn(),
            getPendingReminders: jest.fn(),
            getReminderStats: jest.fn(),
            acknowledgeReminder: jest.fn(),
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

    controller = module.get<RemindersController>(RemindersController);
    rolesGuard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("RBAC - Get Reminder History", () => {
    it("should allow SUPER_ADMIN to get reminder history", () => {
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

    it("should allow ADMIN to get reminder history", () => {
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

    it("should allow MANAGER to get reminder history", () => {
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

    it("should deny USER from getting reminder history", () => {
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

    it("should deny CONTRACTOR from getting reminder history", () => {
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

    it("should deny SUBCONTRACTOR from getting reminder history", () => {
      const context = createMockExecutionContext({
        id: "subcontractor-123",
        role: UserRole.SUBCONTRACTOR,
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

  describe("RBAC - Get Pending Reminders", () => {
    it("should allow SUPER_ADMIN to get pending reminders", () => {
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

    it("should allow ADMIN to get pending reminders", () => {
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

    it("should deny MANAGER from getting pending reminders", () => {
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

    it("should deny USER from getting pending reminders", () => {
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

    it("should deny CONTRACTOR from getting pending reminders", () => {
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

  describe("RBAC - Get Reminder Stats", () => {
    it("should allow SUPER_ADMIN to get reminder stats", () => {
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

    it("should allow ADMIN to get reminder stats", () => {
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

    it("should deny MANAGER from getting reminder stats", () => {
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

    it("should deny USER from getting reminder stats", () => {
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
  });

  describe("RBAC - Acknowledge Reminder", () => {
    it("should allow SUPER_ADMIN to acknowledge reminder", () => {
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

    it("should allow ADMIN to acknowledge reminder", () => {
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

    it("should allow MANAGER to acknowledge reminder", () => {
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

    it("should deny USER from acknowledging reminder", () => {
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

    it("should deny CONTRACTOR from acknowledging reminder", () => {
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

    it("should deny SUBCONTRACTOR from acknowledging reminder", () => {
      const context = createMockExecutionContext({
        id: "subcontractor-123",
        role: UserRole.SUBCONTRACTOR,
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
