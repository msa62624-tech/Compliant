// K6 Load Test for Contractors API
// Tests CRUD operations on contractors with proper authentication

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 5 },   // Ramp up to 5 users
    { duration: '1m', target: 5 },    // Stay at 5 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests under 1s
    http_req_failed: ['rate<0.1'],     // Error rate < 10%
    errors: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3001/api';
const TEST_EMAIL = __ENV.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'Test123!@#';

export function setup() {
  console.log('Setting up contractors load test...');
  
  // Login to get access token
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginRes.status !== 200 && loginRes.status !== 201) {
    console.error('Setup failed: Could not login');
    throw new Error('Authentication failed during setup');
  }

  let token;
  try {
    const body = JSON.parse(loginRes.body);
    token = body.accessToken;
  } catch (e) {
    throw new Error('Failed to parse login response');
  }

  return { baseUrl: BASE_URL, token: token };
}

export default function(data) {
  const params = {
    headers: {
      'Authorization': `Bearer ${data.token}`,
      'Content-Type': 'application/json',
    },
  };

  // Test 1: List contractors
  const listRes = http.get(`${data.baseUrl}/contractors`, params);
  const listSuccess = check(listRes, {
    'list contractors status is 200': (r) => r.status === 200,
    'list returns array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body) || Array.isArray(body.data);
      } catch (e) {
        return false;
      }
    },
  });

  errorRate.add(listSuccess ? 0 : 1);
  sleep(1);

  // Test 2: Create contractor
  const newContractor = {
    name: `Test Contractor ${Date.now()}`,
    email: `contractor${Date.now()}@test.com`,
    phone: '555-0100',
    address: '123 Test St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
  };

  const createRes = http.post(
    `${data.baseUrl}/contractors`,
    JSON.stringify(newContractor),
    params
  );

  const createSuccess = check(createRes, {
    'create contractor status is 201 or 200': (r) => r.status === 201 || r.status === 200,
    'create returns id': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.id !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  errorRate.add(createSuccess ? 0 : 1);

  let contractorId;
  try {
    const body = JSON.parse(createRes.body);
    contractorId = body.id;
  } catch (e) {
    console.error('Failed to get contractor ID from response');
  }

  sleep(1);

  // Test 3: Get specific contractor (if creation succeeded)
  if (contractorId) {
    const getRes = http.get(`${data.baseUrl}/contractors/${contractorId}`, params);
    const getSuccess = check(getRes, {
      'get contractor status is 200': (r) => r.status === 200,
      'get returns contractor data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.id === contractorId;
        } catch (e) {
          return false;
        }
      },
    });

    errorRate.add(getSuccess ? 0 : 1);
    sleep(1);

    // Test 4: Update contractor
    const updateData = {
      phone: '555-0199',
    };

    const updateRes = http.patch(
      `${data.baseUrl}/contractors/${contractorId}`,
      JSON.stringify(updateData),
      params
    );

    const updateSuccess = check(updateRes, {
      'update contractor status is 200': (r) => r.status === 200,
    });

    errorRate.add(updateSuccess ? 0 : 1);
    sleep(1);
  }

  sleep(2);
}

export function teardown(data) {
  console.log('Contractors load test completed');
}
