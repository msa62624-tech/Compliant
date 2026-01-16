import { Injectable, UnauthorizedException, Inject, LoggerService } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from '../../config/prisma.service';

// Refresh token expiration in days
const REFRESH_TOKEN_EXPIRATION_DAYS = 7;

// Salt rounds for bcrypt hashing of refresh tokens
const REFRESH_TOKEN_SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      // Log failed login attempt
      this.logger.warn({
        message: 'Failed login attempt',
        context: 'Auth',
        email: loginDto.email,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    
    // Generate refresh token
    const refreshTokenString = crypto.randomBytes(32).toString('hex');
    
    // Hash the refresh token before storing
    const refreshTokenHash = await bcrypt.hash(refreshTokenString, REFRESH_TOKEN_SALT_ROUNDS);
    
    // Set refresh token expiration to 7 days from now
    const refreshTokenExpiresAt = new Date();
    refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + REFRESH_TOKEN_EXPIRATION_DAYS);

    // Store hashed refresh token in User model with expiration
    await this.prisma.user.update({
      where: { id: user.id },
      data: { 
        refreshTokenHash: refreshTokenHash,
        refreshTokenExpiresAt: refreshTokenExpiresAt,
      },
    });

    // Log successful login
    this.logger.log({
      message: 'User logged in successfully',
      context: 'Auth',
      userId: user.id,
      email: user.email,
    });

    return {
      user,
      accessToken,
      refreshToken: refreshTokenString,
    };
  }

  async refresh(refreshTokenString: string) {
    try {
      // Find all users with non-null, non-expired refresh tokens
      // This prevents timing attacks by always performing the same database query
      // Limited to 1000 users to prevent DoS (most apps will have far fewer active sessions)
      const users = await this.prisma.user.findMany({
        where: {
          refreshTokenHash: { not: null },
          refreshTokenExpiresAt: { gte: new Date() },
        },
        take: 1000,
      });

      // Find the user with a matching refresh token hash using constant-time comparison
      let validUser = null;
      for (const user of users) {
        if (user.refreshTokenHash) {
          // Use bcrypt.compare which includes constant-time comparison
          const isValid = await bcrypt.compare(refreshTokenString, user.refreshTokenHash);
          if (isValid) {
            validUser = user;
            // Continue checking all tokens to maintain constant-time behavior
          }
        }
      }

      if (!validUser) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newPayload = { email: validUser.email, sub: validUser.id, role: validUser.role };
      const accessToken = this.jwtService.sign(newPayload);

      // Rotate refresh token - generate new one with new expiration
      const newRefreshTokenString = crypto.randomBytes(32).toString('hex');
      const newRefreshTokenHash = await bcrypt.hash(newRefreshTokenString, REFRESH_TOKEN_SALT_ROUNDS);
      const newRefreshTokenExpiresAt = new Date();
      newRefreshTokenExpiresAt.setDate(newRefreshTokenExpiresAt.getDate() + REFRESH_TOKEN_EXPIRATION_DAYS);
      
      await this.prisma.user.update({
        where: { id: validUser.id },
        data: { 
          refreshTokenHash: newRefreshTokenHash,
          refreshTokenExpiresAt: newRefreshTokenExpiresAt,
        },
      });

      // Log token refresh
      this.logger.log({
        message: 'Token refreshed successfully',
        context: 'Auth',
        userId: validUser.id,
      });

      return {
        accessToken,
        refreshToken: newRefreshTokenString,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error({
        message: 'Token refresh failed',
        context: 'Auth',
        error: errorMessage,
      });
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    // Clear refresh token hash and expiration for user
    await this.prisma.user.update({
      where: { id: userId },
      data: { 
        refreshTokenHash: null,
        refreshTokenExpiresAt: null,
      },
    });

    // Log logout
    this.logger.log({
      message: 'User logged out successfully',
      context: 'Auth',
      userId,
    });

    return { message: 'Logged out successfully' };
  }
}
