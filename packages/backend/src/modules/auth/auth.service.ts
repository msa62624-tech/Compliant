import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
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
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    
    // Generate refresh token
    const refreshTokenString = crypto.randomBytes(32).toString('hex');
    const refreshTokenExpiration = this.getRefreshTokenExpiration();

    // Store refresh token in RefreshToken table with rotation
    const refreshToken = await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenString,
        userId: user.id,
        expiresAt: refreshTokenExpiration,
      },
    });

    // Clean up old refresh tokens for this user (keep only last 5)
    await this.cleanupOldRefreshTokens(user.id);

    return {
      user,
      accessToken,
      refreshToken: refreshToken.token,
    };
  }

  async refresh(refreshTokenString: string) {
    try {
      // Find refresh token in database
      const refreshToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshTokenString },
        include: { user: true },
      });

      if (!refreshToken || refreshToken.revoked) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if token is expired
      if (new Date() > refreshToken.expiresAt) {
        // Revoke expired token
        await this.prisma.refreshToken.update({
          where: { id: refreshToken.id },
          data: { revoked: true },
        });
        throw new UnauthorizedException('Refresh token expired');
      }

      const user = refreshToken.user;
      const newPayload = { email: user.email, sub: user.id, role: user.role };
      const accessToken = this.jwtService.sign(newPayload);

      // Rotate refresh token - revoke old one and create new one
      await this.prisma.refreshToken.update({
        where: { id: refreshToken.id },
        data: { revoked: true },
      });

      const newRefreshTokenString = crypto.randomBytes(32).toString('hex');
      const newRefreshToken = await this.prisma.refreshToken.create({
        data: {
          token: newRefreshTokenString,
          userId: user.id,
          expiresAt: this.getRefreshTokenExpiration(),
        },
      });

      return {
        accessToken,
        refreshToken: newRefreshToken.token,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, refreshToken?: string) {
    // Revoke specific refresh token if provided
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: {
          userId,
          token: refreshToken,
        },
        data: { revoked: true },
      });
    } else {
      // Revoke all refresh tokens for user
      await this.prisma.refreshToken.updateMany({
        where: { userId },
        data: { revoked: true },
      });
    }

    return { message: 'Logged out successfully' };
  }

  private getRefreshTokenExpiration(): Date {
    const expirationDays = 7; // Default 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);
    return expiresAt;
  }

  private async cleanupOldRefreshTokens(userId: string): Promise<void> {
    // Get all refresh tokens for user, ordered by creation date
    const tokens = await this.prisma.refreshToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Keep only the 5 most recent, revoke the rest
    if (tokens.length > 5) {
      const tokensToRevoke = tokens.slice(5);
      await this.prisma.refreshToken.updateMany({
        where: {
          id: { in: tokensToRevoke.map((t) => t.id) },
        },
        data: { revoked: true },
      });
    }
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { revoked: true },
        ],
      },
    });
  }
}
