# API Rate Limiting Configuration

## Overview

The Compliant Platform uses `@nestjs/throttler` for API rate limiting to protect against abuse, brute force attacks, and ensure fair resource usage.

## Current Configuration

### Global Rate Limiting

Located in `packages/backend/src/app.module.ts`:

```typescript
ThrottlerModule.forRoot([{
  ttl: 60000, // 60 seconds in milliseconds
  limit: 10,  // 10 requests per 60 seconds
}])
```

**Default Limits:**
- **TTL (Time To Live)**: 60 seconds
- **Limit**: 10 requests per TTL window
- **Applied to**: All endpoints by default

### Endpoint-Specific Rate Limiting

Located in `packages/backend/src/modules/auth/auth.controller.ts`:

#### Authentication Endpoints

```typescript
// Login endpoint - Prevent brute force attacks
@Throttle({ default: { limit: 10, ttl: 60000 } })
POST /api/auth/login
- 10 requests per 60 seconds
- Prevents password guessing attacks

// Token refresh endpoint - Prevent token enumeration
@Throttle({ default: { limit: 20, ttl: 60000 } })
POST /api/auth/refresh
- 20 requests per 60 seconds
- Higher limit for legitimate refresh scenarios

// User profile endpoint - Prevent reconnaissance
@Throttle({ default: { limit: 100, ttl: 60000 } })
GET /api/auth/me
- 100 requests per 60 seconds
- Higher limit for frequently accessed endpoint
```

## Recommended Rate Limiting Strategy

### By Endpoint Type

#### 1. Authentication Endpoints (High Security)
```
Login/Register: 5-10 requests/minute
Password Reset: 3 requests/minute
Token Refresh: 20 requests/minute
```

#### 2. Read Operations (Moderate Limits)
```
List/Search: 100 requests/minute
Get Single: 200 requests/minute
Cached Endpoints: 300 requests/minute
```

#### 3. Write Operations (Stricter Limits)
```
Create: 20 requests/minute
Update: 30 requests/minute
Delete: 10 requests/minute
```

#### 4. Heavy Operations (Very Strict)
```
File Upload: 5 requests/minute
Export/Report: 10 requests/minute
Bulk Operations: 5 requests/minute
```

## Environment-Based Configuration

### Development
- **Global**: 1000 requests/minute
- **Purpose**: Allow extensive testing

### Staging
- **Global**: 100 requests/minute
- **Purpose**: Test rate limiting behavior

### Production
- **Global**: 60 requests/minute
- **Purpose**: Protect against abuse

## Implementation Guide

### 1. Environment Variables

Add to `.env`:

```env
# Rate Limiting Configuration
RATE_LIMIT_TTL=60000          # Time window in milliseconds
RATE_LIMIT_MAX=60             # Max requests per window
RATE_LIMIT_SKIP_SUCCESS=false # Skip successful requests
```

### 2. Dynamic Configuration

Update `app.module.ts` to use environment variables:

```typescript
ThrottlerModule.forRoot([{
  ttl: parseInt(process.env.RATE_LIMIT_TTL || '60000'),
  limit: parseInt(process.env.RATE_LIMIT_MAX || '60'),
}])
```

### 3. Controller-Level Configuration

Apply different limits to specific controllers:

```typescript
// Contractors Controller
@Controller('contractors')
@Throttle({ default: { limit: 100, ttl: 60000 } })
export class ContractorsController {
  // All endpoints inherit this limit
  
  // Override for specific endpoint
  @Post()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  create() { ... }
}
```

### 4. Skip Rate Limiting

For internal/admin endpoints:

```typescript
@SkipThrottle()
@Get('internal/health')
healthCheck() {
  return { status: 'ok' };
}
```

## Response Headers

When rate limit is enforced, the following headers are returned:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 5
X-RateLimit-Reset: 1642694400
```

## Error Response

When rate limit is exceeded (HTTP 429):

```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests",
  "error": "Too Many Requests"
}
```

## Per-User Rate Limiting

For authenticated endpoints, implement per-user limits:

```typescript
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): string {
    // Use user ID instead of IP for authenticated requests
    return req.user?.id || req.ip;
  }
}
```

Then apply in `app.module.ts`:

```typescript
{
  provide: APP_GUARD,
  useClass: UserThrottlerGuard,
}
```

## IP-Based Rate Limiting

Default behavior uses client IP address:

```typescript
// Automatically extracts from:
// - req.ip
// - X-Forwarded-For header
// - X-Real-IP header
```

### Behind Proxy Configuration

If behind a proxy/load balancer, configure Express:

```typescript
// main.ts
app.set('trust proxy', 1);
```

## Monitoring Rate Limiting

### 1. Log Rate Limit Events

```typescript
@Injectable()
export class RateLimitLogger implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const remaining = request.res.getHeader('X-RateLimit-Remaining');
    
    if (remaining < 2) {
      console.warn(`User ${request.user?.id} approaching rate limit`);
    }
    
    return next.handle();
  }
}
```

### 2. Metrics Collection

Track rate limit hits for analysis:

```typescript
- Total requests
- Rate-limited requests
- Users hitting limits frequently
- Endpoints with high rate limit hits
```

## Testing Rate Limiting

### Unit Tests

```typescript
it('should return 429 when rate limit exceeded', async () => {
  // Make requests up to limit
  for (let i = 0; i < 10; i++) {
    await request(app).post('/auth/login').send(credentials);
  }
  
  // Next request should be rate limited
  const response = await request(app)
    .post('/auth/login')
    .send(credentials);
    
  expect(response.status).toBe(429);
});
```

### Load Tests

Use Artillery to test rate limiting:

```yaml
config:
  phases:
    - duration: 60
      arrivalRate: 20  # Exceed rate limit
scenarios:
  - flow:
      - post:
          url: "/auth/login"
          expect:
            - statusCode: [200, 429]  # Expect some rate limiting
```

## Best Practices

1. **Start Conservative**: Begin with stricter limits and relax based on usage
2. **Different Limits by Role**: Higher limits for premium/admin users
3. **Whitelist Internal IPs**: Skip rate limiting for health checks
4. **Monitor and Adjust**: Review metrics and adjust limits accordingly
5. **Clear Error Messages**: Inform users about rate limits and retry timing
6. **Implement Backoff**: Add exponential backoff in client applications
7. **Cache Aggressively**: Reduce API calls through caching
8. **Use Redis for Storage**: For distributed systems, use Redis storage

## Redis-Based Rate Limiting

For distributed/clustered deployments:

```typescript
ThrottlerModule.forRoot({
  ttl: 60,
  limit: 10,
  storage: new ThrottlerStorageRedisService(new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
  })),
})
```

## Troubleshooting

### Rate Limit Not Working
1. Check ThrottlerGuard is applied globally
2. Verify @Throttle decorator syntax
3. Check for @SkipThrottle on controller/method
4. Ensure express-rate-limit isn't conflicting

### Wrong IP Address
1. Configure `trust proxy` if behind load balancer
2. Check X-Forwarded-For header
3. Verify reverse proxy configuration

### Too Strict Limits
1. Review application metrics
2. Check user feedback
3. Consider per-user vs IP limiting
4. Implement tiered limits by user role

## Future Enhancements

1. **Dynamic Rate Limiting**: Adjust limits based on server load
2. **User Tiers**: Different limits for free/premium users
3. **Burst Allowance**: Allow short bursts above limit
4. **Geographic Limits**: Different limits by region
5. **Adaptive Limits**: ML-based limit adjustment
6. **DDoS Protection**: Integration with CloudFlare or AWS Shield

## Related Documentation

- [PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md)
- [SECURITY_IMPROVEMENTS.md](./SECURITY_IMPROVEMENTS.md)
- [@nestjs/throttler Documentation](https://docs.nestjs.com/security/rate-limiting)
