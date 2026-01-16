# Load Testing Configuration

This directory contains k6 load test scripts for the Compliant Platform API.

## Prerequisites

Install k6:
```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring \
  --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 \
  --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | \
  sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows (via chocolatey)
choco install k6
```

## Test Configuration

All load tests use **real authentication** instead of placeholder tokens. The tests require:

1. **Running backend server** (local or remote)
2. **Valid test credentials** in your test database
3. **Environment variables** for configuration

## Environment Variables

Configure tests using environment variables:

```bash
# Required
export API_URL="http://localhost:3001/api"
export TEST_EMAIL="test@example.com"
export TEST_PASSWORD="Test123!@#"
```

## Available Tests

### 1. Authentication Load Test
Tests login, token refresh, and profile access endpoints.

```bash
k6 run tests/load/auth-load.js
```

**Default thresholds:**
- 95% of requests < 500ms
- Error rate < 10%

### 2. Contractors API Load Test
Tests CRUD operations on contractors with authentication.

```bash
k6 run tests/load/contractors-load.js
```

**Default thresholds:**
- 95% of requests < 1000ms
- Error rate < 10%

## Running Tests

### Local Testing
```bash
# 1. Start the backend server
cd packages/backend
pnpm dev

# 2. Ensure test user exists (run seed if needed)
pnpm db:seed

# 3. Run load tests with default settings
k6 run tests/load/auth-load.js
```

### Custom Configuration
```bash
# Run with custom API URL and credentials
API_URL="https://api.staging.compliant.com/api" \
TEST_EMAIL="loadtest@example.com" \
TEST_PASSWORD="SecurePassword123!" \
k6 run tests/load/auth-load.js

# Run with increased load
k6 run --vus 50 --duration 5m tests/load/auth-load.js
```

### CI/CD Integration
```bash
# Run in CI with environment variables from secrets
k6 run \
  --out json=test-results.json \
  --summary-export=summary.json \
  tests/load/auth-load.js
```

## Test Scenarios

### Auth Load Test Stages
1. **Ramp-up** (30s): 0 → 10 virtual users
2. **Steady** (1m): 10 virtual users
3. **Ramp-down** (30s): 10 → 0 virtual users

### Contractors Load Test Stages
1. **Ramp-up** (30s): 0 → 5 virtual users
2. **Steady** (1m): 5 virtual users
3. **Ramp-down** (30s): 5 → 0 virtual users

## Metrics

Each test tracks:
- **HTTP request duration** (p50, p90, p95, p99)
- **HTTP request rate**
- **HTTP failure rate**
- **Custom error rate**
- **Data sent/received**

## Best Practices

### DO ✅
- Use real test credentials from a dedicated test database
- Set appropriate thresholds based on your SLA requirements
- Run tests against staging environment first
- Monitor server resources during tests
- Clean up test data after load tests

### DON'T ❌
- Use production credentials or production endpoints
- Use placeholder tokens like "test-token-123"
- Run load tests against production without approval
- Skip authentication in load tests
- Hardcode sensitive credentials in test files

## Security Notes

1. **Never commit credentials** to version control
2. **Use environment variables** for sensitive data
3. **Test credentials** should be rotated regularly
4. **Load test accounts** should have minimal permissions
5. **Monitor for abuse** of test endpoints

## Troubleshooting

### Authentication Failures
If tests fail with 401 errors:
```bash
# 1. Verify test user exists
cd packages/backend
pnpm db:studio
# Check Users table for test@example.com

# 2. Verify credentials are correct
# Check TEST_EMAIL and TEST_PASSWORD match database

# 3. Check token expiration settings
# Verify JWT_EXPIRATION in backend .env
```

### High Error Rates
If error rate exceeds threshold:
1. Check server logs for errors
2. Verify database connections
3. Reduce concurrent users
4. Increase request timeouts

### Slow Response Times
If requests exceed duration thresholds:
1. Check database query performance
2. Review server resource usage (CPU, memory)
3. Consider caching strategies
4. Profile slow endpoints

## Example Results

```
scenarios: (100.00%) 1 scenario, 10 max VUs, 2m30s max duration
default: 10 VUs  2m0s

✓ login status is 200 or 201
✓ login returns token
✓ profile status is 200
✓ profile returns user data

checks.........................: 100.00% ✓ 2400     ✗ 0
data_received..................: 890 kB  7.4 kB/s
data_sent......................: 425 kB  3.5 kB/s
http_req_duration..............: avg=125ms  p(95)=245ms
http_reqs......................: 1200    10/s
errors.........................: 0.00%   ✓ 0       ✗ 1200
```

## Further Reading

- [k6 Documentation](https://k6.io/docs/)
- [k6 Best Practices](https://k6.io/docs/misc/fine-tuning-os/)
- [Load Testing Guide](https://k6.io/docs/test-types/load-testing/)
