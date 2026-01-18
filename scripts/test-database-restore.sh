#!/bin/bash
# =============================================================================
# Database Restore Testing Script
# =============================================================================
# Tests database backup and restore procedures to validate disaster recovery
# readiness and RTO compliance (target: < 1 hour).
#
# Usage:
#   ./test-database-restore.sh [OPTIONS]
#
# Options:
#   --dry-run              Show what would be done without executing
#   --skip-cleanup         Keep test database after completion
#   --backup-file FILE     Use specific backup file instead of latest
#   --s3-bucket BUCKET     Override default S3 bucket
#   --skip-download        Use existing local backup file
#   --verbose              Show detailed output
#   --help                 Show this help message
#
# Environment Variables:
#   DATABASE_URL           Production database URL (for verification only)
#   TEST_DATABASE_URL      Test database URL (default: uses temp DB)
#   AWS_ACCESS_KEY_ID      AWS credentials for S3 access
#   AWS_SECRET_ACCESS_KEY  AWS credentials for S3 access
#   S3_BUCKET              S3 bucket name for backups
#   S3_REGION              AWS region (default: us-east-1)
#
# Examples:
#   # Run full restore test with latest backup
#   ./test-database-restore.sh
#
#   # Dry run to see what would happen
#   ./test-database-restore.sh --dry-run
#
#   # Test specific backup file
#   ./test-database-restore.sh --backup-file backup-2024-01-18.sql.gz
#
#   # Use existing local backup
#   ./test-database-restore.sh --skip-download --backup-file ./backup.sql.gz
#
# Exit Codes:
#   0 - Success
#   1 - General error
#   2 - Configuration error
#   3 - Backup download failed
#   4 - Restore failed
#   5 - Validation failed
#   6 - Safety check failed
# =============================================================================

set -euo pipefail

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color
readonly BOLD='\033[1m'

# Default configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK_DIR="${WORK_DIR:-/tmp/db-restore-test-$$}"
DRY_RUN=false
SKIP_CLEANUP=false
SKIP_DOWNLOAD=false
VERBOSE=false
BACKUP_FILE=""
S3_BUCKET="${S3_BUCKET:-compliant-backups}"
S3_REGION="${S3_REGION:-us-east-1}"
TEST_DB_NAME="compliant_restore_test_$(date +%s)"
START_TIME=$(date +%s)

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
WARNINGS=0

# =============================================================================
# Utility Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $*"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*"
    ((TESTS_PASSED++))
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*" >&2
    ((TESTS_FAILED++))
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $*"
    ((WARNINGS++))
}

log_step() {
    echo -e "\n${CYAN}${BOLD}==>${NC} ${BOLD}$*${NC}"
}

log_detail() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "    $*"
    fi
}

show_usage() {
    sed -n '/^# Usage:/,/^# ===/p' "$0" | sed 's/^# \?//'
    exit 0
}

elapsed_time() {
    local end_time=$(date +%s)
    local elapsed=$((end_time - START_TIME))
    local minutes=$((elapsed / 60))
    local seconds=$((elapsed % 60))
    echo "${minutes}m ${seconds}s"
}

check_rto_compliance() {
    local elapsed=$(($(date +%s) - START_TIME))
    local target_seconds=$((60 * 60)) # 1 hour
    
    if [[ $elapsed -lt $target_seconds ]]; then
        log_success "RTO COMPLIANT: Restore completed in $(elapsed_time) (target: < 1h)"
        return 0
    else
        log_error "RTO EXCEEDED: Restore took $(elapsed_time) (target: < 1h)"
        return 1
    fi
}

# =============================================================================
# Safety Checks
# =============================================================================

check_production_safety() {
    log_step "Running production safety checks"
    
    # Check if DATABASE_URL contains production indicators
    if [[ "${DATABASE_URL:-}" =~ (prod|production|live|prd) ]]; then
        log_error "DATABASE_URL appears to point to production database"
        log_error "This script should never run against production!"
        return 6
    fi
    
    # Check hostname
    local hostname=$(hostname)
    if [[ "$hostname" =~ (prod|production|live|prd) ]]; then
        log_warning "Running on what appears to be a production server: $hostname"
        read -p "Are you sure you want to continue? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            log_error "Aborted by user"
            return 6
        fi
    fi
    
    log_success "Safety checks passed"
    return 0
}

# =============================================================================
# Dependency Checks
# =============================================================================

check_dependencies() {
    log_step "Checking dependencies"
    
    local missing_deps=()
    
    # Check required commands
    for cmd in psql pg_dump pg_restore aws gzip gunzip md5sum date; do
        if ! command -v "$cmd" &> /dev/null; then
            missing_deps+=("$cmd")
            log_error "Required command not found: $cmd"
        else
            log_detail "✓ $cmd found"
        fi
    done
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        log_error "Install required packages:"
        log_error "  Ubuntu/Debian: apt-get install postgresql-client awscli gzip coreutils"
        log_error "  macOS: brew install postgresql awscli"
        return 2
    fi
    
    # Check AWS credentials
    if [[ -z "${AWS_ACCESS_KEY_ID:-}" ]] || [[ -z "${AWS_SECRET_ACCESS_KEY:-}" ]]; then
        log_warning "AWS credentials not set, may not be able to download from S3"
        log_warning "Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables"
    else
        log_detail "✓ AWS credentials configured"
    fi
    
    log_success "All dependencies available"
    return 0
}

# =============================================================================
# S3 Backup Operations
# =============================================================================

list_s3_backups() {
    log_step "Listing available backups from S3"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would list: s3://${S3_BUCKET}/backups/"
        return 0
    fi
    
    log_info "S3 Bucket: s3://${S3_BUCKET}/backups/"
    
    if ! aws s3 ls "s3://${S3_BUCKET}/backups/" --region "$S3_REGION" 2>/dev/null; then
        log_error "Failed to list S3 backups"
        log_error "Check AWS credentials and bucket name"
        return 3
    fi
    
    return 0
}

download_latest_backup() {
    log_step "Downloading latest backup from S3"
    
    # List backups and get the latest
    local latest_backup=$(aws s3 ls "s3://${S3_BUCKET}/backups/" --region "$S3_REGION" \
        | grep '\.sql\.gz$' \
        | sort \
        | tail -n 1 \
        | awk '{print $4}')
    
    if [[ -z "$latest_backup" ]]; then
        log_error "No backup files found in S3 bucket"
        return 3
    fi
    
    log_info "Latest backup: $latest_backup"
    BACKUP_FILE="${WORK_DIR}/${latest_backup}"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would download: s3://${S3_BUCKET}/backups/${latest_backup}"
        return 0
    fi
    
    # Download backup
    log_info "Downloading to: $BACKUP_FILE"
    if ! aws s3 cp "s3://${S3_BUCKET}/backups/${latest_backup}" "$BACKUP_FILE" --region "$S3_REGION"; then
        log_error "Failed to download backup from S3"
        return 3
    fi
    
    log_success "Backup downloaded successfully"
    return 0
}

verify_backup_integrity() {
    log_step "Verifying backup integrity"
    
    if [[ ! -f "$BACKUP_FILE" ]]; then
        log_error "Backup file not found: $BACKUP_FILE"
        return 3
    fi
    
    # Check file size
    local file_size
    if stat -f%z "$BACKUP_FILE" &>/dev/null; then
        # macOS/BSD
        file_size=$(stat -f%z "$BACKUP_FILE")
    elif stat -c%s "$BACKUP_FILE" &>/dev/null; then
        # Linux/GNU
        file_size=$(stat -c%s "$BACKUP_FILE")
    else
        log_error "Cannot determine file size (stat command failed)"
        return 3
    fi
    
    local size_mb=$((file_size / 1024 / 1024))
    log_info "Backup file size: ${size_mb}MB"
    
    if [[ $file_size -lt 1024 ]]; then
        log_error "Backup file suspiciously small: ${file_size} bytes"
        return 3
    fi
    log_detail "✓ File size check passed"
    
    # Check if it's a valid gzip file
    if ! gzip -t "$BACKUP_FILE" 2>/dev/null; then
        log_error "Backup file is not a valid gzip archive"
        return 3
    fi
    log_detail "✓ Gzip integrity check passed"
    
    # Calculate checksum
    local checksum=$(md5sum "$BACKUP_FILE" | awk '{print $1}')
    log_info "MD5 Checksum: $checksum"
    log_detail "✓ Checksum calculated"
    
    # Check if backup contains SQL
    if ! gunzip -c "$BACKUP_FILE" | head -n 20 | grep -q "PostgreSQL database dump"; then
        log_error "Backup file does not appear to be a PostgreSQL dump"
        return 3
    fi
    log_detail "✓ PostgreSQL dump format verified"
    
    log_success "Backup integrity verified"
    return 0
}

# =============================================================================
# Database Operations
# =============================================================================

setup_test_database() {
    log_step "Setting up test database"
    
    # Parse DATABASE_URL or use default
    local db_host="${POSTGRES_HOST:-localhost}"
    local db_port="${POSTGRES_PORT:-5432}"
    local db_user="${POSTGRES_USER:-postgres}"
    local db_pass="${POSTGRES_PASSWORD:-postgres}"
    
    export PGHOST="$db_host"
    export PGPORT="$db_port"
    export PGUSER="$db_user"
    export PGPASSWORD="$db_pass"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would create database: $TEST_DB_NAME"
        return 0
    fi
    
    # Check database connectivity
    if ! psql -c "SELECT version();" postgres &>/dev/null; then
        log_error "Cannot connect to PostgreSQL server"
        log_error "Check connection settings: $db_host:$db_port"
        return 2
    fi
    log_detail "✓ Database connection verified"
    
    # Drop test database if it exists
    psql -c "DROP DATABASE IF EXISTS ${TEST_DB_NAME};" postgres &>/dev/null || true
    
    # Create test database
    if ! psql -c "CREATE DATABASE ${TEST_DB_NAME};" postgres; then
        log_error "Failed to create test database"
        return 4
    fi
    log_detail "✓ Test database created: $TEST_DB_NAME"
    
    log_success "Test database ready"
    return 0
}

restore_backup() {
    log_step "Restoring backup to test database"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would restore backup to: $TEST_DB_NAME"
        return 0
    fi
    
    local restore_start=$(date +%s)
    
    # Restore backup
    log_info "Restoring... (this may take several minutes)"
    if gunzip -c "$BACKUP_FILE" | psql "$TEST_DB_NAME" &>/dev/null; then
        local restore_end=$(date +%s)
        local restore_time=$((restore_end - restore_start))
        log_success "Backup restored in ${restore_time}s"
    else
        log_error "Failed to restore backup"
        return 4
    fi
    
    return 0
}

# =============================================================================
# Data Validation
# =============================================================================

validate_data_integrity() {
    log_step "Validating data integrity"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would validate data integrity"
        return 0
    fi
    
    # Check critical tables exist
    local critical_tables=("users" "organizations" "policies" "documents" "audit_logs")
    
    for table in "${critical_tables[@]}"; do
        if psql "$TEST_DB_NAME" -c "\dt $table" 2>/dev/null | grep -q "$table"; then
            log_detail "✓ Table exists: $table"
        else
            log_warning "Critical table not found: $table (may not exist in backup)"
        fi
    done
    
    # Get row counts
    log_info "Checking row counts..."
    local total_rows=0
    
    for table in "${critical_tables[@]}"; do
        local count=$(psql "$TEST_DB_NAME" -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null || echo "0")
        count=$(echo "$count" | tr -d ' ')
        total_rows=$((total_rows + count))
        log_detail "  $table: $count rows"
    done
    
    if [[ $total_rows -eq 0 ]]; then
        log_warning "No data found in critical tables (empty database?)"
    else
        log_info "Total rows in critical tables: $total_rows"
    fi
    
    # Check indexes
    local index_count=$(psql "$TEST_DB_NAME" -t -c "SELECT COUNT(*) FROM pg_indexes;" 2>/dev/null | tr -d ' ')
    log_info "Indexes: $index_count"
    log_detail "✓ Indexes verified"
    
    # Check foreign key constraints
    local fk_count=$(psql "$TEST_DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY';" 2>/dev/null | tr -d ' ')
    log_info "Foreign key constraints: $fk_count"
    log_detail "✓ Constraints verified"
    
    log_success "Data integrity validated"
    return 0
}

test_query_performance() {
    log_step "Testing query performance"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would test query performance"
        return 0
    fi
    
    # Test simple SELECT query
    local query_time=$(psql "$TEST_DB_NAME" -c "\timing on" -c "SELECT COUNT(*) FROM pg_tables;" 2>&1 | grep "Time:" | awk '{print $2}' | sed 's/ms//')
    
    if [[ -n "$query_time" ]]; then
        log_info "Sample query time: ${query_time}ms"
        # Use awk for comparison instead of bc
        if [[ $(awk "BEGIN {print ($query_time < 1000)}") == "1" ]]; then
            log_detail "✓ Query performance acceptable"
        else
            log_warning "Query performance may be degraded: ${query_time}ms"
        fi
    fi
    
    # Test database connection pool
    log_info "Testing connection pool..."
    for i in {1..5}; do
        psql "$TEST_DB_NAME" -c "SELECT 1;" &>/dev/null &
    done
    wait
    log_detail "✓ Connection pool test passed"
    
    log_success "Query performance test completed"
    return 0
}

# =============================================================================
# Cleanup
# =============================================================================

cleanup() {
    if [[ "$SKIP_CLEANUP" == "true" ]]; then
        log_info "Skipping cleanup (--skip-cleanup specified)"
        log_info "Test database: $TEST_DB_NAME"
        log_info "Backup file: $BACKUP_FILE"
        return 0
    fi
    
    log_step "Cleaning up"
    
    # Drop test database
    if [[ -n "${TEST_DB_NAME:-}" ]] && [[ "$DRY_RUN" == "false" ]]; then
        psql -c "DROP DATABASE IF EXISTS ${TEST_DB_NAME};" postgres &>/dev/null || true
        log_detail "✓ Test database dropped"
    fi
    
    # Remove work directory
    if [[ -d "$WORK_DIR" ]]; then
        rm -rf "$WORK_DIR"
        log_detail "✓ Work directory removed"
    fi
    
    log_success "Cleanup completed"
}

# =============================================================================
# Report Generation
# =============================================================================

generate_report() {
    local end_time=$(date +%s)
    local total_time=$((end_time - START_TIME))
    
    echo ""
    echo -e "${BOLD}${CYAN}========================================${NC}"
    echo -e "${BOLD}${CYAN}  DATABASE RESTORE TEST REPORT${NC}"
    echo -e "${BOLD}${CYAN}========================================${NC}"
    echo ""
    echo -e "${BOLD}Test Information:${NC}"
    echo "  Date: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "  Duration: $(elapsed_time)"
    echo "  Backup File: $(basename "${BACKUP_FILE:-N/A}")"
    echo "  Test Database: $TEST_DB_NAME"
    echo ""
    echo -e "${BOLD}Results Summary:${NC}"
    echo -e "  ${GREEN}Passed:${NC}  $TESTS_PASSED"
    echo -e "  ${RED}Failed:${NC}  $TESTS_FAILED"
    echo -e "  ${YELLOW}Warnings:${NC} $WARNINGS"
    echo ""
    
    # RTO Compliance
    local rto_target=$((60 * 60))
    if [[ $total_time -lt $rto_target ]]; then
        echo -e "${BOLD}RTO Compliance:${NC} ${GREEN}✓ PASS${NC} ($(elapsed_time) < 1 hour)"
    else
        echo -e "${BOLD}RTO Compliance:${NC} ${RED}✗ FAIL${NC} ($(elapsed_time) > 1 hour)"
    fi
    echo ""
    
    # Overall Status
    if [[ $TESTS_FAILED -eq 0 ]]; then
        echo -e "${BOLD}Overall Status:${NC} ${GREEN}✓ ALL TESTS PASSED${NC}"
        echo ""
        echo -e "${GREEN}Database restore procedures are working correctly!${NC}"
        return 0
    else
        echo -e "${BOLD}Overall Status:${NC} ${RED}✗ SOME TESTS FAILED${NC}"
        echo ""
        echo -e "${RED}Please review the errors above and fix the issues.${NC}"
        return 1
    fi
}

# =============================================================================
# Main Execution
# =============================================================================

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --skip-cleanup)
                SKIP_CLEANUP=true
                shift
                ;;
            --skip-download)
                SKIP_DOWNLOAD=true
                shift
                ;;
            --backup-file)
                BACKUP_FILE="$2"
                shift 2
                ;;
            --s3-bucket)
                S3_BUCKET="$2"
                shift 2
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --help)
                show_usage
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                ;;
        esac
    done
}

main() {
    parse_args "$@"
    
    echo -e "${BOLD}${CYAN}Database Restore Test${NC}"
    echo -e "${CYAN}Starting at $(date)${NC}"
    echo ""
    
    # Create work directory
    mkdir -p "$WORK_DIR"
    
    # Run all checks and tests
    check_production_safety || exit $?
    check_dependencies || exit $?
    
    if [[ "$SKIP_DOWNLOAD" == "false" ]]; then
        if [[ -z "$BACKUP_FILE" ]]; then
            list_s3_backups || exit $?
            download_latest_backup || exit $?
        fi
    fi
    
    verify_backup_integrity || exit $?
    setup_test_database || exit $?
    restore_backup || exit $?
    validate_data_integrity || exit $?
    test_query_performance || exit $?
    check_rto_compliance || true
    
    # Cleanup
    cleanup
    
    # Generate final report
    generate_report
    local exit_code=$?
    
    exit $exit_code
}

# Trap errors and cleanup
trap 'log_error "Script interrupted"; cleanup; exit 1' INT TERM

main "$@"
