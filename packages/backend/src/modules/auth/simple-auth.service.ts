import { Injectable } from '@nestjs/common';

/**
 * Simple Authentication Service for Netlify
 * - No database required
 * - Returns mock user data
 * - Used when USE_SIMPLE_AUTH=true
 */
@Injectable()
export class SimpleAuthService {
  private readonly SIMPLE_USERNAME = process.env.SIMPLE_AUTH_USERNAME || 'admin';
  private readonly SIMPLE_PASSWORD = process.env.SIMPLE_AUTH_PASSWORD || 'admin123';

  async validateUser(identifier: string, password: string) {
    // Accept either username OR email (admin@compliant.com)
    const isValidIdentifier = 
      identifier === this.SIMPLE_USERNAME || 
      identifier === 'admin@compliant.com' ||
      identifier === 'admin@compliant.local';
    
    if (isValidIdentifier && password === this.SIMPLE_PASSWORD) {
      return {
        id: 'simple-user-1',
        email: 'admin@compliant.com',
        username: this.SIMPLE_USERNAME,
        role: 'admin',
      };
    }
    return null;
  }

  async login(identifier: string, password: string) {
    const user = await this.validateUser(identifier, password);
    
    if (!user) {
      return null;
    }

    // Return mock tokens for simple auth (camelCase to match AuthService)
    return {
      accessToken: 'simple-access-token',
      refreshToken: 'simple-refresh-token',
      user,
    };
  }

  getMockUser() {
    // Return mock user profile
    return {
      id: 'simple-user-1',
      email: 'admin@compliant.com',
      username: this.SIMPLE_USERNAME,
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async getProfile() {
    // Return mock user profile
    return this.getMockUser();
  }

  async refresh() {
    // Return mock refreshed tokens (camelCase to match AuthService)
    return {
      accessToken: 'simple-access-token-refreshed',
      refreshToken: 'simple-refresh-token-refreshed',
    };
  }

  async logout() {
    // Nothing to do for simple auth
    return { message: 'Logged out successfully' };
  }
}
