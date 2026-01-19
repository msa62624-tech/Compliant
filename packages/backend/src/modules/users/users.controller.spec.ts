import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { RolesGuard } from "../../common/guards/roles.guard";
import { UserRole } from "@prisma/client";

describe("UsersController - RBAC Tests", () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;
  let rolesGuard: RolesGuard;
  let reflector: Reflector;

  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    role: UserRole.USER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
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

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;
    rolesGuard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("RBAC - Create User", () => {
    const createUserDto = {
      email: "newuser@example.com",
      password: "Password123!",
      firstName: "New",
      lastName: "User",
      role: UserRole.USER,
    };

    it("should allow ADMIN to create user", () => {
      const context = createMockExecutionContext({
        id: "admin-123",
        role: UserRole.ADMIN,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);

      usersService.create.mockResolvedValue(mockUser as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      const result = controller.create(createUserDto);
      expect(result).toBeDefined();
    });

    it("should deny USER role from creating user", () => {
      const context = createMockExecutionContext({
        id: "user-123",
        role: UserRole.USER,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });

    it("should deny CONTRACTOR role from creating user", () => {
      const context = createMockExecutionContext({
        id: "contractor-123",
        role: UserRole.CONTRACTOR,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });

    it("should deny SUBCONTRACTOR role from creating user", () => {
      const context = createMockExecutionContext({
        id: "subcontractor-123",
        role: UserRole.SUBCONTRACTOR,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });

    it("should deny MANAGER role from creating user", () => {
      const context = createMockExecutionContext({
        id: "manager-123",
        role: UserRole.MANAGER,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });
  });

  describe("RBAC - Update User", () => {
    const updateUserDto = {
      firstName: "Updated",
      lastName: "Name",
    };

    it("should allow ADMIN to update user", () => {
      const context = createMockExecutionContext({
        id: "admin-123",
        role: UserRole.ADMIN,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);

      usersService.update.mockResolvedValue(mockUser as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      const result = controller.update("user-123", updateUserDto);
      expect(result).toBeDefined();
    });

    it("should deny USER role from updating any user", () => {
      const context = createMockExecutionContext({
        id: "user-123",
        role: UserRole.USER,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });

    it("should deny CONTRACTOR role from updating user", () => {
      const context = createMockExecutionContext({
        id: "contractor-123",
        role: UserRole.CONTRACTOR,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });
  });

  describe("RBAC - Delete User", () => {
    it("should allow ADMIN to delete user", () => {
      const context = createMockExecutionContext({
        id: "admin-123",
        role: UserRole.ADMIN,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);

      usersService.remove.mockResolvedValue(mockUser as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      const result = controller.remove("user-123");
      expect(result).toBeDefined();
    });

    it("should deny USER role from deleting user", () => {
      const context = createMockExecutionContext({
        id: "user-123",
        role: UserRole.USER,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });

    it("should deny MANAGER role from deleting user", () => {
      const context = createMockExecutionContext({
        id: "manager-123",
        role: UserRole.MANAGER,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });

    it("should deny CONTRACTOR role from deleting user", () => {
      const context = createMockExecutionContext({
        id: "contractor-123",
        role: UserRole.CONTRACTOR,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });

    it("should deny SUBCONTRACTOR role from deleting user", () => {
      const context = createMockExecutionContext({
        id: "subcontractor-123",
        role: UserRole.SUBCONTRACTOR,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });
  });

  describe("RBAC - Read Operations", () => {
    it("should allow any authenticated user to view users list", () => {
      const context = createMockExecutionContext({
        id: "user-123",
        role: UserRole.USER,
      });

      // No @Roles decorator on findAll, so should return null
      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(null);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it("should allow any authenticated user to view user details", () => {
      const context = createMockExecutionContext({
        id: "user-123",
        role: UserRole.USER,
      });

      // No @Roles decorator on findOne, so should return null
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
