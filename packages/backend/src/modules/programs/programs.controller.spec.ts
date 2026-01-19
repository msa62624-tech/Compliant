import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ProgramsController } from "./programs.controller";
import { ProgramsService } from "./programs.service";
import { RolesGuard } from "../../common/guards/roles.guard";
import { UserRole } from "@prisma/client";

describe("ProgramsController - RBAC Tests", () => {
  let controller: ProgramsController;
  let programsService: jest.Mocked<ProgramsService>;
  let rolesGuard: RolesGuard;
  let reflector: Reflector;

  const mockProgram = {
    id: "program-123",
    name: "Test Program",
    description: "Test Description",
    isTemplate: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProgramsController],
      providers: [
        {
          provide: ProgramsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            getStatistics: jest.fn(),
            findByProject: jest.fn(),
            assignToProject: jest.fn(),
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

    controller = module.get<ProgramsController>(ProgramsController);
    programsService = module.get(
      ProgramsService,
    ) as jest.Mocked<ProgramsService>;
    rolesGuard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("RBAC - Create Program", () => {
    const createProgramDto = {
      name: "New Program",
      description: "Test",
      isTemplate: true,
    };

    const mockRequest = {
      user: { id: "user-123", role: UserRole.ADMIN },
    } as any;

    it("should allow ADMIN to create program", () => {
      const context = createMockExecutionContext({
        id: "admin-123",
        role: UserRole.ADMIN,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);

      programsService.create.mockResolvedValue(mockProgram as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      const result = controller.create(createProgramDto, mockRequest);
      expect(result).toBeDefined();
    });

    it("should allow SUPER_ADMIN to create program", () => {
      const context = createMockExecutionContext({
        id: "superadmin-123",
        role: UserRole.SUPER_ADMIN,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it("should deny MANAGER from creating program", () => {
      const context = createMockExecutionContext({
        id: "manager-123",
        role: UserRole.MANAGER,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });

    it("should deny USER from creating program", () => {
      const context = createMockExecutionContext({
        id: "user-123",
        role: UserRole.USER,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });

    it("should deny CONTRACTOR from creating program", () => {
      const context = createMockExecutionContext({
        id: "contractor-123",
        role: UserRole.CONTRACTOR,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });
  });

  describe("RBAC - Update Program", () => {
    const updateProgramDto = {
      name: "Updated Program",
    };

    it("should allow ADMIN to update program", () => {
      const context = createMockExecutionContext({
        id: "admin-123",
        role: UserRole.ADMIN,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);

      programsService.update.mockResolvedValue(mockProgram as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      const result = controller.update("program-123", updateProgramDto);
      expect(result).toBeDefined();
    });

    it("should allow SUPER_ADMIN to update program", () => {
      const context = createMockExecutionContext({
        id: "superadmin-123",
        role: UserRole.SUPER_ADMIN,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it("should deny MANAGER from updating program", () => {
      const context = createMockExecutionContext({
        id: "manager-123",
        role: UserRole.MANAGER,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });

    it("should deny USER from updating program", () => {
      const context = createMockExecutionContext({
        id: "user-123",
        role: UserRole.USER,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });
  });

  describe("RBAC - Delete Program (SUPER_ADMIN only)", () => {
    it("should allow SUPER_ADMIN to delete program", () => {
      const context = createMockExecutionContext({
        id: "superadmin-123",
        role: UserRole.SUPER_ADMIN,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.SUPER_ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);

      programsService.remove.mockResolvedValue(mockProgram as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      const result = controller.remove("program-123");
      expect(result).toBeDefined();
    });

    it("should deny ADMIN from deleting program", () => {
      const context = createMockExecutionContext({
        id: "admin-123",
        role: UserRole.ADMIN,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.SUPER_ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });

    it("should deny MANAGER from deleting program", () => {
      const context = createMockExecutionContext({
        id: "manager-123",
        role: UserRole.MANAGER,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.SUPER_ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });

    it("should deny USER from deleting program", () => {
      const context = createMockExecutionContext({
        id: "user-123",
        role: UserRole.USER,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.SUPER_ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });

    it("should deny CONTRACTOR from deleting program", () => {
      const context = createMockExecutionContext({
        id: "contractor-123",
        role: UserRole.CONTRACTOR,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.SUPER_ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });
  });

  describe("RBAC - Get Statistics", () => {
    it("should allow ADMIN to get statistics", () => {
      const context = createMockExecutionContext({
        id: "admin-123",
        role: UserRole.ADMIN,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it("should allow SUPER_ADMIN to get statistics", () => {
      const context = createMockExecutionContext({
        id: "superadmin-123",
        role: UserRole.SUPER_ADMIN,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

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
        .mockReturnValue([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });
  });

  describe("RBAC - Assign Program to Project", () => {
    it("should allow ADMIN to assign program to project", () => {
      const context = createMockExecutionContext({
        id: "admin-123",
        role: UserRole.ADMIN,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it("should allow SUPER_ADMIN to assign program to project", () => {
      const context = createMockExecutionContext({
        id: "superadmin-123",
        role: UserRole.SUPER_ADMIN,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it("should deny MANAGER from assigning program to project", () => {
      const context = createMockExecutionContext({
        id: "manager-123",
        role: UserRole.MANAGER,
      });

      jest
        .spyOn(reflector, "getAllAndOverride")
        .mockReturnValue([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(false);
    });
  });

  describe("RBAC - Read Operations", () => {
    it("should allow any authenticated user to view programs list", () => {
      const context = createMockExecutionContext({
        id: "user-123",
        role: UserRole.USER,
      });

      // No @Roles decorator on findAll
      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(null);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it("should allow any authenticated user to view program details", () => {
      const context = createMockExecutionContext({
        id: "user-123",
        role: UserRole.USER,
      });

      // No @Roles decorator on findOne
      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(null);

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it("should allow any authenticated user to view programs by project", () => {
      const context = createMockExecutionContext({
        id: "contractor-123",
        role: UserRole.CONTRACTOR,
      });

      // No @Roles decorator on findByProject
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
