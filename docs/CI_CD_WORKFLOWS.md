# CI/CD Workflows Documentation

This document provides an overview of all CI/CD workflows in this repository.

## 📋 Table of Contents

1. [Testing Workflows](#testing-workflows)
2. [Security Workflows](#security-workflows)
3. [Deployment Workflows](#deployment-workflows)
4. [Workflow Triggers](#workflow-triggers)
5. [Configuration](#configuration)

---

## Testing Workflows

### 1. CI (Continuous Integration)
**File**: `.github/workflows/ci.yml`

**Purpose**: Primary CI pipeline for all pull requests and pushes

**Features**:
- Linting with ESLint
- Building all packages
- Unit tests with Jest
- PostgreSQL service for database tests
- Build status verification

**Triggers**:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

**Duration**: ~5-10 minutes

---

### 2. Integration Tests
**File**: `.github/workflows/integration-tests.yml`

**Purpose**: Comprehensive integration testing with real services

**Features**:
- PostgreSQL 15 service
- Redis 7 service
- Database migrations
- Database seeding
- API endpoint health checks
- Backend integration tests
- Test result artifacts

**Triggers**:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`
- Manual workflow dispatch

**Duration**: ~15-30 minutes

**Environment Variables**:
```yaml
DATABASE_URL: postgresql://postgres:postgres@localhost:5432/compliant_integration_test
REDIS_URL: redis://localhost:6379
JWT_SECRET: test-jwt-secret-key-for-integration-tests-32chars
JWT_REFRESH_SECRET: test-jwt-refresh-secret-key-integration-tests
ENCRYPTION_KEY: dGVzdC1lbmNyeXB0aW9uLWtleS1mb3ItdGVzdGluZzEyMzQ1Njc4OTA=
ENCRYPTION_SALT: 0123456789abcdef0123456789abcdef
```

---

### 3. E2E Tests
**File**: `.github/workflows/e2e-tests.yml`

**Purpose**: End-to-end testing with Playwright across multiple browsers and viewports

**Features**:
- **Browser Support**: Chromium, Firefox, WebKit
- **Viewport Testing**: Desktop (1920x1080), Tablet (768x1024), Mobile (375x667)
- **Services**: PostgreSQL, Redis
- **Full Stack**: Backend + Frontend running
- **Matrix Testing**: Cross-browser and cross-viewport (on schedule only)
- **Screenshots**: Captured on test failures

**Triggers**:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`
- Daily at 2 AM UTC (schedule)
- Manual workflow dispatch

**Duration**: 
- Single run: ~20-45 minutes
- Matrix (scheduled): ~2-3 hours

**Test Artifacts**:
- Playwright reports
- Test screenshots (on failure)
- Test results per browser/viewport combination

---

### 4. Code Coverage
**File**: `.github/workflows/code-coverage.yml`

**Purpose**: Measure and enforce code coverage standards

**Features**:
- Backend coverage with Jest
- Frontend coverage with Jest
- Shared package coverage
- Codecov integration
- Coverage thresholds (50% warning, 70% target)
- PR comments with coverage details
- Coverage summary in workflow output

**Triggers**:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`
- Manual workflow dispatch

**Duration**: ~10-15 minutes

**Coverage Thresholds**:
- ⚠️ Warning: < 50%
- ⚠️ Warning: < 70%
- ✅ Good: ≥ 70%

**Artifacts**:
- Coverage reports (JSON, HTML, LCOV)
- Retained for 30 days

---

### 5. Performance Tests
**File**: `.github/workflows/performance-tests.yml`

**Purpose**: Load testing and performance monitoring

**Features**:
- **K6 Load Testing**:
  - Ramp-up stages: 10 → 50 → 100 users
  - Response time thresholds: p95 < 500ms, p99 < 1s
  - Error rate threshold: < 5%
  - Duration: ~5 minutes
- **Lighthouse CI**:
  - Performance audits
  - Accessibility checks
  - Best practices validation
  - SEO analysis
- **Metrics Tracking**:
  - Response times (p50, p95, p99)
  - Error rates
  - Total requests
  - Resource usage

**Triggers**:
- Push to `main` (only)
- Pull requests to `main`
- Weekly on Sundays at 3 AM UTC
- Manual workflow dispatch

**Duration**: ~30-60 minutes

**Performance Thresholds**:
| Metric | Target | Threshold |
|--------|--------|-----------|
| 95th Percentile | < 500ms | Warning |
| 99th Percentile | < 1000ms | Warning |
| Error Rate | < 5% | Failure |
| Performance Score | > 60% | Warning |

**Artifacts**:
- K6 results (JSON)
- Lighthouse CI reports
- Retained for 90 days

---

## Security Workflows

### 6. Container Security Scan
**File**: `.github/workflows/security-scan.yml`

**Purpose**: Comprehensive container and dependency security scanning

**Features**:
- **Multi-Stage Docker Build** (Security Fix ✅):
  - Prevents secret leakage
  - Non-root user execution
  - Minimal production image
- **Dependency Scanning**:
  - npm audit (moderate severity+)
  - Snyk security scan (high severity+)
- **Container Scanning**:
  - Trivy vulnerability scanner (OS & libraries)
  - Trivy secret scanner
  - Trivy configuration scanner
  - Grype vulnerability scanner
  - Dockle best practices validator
- **SBOM Generation**:
  - CycloneDX format
  - Full dependency tree
  - Compliance tracking
- **SARIF Upload**:
  - Results to GitHub Security tab
  - Integration with code scanning

**Triggers**:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`
- Weekly on Mondays at 9 AM UTC
- Manual workflow dispatch

**Duration**: ~15-25 minutes

**Severity Levels**:
- CRITICAL: Immediate action required
- HIGH: Fix before production
- MEDIUM: Monitor and plan fix
- LOW: Optional

**Artifacts**:
- SBOM (CycloneDX JSON)
- Retained for 90 days

---

### 7. CodeQL Security Analysis
**File**: `.github/workflows/codeql-analysis.yml`

**Purpose**: Static Application Security Testing (SAST)

**Features**:
- **CodeQL Analysis**:
  - JavaScript/TypeScript scanning
  - Security-extended queries
  - Quality queries
  - Path ignoring (node_modules, dist, etc.)
- **Semgrep Analysis**:
  - OWASP Top 10 rules
  - Secret detection
  - JavaScript/TypeScript security patterns
  - React/Next.js specific rules
- **ESLint Security**:
  - eslint-plugin-security
  - eslint-plugin-no-secrets
  - Custom security rules
- **SARIF Upload**:
  - All results to GitHub Security tab
  - Categorized by tool and language

**Triggers**:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`
- Weekly on Tuesdays at 4 AM UTC
- Manual workflow dispatch

**Duration**: ~20-45 minutes

**Security Checks**:
- SQL Injection patterns
- XSS vulnerabilities
- Hardcoded secrets
- Unsafe regular expressions
- Command injection
- Path traversal
- CSRF vulnerabilities
- Timing attacks

**Artifacts**:
- CodeQL results (by language)
- Semgrep results
- ESLint security results
- Retained for 30 days

---

## Deployment Workflows

### 8. Production Deployment
**File**: `.github/workflows/deploy.yml`

**Purpose**: Automated deployment to production/staging environments

**Features**:
- **Pre-Deployment Testing**:
  - Full test suite
  - Linting
  - Build verification
- **Build Artifacts**:
  - Backend dist
  - Frontend build
  - Next.js artifacts
- **Environment Support**:
  - Production (default)
  - Staging (manual selection)
- **Post-Deployment**:
  - Smoke tests
  - Deployment notifications

**Triggers**:
- Push to `main` (production)
- Manual workflow dispatch (choose environment)

**Duration**: ~15-20 minutes

**Deployment Steps**:
1. Run tests
2. Build packages
3. Upload artifacts
4. Deploy to environment
5. Run smoke tests
6. Send notifications

---

## Workflow Triggers

### Automatic Triggers

| Workflow | Push (main) | Push (develop) | PR | Schedule | Dispatch |
|----------|-------------|----------------|-----|----------|----------|
| CI | ✅ | ✅ | ✅ | ❌ | ❌ |
| Integration Tests | ✅ | ✅ | ✅ | ❌ | ✅ |
| E2E Tests | ✅ | ✅ | ✅ | Daily 2 AM | ✅ |
| Code Coverage | ✅ | ✅ | ✅ | ❌ | ✅ |
| Performance Tests | ✅ | ❌ | ✅ (to main) | Weekly Sun 3 AM | ✅ |
| Container Security | ✅ | ✅ | ✅ | Weekly Mon 9 AM | ✅ |
| CodeQL Analysis | ✅ | ✅ | ✅ | Weekly Tue 4 AM | ✅ |
| Production Deploy | ✅ | ❌ | ❌ | ❌ | ✅ |

### Schedule Details

- **Daily**: E2E Tests (2 AM UTC)
- **Weekly**: 
  - Sunday 3 AM: Performance Tests
  - Monday 9 AM: Container Security Scan
  - Tuesday 4 AM: CodeQL Analysis

---

## Configuration

### Required Secrets

The following secrets should be configured in GitHub repository settings:

```yaml
CODECOV_TOKEN          # Optional: For Codecov integration
SNYK_TOKEN            # Optional: For Snyk scanning
```

### Environment Setup

All workflows use test databases with isolated schemas:
- Integration: `compliant_integration_test`
- E2E: `compliant_e2e_test`
- Coverage: `compliant_coverage_test`
- Performance: `compliant_perf_test`

### Service Versions

| Service | Version | Image |
|---------|---------|-------|
| PostgreSQL | 15 | `postgres:15` |
| Redis | 7 | `redis:7-alpine` |
| Node.js | 20 | `node:20-alpine` |

### Test Secrets (Non-Sensitive)

All workflows use non-sensitive test secrets:
```yaml
JWT_SECRET: test-jwt-secret-key-*-32chars
JWT_REFRESH_SECRET: test-jwt-refresh-secret-*
ENCRYPTION_KEY: dGVzdC1lbmNyeXB0aW9uLWtleS0* (base64)
ENCRYPTION_SALT: 0123456789abcdef* (hex)
```

---

## Monitoring and Alerts

### Workflow Status

Monitor workflow status at:
```
https://github.com/hml-brokerage/Compliant-/actions
```

### Failed Workflow Notifications

GitHub automatically sends notifications for:
- Failed workflows on `main` branch
- Failed workflows on your PRs

### Security Alerts

Security scan results are available at:
```
https://github.com/hml-brokerage/Compliant-/security/code-scanning
```

---

## Best Practices

### For Developers

1. **Before Creating PR**:
   - Run `pnpm lint` locally
   - Run `pnpm test` locally
   - Ensure code builds successfully

2. **During PR Review**:
   - Check all workflow statuses
   - Address any security findings
   - Maintain or improve code coverage

3. **Before Merging**:
   - Ensure all workflows pass
   - Review security scan results
   - Check performance metrics (if changed)

### For DevOps

1. **Weekly Review**:
   - Check scheduled workflow results
   - Review security scan findings
   - Monitor performance trends

2. **Security Updates**:
   - Address CRITICAL findings immediately
   - Plan fixes for HIGH findings
   - Track MEDIUM/LOW findings

3. **Performance Monitoring**:
   - Track performance trends
   - Investigate degradation
   - Optimize based on metrics

---

## Troubleshooting

### Common Issues

#### Workflow Fails on Dependency Installation
```bash
# Solution: Update pnpm-lock.yaml
pnpm install
git add pnpm-lock.yaml
git commit -m "Update lock file"
```

#### Database Connection Errors
```yaml
# Check DATABASE_URL format in workflow
DATABASE_URL: postgresql://postgres:postgres@localhost:5432/db_name
```

#### Coverage Threshold Not Met
```bash
# Run coverage locally to identify gaps
pnpm test:cov

# Add more tests for uncovered code
```

#### Container Security Scan Failures
```bash
# Update vulnerable dependencies
pnpm update

# Or update specific package
pnpm update package-name@latest
```

---

## Future Enhancements

Potential improvements for consideration:

1. **Testing**:
   - Visual regression testing
   - API contract testing
   - Mutation testing

2. **Security**:
   - Dependency license scanning
   - Container runtime scanning
   - Infrastructure as Code scanning

3. **Performance**:
   - Real User Monitoring (RUM)
   - Synthetic monitoring
   - Database query profiling

4. **Deployment**:
   - Blue-green deployments
   - Canary releases
   - Automatic rollback

---

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Playwright Documentation](https://playwright.dev)
- [K6 Documentation](https://k6.io/docs)
- [CodeQL Documentation](https://codeql.github.com)
- [Trivy Documentation](https://aquasecurity.github.io/trivy)
