# E2E Testing Guide

**Last Updated:** 2026-01-20  
**Status:** ✅ Environment Ready for Testing

---

## Quick Start

### Prerequisites
- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Docker (for PostgreSQL)

### Setup and Run Tests
```bash
# 1. Install dependencies
pnpm install
pnpm exec playwright install chromium

# 2. Start PostgreSQL
docker-compose up -d

# 3. Setup database
cd packages/backend
pnpm db:push
pnpm db:seed
cd ../..

# 4. Start services (in separate terminals)
pnpm backend    # Terminal 1: http://localhost:3001
pnpm frontend   # Terminal 2: http://localhost:3000

# 5. Run E2E tests
NODE_OPTIONS="--max-old-space-size=4096" pnpm test:e2e

# Optional: Run with UI
pnpm test:e2e:ui

# Optional: Run with visible browser
pnpm test:e2e:headed
```

---

## Environment Configuration

### Backend Environment (.env)
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/compliant_dev"
JWT_SECRET="test-jwt-secret-for-comprehensive-testing-min-32-chars"
JWT_REFRESH_SECRET="test-refresh-secret-for-testing-min-32-characters"
JWT_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"
PORT=3001
NODE_ENV="test"
EMAIL_PROVIDER="test"
EMAIL_FROM="test@compliant.com"
CORS_ORIGIN="http://localhost:3000"
FRONTEND_URL="http://localhost:3000"
```

### Frontend Environment (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## Test User Credentials

Admin users are pre-seeded for testing:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@compliant.com | SuperAdmin123!@# |
| Admin | admin@compliant.com | Admin123!@# |
| Admin 2 | admin2@compliant.com | Admin2123!@# |
| Admin 3 | admin3@compliant.com | Admin3123!@# |
| Manager | manager@compliant.com | Manager123!@# |

**Note:** General Contractors, Subcontractors, and Broker accounts are dynamically created during tests with auto-generated credentials.

---

## Test Structure

### Test Files
- `tests/e2e/complete-workflow.spec.ts` - Full workflow tests
- `tests/e2e/complete-workflow-with-ui.spec.ts` - UI interaction tests
- `tests/e2e/real-world-workflow.spec.ts` - Real-world scenarios
- `tests/e2e/real-login-ui.spec.ts` - Login and authentication tests

### Test Fixtures
- `tests/e2e/fixtures/test-fixtures.ts` - Enhanced test fixtures with auth and navigation helpers
- Automatic screenshot capture for debugging
- Browser console log monitoring

---

## Key Implementation Details

### 1. Infrastructure Improvements
- **Health Check Threshold**: Increased to 90% for CI environments
- **Rate Limiting**: 1000 req/min in test mode (was 10)
- **Auth Token Response**: Returns tokens in body for test/dev modes
- **NODE Memory**: 4GB heap size prevents crashes during long test runs

### 2. Data Model Updates
- **Contractor Address Fields**: Added address, city, state, zipCode to schema
- **Auto-Determine ContractorType**: Based on creator role (Admin → GENERAL_CONTRACTOR, GC → SUBCONTRACTOR)

### 3. Credential Management
- Pre-seeded admin users only
- Dynamic user creation via API for GC/Sub/Broker accounts
- Automatic credential capture and authentication

### 4. Test Data Best Practices
- Timestamp-based unique email addresses
- Proper API format for broker info (includes `brokerType: 'PER_POLICY'`)
- Consistent test address data (Brooklyn, NY)

---

## Troubleshooting

### Database Connection Issues
```bash
# Reset database
docker-compose down -v
docker-compose up -d
cd packages/backend
pnpm db:push
pnpm db:seed
```

### Backend Crashes During Tests
- Ensure `NODE_OPTIONS="--max-old-space-size=4096"` is set
- Check database connection pooling
- Verify proper cleanup in test afterEach hooks

### Frontend Login Redirect Issues
- Check `packages/frontend/contexts/AuthContext.tsx`
- Ensure `router.push('/dashboard')` after successful login
- Verify token storage in localStorage

### Test Failures
1. Ensure all services are running (PostgreSQL, Backend, Frontend)
2. Verify environment variables are correctly set
3. Check browser console for errors
4. Review screenshot artifacts in `test-results/` directory

---

## CI/CD Integration

### GitHub Actions
E2E tests run automatically on:
- Pull requests to main branch
- Daily scheduled runs
- Manual workflow dispatch

### Test Artifacts
- Screenshots saved to `docs/e2e-screenshots/`
- Console logs captured for debugging
- Video recordings for failures
- Detailed trace files

---

## Additional Resources

- **API Documentation**: http://localhost:3001/api/docs (when backend is running)
- **Database GUI**: Run `pnpm db:studio` then visit http://localhost:5555
- **Playwright Documentation**: https://playwright.dev/

---

## Status History

### Latest (2026-01-20)
- ✅ All infrastructure fixes implemented
- ✅ Data model updates complete
- ✅ Dynamic credential management working
- ✅ Environment stable and documented

### Previous Issues (Resolved)
- ✅ Health check threshold too strict
- ✅ Rate limiting too aggressive for tests
- ✅ Missing contractor address fields
- ✅ Credential management issues
- ✅ Backend memory crashes during long runs
