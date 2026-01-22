import { Injectable, ExecutionContext, CanActivate } from '@nestjs/common';
import { SimpleAuthGuard } from './simple-auth.guard';

/**
 * Conditional Auth Guard
 * - Uses simple authentication for Netlify (no database required)
 * - Uses full JWT authentication for AWS/production deployments
 */
@Injectable()
export class ConditionalAuthGuard implements CanActivate {
  private simpleAuthGuard = new SimpleAuthGuard();

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if using simple auth (Netlify)
    const useSimpleAuth = process.env.USE_SIMPLE_AUTH === 'true' || process.env.NETLIFY === 'true';
    
    if (useSimpleAuth) {
      // Netlify: Use simple authentication (always returns true for all requests)
      return this.simpleAuthGuard.canActivate(context);
    }
    
    // AWS: Use full JWT authentication
    // Lazy load AuthGuard ONLY when not in simple auth mode to avoid loading Passport/JWT strategy
    const { AuthGuard } = await import('@nestjs/passport');
    const jwtGuard = new (AuthGuard('jwt'))();
    const result = await jwtGuard.canActivate(context);
    return result as boolean;
  }
}
