import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Response, Request } from "express";
import { AuthService } from "./auth.service";
import { SimpleAuthService } from "./simple-auth.service";
import { LoginDto } from "./dto/login.dto";
import { ConditionalAuthGuard } from "./guards/jwt-auth.guard";
import { GetUser } from "../../common/decorators/get-user.decorator";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";

// Rate limiting configuration for login endpoint to prevent brute force attacks
const AUTH_THROTTLE_CONFIG = { default: { limit: 10, ttl: 60000 } };

// Rate limiting for refresh endpoint to prevent token enumeration attacks
const REFRESH_THROTTLE_CONFIG = { default: { limit: 20, ttl: 60000 } };

// Rate limiting for /me endpoint to prevent reconnaissance attacks
const ME_THROTTLE_CONFIG = { default: { limit: 100, ttl: 60000 } };

// Cookie configuration for secure token storage
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

const ACCESS_TOKEN_COOKIE = "access_token";
const REFRESH_TOKEN_COOKIE = "refresh_token";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private simpleAuthService: SimpleAuthService,
  ) {}
  
  // Check environment variable at runtime, not at class initialization
  private get useSimpleAuth(): boolean {
    return process.env.USE_SIMPLE_AUTH === 'true' || process.env.USE_SIMPLE_AUTH === '1';
  }

  @Post("login")
  @Throttle(AUTH_THROTTLE_CONFIG)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "User login" })
  @ApiResponse({ status: 200, description: "Login successful" })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      // Use simple auth for Netlify, full auth for AWS
      if (this.useSimpleAuth) {
        console.log('[SimpleAuth] Processing login with identifier:', loginDto.email || loginDto.username);
        
        // Accept either username or email for simple auth
        const identifier = loginDto.username || loginDto.email || '';
        const result = await this.simpleAuthService.login(
          identifier,
          loginDto.password,
        );
        
        if (!result) {
          console.log('[SimpleAuth] Login failed - invalid credentials');
          throw new UnauthorizedException('Invalid credentials');
        }
        
        console.log('[SimpleAuth] Login successful for user:', result.user.email);
        // For simple auth, just return user data (no real tokens)
        return { user: result.user, message: 'Logged in successfully' };
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('[Auth] Login error:', error.message, error.stack);
      } else {
        console.error('[Auth] Login error:', error);
      }
      throw error;
    }

    // Full JWT authentication (AWS)
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

    // In test/development mode, also return tokens in response body for API testing
    // In production, tokens are only in httpOnly cookies for security
    if (
      process.env.NODE_ENV === "test" ||
      process.env.NODE_ENV === "development"
    ) {
      return {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      };
    }

    // Return user data without tokens (tokens are in cookies)
    return { user: result.user };
  }

  @Post("refresh")
  @Throttle(REFRESH_THROTTLE_CONFIG)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Refresh access token" })
  @ApiResponse({ status: 200, description: "Token refreshed" })
  @ApiResponse({ status: 401, description: "Invalid refresh token" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Body() body?: { refreshToken?: string },
  ) {
    // Simple auth doesn't need refresh
    if (this.useSimpleAuth) {
      return { success: true, message: 'Simple auth active' };
    }
    
    // Try to get refresh token from cookie first, fallback to body for backward compatibility
    const refreshToken =
      request.cookies[REFRESH_TOKEN_COOKIE] || body?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException("No refresh token provided");
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

  @Post("logout")
  @UseGuards(ConditionalAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "User logout" })
  @ApiResponse({ status: 200, description: "Logout successful" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async logout(
    @GetUser("id") userId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    // Simple auth doesn't need logout logic
    if (this.useSimpleAuth) {
      return { message: "Logged out successfully" };
    }
    
    await this.authService.logout(userId);

    // Clear httpOnly cookies
    response.clearCookie(ACCESS_TOKEN_COOKIE, COOKIE_OPTIONS);
    response.clearCookie(REFRESH_TOKEN_COOKIE, COOKIE_OPTIONS);

    return { message: "Logged out successfully" };
  }

  @Get("me")
  @Throttle(ME_THROTTLE_CONFIG)
  @UseGuards(ConditionalAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get current user" })
  @ApiResponse({ status: 200, description: "User retrieved" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async getProfile(
    @GetUser() user: { id: string; email: string; role: string },
  ) {
    // Return mock profile for simple auth
    if (this.useSimpleAuth) {
      return await this.simpleAuthService.getProfile();
    }
    
    return user;
  }
}
