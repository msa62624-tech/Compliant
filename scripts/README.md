# Security Scan Script

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

**Issue**: When `AUDIT_FAILED` was set to 1, the global `FAILED` flag was not being set, allowing deployments with vulnerabilities to proceed.

**Fix**: Added `FAILED=1` assignment when `AUDIT_FAILED=1` is detected in the `run_audit()` function.

```bash
# Before (BUGGY):
if ! pnpm audit --audit-level=high --json > /tmp/audit-${package_name}.json 2>&1; then
    AUDIT_FAILED=1
    echo -e "${RED}✗ Security vulnerabilities found in ${package_name}${NC}"
    # Missing: FAILED=1
fi

# After (FIXED):
if ! pnpm audit --audit-level=high --json > /tmp/audit-${package_name}.json 2>&1; then
    AUDIT_FAILED=1
    echo -e "${RED}✗ Security vulnerabilities found in ${package_name}${NC}"
    # FIX: Set global FAILED flag when AUDIT_FAILED is true
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
