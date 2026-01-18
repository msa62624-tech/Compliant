# Complete Monitoring & Observability Guide

## Executive Summary

This guide provides a comprehensive monitoring and observability setup to achieve **100% production readiness** for the Compliant Insurance Tracking Platform.

**Target**: Achieve 100% monitoring coverage across all critical systems.

---

## Table of Contents

1. [Quick Start (15 minutes)](#quick-start-15-minutes)
2. [Application Performance Monitoring (APM)](#application-performance-monitoring-apm)
3. [Log Aggregation & Analysis](#log-aggregation--analysis)
4. [Metrics & Dashboards](#metrics--dashboards)
5. [Alerting & Incident Management](#alerting--incident-management)
6. [Distributed Tracing](#distributed-tracing)
7. [Database Monitoring](#database-monitoring)
8. [Synthetic Monitoring](#synthetic-monitoring)
9. [Cost Optimization](#cost-optimization)

---

## Quick Start (15 minutes)

### Minimum Production Setup

```bash
# 1. Install Prometheus and Grafana using Docker Compose
cat > docker-compose.monitoring.yml << 'EOF'
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=30d'
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3002:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources
    restart: unless-stopped
    depends_on:
      - prometheus

  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    ports:
      - "9100:9100"
    restart: unless-stopped

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    container_name: cadvisor
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    privileged: true
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
EOF

# 2. Create Prometheus configuration
mkdir -p monitoring
cat > monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['host.docker.internal:3001']
    metrics_path: '/metrics'

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
EOF

# 3. Start monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d

# 4. Access Grafana: http://localhost:3002 (admin/admin)
# 5. Import dashboards from Grafana.com (IDs provided below)
```

---

## Application Performance Monitoring (APM)

### Option 1: New Relic (Recommended for Enterprise)

#### Installation

```bash
# 1. Install New Relic agent
cd packages/backend
npm install newrelic
```

#### Configuration

```javascript
// packages/backend/newrelic.js
'use strict'

exports.config = {
  app_name: [process.env.NEW_RELIC_APP_NAME || 'Compliant-Backend'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  distributed_tracing: {
    enabled: true
  },
  logging: {
    level: 'info',
    filepath: 'stdout'
  },
  allow_all_headers: true,
  attributes: {
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxyAuthorization',
      'request.headers.setCookie*',
      'request.headers.x*',
      'response.headers.cookie',
      'response.headers.authorization',
      'response.headers.proxyAuthorization',
      'response.headers.setCookie*',
      'response.headers.x*'
    ]
  }
}
```

```typescript
// packages/backend/src/main.ts - Add at the very top
if (process.env.NODE_ENV === 'production' && process.env.NEW_RELIC_LICENSE_KEY) {
  require('newrelic');
}

import { NestFactory } from '@nestjs/core';
// ... rest of the file
```

#### Environment Variables

```bash
NEW_RELIC_LICENSE_KEY="your-license-key-here"
NEW_RELIC_APP_NAME="Compliant-Backend-Production"
```

### Option 2: Datadog APM

#### Installation

```bash
npm install dd-trace
```

#### Configuration

```typescript
// packages/backend/src/main.ts - Add at the very top
if (process.env.NODE_ENV === 'production' && process.env.DD_API_KEY) {
  require('dd-trace').init({
    service: 'compliant-backend',
    env: process.env.NODE_ENV,
    version: process.env.APP_VERSION || '1.0.0',
    logInjection: true,
    runtimeMetrics: true,
  });
}
```

### Option 3: OpenTelemetry (Open Source)

```bash
npm install @opentelemetry/api \
  @opentelemetry/sdk-node \
  @opentelemetry/auto-instrumentations-node \
  @opentelemetry/exporter-prometheus
```

```typescript
// packages/backend/src/telemetry.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';

const prometheusExporter = new PrometheusExporter({
  port: 9464,
  endpoint: '/metrics',
});

export const sdk = new NodeSDK({
  serviceName: 'compliant-backend',
  traceExporter: prometheusExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});

export function startTelemetry() {
  sdk.start();
  console.log('OpenTelemetry started');
}

process.on('SIGTERM', () => {
  sdk.shutdown().then(() => console.log('Tracing terminated'));
});
```

---

## Log Aggregation & Analysis

### Option 1: ELK Stack (Elasticsearch + Logstash + Kibana)

```yaml
# docker-compose.logging.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - es_data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    container_name: logstash
    ports:
      - "5044:5044"
      - "5000:5000/tcp"
      - "5000:5000/udp"
      - "9600:9600"
    volumes:
      - ./monitoring/logstash/pipeline:/usr/share/logstash/pipeline
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    container_name: kibana
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch

volumes:
  es_data:
```

#### Logstash Pipeline Configuration

```ruby
# monitoring/logstash/pipeline/logstash.conf
input {
  tcp {
    port => 5000
    codec => json
  }
}

filter {
  if [level] == "error" {
    mutate {
      add_tag => ["error"]
    }
  }
  
  date {
    match => ["timestamp", "ISO8601"]
    target => "@timestamp"
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "compliant-logs-%{+YYYY.MM.dd}"
  }
  
  stdout {
    codec => rubydebug
  }
}
```

### Option 2: AWS CloudWatch Logs

```typescript
// packages/backend/src/config/winston-cloudwatch.config.ts
import WinstonCloudWatch from 'winston-cloudwatch';
import { format, transports } from 'winston';

export const cloudWatchTransport = new WinstonCloudWatch({
  logGroupName: process.env.AWS_CLOUDWATCH_LOG_GROUP || 'compliant-backend',
  logStreamName: `${process.env.NODE_ENV}-${new Date().toISOString().split('T')[0]}`,
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
  messageFormatter: ({ level, message, ...meta }) => {
    return JSON.stringify({
      level,
      message,
      timestamp: new Date().toISOString(),
      ...meta,
    });
  },
});
```

### Option 3: Loki + Promtail (Grafana Stack)

```yaml
# Add to docker-compose.monitoring.yml
  loki:
    image: grafana/loki:latest
    container_name: loki
    ports:
      - "3100:3100"
    volumes:
      - ./monitoring/loki-config.yml:/etc/loki/local-config.yaml
      - loki_data:/loki
    command: -config.file=/etc/loki/local-config.yaml

  promtail:
    image: grafana/promtail:latest
    container_name: promtail
    volumes:
      - ./monitoring/promtail-config.yml:/etc/promtail/config.yml
      - /var/log:/var/log:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
    command: -config.file=/etc/promtail/config.yml
```

---

## Metrics & Dashboards

### Backend Metrics Endpoint

```typescript
// packages/backend/src/modules/metrics/metrics.controller.ts
import { Controller, Get } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  async getMetrics() {
    return this.metricsService.getPrometheusMetrics();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }
}
```

```typescript
// packages/backend/src/modules/metrics/metrics.service.ts
import { Injectable } from '@nestjs/common';
import { register, Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly httpRequestDuration: Histogram;
  private readonly httpRequestTotal: Counter;
  private readonly activeConnections: Gauge;

  constructor() {
    // HTTP request duration
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    });

    // HTTP request count
    this.httpRequestTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });

    // Active connections
    this.activeConnections = new Gauge({
      name: 'active_connections',
      help: 'Number of active connections',
    });

    // Default metrics (CPU, memory, etc.)
    register.collectDefaultMetrics();
  }

  recordRequest(method: string, route: string, statusCode: number, duration: number) {
    this.httpRequestDuration.labels(method, route, statusCode.toString()).observe(duration);
    this.httpRequestTotal.labels(method, route, statusCode.toString()).inc();
  }

  setActiveConnections(count: number) {
    this.activeConnections.set(count);
  }

  async getPrometheusMetrics() {
    return register.metrics();
  }
}
```

### Grafana Dashboards

```json
// monitoring/grafana/dashboards/dashboard.json
{
  "dashboard": {
    "title": "Compliant Platform - Overview",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Response Time (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status_code=~\"5..\"}[5m])"
          }
        ]
      },
      {
        "title": "Memory Usage",
        "targets": [
          {
            "expr": "process_resident_memory_bytes"
          }
        ]
      }
    ]
  }
}
```

**Recommended Grafana Dashboard IDs** (Import from Grafana.com):
- **Node Exporter**: Dashboard ID `1860`
- **PostgreSQL**: Dashboard ID `9628`
- **Redis**: Dashboard ID `11835`
- **Docker**: Dashboard ID `893`
- **NestJS**: Dashboard ID `14058`

---

## Alerting & Incident Management

### Prometheus Alerting Rules

```yaml
# monitoring/prometheus/alerts.yml
groups:
  - name: backend_alerts
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} (threshold: 0.05)"

      # Slow response time
      - alert: SlowResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Slow API response time"
          description: "P95 response time is {{ $value }}s (threshold: 1s)"

      # High CPU usage
      - alert: HighCPUUsage
        expr: rate(process_cpu_seconds_total[5m]) > 0.8
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage"
          description: "CPU usage is {{ $value }} (threshold: 80%)"

      # High memory usage
      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes > 1073741824
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value }} bytes (threshold: 1GB)"

      # Database connection pool exhaustion
      - alert: DatabaseConnectionPoolExhausted
        expr: active_connections > 45
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Database connection pool nearly exhausted"
          description: "Active connections: {{ $value }} (limit: 50)"

      # Service down
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service is down"
          description: "{{ $labels.instance }} is down"
```

### PagerDuty Integration

```yaml
# Add to prometheus.yml
alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

# monitoring/alertmanager/config.yml
global:
  resolve_timeout: 5m
  pagerduty_url: 'https://events.pagerduty.com/v2/enqueue'

route:
  receiver: 'pagerduty-critical'
  group_by: ['alertname', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 12h
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty-critical'
    - match:
        severity: warning
      receiver: 'slack-warnings'

receivers:
  - name: 'pagerduty-critical'
    pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_SERVICE_KEY'
        description: '{{ .CommonAnnotations.summary }}'
        severity: '{{ .CommonLabels.severity }}'

  - name: 'slack-warnings'
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK_URL'
        channel: '#alerts'
        title: 'Alert: {{ .CommonAnnotations.summary }}'
        text: '{{ .CommonAnnotations.description }}'
```

---

## Distributed Tracing

### Jaeger Setup

```yaml
# Add to docker-compose.monitoring.yml
  jaeger:
    image: jaegertracing/all-in-one:latest
    container_name: jaeger
    ports:
      - "5775:5775/udp"
      - "6831:6831/udp"
      - "6832:6832/udp"
      - "5778:5778"
      - "16686:16686"  # Jaeger UI
      - "14268:14268"
      - "14250:14250"
      - "9411:9411"
    environment:
      - COLLECTOR_ZIPKIN_HOST_PORT=:9411
```

```typescript
// packages/backend/src/tracing.ts
import { initTracer } from 'jaeger-client';

export function initializeTracing() {
  const config = {
    serviceName: 'compliant-backend',
    sampler: {
      type: 'const',
      param: 1,
    },
    reporter: {
      logSpans: true,
      agentHost: process.env.JAEGER_AGENT_HOST || 'localhost',
      agentPort: 6831,
    },
  };

  const options = {
    logger: {
      info: (msg) => console.log('INFO', msg),
      error: (msg) => console.error('ERROR', msg),
    },
  };

  return initTracer(config, options);
}
```

---

## Database Monitoring

### PostgreSQL Exporter

```yaml
# Add to docker-compose.monitoring.yml
  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    container_name: postgres-exporter
    ports:
      - "9187:9187"
    environment:
      DATA_SOURCE_NAME: "postgresql://user:password@postgres:5432/compliant_prod?sslmode=disable"
    depends_on:
      - postgres
```

### Redis Exporter

```yaml
# Add to docker-compose.monitoring.yml
  redis-exporter:
    image: oliver006/redis_exporter:latest
    container_name: redis-exporter
    ports:
      - "9121:9121"
    environment:
      REDIS_ADDR: "redis:6379"
    depends_on:
      - redis
```

---

## Synthetic Monitoring

### Uptime Monitoring with Uptime Robot

1. Sign up at [UptimeRobot.com](https://uptimerobot.com)
2. Create monitors for:
   - API Health: `https://api.yourdomain.com/health`
   - Frontend: `https://app.yourdomain.com`
   - Database connectivity (via API)

### Synthetic API Tests

```javascript
// monitoring/synthetic-tests/api-health.js
const fetch = require('node-fetch');

async function checkAPIHealth() {
  try {
    const response = await fetch('https://api.yourdomain.com/health');
    const data = await response.json();
    
    if (response.status !== 200 || data.status !== 'ok') {
      throw new Error(`Health check failed: ${JSON.stringify(data)}`);
    }
    
    console.log('✅ API health check passed');
    return true;
  } catch (error) {
    console.error('❌ API health check failed:', error);
    // Send alert to PagerDuty/Slack
    return false;
  }
}

// Run every 5 minutes
setInterval(checkAPIHealth, 5 * 60 * 1000);
```

---

## Cost Optimization

### Estimated Monthly Costs

| Service | Tier | Cost |
|---------|------|------|
| **New Relic** | Pro | $99/user |
| **Datadog** | Pro | $15/host |
| **AWS CloudWatch** | Pay-as-you-go | $5-50 |
| **ELK Stack (Self-hosted)** | EC2 t3.large | $60 |
| **Prometheus + Grafana (Self-hosted)** | Free | $0 |
| **UptimeRobot** | Free tier | $0 |

**Recommended Starter Stack** (Free/$10/month):
- Prometheus + Grafana (self-hosted)
- Loki for logs
- UptimeRobot for uptime monitoring
- AWS CloudWatch for cloud resources (if on AWS)

---

## Implementation Checklist

### Phase 1: Basic Monitoring (Week 1)
- [ ] Deploy Prometheus + Grafana
- [ ] Add /metrics endpoint to backend
- [ ] Configure basic dashboards
- [ ] Set up uptime monitoring
- [ ] Configure health checks

### Phase 2: Advanced Monitoring (Week 2)
- [ ] Implement log aggregation (ELK or Loki)
- [ ] Add distributed tracing (Jaeger)
- [ ] Configure database monitoring
- [ ] Set up alerting rules
- [ ] Integrate with PagerDuty/Slack

### Phase 3: APM Integration (Week 3)
- [ ] Choose APM provider (New Relic/Datadog)
- [ ] Install and configure APM agent
- [ ] Configure transaction tracing
- [ ] Set up custom metrics
- [ ] Train team on APM usage

### Phase 4: Optimization (Ongoing)
- [ ] Review and tune alert thresholds
- [ ] Optimize dashboard layouts
- [ ] Configure SLO/SLI tracking
- [ ] Document runbooks for alerts
- [ ] Regular review of monitoring data

---

## Support & Resources

- **Prometheus Documentation**: https://prometheus.io/docs/
- **Grafana Documentation**: https://grafana.com/docs/
- **OpenTelemetry**: https://opentelemetry.io/docs/
- **ELK Stack**: https://www.elastic.co/guide/
- **New Relic**: https://docs.newrelic.com/
- **Datadog**: https://docs.datadoghq.com/

---

**Status**: ✅ **100% Complete Monitoring & Observability Guide**  
**Last Updated**: January 2026
