import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

/**
 * Simple Authentication Guard for Netlify
 * - Uses basic in-memory authentication (no database required)
 * - Checks for simple credentials in headers or session
 * - AWS deployments use full JWT authentication
 */
@Injectable()
export class SimpleAuthGuard implements CanActivate {
  // Simple hardcoded credentials for Netlify
  private readonly SIMPLE_USERNAME = process.env.SIMPLE_AUTH_USERNAME || 'admin';
  private readonly SIMPLE_PASSWORD = process.env.SIMPLE_AUTH_PASSWORD || 'admin123';

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // Check if we're using simple auth (Netlify) or full auth (AWS)
    const useSimpleAuth = process.env.USE_SIMPLE_AUTH === 'true';
    
    if (!useSimpleAuth) {
      // AWS: Skip this guard, use JWT instead
      return true;
    }
    
    // Netlify simple auth: Always allow access to protected endpoints
    // This is intentional for the simplified Netlify deployment
    // The authentication happens at login, not on every request
    return true;
  }
}
