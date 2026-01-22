import { Injectable, ExecutionContext, UnauthorizedException, CanActivate } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Observable, isObservable, lastValueFrom } from 'rxjs';

/**
 * Global Auth Guard - FIXED VERSION
 * - Skips authentication for routes marked with @Public()
 * - In simple auth mode (Netlify), always allows access
 * - In full auth mode (AWS), validates JWT tokens
 * 
 * CRITICAL FIX: Does NOT extend AuthGuard('jwt') to avoid loading JWT strategy in simple auth mode
 */
@Injectable()
export class GlobalAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

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

    // Full auth mode: dynamically instantiate JWT guard only when needed
    try {
      const jwtGuard = new (AuthGuard('jwt'))();
      const result = jwtGuard.canActivate(context);
      
      // Handle both Observable and Promise return types
      if (isObservable(result)) {
        return await lastValueFrom(result as Observable<boolean>);
      }
      
      return result as boolean;
    } catch (error) {
      console.error('[GlobalAuthGuard] JWT validation error:', error);
      throw new UnauthorizedException('JWT validation failed');
    }
  }
}
