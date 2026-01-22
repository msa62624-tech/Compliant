import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Global Auth Guard
 * - Skips authentication for routes marked with @Public()
 * - In simple auth mode (Netlify), always allows access
 * - In full auth mode (AWS), validates JWT tokens
 */
@Injectable()
export class GlobalAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Check if using simple auth (Netlify)
    const useSimpleAuth = process.env.USE_SIMPLE_AUTH === 'true' || process.env.NETLIFY === 'true';
    
    if (useSimpleAuth) {
      // Simple auth mode: allow all requests (auth already done at login)
      return true;
    }

    // Full auth mode: validate JWT
    return super.canActivate(context) as Promise<boolean>;
  }

  handleRequest(err: any, user: any, info: any) {
    // In simple auth mode, don't throw errors
    const useSimpleAuth = process.env.USE_SIMPLE_AUTH === 'true' || process.env.NETLIFY === 'true';
    
    if (useSimpleAuth) {
      return user || {}; // Return empty user object in simple auth
    }

    // In full auth mode, throw error if no user
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
