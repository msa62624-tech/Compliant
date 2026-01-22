import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  UnauthorizedException,
  Optional,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Response, Request } from "express";
import { AuthService } from "./auth.service";
import { SimpleAuthService } from "./simple-auth.service";
import { LoginDto } from "./dto/login.dto";
import { Public } from "../../common/decorators/public.decorator";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";

// Rate limiting configuration
const AUTH_THROTTLE_CONFIG = { default: { limit: 10, ttl: 60000 } };
const REFRESH_THROTTLE_CONFIG = { default: { limit: 20, ttl: 60000 } };
const ME_THROTTLE_CONFIG = { default: { limit: 100, ttl: 60000 } };

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(
    private simpleAuthService: SimpleAuthService,
    @Optional() private authService: AuthService,
  ) {
    if (!this.authService) {
      console.log('[AuthController] Running in SIMPLE AUTH mode');
    }
  }
  
  private get useSimpleAuth(): boolean {
    return process.env.USE_SIMPLE_AUTH === 'true' || process.env.NETLIFY === 'true';
  }

  @Public()
  @Post("login")
  @Throttle(AUTH_THROTTLE_CONFIG)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "User login" })
  @ApiResponse({ status: 200, description: "Login successful" })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      if (this.useSimpleAuth) {
        const identifier = loginDto.username || loginDto.email || '';
        const result = await this.simpleAuthService.login(
          identifier,
          loginDto.password,
        );
        
        if (!result) {
          throw new UnauthorizedException('Invalid credentials');
        }
        
        return {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        };
      } else {
        // Full auth with database
        if (!this.authService) {
          throw new UnauthorizedException('Auth service not available');
        }
        
        const result = await this.authService.login(loginDto);
        
        return {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        };
      }
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  @Get("me")
  @Throttle(ME_THROTTLE_CONFIG)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get current user" })
  @ApiResponse({ status: 200, description: "User retrieved successfully" })
  async me(@Req() req: Request) {
    if (this.useSimpleAuth) {
      // Simple auth: return mock user
      return this.simpleAuthService.getMockUser();
    } else {
      // Full auth: return user from JWT
      const user = (req as any).user;
      if (!user) {
        throw new UnauthorizedException();
      }
      return user;
    }
  }
}
