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

  async validateUser(username: string, password: string) {
    if (username === this.SIMPLE_USERNAME && password === this.SIMPLE_PASSWORD) {
      return {
        id: 'simple-user-1',
        email: 'admin@compliant.local',
        username: this.SIMPLE_USERNAME,
        role: 'admin',
      };
    }
    return null;
  }

  async login(username: string, password: string) {
    const user = await this.validateUser(username, password);
    
    if (!user) {
      return null;
    }

    // Return mock tokens for simple auth
    return {
      access_token: 'simple-access-token',
      refresh_token: 'simple-refresh-token',
      user,
    };
  }

  async getProfile() {
    // Return mock user profile
    return {
      id: 'simple-user-1',
      email: 'admin@compliant.local',
      username: this.SIMPLE_USERNAME,
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async refresh() {
    // Return mock refreshed tokens
    return {
      access_token: 'simple-access-token-refreshed',
      refresh_token: 'simple-refresh-token-refreshed',
    };
  }

  async logout() {
    // Nothing to do for simple auth
    return { message: 'Logged out successfully' };
  }
}
