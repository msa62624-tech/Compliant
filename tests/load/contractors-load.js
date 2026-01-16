// K6 Load Test for Contractors API
// Tests CRUD operations on contractors with proper authentication

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 5 },   // Ramp up to 5 users
    { duration: '1m', target: 5 },    // Stay at 5 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests under 1s
    http_req_failed: ['rate<0.1'],     // Error rate < 10%
    checks: ['rate>0.9'],              // 90% of checks should pass
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
  check(listRes, {
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

  sleep(1);

  // Test 2: Create contractor
  // Using k6 built-in variables (__VU, __ITER) for uniqueness in concurrent scenarios
  const newContractor = {
    name: `Test Contractor VU${__VU}-${__ITER}-${Date.now()}`,
    email: `contractor-vu${__VU}-${__ITER}-${Date.now()}@test.com`,
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

  let contractorId;
  if (createSuccess) {
    try {
      const body = JSON.parse(createRes.body);
      contractorId = body.id;
    } catch (e) {
      console.error('Failed to get contractor ID from response');
    }
  }

  sleep(1);

  // Test 3: Get specific contractor (if creation succeeded)
  if (contractorId) {
    const getRes = http.get(`${data.baseUrl}/contractors/${contractorId}`, params);
    check(getRes, {
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

    check(updateRes, {
      'update contractor status is 200': (r) => r.status === 200,
    });

    sleep(1);
  }

  sleep(2);
}

export function teardown(data) {
  console.log('Contractors load test completed');
  // Note: In a production scenario, you would want to clean up
  // any test contractors created during the load test to prevent
  // database accumulation. This could be done by tracking created IDs
  // and making DELETE requests here.
}
