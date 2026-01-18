# Scripts Directory

This directory contains operational scripts for the Compliant Insurance Tracking Platform.

## Available Scripts

### Security & Validation
- **security-scan.sh** - Security vulnerability scanning
- **validate-production-env.js** - Production environment validation
- **validate-enterprise-readiness.js** - Enterprise readiness assessment
- **production-deployment-checklist.sh** - Pre-deployment checklist

### Backup & Disaster Recovery
- **test-database-restore.sh** - Automated database restore testing
- **verify-backup-config.sh** - Backup configuration verification

### Performance Testing
- **run-load-tests.sh** - K6 load test execution wrapper

### Setup
- **setup-and-run.sh** - Quick setup and run script

---

## Security Scan Script

This script performs security audits on the Compliant Platform codebase before deployment.

## Usage

```bash
# Run security scan
./scripts/security-scan.sh
```

## What It Checks

1. **NPM Audit**: Scans all packages (backend, frontend, shared) for high and critical vulnerabilities
2. **Hardcoded Secrets**: Searches for potential hardcoded passwords, API keys, and tokens
3. **Environment Files**: Verifies that .env.example files exist

## Exit Codes

- `0`: All security checks passed
- `1`: Security vulnerabilities found or checks failed

## Integration with CI/CD

Add to your GitHub Actions workflow:

```yaml
- name: Run Security Scan
  run: |
    chmod +x scripts/security-scan.sh
    ./scripts/security-scan.sh
```

## Requirements

- `pnpm`: Package manager
- `jq` (optional): For better audit output formatting

## Bug Fixes

### v1.1 - Fixed AUDIT_FAILED Flag Bug

**Issue**: When audit failures occurred, the global `FAILED` flag was not being set, allowing deployments with vulnerabilities to proceed.

**Fix**: Updated `run_audit()` function to directly set `FAILED=1` when package audits fail.

```bash
# Fixed implementation:
if ! pnpm audit --audit-level=high --json > /tmp/audit-${package_name}.json 2>&1; then
    echo -e "${RED}✗ Security vulnerabilities found in ${package_name}${NC}"
    # FIX: Set global FAILED flag when audit fails
    FAILED=1
fi
```

This ensures that when any package has audit failures, the script properly exits with code 1, preventing insecure code from being deployed.

## Testing

Test the script locally:

```bash
# Should pass on clean codebase
./scripts/security-scan.sh
echo $? # Should be 0

# Test failure scenario by temporarily adding a vulnerable package
cd packages/backend
pnpm add old-vulnerable-package@1.0.0
cd ../..
./scripts/security-scan.sh
echo $? # Should be 1
```

---

## Database Restore Testing Script

**File:** `test-database-restore.sh` (621 lines)

Automated testing of database backup and restore procedures to validate disaster recovery readiness and RTO compliance.

### Features

- ✅ Downloads latest backup from AWS S3
- ✅ Verifies backup integrity (checksums, file size)
- ✅ Creates temporary test database
- ✅ Restores backup and validates data
- ✅ Tests query performance
- ✅ Measures RTO compliance (< 1 hour target)
- ✅ Comprehensive error handling
- ✅ Production safety checks
- ✅ Color-coded output

### Usage

```bash
# Run full restore test with latest backup
./scripts/test-database-restore.sh

# Dry run to see what would happen
./scripts/test-database-restore.sh --dry-run

# Test specific backup file
./scripts/test-database-restore.sh --backup-file backup-2024-01-18.sql.gz

# Use existing local backup
./scripts/test-database-restore.sh --skip-download --backup-file ./backup.sql.gz

# Keep test database for inspection
./scripts/test-database-restore.sh --skip-cleanup
```

### Environment Variables

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/prod
TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/test
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
S3_BUCKET=compliant-backups
S3_REGION=us-east-1
```

### Exit Codes

- `0` - Success
- `1` - General error
- `2` - Configuration error
- `3` - Backup download failed
- `4` - Restore failed
- `5` - Validation failed
- `6` - Safety check failed

### Safety Features

- Prevents running against production databases
- Validates environment before execution
- Uses temporary test database
- Automatic cleanup on completion

---

## Backup Configuration Verification Script

**File:** `verify-backup-config.sh` (860 lines)

Comprehensive verification of backup infrastructure and configuration to ensure disaster recovery readiness.

### Features

- ✅ Verifies backup scripts exist and are executable
- ✅ Checks cron job configuration
- ✅ Tests AWS S3 access and lists backups
- ✅ Validates database connectivity
- ✅ Checks RDS automated backup configuration
- ✅ Tests PostgreSQL WAL archiving setup
- ✅ Validates backup retention policies
- ✅ Checks encryption settings
- ✅ Storage capacity monitoring
- ✅ Auto-fix capabilities

### Usage

```bash
# Run all checks
./scripts/verify-backup-config.sh

# Check only S3 configuration
./scripts/verify-backup-config.sh --check-s3

# Check only database connectivity
./scripts/verify-backup-config.sh --check-db

# Run all checks and attempt fixes
./scripts/verify-backup-config.sh --fix

# Verbose output for debugging
./scripts/verify-backup-config.sh --verbose
```

### Available Checks

- `--check-all` - Run all checks (default)
- `--check-scripts` - Verify backup scripts
- `--check-cron` - Verify cron configuration
- `--check-s3` - Verify S3 access and backups
- `--check-db` - Verify database connectivity
- `--check-rds` - Verify RDS backup configuration
- `--check-wal` - Verify WAL archiving

### Environment Variables

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/prod
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
S3_BUCKET=compliant-backups
S3_REGION=us-east-1
RDS_INSTANCE_ID=compliant-prod-db
BACKUP_RETENTION_DAYS=30
```

### Exit Codes

- `0` - All checks passed
- `1` - Some checks failed
- `2` - Configuration error
- `3` - Critical failure

---

## Load Test Execution Script

**File:** `run-load-tests.sh` (752 lines)

Comprehensive wrapper for executing K6 load tests with validation, safety checks, and results reporting.

### Features

- ✅ Multiple test types (normal, peak, stress, spike, soak)
- ✅ Environment safety checks
- ✅ K6 installation verification
- ✅ Target accessibility validation
- ✅ Automated K6 script generation
- ✅ Threshold validation (p95 < 500ms, error rate < 1%)
- ✅ Detailed results reporting
- ✅ Timestamped result files
- ✅ Production warning system
- ✅ Color-coded output

### Usage

```bash
# Run normal load test
./scripts/run-load-tests.sh normal

# Run stress test against staging
./scripts/run-load-tests.sh --target https://staging-api.example.com stress

# Run peak test with custom duration
./scripts/run-load-tests.sh --duration 10m peak

# Dry run to see configuration
./scripts/run-load-tests.sh --dry-run normal

# Run with custom VUs and K6 args
./scripts/run-load-tests.sh --vus 100 --k6-args "--http-debug" normal
```

### Test Types

| Type | Duration | VUs | Description |
|------|----------|-----|-------------|
| **normal** | 5m | 50 | Baseline performance test |
| **peak** | 10m | 100-150 | Peak traffic conditions |
| **stress** | 15m | 200-300 | Find breaking point |
| **spike** | 3m | 50-500 | Sudden traffic surge |
| **soak** | 1h | 50 | Extended stability test |

### Options

- `--target URL` - Target API base URL
- `--duration TIME` - Test duration (e.g., 5m, 1h)
- `--vus NUMBER` - Virtual users override
- `--dry-run` - Preview without executing
- `--skip-checks` - Skip safety checks
- `--output DIR` - Output directory
- `--k6-args ARGS` - Additional K6 arguments
- `--verbose` - Detailed output

### Environment Variables

```bash
API_BASE_URL=https://api-staging.example.com
K6_CLOUD_TOKEN=your-k6-cloud-token
TEST_DURATION=10m
MAX_VUS=200
THRESHOLDS_P95=500
THRESHOLDS_ERROR_RATE=0.01
```

### Performance Thresholds

- **P95 Response Time:** < 500ms
- **P99 Response Time:** < 1000ms
- **Error Rate:** < 1%

### Exit Codes

- `0` - Success (all thresholds met)
- `1` - Test failed (thresholds not met)
- `2` - Configuration error
- `3` - K6 not installed
- `4` - Safety check failed
- `5` - Target not accessible

### Safety Features

- Detects production URLs and warns
- Validates target accessibility before testing
- Checks K6 installation
- Prevents accidental production testing

---

## Dependencies

### Common Dependencies
- `bash` (4.0+)
- `curl`
- `jq` (optional, for JSON parsing)

### Database Scripts
- `psql` (PostgreSQL client)
- `pg_dump` / `pg_restore`
- `aws` CLI (for S3 operations)

### Load Testing
- `k6` (load testing tool)

### Installation

```bash
# Ubuntu/Debian
apt-get update
apt-get install -y postgresql-client awscli jq curl

# macOS
brew install postgresql awscli jq k6

# K6 (Ubuntu/Debian)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 \
  --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

---

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Validation Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  backup-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Verify Backup Configuration
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: ./scripts/verify-backup-config.sh
      
      - name: Test Database Restore
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: ./scripts/test-database-restore.sh

  load-testing:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install K6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
            --keyserver hkp://keyserver.ubuntu.com:80 \
            --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
            | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6
      
      - name: Run Load Tests
        env:
          API_BASE_URL: ${{ secrets.STAGING_API_URL }}
        run: ./scripts/run-load-tests.sh --target $API_BASE_URL normal
```

---

## Best Practices

### Backup Testing
1. Run restore tests weekly
2. Verify RTO compliance
3. Test different backup scenarios
4. Keep test results for audit trail

### Load Testing
1. Start with normal tests
2. Run against staging/QA environments
3. Schedule during off-peak hours
4. Monitor system resources during tests
5. Compare results against baselines

### Security
1. Never commit credentials
2. Use environment variables
3. Rotate AWS keys regularly
4. Review audit logs

---

## Troubleshooting

### Database Restore Issues

**Problem:** Cannot connect to database
```bash
# Check DATABASE_URL format
echo $DATABASE_URL
# Should be: postgresql://user:pass@host:5432/dbname
```

**Problem:** S3 download fails
```bash
# Test AWS credentials
aws sts get-caller-identity
# Verify bucket access
aws s3 ls s3://your-bucket-name/
```

### Load Test Issues

**Problem:** K6 not found
```bash
# Check installation
k6 version
# If missing, install using package manager
```

**Problem:** Target not accessible
```bash
# Test connectivity
curl -I https://your-api-url.com/health
```

---

## Contributing

When adding new scripts:
1. Include comprehensive help text
2. Add error handling with `set -euo pipefail`
3. Use color-coded output
4. Implement `--dry-run` mode
5. Document exit codes
6. Add examples in comments
7. Make scripts executable: `chmod +x script.sh`
8. Update this README

---

## License

These scripts are part of the Compliant Insurance Tracking Platform.
See the main LICENSE file for details.
