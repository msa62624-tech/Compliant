# Testing Guide - Security Improvements

## Quick Test Commands

### 1. Database Migration

```bash
cd packages/backend

# Generate Prisma Client
pnpm db:generate

# Push schema to database (development)
pnpm db:push

# Or create a migration (production)
pnpm db:migrate
```

### 2. Build Tests

```bash
# Build all packages
pnpm build

# Build backend only
cd packages/backend
pnpm build

# Build frontend only
cd packages/frontend
pnpm build
```

### 3. Start Development Server

```bash
# Start both backend and frontend
pnpm dev

# Or start individually:
cd packages/backend && pnpm dev
cd packages/frontend && pnpm dev
```

---

## API Testing with cURL

### Test Authentication with Cookies

#### 1. Login (Sets Cookies)
```bash
curl -v -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt

# Expected Response:
# - Status: 200 OK
# - Set-Cookie headers with access_token and refresh_token
# - Response body: { "user": { "id": "...", "email": "...", ... } }
```

#### 2. Access Protected Endpoint (Uses Cookies)
```bash
curl -v http://localhost:3001/api/v1/auth/me \
  -b cookies.txt

# Expected Response:
# - Status: 200 OK
# - Response body: { "id": "...", "email": "...", "role": "..." }
```

#### 3. Refresh Token
```bash
curl -v -X POST http://localhost:3001/api/v1/auth/refresh \
  -b cookies.txt \
  -c cookies.txt

# Expected Response:
# - Status: 200 OK
# - New Set-Cookie headers
# - Response body: { "success": true }
```

#### 4. Logout (Clears Cookies)
```bash
curl -v -X POST http://localhost:3001/api/v1/auth/logout \
  -b cookies.txt

# Expected Response:
# - Status: 200 OK
# - Set-Cookie headers clearing cookies
# - Response body: { "message": "Logged out successfully" }
```

---

## Health Check Tests

### 1. Full Health Check
```bash
curl http://localhost:3001/api/v1/health

# Expected Response:
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "memory_heap": { "status": "up" },
    "memory_rss": { "status": "up" },
    "disk": { "status": "up" }
  }
}
```

### 2. Liveness Probe
```bash
curl http://localhost:3001/api/v1/health/liveness

# Expected Response:
{
  "status": "ok",
  "timestamp": "2026-01-16T17:30:00.000Z"
}
```

### 3. Readiness Probe
```bash
curl http://localhost:3001/api/v1/health/readiness

# Expected Response:
{
  "status": "ok",
  "info": {
    "database": { "status": "up" }
  }
}
```

---

## Audit Log Tests

### 1. Get All Audit Logs (Admin Only)
```bash
curl http://localhost:3001/api/v1/audit \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Or with cookies:
curl http://localhost:3001/api/v1/audit \
  -b cookies.txt
```

### 2. Filter by Action
```bash
curl "http://localhost:3001/api/v1/audit?action=LOGIN" \
  -b cookies.txt
```

### 3. Filter by Date Range
```bash
curl "http://localhost:3001/api/v1/audit?startDate=2026-01-01&endDate=2026-01-31" \
  -b cookies.txt
```

### 4. Get Resource Audit Logs
```bash
curl "http://localhost:3001/api/v1/audit/resource?resource=USER&resourceId=USER_ID" \
  -b cookies.txt
```

---

## Structured Logging Tests

### 1. Check Console Logs (Development)

Start the backend and watch for structured logs:

```bash
cd packages/backend
pnpm dev

# Make some requests, observe logs in console:
# - Request logs with method, URL, IP, user
# - Response logs with status code and time
# - Error logs with stack traces
```

### 2. Check Log Files (Production)

```bash
# After running in production mode
ls -lh logs/

# View error logs
tail -f logs/error.log

# View combined logs
tail -f logs/combined.log

# View exceptions
tail -f logs/exceptions.log
```

### 3. Parse JSON Logs

```bash
# Pretty print JSON logs
cat logs/combined.log | jq .

# Filter by context
cat logs/combined.log | jq 'select(.context == "HTTP")'

# Filter by user
cat logs/combined.log | jq 'select(.userId == "USER_ID")'
```

---

## Browser Testing

### 1. Chrome DevTools

1. Open DevTools (F12)
2. Go to Network tab
3. Login to the application
4. Check Response Headers:
   ```
   Set-Cookie: access_token=...; HttpOnly; SameSite=Strict; Path=/
   Set-Cookie: refresh_token=...; HttpOnly; SameSite=Strict; Path=/
   ```
5. Go to Application tab → Cookies
6. Verify `access_token` and `refresh_token` cookies exist
7. Verify `HttpOnly` flag is checked

### 2. Test XSS Protection

1. Open browser console
2. Try to access cookies:
   ```javascript
   document.cookie
   // Should NOT show access_token or refresh_token
   ```
3. Verify tokens are protected

### 3. Test Logout

1. Login to application
2. Check cookies in DevTools
3. Click logout
4. Verify cookies are cleared
5. Verify redirect to login page

---

## Integration Testing

### Test Scenario: Complete Auth Flow

```bash
# 1. Login
LOGIN_RESPONSE=$(curl -s -c /tmp/cookies.txt -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}')
echo "Login: $LOGIN_RESPONSE"

# 2. Access protected endpoint
ME_RESPONSE=$(curl -s -b /tmp/cookies.txt http://localhost:3001/api/v1/auth/me)
echo "User data: $ME_RESPONSE"

# 3. Refresh token
REFRESH_RESPONSE=$(curl -s -b /tmp/cookies.txt -c /tmp/cookies.txt -X POST http://localhost:3001/api/v1/auth/refresh)
echo "Refresh: $REFRESH_RESPONSE"

# 4. Access protected endpoint again
ME_RESPONSE2=$(curl -s -b /tmp/cookies.txt http://localhost:3001/api/v1/auth/me)
echo "User data after refresh: $ME_RESPONSE2"

# 5. Logout
LOGOUT_RESPONSE=$(curl -s -b /tmp/cookies.txt -X POST http://localhost:3001/api/v1/auth/logout)
echo "Logout: $LOGOUT_RESPONSE"

# 6. Try to access protected endpoint (should fail)
UNAUTHORIZED=$(curl -s -b /tmp/cookies.txt http://localhost:3001/api/v1/auth/me)
echo "After logout (should be 401): $UNAUTHORIZED"
```

---

## Load Testing (Optional)

### Using Apache Bench

```bash
# Test health endpoint
ab -n 1000 -c 10 http://localhost:3001/api/v1/health/liveness

# Test login endpoint (with auth)
ab -n 100 -c 5 -p login.json -T application/json http://localhost:3001/api/v1/auth/login

# Create login.json:
echo '{"email":"test@example.com","password":"password123"}' > login.json
```

### Using Artillery

```yaml
# artillery-test.yml
config:
  target: 'http://localhost:3001/api/v1'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Health Check"
    flow:
      - get:
          url: "/health/liveness"
```

```bash
artillery run artillery-test.yml
```

---

## Database Verification

### 1. Check AuditLog Table

```bash
cd packages/backend
pnpm db:studio

# Navigate to AuditLog model
# Verify entries are being created for:
# - LOGIN events
# - LOGOUT events
# - Other tracked actions
```

### 2. Query Audit Logs Directly

```sql
-- Connect to PostgreSQL
psql -d compliant_dev

-- View recent audit logs
SELECT 
  id,
  action,
  resource,
  "userId",
  "ipAddress",
  timestamp
FROM audit_logs
ORDER BY timestamp DESC
LIMIT 10;

-- Count logs by action
SELECT action, COUNT(*) as count
FROM audit_logs
GROUP BY action;

-- View user activity
SELECT 
  u.email,
  a.action,
  a.resource,
  a.timestamp
FROM audit_logs a
JOIN users u ON a."userId" = u.id
WHERE u.email = 'test@example.com'
ORDER BY a.timestamp DESC;
```

---

## Troubleshooting

### Issue: Build Fails

```bash
# Clean and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Regenerate Prisma client
cd packages/backend
pnpm db:generate

# Rebuild
cd ../..
pnpm build
```

### Issue: Cookies Not Working

```bash
# Check backend logs for errors
cd packages/backend
pnpm dev

# Check CORS configuration in .env
cat .env | grep CORS

# Test with verbose curl
curl -v -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Issue: Database Connection Error

```bash
# Check database is running
psql -d compliant_dev -c "SELECT 1"

# Check DATABASE_URL in .env
cat packages/backend/.env | grep DATABASE_URL

# Run migrations
cd packages/backend
pnpm db:push
```

### Issue: Health Check Fails

```bash
# Check which service is failing
curl http://localhost:3001/api/v1/health

# Check logs
tail -f packages/backend/logs/error.log

# Verify database connection
psql -d compliant_dev -c "SELECT 1"
```

---

## Performance Benchmarks

Expected performance metrics:

- **Login**: < 300ms
- **Token Refresh**: < 100ms
- **Health Check**: < 50ms
- **Audit Log Query**: < 200ms
- **Protected Endpoint**: < 100ms

Monitor these with:

```bash
# Time a request
time curl http://localhost:3001/api/v1/health

# Check response time in logs
tail -f logs/combined.log | grep responseTime
```

---

## Test Checklist

Before considering implementation complete:

- [ ] Database migration applied successfully
- [ ] Backend builds without errors
- [ ] Frontend builds without errors
- [ ] Login with cookies works
- [ ] Logout clears cookies
- [ ] Token refresh works
- [ ] Protected routes require authentication
- [ ] Health checks return correct status
- [ ] Audit logs are being created
- [ ] Structured logs are formatted correctly
- [ ] Log files are being created (production mode)
- [ ] No tokens in localStorage
- [ ] Cookies have HttpOnly flag
- [ ] CORS configured correctly
- [ ] All tests pass (if applicable)

---

## Next Steps After Testing

1. ✅ Verify all tests pass
2. 📝 Document any issues found
3. 🔄 Update frontend to use cookies
4. 🚀 Deploy to staging environment
5. 🧪 Run integration tests on staging
6. 📊 Monitor logs and metrics
7. ✅ Get approval for production deployment
8. 🚀 Deploy to production
9. 📊 Monitor production for 24-48 hours

---

**Last Updated**: 2026-01-16
**Version**: 1.0.0
