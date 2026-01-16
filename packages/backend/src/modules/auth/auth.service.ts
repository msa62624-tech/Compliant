import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from '../../config/prisma.service';

// Refresh token expiration in days
const REFRESH_TOKEN_EXPIRATION_DAYS = 7;

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
    
    // Set refresh token expiration to 7 days from now
    const refreshTokenExpiresAt = new Date();
    refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + REFRESH_TOKEN_EXPIRATION_DAYS);

    // Store refresh token in User model with expiration
    await this.prisma.user.update({
      where: { id: user.id },
      data: { 
        refreshToken: refreshTokenString,
        refreshTokenExpiresAt: refreshTokenExpiresAt,
      },
    });

    return {
      user,
      accessToken,
      refreshToken: refreshTokenString,
    };
  }

  async refresh(refreshTokenString: string) {
    try {
      // Find user with this refresh token
      const user = await this.prisma.user.findFirst({
        where: { refreshToken: refreshTokenString },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Validate refresh token expiration
      if (!user.refreshTokenExpiresAt || user.refreshTokenExpiresAt < new Date()) {
        // Clear expired token
        await this.prisma.user.update({
          where: { id: user.id },
          data: { refreshToken: null, refreshTokenExpiresAt: null },
        });
        throw new UnauthorizedException('Refresh token expired');
      }

      const newPayload = { email: user.email, sub: user.id, role: user.role };
      const accessToken = this.jwtService.sign(newPayload);

      // Rotate refresh token - generate new one with new expiration
      const newRefreshTokenString = crypto.randomBytes(32).toString('hex');
      const newRefreshTokenExpiresAt = new Date();
      newRefreshTokenExpiresAt.setDate(newRefreshTokenExpiresAt.getDate() + REFRESH_TOKEN_EXPIRATION_DAYS);
      
      await this.prisma.user.update({
        where: { id: user.id },
        data: { 
          refreshToken: newRefreshTokenString,
          refreshTokenExpiresAt: newRefreshTokenExpiresAt,
        },
      });

      return {
        accessToken,
        refreshToken: newRefreshTokenString,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    // Clear refresh token and expiration for user
    await this.prisma.user.update({
      where: { id: userId },
      data: { 
        refreshToken: null,
        refreshTokenExpiresAt: null,
      },
    });

    return { message: 'Logged out successfully' };
  }
}
