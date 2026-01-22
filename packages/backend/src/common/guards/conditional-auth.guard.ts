import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Conditional Auth Guard
 * - Disables authentication when DISABLE_AUTH=true (for Netlify)
 * - Enables full authentication for AWS/production deployments
 */
@Injectable()
export class ConditionalAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Check if authentication is disabled via environment variable
    const authDisabled = process.env.DISABLE_AUTH === 'true';
    
    if (authDisabled) {
      // Skip authentication - allow all requests
      return true;
    }
    
    // Full authentication enabled - use JWT guard
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    // If auth is disabled, create a mock user
    const authDisabled = process.env.DISABLE_AUTH === 'true';
    
    if (authDisabled) {
      // Return a mock user for open access
      return {
        id: 'netlify-user',
        email: 'netlify@example.com',
        role: 'ADMIN',
      };
    }
    
    // Standard JWT authentication
    if (err || !user) {
      throw err || new Error('Unauthorized');
    }
    return user;
  }
}
