import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SimpleAuthGuard } from './simple-auth.guard';

/**
 * Conditional Auth Guard
 * - Uses simple authentication for Netlify (no database required)
 * - Uses full JWT authentication for AWS/production deployments
 */
@Injectable()
export class ConditionalAuthGuard extends AuthGuard('jwt') {
  private simpleAuthGuard = new SimpleAuthGuard();

  canActivate(context: ExecutionContext) {
    // Check if using simple auth (Netlify)
    const useSimpleAuth = process.env.USE_SIMPLE_AUTH === 'true';
    
    if (useSimpleAuth) {
      // Netlify: Use simple authentication
      return this.simpleAuthGuard.canActivate(context);
    }
    
    // AWS: Use full JWT authentication
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Check if using simple auth (Netlify)
    const useSimpleAuth = process.env.USE_SIMPLE_AUTH === 'true';
    
    if (useSimpleAuth) {
      // Return a simple user for Netlify
      return {
        id: 'simple-user',
        email: 'admin@netlify.com',
        role: 'ADMIN',
      };
    }
    
    // AWS: Standard JWT authentication
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
