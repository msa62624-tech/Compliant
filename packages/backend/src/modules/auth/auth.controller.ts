import { Controller, Post, Body, Get, UseGuards, HttpCode, HttpStatus, Res, Req, UnauthorizedException } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

// Rate limiting configuration for login endpoint to prevent brute force attacks
const AUTH_THROTTLE_CONFIG = { default: { limit: 10, ttl: 60000 } };

// Rate limiting for refresh endpoint to prevent token enumeration attacks
const REFRESH_THROTTLE_CONFIG = { default: { limit: 20, ttl: 60000 } };

// Rate limiting for /me endpoint to prevent reconnaissance attacks
const ME_THROTTLE_CONFIG = { default: { limit: 100, ttl: 60000 } };

// Cookie configuration for secure token storage
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @Throttle(AUTH_THROTTLE_CONFIG)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(loginDto);
    
    // Set httpOnly cookies for tokens
    response.cookie(ACCESS_TOKEN_COOKIE, result.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    
    response.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    // Return user data without tokens (tokens are in cookies)
    return { user: result.user };
  }

  @Post('refresh')
  @Throttle(REFRESH_THROTTLE_CONFIG)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Body() body?: { refreshToken?: string }
  ) {
    // Try to get refresh token from cookie first, fallback to body for backward compatibility
    const refreshToken = request.cookies[REFRESH_TOKEN_COOKIE] || body?.refreshToken;
    
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }
    
    const result = await this.authService.refresh(refreshToken);
    
    // Set new httpOnly cookies
    response.cookie(ACCESS_TOKEN_COOKIE, result.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    
    response.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    return { success: true };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async logout(@GetUser('id') userId: string, @Res({ passthrough: true }) response: Response) {
    await this.authService.logout(userId);
    
    // Clear httpOnly cookies
    response.clearCookie(ACCESS_TOKEN_COOKIE, COOKIE_OPTIONS);
    response.clearCookie(REFRESH_TOKEN_COOKIE, COOKIE_OPTIONS);
    
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @Throttle(ME_THROTTLE_CONFIG)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'User retrieved' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async getProfile(@GetUser() user: { id: string; email: string; role: string }) {
    return user;
  }
}
