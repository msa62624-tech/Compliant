#!/bin/bash
# Security Scan Script for Compliant Platform
# Runs npm audit and security checks before deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Global flag to track failures
FAILED=0

echo -e "${GREEN}🔒 Starting Security Scan...${NC}"

# Function to handle audit failures
run_audit() {
    local package_path=$1
    local package_name=$2
    
    echo -e "${YELLOW}Auditing ${package_name}...${NC}"
    
    cd "$package_path"
    
    # Run npm audit and capture exit code
    if ! pnpm audit --audit-level=high --json > /tmp/audit-${package_name}.json 2>&1; then
        echo -e "${RED}✗ Security vulnerabilities found in ${package_name}${NC}"
        
        # Parse and display critical vulnerabilities
        if [ -f /tmp/audit-${package_name}.json ]; then
            jq -r '.vulnerabilities | to_entries[] | select(.value.severity == "high" or .value.severity == "critical") | "  - \(.key): \(.value.severity) - \(.value.title)"' /tmp/audit-${package_name}.json 2>/dev/null || cat /tmp/audit-${package_name}.json
        fi
        
        # FIX: Set global FAILED flag when audit fails
        FAILED=1
    else
        echo -e "${GREEN}✓ No high/critical vulnerabilities in ${package_name}${NC}"
    fi
    
    cd - > /dev/null
}

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}✗ pnpm is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if jq is installed for JSON parsing
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠ jq is not installed. Install it for better audit output parsing.${NC}"
fi

# Determine repository root (supports both CI and local environments)
REPO_ROOT="${REPO_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

# Run audit for each package
run_audit "${REPO_ROOT}/packages/backend" "backend"
run_audit "${REPO_ROOT}/packages/frontend" "frontend"
run_audit "${REPO_ROOT}/packages/shared" "shared"

# Run additional security checks
echo -e "${YELLOW}Running additional security checks...${NC}"

# Check for hardcoded secrets (basic patterns)
# Note: This is a basic check. For production use, consider dedicated tools
# like gitleaks (https://github.com/gitleaks/gitleaks) or
# truffleHog (https://github.com/trufflesecurity/truffleHog) for more accurate detection
echo "Checking for hardcoded secrets..."
if grep -r -E "(password|secret|api_key|apikey|token)\s*=\s*['\"][^'\"]{8,}" \
    --include="*.ts" --include="*.js" --include="*.json" \
    --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git \
    "${REPO_ROOT}/packages/" 2>/dev/null | grep -v "\.example" | grep -v "test" | grep -v "mock"; then
    echo -e "${RED}✗ Potential hardcoded secrets found${NC}"
    FAILED=1
else
    echo -e "${GREEN}✓ No hardcoded secrets detected${NC}"
fi

# Check for proper environment variable usage
echo "Checking .env.example files..."
if [ ! -f "${REPO_ROOT}/packages/backend/.env.example" ]; then
    echo -e "${YELLOW}⚠ packages/backend/.env.example not found${NC}"
fi

# Final result
echo ""
echo "======================================"
if [ $FAILED -eq 1 ]; then
    echo -e "${RED}✗ Security scan FAILED${NC}"
    echo -e "${RED}Fix the issues above before deploying${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Security scan PASSED${NC}"
    echo -e "${GREEN}All security checks completed successfully${NC}"
    exit 0
fi
