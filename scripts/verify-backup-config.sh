#!/bin/bash
# =============================================================================
# Backup Configuration Verification Script
# =============================================================================
# Comprehensive verification of backup infrastructure and configuration.
# Validates that all backup mechanisms are properly configured and functional.
#
# Usage:
#   ./verify-backup-config.sh [OPTIONS]
#
# Options:
#   --check-all            Run all checks (default)
#   --check-scripts        Only verify backup scripts
#   --check-cron           Only verify cron configuration
#   --check-s3             Only verify S3 access and backups
#   --check-db             Only verify database connectivity
#   --check-rds            Only verify RDS backup configuration
#   --check-wal            Only verify WAL archiving
#   --fix                  Attempt to fix issues automatically
#   --verbose              Show detailed output
#   --help                 Show this help message
#
# Environment Variables:
#   DATABASE_URL           Database connection string
#   AWS_ACCESS_KEY_ID      AWS credentials for S3/RDS access
#   AWS_SECRET_ACCESS_KEY  AWS credentials for S3/RDS access
#   S3_BUCKET              S3 bucket name for backups
#   S3_REGION              AWS region (default: us-east-1)
#   RDS_INSTANCE_ID        RDS instance identifier (if using RDS)
#   BACKUP_RETENTION_DAYS  Backup retention policy (default: 30)
#
# Examples:
#   # Run all checks
#   ./verify-backup-config.sh
#
#   # Check only S3 configuration
#   ./verify-backup-config.sh --check-s3
#
#   # Run all checks and attempt fixes
#   ./verify-backup-config.sh --fix
#
#   # Verbose output for debugging
#   ./verify-backup-config.sh --verbose
#
# Exit Codes:
#   0 - All checks passed
#   1 - Some checks failed
#   2 - Configuration error
#   3 - Critical failure
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

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Check options
CHECK_ALL=true
CHECK_SCRIPTS=false
CHECK_CRON=false
CHECK_S3=false
CHECK_DB=false
CHECK_RDS=false
CHECK_WAL=false
FIX_ISSUES=false
VERBOSE=false

# Configuration
S3_BUCKET="${S3_BUCKET:-compliant-backups}"
S3_REGION="${S3_REGION:-us-east-1}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
RDS_INSTANCE_ID="${RDS_INSTANCE_ID:-}"

# Results tracking
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0
ISSUES_FOUND=()
RECOMMENDATIONS=()

# =============================================================================
# Utility Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $*"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $*"
    ((CHECKS_PASSED++))
}

log_error() {
    echo -e "${RED}[✗]${NC} $*"
    ((CHECKS_FAILED++))
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $*"
    ((CHECKS_WARNING++))
}

log_section() {
    echo ""
    echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}${BOLD}$*${NC}"
    echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

log_detail() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "    ${BLUE}→${NC} $*"
    fi
}

add_issue() {
    ISSUES_FOUND+=("$*")
}

add_recommendation() {
    RECOMMENDATIONS+=("$*")
}

show_usage() {
    sed -n '/^# Usage:/,/^# ===/p' "$0" | sed 's/^# \?//'
    exit 0
}

# =============================================================================
# Backup Scripts Verification
# =============================================================================

check_backup_scripts() {
    log_section "Checking Backup Scripts"
    
    local backup_script="${SCRIPT_DIR}/backup-database.sh"
    
    # Check if backup script exists
    if [[ -f "$backup_script" ]]; then
        log_success "Backup script exists: $backup_script"
        log_detail "Location: $backup_script"
    else
        log_error "Backup script not found: $backup_script"
        add_issue "Missing backup script at $backup_script"
        add_recommendation "Create backup script with daily database dumps"
        
        if [[ "$FIX_ISSUES" == "true" ]]; then
            log_info "Attempting to create basic backup script..."
            create_backup_script "$backup_script"
        fi
        return
    fi
    
    # Check if script is executable
    if [[ -x "$backup_script" ]]; then
        log_success "Backup script is executable"
    else
        log_error "Backup script is not executable"
        add_issue "Backup script lacks execute permissions"
        
        if [[ "$FIX_ISSUES" == "true" ]]; then
            log_info "Making script executable..."
            chmod +x "$backup_script"
            log_success "Fixed: Made backup script executable"
        else
            add_recommendation "Run: chmod +x $backup_script"
        fi
    fi
    
    # Check script syntax
    log_detail "Validating script syntax..."
    if bash -n "$backup_script" 2>/dev/null; then
        log_success "Backup script syntax is valid"
    else
        log_error "Backup script has syntax errors"
        add_issue "Backup script contains syntax errors"
    fi
    
    # Check for required environment variables in script
    log_detail "Checking for environment variable usage..."
    local required_vars=("DATABASE_URL" "S3_BUCKET" "AWS_ACCESS_KEY_ID")
    local found_vars=0
    
    for var in "${required_vars[@]}"; do
        if grep -q "$var" "$backup_script"; then
            ((found_vars++))
            log_detail "✓ Script references $var"
        fi
    done
    
    if [[ $found_vars -ge 2 ]]; then
        log_success "Backup script uses required environment variables"
    else
        log_warning "Backup script may be missing environment variable checks"
    fi
    
    # Check for error handling
    if grep -q "set -e" "$backup_script"; then
        log_success "Backup script has error handling (set -e)"
    else
        log_warning "Backup script may lack proper error handling"
        add_recommendation "Add 'set -e' to backup script for better error handling"
    fi
    
    # Check for logging
    if grep -q "log\|echo.*ERROR\|echo.*SUCCESS" "$backup_script"; then
        log_success "Backup script includes logging"
    else
        log_warning "Backup script may lack logging"
        add_recommendation "Add logging to backup script for monitoring"
    fi
}

create_backup_script() {
    local script_path="$1"
    
    cat > "$script_path" << 'EOF'
#!/bin/bash
set -euo pipefail

# Simple database backup script
BACKUP_DIR="${BACKUP_DIR:-/tmp/backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "Starting backup: $BACKUP_FILE"
pg_dump "$DATABASE_URL" | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

if [[ -n "${S3_BUCKET:-}" ]]; then
    aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}" "s3://${S3_BUCKET}/backups/"
    echo "Uploaded to S3: s3://${S3_BUCKET}/backups/${BACKUP_FILE}"
fi

echo "Backup completed: $BACKUP_FILE"
EOF
    
    chmod +x "$script_path"
    log_success "Created basic backup script"
}

# =============================================================================
# Cron Job Verification
# =============================================================================

check_cron_jobs() {
    log_section "Checking Cron Job Configuration"
    
    # Check if cron is available
    if ! command -v crontab &> /dev/null; then
        log_error "Cron not available on this system"
        add_issue "Cron service not installed"
        add_recommendation "Install cron: apt-get install cron (Debian/Ubuntu) or yum install cronie (RHEL/CentOS)"
        return
    fi
    
    log_success "Cron is available"
    
    # Check current user's crontab
    log_detail "Checking crontab for current user..."
    local crontab_output
    crontab_output=$(crontab -l 2>/dev/null || echo "")
    
    if [[ -z "$crontab_output" ]]; then
        log_warning "No crontab entries found for current user"
        add_issue "No automated backup jobs scheduled"
        add_recommendation "Add cron job: 0 2 * * * /path/to/backup-database.sh"
    else
        log_detail "Crontab exists for current user"
    fi
    
    # Check for backup-related cron jobs
    if echo "$crontab_output" | grep -q "backup"; then
        log_success "Backup-related cron jobs found"
        
        # Show the backup cron jobs
        if [[ "$VERBOSE" == "true" ]]; then
            echo ""
            echo -e "${BLUE}Backup cron jobs:${NC}"
            echo "$crontab_output" | grep "backup" | while read -r line; do
                echo -e "  ${GREEN}→${NC} $line"
            done
            echo ""
        fi
        
        # Check frequency
        local backup_count=$(echo "$crontab_output" | grep "backup" | wc -l || echo "0")
        log_info "Found $backup_count backup-related cron job(s)"
        
        if [[ $backup_count -ge 1 ]]; then
            log_success "Automated backups are scheduled"
        fi
    else
        log_error "No backup-related cron jobs found"
        add_issue "Automated backups not scheduled in cron"
        add_recommendation "Add daily backup cron job: 0 2 * * * $SCRIPT_DIR/backup-database.sh"
    fi
    
    # Check cron service status (systemd systems)
    if command -v systemctl &> /dev/null; then
        log_detail "Checking cron service status..."
        if systemctl is-active --quiet cron 2>/dev/null || systemctl is-active --quiet crond 2>/dev/null; then
            log_success "Cron service is running"
        else
            log_error "Cron service is not running"
            add_issue "Cron service is not active"
            
            if [[ "$FIX_ISSUES" == "true" ]]; then
                log_info "Attempting to start cron service..."
                sudo systemctl start cron 2>/dev/null || sudo systemctl start crond 2>/dev/null || true
            else
                add_recommendation "Start cron service: systemctl start cron"
            fi
        fi
    fi
    
    # Check cron logs (if available)
    if [[ -f /var/log/cron ]]; then
        log_detail "Checking recent cron activity..."
        local recent_backups=$(grep "backup" /var/log/cron 2>/dev/null | tail -20 | wc -l || echo "0")
        if [[ $recent_backups -gt 0 ]]; then
            log_success "Recent backup executions found in cron logs"
        else
            log_warning "No recent backup executions in cron logs"
        fi
    fi
}

# =============================================================================
# S3 Backup Verification
# =============================================================================

check_s3_configuration() {
    log_section "Checking AWS S3 Backup Configuration"
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not installed"
        add_issue "AWS CLI not available"
        add_recommendation "Install AWS CLI: pip install awscli"
        return
    fi
    log_success "AWS CLI is installed"
    
    # Check version
    local aws_version=$(aws --version 2>&1 | awk '{print $1}')
    log_detail "AWS CLI version: $aws_version"
    
    # Check AWS credentials
    if [[ -z "${AWS_ACCESS_KEY_ID:-}" ]] || [[ -z "${AWS_SECRET_ACCESS_KEY:-}" ]]; then
        log_warning "AWS credentials not set in environment variables"
        
        # Check if credentials file exists
        if [[ -f ~/.aws/credentials ]]; then
            log_success "AWS credentials file exists: ~/.aws/credentials"
        else
            log_error "No AWS credentials configured"
            add_issue "AWS credentials not configured"
            add_recommendation "Configure AWS credentials: aws configure"
            return
        fi
    else
        log_success "AWS credentials set in environment variables"
    fi
    
    # Test AWS connectivity
    log_detail "Testing AWS connectivity..."
    if aws sts get-caller-identity --region "$S3_REGION" &>/dev/null; then
        log_success "AWS authentication successful"
        local account_id=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)
        log_detail "AWS Account ID: $account_id"
    else
        log_error "AWS authentication failed"
        add_issue "Cannot authenticate with AWS"
        return
    fi
    
    # Check S3 bucket exists
    log_detail "Checking S3 bucket: $S3_BUCKET"
    if aws s3 ls "s3://${S3_BUCKET}" --region "$S3_REGION" &>/dev/null; then
        log_success "S3 bucket exists: $S3_BUCKET"
    else
        log_error "S3 bucket not accessible: $S3_BUCKET"
        add_issue "Cannot access S3 bucket: $S3_BUCKET"
        
        if [[ "$FIX_ISSUES" == "true" ]]; then
            log_info "Attempting to create S3 bucket..."
            if aws s3 mb "s3://${S3_BUCKET}" --region "$S3_REGION" 2>/dev/null; then
                log_success "Created S3 bucket: $S3_BUCKET"
            else
                log_error "Failed to create S3 bucket"
                add_recommendation "Create S3 bucket manually or check permissions"
            fi
        else
            add_recommendation "Create S3 bucket: aws s3 mb s3://${S3_BUCKET}"
        fi
        return
    fi
    
    # Check for existing backups
    log_detail "Checking for existing backups..."
    local backup_count=$(aws s3 ls "s3://${S3_BUCKET}/backups/" --region "$S3_REGION" 2>/dev/null | wc -l || echo "0")
    
    if [[ $backup_count -gt 0 ]]; then
        log_success "Found $backup_count backup file(s) in S3"
        
        # Check latest backup age
        local latest_backup=$(aws s3 ls "s3://${S3_BUCKET}/backups/" --region "$S3_REGION" 2>/dev/null | sort | tail -n 1)
        if [[ -n "$latest_backup" ]]; then
            local backup_date=$(echo "$latest_backup" | awk '{print $1, $2}')
            log_info "Latest backup: $backup_date"
            
            # Calculate age
            local backup_timestamp
            local age_hours=0
            
            # Try Linux date format first, then macOS
            if backup_timestamp=$(date -d "$backup_date" +%s 2>/dev/null); then
                # Linux/GNU date
                local now=$(date +%s)
                age_hours=$(( (now - backup_timestamp) / 3600 ))
            elif backup_timestamp=$(date -j -f "%Y-%m-%d %H:%M:%S" "$backup_date" +%s 2>/dev/null); then
                # macOS/BSD date
                local now=$(date +%s)
                age_hours=$(( (now - backup_timestamp) / 3600 ))
            else
                log_warning "Cannot parse backup date, skipping age check"
            fi
            
            if [[ $age_hours -gt 0 ]]; then
                if [[ $age_hours -lt 24 ]]; then
                    log_success "Latest backup is recent (${age_hours}h old)"
                elif [[ $age_hours -lt 48 ]]; then
                    log_warning "Latest backup is ${age_hours}h old (older than 24h)"
                    add_recommendation "Verify backup cron job is running"
                else
                    log_error "Latest backup is ${age_hours}h old (older than 48h)"
                    add_issue "Backups appear to be stale"
                    add_recommendation "Check backup cron job and script execution"
                fi
            fi
        fi
    else
        log_warning "No backups found in S3"
        add_issue "No backups exist in S3 bucket"
        add_recommendation "Run manual backup to verify backup process"
    fi
    
    # Check bucket versioning
    log_detail "Checking bucket versioning..."
    local versioning_status=$(aws s3api get-bucket-versioning --bucket "$S3_BUCKET" --region "$S3_REGION" 2>/dev/null | grep Status | cut -d'"' -f4 || echo "Disabled")
    
    if [[ "$versioning_status" == "Enabled" ]]; then
        log_success "S3 bucket versioning is enabled"
    else
        log_warning "S3 bucket versioning is not enabled"
        add_recommendation "Enable versioning: aws s3api put-bucket-versioning --bucket $S3_BUCKET --versioning-configuration Status=Enabled"
    fi
    
    # Check encryption
    log_detail "Checking bucket encryption..."
    if aws s3api get-bucket-encryption --bucket "$S3_BUCKET" --region "$S3_REGION" &>/dev/null; then
        log_success "S3 bucket encryption is enabled"
    else
        log_warning "S3 bucket encryption is not enabled"
        add_recommendation "Enable encryption: aws s3api put-bucket-encryption --bucket $S3_BUCKET --server-side-encryption-configuration '{\"Rules\":[{\"ApplyServerSideEncryptionByDefault\":{\"SSEAlgorithm\":\"AES256\"}}]}'"
    fi
    
    # Check lifecycle policy (retention)
    log_detail "Checking lifecycle policy..."
    if aws s3api get-bucket-lifecycle-configuration --bucket "$S3_BUCKET" --region "$S3_REGION" &>/dev/null; then
        log_success "S3 bucket lifecycle policy configured"
    else
        log_warning "No lifecycle policy configured (backups will not expire)"
        add_recommendation "Configure retention policy to delete backups older than $BACKUP_RETENTION_DAYS days"
    fi
}

# =============================================================================
# Database Connectivity Verification
# =============================================================================

check_database_connectivity() {
    log_section "Checking Database Connectivity"
    
    # Check PostgreSQL client
    if ! command -v psql &> /dev/null; then
        log_error "PostgreSQL client (psql) not installed"
        add_issue "PostgreSQL client tools not available"
        add_recommendation "Install PostgreSQL client: apt-get install postgresql-client"
        return
    fi
    log_success "PostgreSQL client is installed"
    
    # Check version
    local pg_version=$(psql --version | awk '{print $3}')
    log_detail "PostgreSQL client version: $pg_version"
    
    # Check DATABASE_URL
    if [[ -z "${DATABASE_URL:-}" ]]; then
        log_error "DATABASE_URL not set"
        add_issue "DATABASE_URL environment variable not configured"
        add_recommendation "Set DATABASE_URL with connection string"
        return
    fi
    log_success "DATABASE_URL is set"
    
    # Parse DATABASE_URL (basic check)
    if [[ "$DATABASE_URL" =~ postgresql:// ]] || [[ "$DATABASE_URL" =~ postgres:// ]]; then
        log_detail "✓ Valid PostgreSQL URL format"
    else
        log_warning "DATABASE_URL format may be invalid"
    fi
    
    # Test database connection
    log_detail "Testing database connection..."
    if psql "$DATABASE_URL" -c "SELECT version();" &>/dev/null; then
        log_success "Database connection successful"
        
        # Get database version
        local db_version=$(psql "$DATABASE_URL" -t -c "SELECT version();" 2>/dev/null | head -n1)
        log_detail "Database: $db_version"
        
        # Check database size
        local db_size=$(psql "$DATABASE_URL" -t -c "SELECT pg_size_pretty(pg_database_size(current_database()));" 2>/dev/null | tr -d ' ')
        log_info "Database size: $db_size"
        
        # Check table count
        local table_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
        log_info "Table count: $table_count"
        
    else
        log_error "Cannot connect to database"
        add_issue "Database connection failed"
        add_recommendation "Verify DATABASE_URL and network connectivity"
        return
    fi
    
    # Check pg_dump availability
    if command -v pg_dump &> /dev/null; then
        log_success "pg_dump is available for backups"
    else
        log_error "pg_dump not found"
        add_issue "pg_dump command not available"
    fi
}

# =============================================================================
# RDS Backup Verification
# =============================================================================

check_rds_backups() {
    log_section "Checking RDS Automated Backup Configuration"
    
    if [[ -z "$RDS_INSTANCE_ID" ]]; then
        log_info "RDS_INSTANCE_ID not set, skipping RDS checks"
        log_detail "Set RDS_INSTANCE_ID if using AWS RDS"
        return
    fi
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not available for RDS checks"
        return
    fi
    
    # Get RDS instance details
    log_detail "Checking RDS instance: $RDS_INSTANCE_ID"
    
    local rds_info
    if ! rds_info=$(aws rds describe-db-instances --db-instance-identifier "$RDS_INSTANCE_ID" --region "$S3_REGION" 2>/dev/null); then
        log_error "Cannot access RDS instance: $RDS_INSTANCE_ID"
        add_issue "RDS instance not found or not accessible"
        return
    fi
    
    log_success "RDS instance found: $RDS_INSTANCE_ID"
    
    # Check automated backups
    local backup_retention=$(echo "$rds_info" | grep -o '"BackupRetentionPeriod": [0-9]*' | awk '{print $2}')
    
    if [[ -n "$backup_retention" ]] && [[ $backup_retention -gt 0 ]]; then
        log_success "RDS automated backups enabled (retention: $backup_retention days)"
        
        if [[ $backup_retention -lt 7 ]]; then
            log_warning "RDS backup retention is less than 7 days"
            add_recommendation "Increase RDS backup retention to at least 7 days"
        fi
    else
        log_error "RDS automated backups not enabled"
        add_issue "RDS automated backups disabled"
        add_recommendation "Enable RDS automated backups with retention period"
    fi
    
    # Check backup window
    local backup_window=$(echo "$rds_info" | grep -o '"PreferredBackupWindow": "[^"]*"' | cut -d'"' -f4)
    if [[ -n "$backup_window" ]]; then
        log_success "RDS backup window configured: $backup_window"
    fi
    
    # Check snapshot count
    local snapshot_count=$(aws rds describe-db-snapshots --db-instance-identifier "$RDS_INSTANCE_ID" --region "$S3_REGION" 2>/dev/null | grep -c "DBSnapshotIdentifier" || echo "0")
    log_info "RDS snapshots available: $snapshot_count"
    
    if [[ $snapshot_count -gt 0 ]]; then
        log_success "RDS snapshots exist"
    else
        log_warning "No RDS snapshots found"
    fi
}

# =============================================================================
# WAL Archiving Verification
# =============================================================================

check_wal_archiving() {
    log_section "Checking PostgreSQL WAL Archiving"
    
    if [[ -z "${DATABASE_URL:-}" ]]; then
        log_warning "DATABASE_URL not set, skipping WAL checks"
        return
    fi
    
    # Check WAL archiving status
    log_detail "Checking WAL archive configuration..."
    
    local archive_mode=$(psql "$DATABASE_URL" -t -c "SHOW archive_mode;" 2>/dev/null | tr -d ' ')
    
    if [[ "$archive_mode" == "on" ]]; then
        log_success "WAL archiving is enabled"
        
        # Check archive command
        local archive_command=$(psql "$DATABASE_URL" -t -c "SHOW archive_command;" 2>/dev/null)
        if [[ -n "$archive_command" ]] && [[ "$archive_command" != "(disabled)" ]]; then
            log_success "WAL archive command configured"
            log_detail "Archive command: $archive_command"
        else
            log_warning "WAL archive command not configured"
            add_recommendation "Configure archive_command in postgresql.conf"
        fi
        
        # Check WAL level
        local wal_level=$(psql "$DATABASE_URL" -t -c "SHOW wal_level;" 2>/dev/null | tr -d ' ')
        log_info "WAL level: $wal_level"
        
        if [[ "$wal_level" == "replica" ]] || [[ "$wal_level" == "logical" ]]; then
            log_success "WAL level supports archiving"
        else
            log_warning "WAL level may not support full archiving"
        fi
        
    else
        log_warning "WAL archiving is not enabled"
        log_info "WAL archiving provides point-in-time recovery (PITR)"
        add_recommendation "Enable WAL archiving for enhanced disaster recovery"
    fi
    
    # Check replication status (if applicable)
    local replication_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_stat_replication;" 2>/dev/null | tr -d ' ' || echo "0")
    
    if [[ $replication_count -gt 0 ]]; then
        log_success "Database replication active ($replication_count replica(s))"
    else
        log_info "No database replication configured"
        log_detail "Consider setting up replication for high availability"
    fi
}

# =============================================================================
# Storage Capacity Check
# =============================================================================

check_storage_capacity() {
    log_section "Checking Backup Storage Capacity"
    
    # Check local disk space (if backups stored locally)
    local backup_dir="${BACKUP_DIR:-/var/backups}"
    
    if [[ -d "$backup_dir" ]]; then
        log_detail "Checking local backup directory: $backup_dir"
        
        local available_space=$(df -h "$backup_dir" | awk 'NR==2 {print $4}')
        local used_percent=$(df -h "$backup_dir" | awk 'NR==2 {print $5}' | tr -d '%')
        
        log_info "Available space: $available_space (${used_percent}% used)"
        
        if [[ $used_percent -lt 80 ]]; then
            log_success "Sufficient local storage available"
        elif [[ $used_percent -lt 90 ]]; then
            log_warning "Local storage is ${used_percent}% full"
            add_recommendation "Monitor disk space usage"
        else
            log_error "Local storage is critically low (${used_percent}% full)"
            add_issue "Insufficient local storage for backups"
            add_recommendation "Free up disk space or configure retention policy"
        fi
    fi
    
    # Check S3 storage (if using S3)
    if [[ -n "${S3_BUCKET:-}" ]] && command -v aws &> /dev/null; then
        log_detail "Checking S3 storage usage..."
        
        local s3_size=$(aws s3 ls "s3://${S3_BUCKET}/backups/" --recursive --summarize --region "$S3_REGION" 2>/dev/null | grep "Total Size" | awk '{print $3}' || echo "0")
        
        if [[ $s3_size -gt 0 ]]; then
            local size_gb=$((s3_size / 1024 / 1024 / 1024))
            log_info "S3 backup storage: ${size_gb}GB"
            log_success "S3 storage information available"
        fi
    fi
}

# =============================================================================
# Report Generation
# =============================================================================

generate_report() {
    echo ""
    echo -e "${BOLD}${CYAN}════════════════════════════════════════${NC}"
    echo -e "${BOLD}${CYAN}  BACKUP CONFIGURATION REPORT${NC}"
    echo -e "${BOLD}${CYAN}════════════════════════════════════════${NC}"
    echo ""
    echo -e "${BOLD}Verification Summary:${NC}"
    echo -e "  ${GREEN}Passed:${NC}   $CHECKS_PASSED"
    echo -e "  ${RED}Failed:${NC}   $CHECKS_FAILED"
    echo -e "  ${YELLOW}Warnings:${NC} $CHECKS_WARNING"
    echo ""
    
    # Show issues
    if [[ ${#ISSUES_FOUND[@]} -gt 0 ]]; then
        echo -e "${BOLD}${RED}Issues Found:${NC}"
        for issue in "${ISSUES_FOUND[@]}"; do
            echo -e "  ${RED}✗${NC} $issue"
        done
        echo ""
    fi
    
    # Show recommendations
    if [[ ${#RECOMMENDATIONS[@]} -gt 0 ]]; then
        echo -e "${BOLD}${YELLOW}Recommendations:${NC}"
        for rec in "${RECOMMENDATIONS[@]}"; do
            echo -e "  ${YELLOW}→${NC} $rec"
        done
        echo ""
    fi
    
    # Overall status
    if [[ $CHECKS_FAILED -eq 0 ]]; then
        echo -e "${BOLD}Overall Status:${NC} ${GREEN}✓ BACKUP CONFIGURATION OK${NC}"
        echo ""
        echo -e "${GREEN}Your backup infrastructure appears to be properly configured!${NC}"
        return 0
    else
        echo -e "${BOLD}Overall Status:${NC} ${RED}✗ CONFIGURATION ISSUES DETECTED${NC}"
        echo ""
        echo -e "${RED}Please review and fix the issues listed above.${NC}"
        return 1
    fi
}

# =============================================================================
# Main Execution
# =============================================================================

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --check-all)
                CHECK_ALL=true
                shift
                ;;
            --check-scripts)
                CHECK_ALL=false
                CHECK_SCRIPTS=true
                shift
                ;;
            --check-cron)
                CHECK_ALL=false
                CHECK_CRON=true
                shift
                ;;
            --check-s3)
                CHECK_ALL=false
                CHECK_S3=true
                shift
                ;;
            --check-db)
                CHECK_ALL=false
                CHECK_DB=true
                shift
                ;;
            --check-rds)
                CHECK_ALL=false
                CHECK_RDS=true
                shift
                ;;
            --check-wal)
                CHECK_ALL=false
                CHECK_WAL=true
                shift
                ;;
            --fix)
                FIX_ISSUES=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --help)
                show_usage
                ;;
            *)
                echo "Unknown option: $1"
                show_usage
                ;;
        esac
    done
}

main() {
    parse_args "$@"
    
    echo -e "${BOLD}${CYAN}Backup Configuration Verification${NC}"
    echo -e "${CYAN}Starting at $(date)${NC}"
    echo ""
    
    # Run selected checks
    if [[ "$CHECK_ALL" == "true" ]] || [[ "$CHECK_SCRIPTS" == "true" ]]; then
        check_backup_scripts
    fi
    
    if [[ "$CHECK_ALL" == "true" ]] || [[ "$CHECK_CRON" == "true" ]]; then
        check_cron_jobs
    fi
    
    if [[ "$CHECK_ALL" == "true" ]] || [[ "$CHECK_S3" == "true" ]]; then
        check_s3_configuration
    fi
    
    if [[ "$CHECK_ALL" == "true" ]] || [[ "$CHECK_DB" == "true" ]]; then
        check_database_connectivity
    fi
    
    if [[ "$CHECK_ALL" == "true" ]] || [[ "$CHECK_RDS" == "true" ]]; then
        check_rds_backups
    fi
    
    if [[ "$CHECK_ALL" == "true" ]] || [[ "$CHECK_WAL" == "true" ]]; then
        check_wal_archiving
    fi
    
    if [[ "$CHECK_ALL" == "true" ]]; then
        check_storage_capacity
    fi
    
    # Generate report
    generate_report
    exit $?
}

main "$@"
