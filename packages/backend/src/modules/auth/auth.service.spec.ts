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
              findMany: jest.fn(),
              delete: jest.fn(),
              deleteMany: jest.fn(),
            },
            user: {
              update: jest.fn(),
            },
            $transaction: jest.fn(),
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

  describe("refresh", () => {
    const mockSelector = "a".repeat(32); // 32 hex chars
    const mockVerifier = "b".repeat(64); // 64 hex chars
    const mockRefreshToken = `${mockSelector}:${mockVerifier}`;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should successfully refresh tokens with valid refresh token", async () => {
      const mockTokenRecord = {
        id: "token-id-123",
        userId: mockUser.id,
        selector: mockSelector,
        verifier: "$2b$10$hashedVerifier",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        createdAt: new Date(),
        user: mockUser,
      };

      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(
        mockTokenRecord,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue("$2b$10$newHashedVerifier");
      jwtService.sign.mockReturnValue("new-access-token");
      (prisma.$transaction as jest.Mock).mockResolvedValue([
        { id: "new-token-id" },
        { id: "token-id-123" },
      ]);

      const result = await service.refresh(mockRefreshToken);

      expect(result.accessToken).toBe("new-access-token");
      expect(result.refreshToken).toBeDefined();
      expect(typeof result.refreshToken).toBe("string");
      expect(result.refreshToken).toContain(":");
      expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { selector: mockSelector },
        include: { user: true },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        mockVerifier,
        mockTokenRecord.verifier,
      );
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should throw UnauthorizedException for invalid refresh token format (no colon)", async () => {
      const invalidToken = "invalidtokenwithnocolon";

      await expect(service.refresh(invalidToken)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Token refresh failed",
        }),
      );
    });

    it("should throw UnauthorizedException for invalid refresh token format (multiple colons)", async () => {
      const invalidToken = "part1:part2:part3";

      await expect(service.refresh(invalidToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException for invalid selector format (wrong length)", async () => {
      const invalidToken = "short:b".repeat(64);

      await expect(service.refresh(invalidToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException for invalid verifier format (wrong length)", async () => {
      const invalidToken = `${"a".repeat(32)}:short`;

      await expect(service.refresh(invalidToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException for non-hex selector", async () => {
      const invalidToken = `${"z".repeat(32)}:${"b".repeat(64)}`;

      await expect(service.refresh(invalidToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException for non-hex verifier", async () => {
      const invalidToken = `${"a".repeat(32)}:${"z".repeat(64)}`;

      await expect(service.refresh(invalidToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException when token record not found", async () => {
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.refresh(mockRefreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException when token is expired", async () => {
      const expiredTokenRecord = {
        id: "token-id-123",
        userId: mockUser.id,
        selector: mockSelector,
        verifier: "$2b$10$hashedVerifier",
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        createdAt: new Date(),
        user: mockUser,
      };

      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(
        expiredTokenRecord,
      );

      await expect(service.refresh(mockRefreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException when verifier does not match", async () => {
      const mockTokenRecord = {
        id: "token-id-123",
        userId: mockUser.id,
        selector: mockSelector,
        verifier: "$2b$10$hashedVerifier",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        user: mockUser,
      };

      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(
        mockTokenRecord,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.refresh(mockRefreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should use transaction to atomically create new token and delete old token", async () => {
      const mockTokenRecord = {
        id: "token-id-123",
        userId: mockUser.id,
        selector: mockSelector,
        verifier: "$2b$10$hashedVerifier",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        user: mockUser,
      };

      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(
        mockTokenRecord,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue("$2b$10$newHashedVerifier");
      jwtService.sign.mockReturnValue("new-access-token");

      (prisma.$transaction as jest.Mock).mockResolvedValue([
        { id: "new-token-id" },
        { id: "token-id-123" },
      ]);

      await service.refresh(mockRefreshToken);

      // Verify transaction was called with an array of operations
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      const transactionArg = (prisma.$transaction as jest.Mock).mock
        .calls[0][0];
      expect(Array.isArray(transactionArg)).toBe(true);
      expect(transactionArg).toHaveLength(2);
    });

    it("should log successful token refresh", async () => {
      const mockTokenRecord = {
        id: "token-id-123",
        userId: mockUser.id,
        selector: mockSelector,
        verifier: "$2b$10$hashedVerifier",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        user: mockUser,
      };

      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(
        mockTokenRecord,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue("$2b$10$newHashedVerifier");
      jwtService.sign.mockReturnValue("new-access-token");
      (prisma.$transaction as jest.Mock).mockResolvedValue([
        { id: "new-token-id" },
        { id: "token-id-123" },
      ]);

      await service.refresh(mockRefreshToken);

      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Token refreshed successfully",
          userId: mockUser.id,
        }),
      );
    });

    it("should generate new selector and verifier for rotation", async () => {
      const mockTokenRecord = {
        id: "token-id-123",
        userId: mockUser.id,
        selector: mockSelector,
        verifier: "$2b$10$hashedVerifier",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        user: mockUser,
      };

      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(
        mockTokenRecord,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue("$2b$10$newHashedVerifier");
      jwtService.sign.mockReturnValue("new-access-token");
      (prisma.$transaction as jest.Mock).mockResolvedValue([
        { id: "new-token-id" },
        { id: "token-id-123" },
      ]);

      const result = await service.refresh(mockRefreshToken);

      // New refresh token should be different from old one
      expect(result.refreshToken).not.toBe(mockRefreshToken);
      // New refresh token should have valid format
      const [newSelector, newVerifier] = result.refreshToken.split(":");
      expect(newSelector).toHaveLength(32);
      expect(newVerifier).toHaveLength(64);
      expect(newSelector).toMatch(/^[a-f0-9]{32}$/i);
      expect(newVerifier).toMatch(/^[a-f0-9]{64}$/i);
    });
  });

  describe("cleanupExpiredTokens", () => {
    it("should delete expired tokens in batch", async () => {
      const expiredTokens = [
        { id: "token-1" },
        { id: "token-2" },
        { id: "token-3" },
      ];

      (prisma.refreshToken.findMany as jest.Mock).mockResolvedValue(
        expiredTokens,
      );
      (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({
        count: 3,
      });

      const result = await service.cleanupExpiredTokens(1000);

      expect(result).toBe(3);
      expect(prisma.refreshToken.findMany).toHaveBeenCalledWith({
        where: { expiresAt: { lt: expect.any(Date) } },
        select: { id: true },
        take: 1000,
      });
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ["token-1", "token-2", "token-3"] } },
      });
    });

    it("should use default batch size of 1000", async () => {
      const expiredTokens = [{ id: "token-1" }];

      (prisma.refreshToken.findMany as jest.Mock).mockResolvedValue(
        expiredTokens,
      );
      (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({
        count: 1,
      });

      await service.cleanupExpiredTokens();

      expect(prisma.refreshToken.findMany).toHaveBeenCalledWith({
        where: { expiresAt: { lt: expect.any(Date) } },
        select: { id: true },
        take: 1000,
      });
    });

    it("should return 0 when no expired tokens found", async () => {
      (prisma.refreshToken.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.cleanupExpiredTokens();

      expect(result).toBe(0);
      expect(prisma.refreshToken.deleteMany).not.toHaveBeenCalled();
    });

    it("should respect custom batch size parameter", async () => {
      const expiredTokens = Array.from({ length: 50 }, (_, i) => ({
        id: `token-${i}`,
      }));

      (prisma.refreshToken.findMany as jest.Mock).mockResolvedValue(
        expiredTokens,
      );
      (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({
        count: 50,
      });

      const result = await service.cleanupExpiredTokens(50);

      expect(result).toBe(50);
      expect(prisma.refreshToken.findMany).toHaveBeenCalledWith({
        where: { expiresAt: { lt: expect.any(Date) } },
        select: { id: true },
        take: 50,
      });
    });

    it("should log successful cleanup", async () => {
      const expiredTokens = [{ id: "token-1" }, { id: "token-2" }];

      (prisma.refreshToken.findMany as jest.Mock).mockResolvedValue(
        expiredTokens,
      );
      (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({
        count: 2,
      });

      await service.cleanupExpiredTokens();

      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Cleaned up expired refresh tokens",
          count: 2,
        }),
      );
    });

    it("should only query for tokens with expiresAt in the past", async () => {
      const beforeCall = new Date();
      (prisma.refreshToken.findMany as jest.Mock).mockResolvedValue([]);

      await service.cleanupExpiredTokens();

      const callArgs = (prisma.refreshToken.findMany as jest.Mock).mock
        .calls[0][0];
      const queriedDate = callArgs.where.expiresAt.lt;

      // The queried date should be close to now (within 1 second)
      expect(queriedDate.getTime()).toBeGreaterThanOrEqual(
        beforeCall.getTime(),
      );
      expect(queriedDate.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });
});
