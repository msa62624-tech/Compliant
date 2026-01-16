# Performance Optimization Guide

## Overview

This document outlines performance optimization strategies for the Compliant Platform, including database optimization, API performance, and frontend improvements.

## 1. Database Optimization

### Indexing Strategy

#### Existing Indexes
Review `packages/backend/prisma/schema.prisma` for current indexes.

#### Recommended Additional Indexes

```prisma
// Add to schema.prisma

model Contractor {
  // ... existing fields
  
  @@index([status])  // Filter by status
  @@index([insuranceStatus])  // Filter by insurance status
  @@index([createdAt])  // Sort by creation date
  @@index([email])  // Search by email
  @@index([company])  // Search by company
  @@index([status, insuranceStatus])  // Composite for common queries
}

model Project {
  // ... existing fields
  
  @@index([status])
  @@index([startDate])
  @@index([endDate])
  @@index([gcId])  // Filter by general contractor
  @@index([status, startDate])  // Composite index
}

model AuditLog {
  // ... existing fields
  
  @@index([userId, timestamp])  // User's recent activity
  @@index([action, timestamp])  // Action-based queries
  @@index([resource, resourceId])  // Resource-specific logs
  @@index([timestamp])  // Time-based queries
}

model InsuranceDocument {
  // ... existing fields
  
  @@index([contractorId, expirationDate])  // Expiring documents
  @@index([status, expirationDate])  // Active expiring documents
  @@index([type, status])  // Document type queries
}
```

#### Apply Indexes

```bash
cd packages/backend
pnpm db:migrate
```

### Query Optimization

#### Use Select to Limit Fields

```typescript
// Before (fetches all fields)
const users = await this.prisma.user.findMany();

// After (only needed fields)
const users = await this.prisma.user.findMany({
  select: {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
  },
});
```

#### Optimize Includes

```typescript
// Before (deep nesting)
const contractor = await this.prisma.contractor.findUnique({
  where: { id },
  include: {
    insuranceDocuments: {
      include: {
        uploadedBy: {
          include: {
            profile: true,
          },
        },
      },
    },
  },
});

// After (only what's needed)
const contractor = await this.prisma.contractor.findUnique({
  where: { id },
  include: {
    insuranceDocuments: {
      where: {
        status: 'VERIFIED',
      },
      select: {
        id: true,
        type: true,
        expirationDate: true,
      },
    },
  },
});
```

#### Use Batch Operations

```typescript
// Before (N+1 queries)
for (const contractorId of contractorIds) {
  await this.prisma.contractor.update({
    where: { id: contractorId },
    data: { status: 'INACTIVE' },
  });
}

// After (single query)
await this.prisma.contractor.updateMany({
  where: {
    id: {
      in: contractorIds,
    },
  },
  data: {
    status: 'INACTIVE',
  },
});
```

#### Implement Cursor-Based Pagination

```typescript
// For large datasets, use cursor-based pagination instead of offset

export class ContractorsService {
  async findAllCursor(cursor?: string, limit = 20) {
    const contractors = await this.prisma.contractor.findMany({
      take: limit + 1, // Fetch one extra to check if there are more
      ...(cursor && {
        skip: 1, // Skip the cursor
        cursor: {
          id: cursor,
        },
      }),
      orderBy: {
        createdAt: 'desc',
      },
    });

    const hasMore = contractors.length > limit;
    const items = hasMore ? contractors.slice(0, -1) : contractors;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return {
      items,
      nextCursor,
      hasMore,
    };
  }
}
```

### Connection Pooling

Update database connection configuration:

```typescript
// packages/backend/src/config/prisma.service.ts

const datasourceUrl = new URL(process.env.DATABASE_URL);
datasourceUrl.searchParams.set('connection_limit', '10');  // Adjust based on load
datasourceUrl.searchParams.set('pool_timeout', '10');  // Seconds
```

### Database Query Monitoring

```typescript
// Add to prisma.service.ts

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
    
    // Log slow queries
    this.$use(async (params, next) => {
      const before = Date.now();
      const result = await next(params);
      const after = Date.now();
      
      const queryTime = after - before;
      if (queryTime > 1000) {  // Log queries > 1s
        console.warn(`Slow query detected: ${params.model}.${params.action} took ${queryTime}ms`);
      }
      
      return result;
    });
  }
}
```

## 2. API Performance Optimization

### Response Compression

Enable gzip compression in NestJS:

```typescript
// packages/backend/src/main.ts

import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable compression
  app.use(compression());
  
  // ... rest of configuration
}
```

Install compression:
```bash
npm install compression
npm install --save-dev @types/compression
```

### Caching Strategy (Already Implemented)

- ✅ Redis caching with memory fallback
- ✅ Cache contractors list and individual records
- ✅ Cache invalidation on updates

**Expand caching to:**
- User profiles
- Project lists
- Insurance document summaries
- Dashboard statistics

### Request Deduplication

Prevent duplicate concurrent requests:

```typescript
// packages/backend/src/common/interceptors/dedupe.interceptor.ts

import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap, share } from 'rxjs/operators';

@Injectable()
export class DedupeInterceptor implements NestInterceptor {
  private cache = new Map<string, Observable<any>>();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const key = `${request.method}:${request.url}`;

    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const shared = next.handle().pipe(
      tap(() => {
        setTimeout(() => this.cache.delete(key), 100);
      }),
      share(),
    );

    this.cache.set(key, shared);
    return shared;
  }
}
```

### Rate Limiting (Already Implemented)

- ✅ Global rate limiting with @nestjs/throttler
- ✅ Endpoint-specific limits for auth endpoints

**Enhance with:**
- Per-user rate limiting
- IP-based rate limiting
- Tiered limits based on user role

## 3. Frontend Performance Optimization

### Code Splitting

Implement dynamic imports for routes:

```typescript
// packages/frontend/app/admin/contractors/page.tsx

import dynamic from 'next/dynamic';

const ContractorsTable = dynamic(() => import('../components/ContractorsTable'), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});
```

### Image Optimization

Use Next.js Image component:

```typescript
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={50}
  priority  // For above-the-fold images
/>
```

### API Request Optimization

#### Implement React Query Optimizations

```typescript
// packages/frontend/lib/api/contractors.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useContractors(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['contractors', page, limit],
    queryFn: () => contractorsApi.findAll(page, limit),
    staleTime: 5 * 60 * 1000,  // 5 minutes
    cacheTime: 10 * 60 * 1000,  // 10 minutes
  });
}

export function useContractor(id: string) {
  return useQuery({
    queryKey: ['contractor', id],
    queryFn: () => contractorsApi.findOne(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,  // Only run if ID exists
  });
}
```

#### Prefetching

```typescript
export function useContractorsPrefetch() {
  const queryClient = useQueryClient();
  
  const prefetchContractor = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: ['contractor', id],
      queryFn: () => contractorsApi.findOne(id),
    });
  };
  
  return { prefetchContractor };
}
```

### Bundle Size Optimization

```bash
# Analyze bundle size
cd packages/frontend
npm install --save-dev @next/bundle-analyzer
```

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // ... existing config
});
```

Run analysis:
```bash
ANALYZE=true npm run build
```

### Lazy Loading

```typescript
// Load heavy components only when needed
const ChartComponent = dynamic(() => import('./Chart'), {
  loading: () => <div>Loading chart...</div>,
});
```

## 4. Standardized Pagination

### Backend Implementation

Create reusable pagination DTO:

```typescript
// packages/backend/src/common/dto/pagination.dto.ts

import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  sortBy?: string = 'createdAt';

  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
```

Create pagination response helper:

```typescript
// packages/backend/src/common/helpers/pagination.helper.ts

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}
```

### Apply to All Endpoints

```typescript
// Example: contractors.controller.ts

@Get()
async findAll(@Query() paginationDto: PaginationDto) {
  return this.contractorsService.findAll(paginationDto);
}

// contractors.service.ts
async findAll(paginationDto: PaginationDto) {
  const { page, limit, sortBy, sortOrder } = paginationDto;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    this.prisma.contractor.findMany({
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    }),
    this.prisma.contractor.count(),
  ]);

  return createPaginatedResponse(data, total, page, limit);
}
```

## 5. Monitoring Query Performance

### Add Query Logging

```typescript
// packages/backend/src/config/prisma.service.ts

this.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  
  // Log to metrics service
  this.metricsService.recordQuery({
    model: params.model,
    action: params.action,
    duration: after - before,
  });
  
  return result;
});
```

### Identify N+1 Queries

Use Prisma's query logging:

```typescript
// In development, enable query logging
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

## 6. Performance Testing

### Load Testing with K6

Install K6:
```bash
brew install k6  # macOS
```

Create load test:

```javascript
// tests/load/contractors.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],    // Error rate < 1%
  },
};

export default function () {
  const res = http.get('http://localhost:3001/api/v1/contractors');
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}
```

Run test:
```bash
k6 run tests/load/contractors.js
```

## 7. Performance Checklist

### Backend
- [x] Database indexes on frequently queried fields
- [x] Connection pooling configured
- [ ] Query optimization (avoid N+1, use batch operations)
- [x] Response caching (Redis)
- [ ] Response compression enabled
- [ ] Slow query logging
- [ ] Cursor-based pagination for large datasets

### Frontend
- [ ] Code splitting implemented
- [ ] Image optimization with Next.js Image
- [ ] React Query with proper caching
- [ ] Bundle size < 200KB (main bundle)
- [ ] Lazy loading for heavy components
- [ ] Prefetching for common routes

### Infrastructure
- [ ] CDN for static assets
- [ ] Database read replicas (for high traffic)
- [ ] Load balancer configuration
- [ ] Auto-scaling policies

## 8. Performance Metrics Goals

### Backend API
- **Response Time**:
  - p50: < 100ms
  - p95: < 500ms
  - p99: < 1s

- **Throughput**: > 1000 req/s per instance

- **Error Rate**: < 0.1%

### Frontend
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.5s
- **Cumulative Layout Shift (CLS)**: < 0.1

### Database
- **Query Time**:
  - p95: < 100ms
  - p99: < 500ms

- **Connection Pool Utilization**: < 80%

## 9. Performance Monitoring

Set up continuous monitoring:
- Prometheus for metrics collection
- Grafana for dashboards
- Alert on performance degradation
- Weekly performance review

## Resources

- [Prisma Performance Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Web Vitals](https://web.dev/vitals/)
- [K6 Load Testing](https://k6.io/docs/)
- [Database Indexing Guide](https://use-the-index-luke.com/)
