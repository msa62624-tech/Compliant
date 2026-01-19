import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "@prisma/client";
import { RolesGuard } from "./roles.guard";
import { ROLES_KEY } from "../decorators/roles.decorator";

describe("RolesGuard", () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockExecutionContext = (user: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  describe("canActivate", () => {
    it("should be defined", () => {
      expect(guard).toBeDefined();
    });

    it("should allow access when no roles are required", () => {
      const context = createMockExecutionContext({
        id: "user-123",
        role: UserRole.USER,
      });

      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(null);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("should allow access when user has required role", () => {
      const context = createMockExecutionContext({
        id: "admin-123",
        role: UserRole.ADMIN,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it("should deny access when user does not have required role", () => {
      const context = createMockExecutionContext({
        id: "user-123",
        role: UserRole.USER,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN]);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it("should allow access when user has any of the required roles (multiple roles)", () => {
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

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("should deny access when user does not have any of the required roles (multiple roles)", () => {
      const context = createMockExecutionContext({
        id: "user-123",
        role: UserRole.USER,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.SUPER_ADMIN, UserRole.ADMIN]);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it("should allow SUPER_ADMIN role", () => {
      const context = createMockExecutionContext({
        id: "super-admin-123",
        role: UserRole.SUPER_ADMIN,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.SUPER_ADMIN]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("should allow CONTRACTOR role when required", () => {
      const context = createMockExecutionContext({
        id: "contractor-123",
        role: UserRole.CONTRACTOR,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.CONTRACTOR]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("should allow SUBCONTRACTOR role when required", () => {
      const context = createMockExecutionContext({
        id: "subcontractor-123",
        role: UserRole.SUBCONTRACTOR,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.SUBCONTRACTOR]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("should allow BROKER role when required", () => {
      const context = createMockExecutionContext({
        id: "broker-123",
        role: UserRole.BROKER,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.BROKER]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("should deny access when CONTRACTOR tries to access ADMIN endpoint", () => {
      const context = createMockExecutionContext({
        id: "contractor-123",
        role: UserRole.CONTRACTOR,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN]);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it("should deny access when ADMIN tries to access SUPER_ADMIN-only endpoint", () => {
      const context = createMockExecutionContext({
        id: "admin-123",
        role: UserRole.ADMIN,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.SUPER_ADMIN]);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it("should handle empty roles array by denying access", () => {
      const context = createMockExecutionContext({
        id: "user-123",
        role: UserRole.USER,
      });

      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([]);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });
  });
});
