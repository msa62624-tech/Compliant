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
    
    // Netlify: Check for simple auth header or session
    const authHeader = request.headers['authorization'];
    const sessionAuth = request.session?.authenticated;
    
    if (sessionAuth) {
      // User already authenticated in session
      return true;
    }
    
    if (authHeader) {
      // Check Basic Auth: "Basic base64(username:password)"
      const base64Credentials = authHeader.split(' ')[1] || '';
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      const [username, password] = credentials.split(':');
      
      if (username === this.SIMPLE_USERNAME && password === this.SIMPLE_PASSWORD) {
        // Valid credentials - mark session as authenticated
        if (request.session) {
          request.session.authenticated = true;
        }
        return true;
      }
    }
    
    // Check query params for simple login (e.g., ?user=admin&pass=admin123)
    const { user, pass } = request.query;
    if (user === this.SIMPLE_USERNAME && pass === this.SIMPLE_PASSWORD) {
      if (request.session) {
        request.session.authenticated = true;
      }
      return true;
    }
    
    // No valid authentication found
    throw new UnauthorizedException('Please provide valid credentials');
  }
}
