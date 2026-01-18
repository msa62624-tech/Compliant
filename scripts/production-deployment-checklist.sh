#!/bin/bash

# Production Deployment Checklist Script
# This script helps verify production readiness step-by-step

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║      Production Deployment Checklist for Compliant Platform      ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Track completion
completed=0
total=0
warnings=0

# Function to check and prompt
check_step() {
    local step_name="$1"
    local description="$2"
    local auto_check="$3"
    
    ((total++))
    
    echo -e "\n${BLUE}━━━ Step $total: $step_name ━━━${NC}"
    echo -e "${description}"
    
    if [ -n "$auto_check" ]; then
        # Run automatic check
        if eval "$auto_check" &>/dev/null; then
            echo -e "${GREEN}✓ Automatic check passed${NC}"
            ((completed++))
            return 0
        else
            echo -e "${RED}✗ Automatic check failed${NC}"
            return 1
        fi
    else
        # Manual confirmation
        read -p "$(echo -e ${YELLOW}Has this been completed? [y/n]: ${NC})" answer
        if [[ "$answer" =~ ^[Yy]$ ]]; then
            echo -e "${GREEN}✓ Marked as complete${NC}"
            ((completed++))
            return 0
        else
            echo -e "${RED}✗ Marked as incomplete${NC}"
            ((warnings++))
            return 1
        fi
    fi
}

echo -e "\n${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}SECTION 1: Environment Configuration${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"

check_step \
    "Generate Production Secrets" \
    "Generate JWT secrets and encryption keys using:
  ${BLUE}openssl rand -base64 32${NC} for JWT_SECRET
  ${BLUE}openssl rand -base64 32${NC} for JWT_REFRESH_SECRET
  ${BLUE}openssl rand -base64 32${NC} for ENCRYPTION_KEY
  ${BLUE}openssl rand -hex 16${NC} for ENCRYPTION_SALT"

check_step \
    "Configure Production Database" \
    "Set up PostgreSQL database with:
  - SSL enabled (sslmode=require)
  - Strong password
  - Connection pooling configured
  - Backups enabled"

check_step \
    "Configure Redis" \
    "Set up Redis instance with:
  - Password authentication
  - SSL/TLS if possible
  - Proper memory limits"

check_step \
    "Configure Email Service" \
    "Choose and configure email provider:
  - SendGrid: Get API key and verify sender
  - AWS SES: Set up credentials and verify domain
  - SMTP: Configure host, port, and credentials"

check_step \
    "Configure File Storage" \
    "Set up file storage:
  - AWS S3: Create bucket and set IAM permissions
  - Azure Blob: Create container and get connection string
  - Local: Ensure persistent volume is mounted"

check_step \
    "Set CORS Origins" \
    "Configure CORS_ORIGIN with production domains only:
  - Format: https://app.yourdomain.com,https://admin.yourdomain.com
  - NO localhost or development URLs"

check_step \
    "Set NODE_ENV=production" \
    "Ensure NODE_ENV is set to 'production'" \
    "[ \"\$NODE_ENV\" = \"production\" ]"

check_step \
    "Validate Environment Variables" \
    "Run validation script:
  ${BLUE}node scripts/validate-production-env.js${NC}"

echo -e "\n${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}SECTION 2: Database Setup${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"

check_step \
    "Run Database Migrations" \
    "Deploy database schema:
  ${BLUE}cd packages/backend && pnpm prisma migrate deploy${NC}"

check_step \
    "Set Up Database Backups" \
    "Configure automated backups:
  - Daily backups recommended
  - Retention policy: 30 days minimum
  - Point-in-time recovery enabled"

check_step \
    "Test Database Connection" \
    "Verify database connectivity:
  ${BLUE}psql \$DATABASE_URL -c 'SELECT version();'${NC}"

echo -e "\n${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}SECTION 3: Security Configuration${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"

check_step \
    "SSL/TLS Certificates" \
    "Set up SSL certificates:
  - Let's Encrypt (free)
  - AWS Certificate Manager
  - Cloudflare SSL"

check_step \
    "Configure Firewall Rules" \
    "Restrict access:
  - Database: Private network only
  - Redis: Private network only
  - API: Public HTTPS only (port 443)"

check_step \
    "Review Security Checklist" \
    "Verify all security measures:
  - JWT secrets are 32+ characters
  - Database uses SSL
  - Rate limiting enabled
  - Audit logging enabled
  - Input validation active"

check_step \
    "Run Security Audit" \
    "Check for vulnerabilities:
  ${BLUE}npm audit --production${NC}"

echo -e "\n${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}SECTION 4: Email Service Verification${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"

check_step \
    "Verify Sender Email/Domain" \
    "Verify sender in email provider:
  - SendGrid: Settings > Sender Authentication
  - AWS SES: Identity Management > Email Addresses
  - SMTP: Test with telnet/curl"

check_step \
    "Set Up SPF/DKIM/DMARC" \
    "Configure email authentication:
  - SPF record in DNS
  - DKIM signing enabled
  - DMARC policy set"

check_step \
    "Test Email Delivery" \
    "Send test email and verify delivery"

check_step \
    "Test Renewal Reminder Emails" \
    "Verify renewal reminder email templates work"

echo -e "\n${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}SECTION 5: Deployment${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"

check_step \
    "Build Application" \
    "Build for production:
  ${BLUE}pnpm build${NC} (in monorepo root)"

check_step \
    "Deploy Application" \
    "Deploy using chosen method:
  - Docker: docker-compose -f docker-compose.prod.yml up -d
  - Kubernetes: kubectl apply -f k8s/production/
  - PaaS: vercel --prod && railway up"

check_step \
    "Verify Health Endpoint" \
    "Check API health:
  ${BLUE}curl https://api.yourdomain.com/health${NC}
  Expected: {\"status\":\"ok\"}"

echo -e "\n${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}SECTION 6: Post-Deployment Verification${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"

check_step \
    "Test Authentication" \
    "Verify login/logout works:
  - Create test user
  - Log in via API
  - Verify JWT token returned"

check_step \
    "Test File Upload" \
    "Upload test file to verify storage:
  - Upload COI document
  - Verify file is stored
  - Verify file can be downloaded"

check_step \
    "Verify Cron Jobs" \
    "Check scheduled tasks:
  - Renewal reminders scheduled (daily 6 AM)
  - Token cleanup scheduled (daily 2 AM)
  - Check logs for execution"

check_step \
    "Test Email Notifications" \
    "Verify emails are sent:
  - Create contractor (welcome email)
  - Upload COI (notification email)
  - Trigger renewal reminder"

check_step \
    "Check Application Logs" \
    "Review logs for errors:
  ${BLUE}docker logs compliant-backend${NC} (Docker)
  ${BLUE}kubectl logs -f deployment/backend${NC} (Kubernetes)"

check_step \
    "Verify SSL Certificate" \
    "Check SSL is valid:
  ${BLUE}curl -I https://api.yourdomain.com${NC}
  ${BLUE}openssl s_client -connect api.yourdomain.com:443${NC}"

check_step \
    "Test CORS Configuration" \
    "Verify frontend can connect:
  - Load frontend application
  - Verify API calls work
  - Check browser console for CORS errors"

echo -e "\n${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}SECTION 7: Monitoring Setup${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"

check_step \
    "Set Up Application Monitoring" \
    "Configure monitoring service:
  - New Relic, DataDog, or similar
  - Monitor: Response time, error rate, throughput"

check_step \
    "Set Up Error Tracking" \
    "Configure error tracking:
  - Sentry or similar
  - Set SENTRY_DSN environment variable"

check_step \
    "Set Up Uptime Monitoring" \
    "Monitor availability:
  - UptimeRobot or similar
  - Monitor: /health endpoint
  - Alert on downtime"

check_step \
    "Configure Alerting" \
    "Set up alerts for:
  - API error rate >1%
  - Database connection failures
  - High CPU/memory usage
  - SSL certificate expiring"

echo -e "\n${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}SECTION 8: Final Checks${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"

check_step \
    "Run Complete Workflow Test" \
    "End-to-end test:
  1. Create project
  2. Add contractor
  3. Generate COI
  4. Upload documents
  5. Approve COI
  6. Verify hold harmless auto-generated
  7. Complete signature workflow"

check_step \
    "Review Documentation" \
    "Ensure team has access to:
  - API documentation (/api/docs)
  - Deployment guide
  - Troubleshooting guide"

check_step \
    "Create Rollback Plan" \
    "Document rollback procedure:
  - Database backup location
  - Previous version deployment steps
  - Rollback contacts"

# Summary
echo -e "\n${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}                           SUMMARY                                 ${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
echo ""

percentage=$((completed * 100 / total))

echo -e "Progress: ${GREEN}${completed}${NC}/${total} steps completed (${percentage}%)"

if [ $warnings -gt 0 ]; then
    echo -e "${YELLOW}Warnings: ${warnings} steps incomplete${NC}"
fi

echo ""

if [ $completed -eq $total ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✓ All steps completed - READY FOR PRODUCTION DEPLOYMENT!    ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    exit 0
elif [ $percentage -ge 80 ]; then
    echo -e "${YELLOW}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║  ⚠ Almost ready - Complete remaining steps before deploying  ║${NC}"
    echo -e "${YELLOW}╚═══════════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ✗ NOT READY - Complete more steps before deploying          ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
