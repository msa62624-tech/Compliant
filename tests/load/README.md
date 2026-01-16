# Load Testing Configuration for Compliant Platform

This directory contains load testing scenarios using Artillery.

## Installation

Artillery is already installed as a dev dependency in the workspace.

## Running Load Tests

```bash
# Run auth load tests
pnpm artillery run tests/load/auth-load-test.yml

# Run contractors load tests  
pnpm artillery run tests/load/contractors-load-test.yml

# Run all load tests
pnpm load:test
```

## Test Scenarios

### 1. Authentication Load Test (`auth-load-test.yml`)
- Tests login, token refresh, and logout endpoints
- Simulates 100 concurrent users over 5 minutes
- Performance thresholds:
  - 95% of requests < 500ms
  - Error rate < 1%

### 2. Contractors Load Test (`contractors-load-test.yml`)
- Tests CRUD operations on contractors
- Simulates 50 concurrent users over 5 minutes
- Performance thresholds:
  - 95% of requests < 1000ms
  - Error rate < 1%

## Performance Thresholds

Based on the performance goals documented in `docs/PERFORMANCE_OPTIMIZATION.md`:

### Response Times
- p50: < 100ms
- p95: < 500ms
- p99: < 1s

### Error Rates
- < 0.1% for production
- < 1% for development/testing

## Interpreting Results

Artillery provides metrics including:
- `http.request_rate`: Requests per second
- `http.response_time`: Response time percentiles (p50, p95, p99)
- `http.responses`: Status code distribution
- `errors`: Error counts by type

### Successful Test Criteria
- All requests complete successfully (status 200-299)
- p95 response time < threshold
- Error rate < threshold
- No connection timeouts

## Prerequisites for Running Tests

1. **Backend Server Running**
   ```bash
   cd packages/backend
   pnpm dev
   ```

2. **Database Available**
   - Ensure PostgreSQL is running
   - Database should be seeded with test data

3. **Test User Credentials**
   - Update `auth-load-test.yml` with valid test credentials
   - Ensure test user exists in database

## Load Testing Best Practices

1. **Start Small**: Begin with low load and gradually increase
2. **Monitor Resources**: Watch CPU, memory, and database connections
3. **Test Incrementally**: Test one endpoint at a time before combined scenarios
4. **Use Realistic Data**: Load test data should mirror production patterns
5. **Test Different Scenarios**: Mix of reads, writes, and complex queries
6. **Clean Up**: Remove test data after load testing

## Environment Configuration

Set the target URL in each test file or via environment variable:

```bash
export TARGET_URL="http://localhost:3001/api"
pnpm artillery run tests/load/auth-load-test.yml
```

## Advanced Usage

### Running with Reporting

```bash
# Generate HTML report
pnpm artillery run --output report.json tests/load/auth-load-test.yml
pnpm artillery report report.json
```

### Custom Load Patterns

Artillery supports various load phases:
- **Ramp-up**: Gradually increase load
- **Sustained**: Maintain constant load
- **Spike**: Sudden traffic spike
- **Ramp-down**: Gradually decrease load

See individual test files for configuration examples.
