# Monitoring and Performance Tracking Setup Guide

## Overview

This document outlines the monitoring, metrics, and performance tracking requirements for the Compliant Platform.

## 1. Application Performance Monitoring (APM)

### Recommended Tools

#### Option 1: Prometheus + Grafana (Open Source)
- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **Cost**: Free (self-hosted)

#### Option 2: New Relic (Commercial)
- Full-stack observability
- APM, Infrastructure, Logs in one place
- **Cost**: Paid (free tier available)

#### Option 3: DataDog (Commercial)
- Comprehensive monitoring platform
- APM, Logs, Metrics, Traces
- **Cost**: Paid

### Recommended Approach
Start with **Prometheus + Grafana** for cost-effectiveness and full control.

## 2. Metrics to Track

### Backend API Metrics

#### HTTP Request Metrics
```typescript
- http_requests_total (counter)
- http_request_duration_seconds (histogram)
- http_requests_in_progress (gauge)
```

#### Database Metrics
```typescript
- db_query_duration_seconds (histogram)
- db_connection_pool_size (gauge)
- db_connection_pool_active (gauge)
- db_query_errors_total (counter)
```

#### Cache Metrics
```typescript
- cache_hits_total (counter)
- cache_misses_total (counter)
- cache_evictions_total (counter)
- cache_size_bytes (gauge)
```

#### Business Metrics
```typescript
- contractors_created_total (counter)
- contractors_active (gauge)
- projects_active (gauge)
- insurance_documents_expiring_soon (gauge)
- coi_pending_review (gauge)
```

### Frontend Metrics

#### Performance Metrics
```typescript
- page_load_time (histogram)
- time_to_interactive (histogram)
- first_contentful_paint (histogram)
- largest_contentful_paint (histogram)
```

#### User Experience Metrics
```typescript
- user_sessions_total (counter)
- user_errors_total (counter)
- api_call_duration (histogram)
```

## 3. Implementation Steps

### Step 1: Install Prometheus Client for NestJS

```bash
cd packages/backend
npm install @willsoto/nestjs-prometheus prom-client
```

### Step 2: Create Metrics Module

Create `packages/backend/src/modules/metrics/metrics.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
      },
      path: '/metrics',
    }),
  ],
})
export class MetricsModule {}
```

### Step 3: Create Custom Metrics Service

Create `packages/backend/src/modules/metrics/metrics.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import {
  makeCounterProvider,
  makeHistogramProvider,
  makeGaugeProvider,
} from '@willsoto/nestjs-prometheus';

@Injectable()
export class MetricsService {
  // HTTP request metrics
  httpRequestsTotal = makeCounterProvider({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'],
  });

  httpRequestDuration = makeHistogramProvider({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route'],
    buckets: [0.1, 0.5, 1, 2, 5],
  });

  // Database metrics
  dbQueryDuration = makeHistogramProvider({
    name: 'db_query_duration_seconds',
    help: 'Database query duration in seconds',
    labelNames: ['operation'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1],
  });

  // Cache metrics
  cacheHits = makeCounterProvider({
    name: 'cache_hits_total',
    help: 'Total number of cache hits',
    labelNames: ['cache_key_prefix'],
  });

  cacheMisses = makeCounterProvider({
    name: 'cache_misses_total',
    help: 'Total number of cache misses',
    labelNames: ['cache_key_prefix'],
  });
}
```

### Step 4: Create Metrics Interceptor

Create `packages/backend/src/common/interceptors/metrics.interceptor.ts`:

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../../modules/metrics/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, route } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = (Date.now() - startTime) / 1000;
        const response = context.switchToHttp().getResponse();
        
        // Record metrics
        this.metricsService.httpRequestsTotal.inc({
          method,
          route: route.path,
          status: response.statusCode,
        });

        this.metricsService.httpRequestDuration.observe(
          { method, route: route.path },
          duration,
        );
      }),
    );
  }
}
```

### Step 5: Update Cache Service to Track Metrics

Modify `packages/backend/src/modules/cache/cache.service.ts` to include metrics tracking.

### Step 6: Set Up Prometheus

Create `docker-compose.monitoring.yml`:

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - '9090:9090'
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'

  grafana:
    image: grafana/grafana:latest
    ports:
      - '3002:3000'
    volumes:
      - grafana-data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false

volumes:
  prometheus-data:
  grafana-data:
```

Create `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'compliant-backend'
    static_configs:
      - targets: ['host.docker.internal:3001']
    metrics_path: '/metrics'
```

## 4. Frontend Monitoring

### Option 1: Google Analytics + Web Vitals

```bash
cd packages/frontend
npm install web-vitals
```

Create `packages/frontend/lib/analytics/vitals.ts`:

```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // Send to your analytics service
  console.log(metric);
}

export function reportWebVitals() {
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
}
```

### Option 2: Sentry for Error Tracking

```bash
cd packages/frontend
npm install @sentry/nextjs
```

## 5. Logging Strategy

### Centralized Logging

#### Option 1: ELK Stack (Elasticsearch, Logstash, Kibana)
- Powerful search and analytics
- Self-hosted
- Free (open source)

#### Option 2: CloudWatch Logs (AWS)
- Integrated with AWS services
- Pay per use
- Good for AWS deployments

#### Option 3: Datadog Logs
- Unified with APM and metrics
- Commercial solution
- Easy integration

### Log Levels
```
ERROR: Application errors, exceptions
WARN: Warning conditions, deprecated features
INFO: General information, key events
DEBUG: Detailed information for debugging
```

### Log Format
Use structured JSON logging (already implemented with Winston):

```json
{
  "level": "info",
  "message": "User logged in",
  "timestamp": "2024-01-16T12:00:00.000Z",
  "context": "AuthService",
  "userId": "123",
  "email": "user@example.com",
  "ip": "192.168.1.1"
}
```

## 6. Alerting

### Critical Alerts
- **Service Down**: No heartbeat for 2 minutes
- **High Error Rate**: > 5% of requests failing
- **High Response Time**: p95 > 2 seconds
- **Database Connection Issues**: Connection pool exhausted
- **Cache Unavailable**: Redis connection failed
- **Disk Space Low**: < 10% free space

### Warning Alerts
- **Elevated Error Rate**: > 1% of requests failing
- **Slow Response Time**: p95 > 1 second
- **Memory Usage High**: > 80% of available memory
- **Insurance Expiring Soon**: Documents expiring in 7 days
- **Pending COI Reviews**: > 10 pending for > 24 hours

### Alert Channels
- **Email**: For all alerts
- **Slack**: For critical alerts
- **PagerDuty**: For after-hours critical alerts (optional)

## 7. Dashboards

### Backend Dashboard
- **System Health**
  - Service uptime
  - Request rate
  - Error rate
  - Response time (p50, p95, p99)

- **Database**
  - Query duration
  - Active connections
  - Slow queries

- **Cache**
  - Hit rate
  - Miss rate
  - Memory usage

### Business Dashboard
- **Operations**
  - Active contractors
  - Active projects
  - Pending COI reviews
  - Insurance documents expiring soon

- **User Activity**
  - Daily active users
  - Login frequency
  - Feature usage

## 8. Health Check Enhancements

The existing health check module at `packages/backend/src/modules/health/` should be enhanced with:

1. **Detailed Component Health**
   - Database connection status
   - Redis connection status
   - External API status (if any)

2. **Health Check Endpoint**
   - Already implemented at `/health`
   - Returns JSON with component status

3. **Kubernetes Integration**
   - Liveness probe: `/health/liveness`
   - Readiness probe: `/health/readiness`

## 9. Implementation Priority

### Phase 1: Essential (Immediate)
- [x] Basic logging (already implemented)
- [x] Health checks (already implemented)
- [ ] Prometheus metrics collection
- [ ] Basic Grafana dashboard

### Phase 2: Enhanced (Short-term)
- [ ] Custom business metrics
- [ ] Alert rules configuration
- [ ] Frontend error tracking (Sentry)
- [ ] Web Vitals monitoring

### Phase 3: Advanced (Long-term)
- [ ] Distributed tracing
- [ ] Log aggregation (ELK/CloudWatch)
- [ ] Advanced analytics
- [ ] Automated anomaly detection

## 10. Monitoring Checklist

- [ ] Install Prometheus client library
- [ ] Create metrics module and service
- [ ] Add metrics interceptor
- [ ] Set up Prometheus server
- [ ] Set up Grafana
- [ ] Create basic dashboards
- [ ] Configure alert rules
- [ ] Set up alert notifications
- [ ] Document runbooks for alerts
- [ ] Test alerting in staging environment

## Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [NestJS Prometheus](https://github.com/willsoto/nestjs-prometheus)
- [Web Vitals](https://web.dev/vitals/)
- [Sentry Documentation](https://docs.sentry.io/)
