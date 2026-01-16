import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { PrismaService } from '../../../config/prisma.service';
import { LoginDto } from '../dto/login.dto';

// Mock bcrypt module
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let prismaService: PrismaService;
  let mockLogger: any;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: '$2b$10$hashedPassword',
    role: 'USER',
    firstName: 'Test',
    lastName: 'User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserWithoutPassword = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'USER',
    firstName: 'Test',
    lastName: 'User',
    createdAt: mockUser.createdAt,
    updatedAt: mockUser.updatedAt,
  };

  beforeEach(async () => {
    // Reset bcrypt mocks
    (bcrypt.compare as jest.Mock).mockReset();
    (bcrypt.hash as jest.Mock).mockReset();

    mockLogger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
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
              findMany: jest.fn(),
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
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password if credentials are valid', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).toEqual(mockUserWithoutPassword);
      expect(result.password).toBeUndefined();
    });

    it('should return null if user not found', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should return tokens and user on successful login', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedVerifier');
      jest.spyOn(jwtService, 'sign').mockReturnValue('access-token-123');
      jest.spyOn(prismaService.refreshToken, 'create').mockResolvedValue({} as any);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken', 'access-token-123');
      expect(result).toHaveProperty('refreshToken');
      expect(result.refreshToken).toMatch(/^[a-f0-9]{32}:[a-f0-9]{64}$/);
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User logged in successfully',
          context: 'Auth',
          userId: mockUser.id,
          email: mockUser.email,
        }),
      );
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed login attempt',
          context: 'Auth',
          email: loginDto.email,
        }),
      );
    });

    it('should store refresh token in database with correct format', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedVerifier');
      jest.spyOn(jwtService, 'sign').mockReturnValue('access-token-123');
      const createSpy = jest.spyOn(prismaService.refreshToken, 'create').mockResolvedValue({} as any);

      await service.login(loginDto);

      expect(createSpy).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUser.id,
          selector: expect.stringMatching(/^[a-f0-9]{32}$/),
          verifier: 'hashedVerifier',
          expiresAt: expect.any(Date),
        }),
      });
    });
  });

  describe('refresh', () => {
    const validRefreshToken = 'a'.repeat(32) + ':' + 'b'.repeat(64);
    const mockTokenRecord = {
      id: 'token-123',
      userId: mockUser.id,
      selector: 'a'.repeat(32),
      verifier: '$2b$10$hashedVerifier',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      user: mockUserWithoutPassword,
    };

    it('should return new tokens on valid refresh token', async () => {
      jest.spyOn(prismaService.refreshToken, 'findUnique').mockResolvedValue(mockTokenRecord as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedVerifier');
      jest.spyOn(jwtService, 'sign').mockReturnValue('new-access-token');
      jest.spyOn(prismaService, '$transaction').mockResolvedValue([{}, {}] as any);

      const result = await service.refresh(validRefreshToken);

      expect(result).toHaveProperty('accessToken', 'new-access-token');
      expect(result).toHaveProperty('refreshToken');
      expect(result.refreshToken).toMatch(/^[a-f0-9]{32}:[a-f0-9]{64}$/);
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Token refreshed successfully',
          context: 'Auth',
          userId: mockUser.id,
        }),
      );
    });

    it('should throw UnauthorizedException if token format is invalid', async () => {
      await expect(service.refresh('invalid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if token has multiple colons', async () => {
      await expect(service.refresh('abc:def:ghi')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if selector length is incorrect', async () => {
      const invalidToken = 'abc123:' + 'b'.repeat(64);
      await expect(service.refresh(invalidToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if verifier length is incorrect', async () => {
      const invalidToken = 'a'.repeat(32) + ':abc123';
      await expect(service.refresh(invalidToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if token not found in database', async () => {
      jest.spyOn(prismaService.refreshToken, 'findUnique').mockResolvedValue(null);

      await expect(service.refresh(validRefreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if token is expired', async () => {
      const expiredTokenRecord = {
        ...mockTokenRecord,
        expiresAt: new Date(Date.now() - 1000),
      };
      jest.spyOn(prismaService.refreshToken, 'findUnique').mockResolvedValue(expiredTokenRecord as any);

      await expect(service.refresh(validRefreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if verifier does not match', async () => {
      jest.spyOn(prismaService.refreshToken, 'findUnique').mockResolvedValue(mockTokenRecord as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.refresh(validRefreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should use transaction to rotate refresh tokens atomically', async () => {
      jest.spyOn(prismaService.refreshToken, 'findUnique').mockResolvedValue(mockTokenRecord as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedVerifier');
      jest.spyOn(jwtService, 'sign').mockReturnValue('new-access-token');
      const transactionSpy = jest.spyOn(prismaService, '$transaction').mockResolvedValue([{}, {}] as any);

      await service.refresh(validRefreshToken);

      expect(transactionSpy).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should delete all refresh tokens for user', async () => {
      const deleteManySpy = jest.spyOn(prismaService.refreshToken, 'deleteMany').mockResolvedValue({ count: 2 } as any);

      await service.logout(mockUser.id);

      expect(deleteManySpy).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
      });
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User logged out successfully',
          context: 'Auth',
          userId: mockUser.id,
        }),
      );
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should delete expired tokens in batches', async () => {
      const expiredTokens = [{ id: 'token-1' }, { id: 'token-2' }];
      jest.spyOn(prismaService.refreshToken, 'findMany').mockResolvedValue(expiredTokens as any);
      const deleteManySpy = jest.spyOn(prismaService.refreshToken, 'deleteMany').mockResolvedValue({ count: 2 } as any);

      const result = await service.cleanupExpiredTokens(1000);

      expect(result).toBe(2);
      expect(deleteManySpy).toHaveBeenCalledWith({
        where: {
          id: { in: ['token-1', 'token-2'] },
        },
      });
    });

    it('should return 0 if no expired tokens found', async () => {
      jest.spyOn(prismaService.refreshToken, 'findMany').mockResolvedValue([]);

      const result = await service.cleanupExpiredTokens();

      expect(result).toBe(0);
    });
  });
});
