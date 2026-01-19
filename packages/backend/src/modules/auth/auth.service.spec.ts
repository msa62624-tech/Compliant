import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { UnauthorizedException } from "@nestjs/common";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { PrismaService } from "../../config/prisma.service";
import { UserRole } from "@prisma/client";

// Mock bcrypt at the module level
jest.mock("bcrypt", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import * as bcrypt from "bcrypt";

describe("AuthService", () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let prisma: jest.Mocked<PrismaService>;
  let mockLogger: {
    log: jest.Mock;
    warn: jest.Mock;
    error: jest.Mock;
    debug: jest.Mock;
  };

  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    password: "$2b$10$hashedPassword",
    firstName: "Test",
    lastName: "User",
    role: UserRole.USER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockLogger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            refreshToken: {
              create: jest.fn(),
              findUnique: jest.fn(),
              delete: jest.fn(),
              deleteMany: jest.fn(),
            },
            user: {
              update: jest.fn(),
            },
          },
        },
        {
          provide: WINSTON_MODULE_NEST_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("validateUser", () => {
    it("should return user without password when credentials are valid", async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userWithoutPassword } = mockUser;
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(
        "test@example.com",
        "password123",
      );

      expect(result).toEqual(userWithoutPassword);
      expect(usersService.findByEmail).toHaveBeenCalledWith("test@example.com");
    });

    it("should return null when user is not found", async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser(
        "nonexistent@example.com",
        "password123",
      );

      expect(result).toBeNull();
    });

    it("should return null when password is invalid", async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(
        "test@example.com",
        "wrongpassword",
      );

      expect(result).toBeNull();
    });
  });

  describe("login", () => {
    it("should return access token and refresh token on successful login", async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userWithoutPassword } = mockUser;
      const mockAccessToken = "mock-access-token";

      jest
        .spyOn(service, "validateUser")
        .mockResolvedValue(userWithoutPassword);
      jwtService.sign.mockReturnValue(mockAccessToken);
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({
        id: "refresh-token-id",
        userId: mockUser.id,
        selector: "mock-selector",
        verifier: "mock-verifier-hash",
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      const result = await service.login({
        email: "test@example.com",
        password: "password123",
      });

      expect(result.accessToken).toBe(mockAccessToken);
      expect(result.refreshToken).toBeDefined();
      expect(typeof result.refreshToken).toBe("string");
      expect(result.user).toEqual(userWithoutPassword);
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
        role: mockUser.role,
      });
    });

    it("should throw UnauthorizedException when credentials are invalid", async () => {
      jest.spyOn(service, "validateUser").mockResolvedValue(null);

      await expect(
        service.login({
          email: "test@example.com",
          password: "wrongpassword",
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should log failed login attempt", async () => {
      jest.spyOn(service, "validateUser").mockResolvedValue(null);

      try {
        await service.login({
          email: "test@example.com",
          password: "wrongpassword",
        });
      } catch {
        // Expected to throw
      }

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Failed login attempt",
          email: "test@example.com",
        }),
      );
    });

    it("should log successful login", async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userWithoutPassword } = mockUser;

      jest
        .spyOn(service, "validateUser")
        .mockResolvedValue(userWithoutPassword);
      jwtService.sign.mockReturnValue("mock-token");
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({
        id: "refresh-token-id",
        userId: mockUser.id,
        selector: "mock-selector",
        verifier: "mock-verifier-hash",
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      await service.login({
        email: "test@example.com",
        password: "password123",
      });

      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "User logged in successfully",
          userId: mockUser.id,
          email: mockUser.email,
        }),
      );
    });
  });

  describe("logout", () => {
    it("should delete all refresh tokens for user", async () => {
      (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({
        count: 1,
      });

      await service.logout("user-123");

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: "user-123" },
      });
    });

    it("should log successful logout", async () => {
      (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({
        count: 1,
      });

      await service.logout("user-123");

      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "User logged out successfully",
          userId: "user-123",
        }),
      );
    });
  });
});
