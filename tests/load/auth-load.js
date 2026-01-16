// K6 Load Test for Authentication Endpoints
// This test uses proper authentication instead of placeholder tokens

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Load test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate should be less than 10%
    errors: ['rate<0.1'],             // Custom error rate threshold
  },
};

// Configuration - these should be set via environment variables
const BASE_URL = __ENV.API_URL || 'http://localhost:3001/api';
const TEST_EMAIL = __ENV.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'Test123!@#';

// Setup: Create test user (runs once at the beginning)
export function setup() {
  console.log('Setting up load test...');
  console.log(`Base URL: ${BASE_URL}`);
  
  // Note: In a real scenario, you would create a test user here
  // or ensure test credentials exist in your test database
  
  return { baseUrl: BASE_URL };
}

// Main test scenario
export default function(data) {
  // Test 1: Login
  const loginPayload = JSON.stringify({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  const loginParams = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'LoginEndpoint' },
  };

  const loginRes = http.post(`${data.baseUrl}/auth/login`, loginPayload, loginParams);
  
  const loginSuccess = check(loginRes, {
    'login status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'login returns token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.accessToken !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  if (!loginSuccess) {
    errorRate.add(1);
    console.error(`Login failed: ${loginRes.status} - ${loginRes.body}`);
    return;
  }

  errorRate.add(0);

  // Extract access token for subsequent requests
  let accessToken;
  try {
    const loginBody = JSON.parse(loginRes.body);
    accessToken = loginBody.accessToken;
  } catch (e) {
    console.error('Failed to parse login response');
    errorRate.add(1);
    return;
  }

  sleep(1);

  // Test 2: Access protected endpoint (e.g., get current user)
  const authParams = {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    tags: { name: 'ProtectedEndpoint' },
  };

  const profileRes = http.get(`${data.baseUrl}/auth/profile`, authParams);
  
  const profileSuccess = check(profileRes, {
    'profile status is 200': (r) => r.status === 200,
    'profile returns user data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.email !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  if (!profileSuccess) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }

  sleep(1);

  // Test 3: Refresh token
  const refreshPayload = JSON.stringify({
    refreshToken: loginRes.json('refreshToken') || '',
  });

  const refreshRes = http.post(`${data.baseUrl}/auth/refresh`, refreshPayload, loginParams);
  
  check(refreshRes, {
    'refresh status is 200 or 201': (r) => r.status === 200 || r.status === 201,
  });

  sleep(2);
}

// Teardown: Clean up (runs once at the end)
export function teardown(data) {
  console.log('Load test completed');
  console.log(`Total requests made to: ${data.baseUrl}`);
}
