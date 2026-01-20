import { test as base, expect } from '@playwright/test';

/**
 * Enhanced E2E Test Fixtures with Token Refresh, Retry Logic, and Test Isolation
 * 
 * Addresses all root causes of E2E test failures:
 * 1. Token refresh logic - Auto-refresh during long workflows
 * 2. Test user permissions - Proper role and permission handling
 * 3. Test isolation - Cleanup between tests
 * 4. Rate limiting - Exponential backoff with retries
 * 5. Async/timeout handling - Better waits and conditions
 */

// API Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const API_PATH = '/api';
const API_VERSION = '1';
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // Refresh if token expires in < 5 minutes

// Pre-seeded admin credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@compliant.com',
  password: 'Admin123!@#'
};

interface TokenInfo {
  token: string;
  expiresAt: number;
  email: string;
  password: string;
  role: string;
}

interface TestContext {
  // Token management
  adminToken: TokenInfo | null;
  tokens: Map<string, TokenInfo>;
  
  // API helpers with auto-refresh and retry
  apiCall: (endpoint: string, method: string, token: string, body?: any, retries?: number) => Promise<any>;
  getAuthToken: (email: string, password: string) => Promise<string>;
  refreshTokenIfNeeded: (email: string) => Promise<string>;
  
  // Test isolation helpers
  createdResources: {
    contractors: string[];
    projects: string[];
    cois: string[];
  };
  cleanup: () => Promise<void>;
}

// Helper: Calculate token expiration from JWT
function getTokenExpiration(token: string): number {
  try {
    // Validate JWT format (3 parts separated by dots)
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('Invalid JWT format, assuming 2 hour expiration');
      return Date.now() + 2 * 60 * 60 * 1000;
    }
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Validate exp field exists and is a number
    if (typeof payload.exp !== 'number') {
      console.warn('JWT missing exp field, assuming 2 hour expiration');
      return Date.now() + 2 * 60 * 60 * 1000;
    }
    
    return payload.exp * 1000; // Convert to milliseconds
  } catch (e) {
    console.warn('Failed to parse JWT:', e);
    // If we can't parse, assume 2 hours from now (default JWT_EXPIRATION)
    return Date.now() + 2 * 60 * 60 * 1000;
  }
}

// Helper: Exponential backoff retry with rate limiting detection
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a rate limiting error (429)
      const isRateLimited = error.message?.includes('429') || 
                           error.message?.includes('Too Many Requests') ||
                           error.message?.includes('rate limit');
      
      // Check if it's a token expiration error (401)
      const isAuthError = error.message?.includes('401') || 
                         error.message?.includes('Unauthorized') ||
                         error.message?.includes('token');
      
      if (attempt < maxRetries) {
        // Calculate exponential backoff delay
        let delay = baseDelay * Math.pow(2, attempt);
        
        // Add jitter to prevent thundering herd
        delay = delay + Math.random() * 1000;
        
        // Longer delay for rate limiting
        if (isRateLimited) {
          delay = Math.max(delay, 5000); // At least 5 seconds for rate limits
          console.log(`⏳ Rate limited (429), retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})`);
        } else if (isAuthError) {
          console.log(`🔐 Auth error, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})`);
        } else {
          console.log(`🔄 Retry in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})`);
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Operation failed after retries');
}

// Extend Playwright test with fixtures
export const test = base.extend<TestContext>({
  // Token storage
  adminToken: async ({}, use) => {
    await use(null);
  },
  
  tokens: async ({}, use) => {
    const tokens = new Map<string, TokenInfo>();
    await use(tokens);
  },
  
  // Track created resources for cleanup
  createdResources: async ({}, use) => {
    const resources = {
      contractors: [] as string[],
      projects: [] as string[],
      cois: [] as string[]
    };
    await use(resources);
  },
  
  // Get auth token with retry
  getAuthToken: async ({ tokens }, use) => {
    const getAuthToken = async (email: string, password: string): Promise<string> => {
      return await retryWithBackoff(async () => {
        const response = await fetch(`${API_BASE_URL}${API_PATH}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Version': API_VERSION,
          },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Login failed (${response.status}): ${error}`);
        }

        const data = await response.json();
        const token = data.accessToken;
        
        // Store token info with password for future refresh
        // NOTE: Storing passwords in test fixtures is acceptable for E2E testing
        // In production, implement a refresh token endpoint instead of re-authentication
        // Security trade-off: Test convenience vs password storage
        // Mitigation: Only used in test environment, never in production code
        tokens.set(email, {
          token,
          expiresAt: getTokenExpiration(token),
          email,
          password, // Stored for token refresh during long test workflows
          role: data.user?.role || 'unknown'
        });
        
        console.log(`✓ Authenticated ${email} (role: ${data.user?.role || 'unknown'})`);
        return token;
      }, 3, 1000);
    };
    
    await use(getAuthToken);
  },
  
  // Refresh token if needed
  refreshTokenIfNeeded: async ({ tokens, getAuthToken }, use) => {
    const refreshTokenIfNeeded = async (email: string): Promise<string> => {
      const tokenInfo = tokens.get(email);
      
      if (!tokenInfo) {
        throw new Error(`No token found for ${email}. Must login first.`);
      }
      
      // Check if token is about to expire
      const timeUntilExpiry = tokenInfo.expiresAt - Date.now();
      
      if (timeUntilExpiry < TOKEN_REFRESH_THRESHOLD) {
        console.log(`🔄 Token for ${email} expires in ${Math.round(timeUntilExpiry / 1000)}s, refreshing...`);
        
        // Re-authenticate using stored password
        return await getAuthToken(email, tokenInfo.password);
      }
      
      return tokenInfo.token;
    };
    
    await use(refreshTokenIfNeeded);
  },
  
  // API call with auto-refresh and retry
  apiCall: async ({ tokens, refreshTokenIfNeeded, createdResources }, use) => {
    const apiCall = async (
      endpoint: string,
      method: string,
      token: string,
      body?: any,
      retries: number = 3
    ): Promise<any> => {
      return await retryWithBackoff(async () => {
        // Try to refresh token if we have email
        const tokenInfo = Array.from(tokens.values()).find(t => t.token === token);
        let actualToken = token;
        
        if (tokenInfo) {
          actualToken = await refreshTokenIfNeeded(tokenInfo.email);
        }
        
        const response = await fetch(`${API_BASE_URL}${API_PATH}${endpoint}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${actualToken}`,
            'X-API-Version': API_VERSION,
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        const responseText = await response.text();
        
        if (!response.ok) {
          throw new Error(`API call failed (${response.status}): ${responseText}`);
        }

        const result = responseText ? JSON.parse(responseText) : null;
        
        // Track created resources for cleanup
        if (method === 'POST' && result?.id) {
          if (endpoint.startsWith('/contractors')) {
            createdResources.contractors.push(result.id);
          } else if (endpoint.startsWith('/projects')) {
            createdResources.projects.push(result.id);
          } else if (endpoint.startsWith('/generated-coi')) {
            createdResources.cois.push(result.id);
          }
        }
        
        return result;
      }, retries, 1000);
    };
    
    await use(apiCall);
  },
  
  // Cleanup after each test
  cleanup: async ({ createdResources, tokens }, use) => {
    await use(async () => {
      console.log('\n🧹 Cleaning up test resources...');
      
      // Get admin token for cleanup
      const adminTokenInfo = Array.from(tokens.values()).find(
        t => t.email === ADMIN_CREDENTIALS.email
      );
      
      if (!adminTokenInfo) {
        console.log('⚠️ No admin token available for cleanup');
        return;
      }
      
      const token = adminTokenInfo.token;
      
      // Clean up COIs
      for (const coiId of createdResources.cois) {
        try {
          await fetch(`${API_BASE_URL}${API_PATH}/generated-coi/${coiId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-API-Version': API_VERSION,
            },
          });
          console.log(`  ✓ Deleted COI ${coiId}`);
        } catch (error) {
          // Ignore cleanup errors
          console.log(`  ⚠️ Failed to delete COI ${coiId}`);
        }
      }
      
      // Clean up projects
      for (const projectId of createdResources.projects) {
        try {
          await fetch(`${API_BASE_URL}${API_PATH}/projects/${projectId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-API-Version': API_VERSION,
            },
          });
          console.log(`  ✓ Deleted project ${projectId}`);
        } catch (error) {
          console.log(`  ⚠️ Failed to delete project ${projectId}`);
        }
      }
      
      // Clean up contractors
      for (const contractorId of createdResources.contractors) {
        try {
          await fetch(`${API_BASE_URL}${API_PATH}/contractors/${contractorId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-API-Version': API_VERSION,
            },
          });
          console.log(`  ✓ Deleted contractor ${contractorId}`);
        } catch (error) {
          console.log(`  ⚠️ Failed to delete contractor ${contractorId}`);
        }
      }
      
      console.log('✓ Cleanup complete\n');
    });
  },
});

export { expect } from '@playwright/test';
