# Quick Start: Production Deployment

This guide gets you from code to production in 30 minutes.

## Prerequisites

- Access to production infrastructure (database, Redis, email service)
- Domain name configured with DNS
- SSL certificate (Let's Encrypt, AWS ACM, or Cloudflare)

## Step 1: Generate Secrets (5 minutes)

```bash
# Copy this output to your .env.production file
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32)"
echo "ENCRYPTION_KEY=$(openssl rand -base64 32)"
echo "ENCRYPTION_SALT=$(openssl rand -hex 16)"
```

## Step 2: Set Up Infrastructure (10 minutes)

### Database (PostgreSQL)

**Option A: Managed Service (Recommended)**
- AWS RDS, DigitalOcean, Azure Database, etc.
- Enable SSL/TLS
- Create dedicated user with strong password
- Note connection string

**Option B: Self-Hosted**
```bash
# Install PostgreSQL 15
sudo apt-get install postgresql-15

# Create database and user
sudo -u postgres psql
CREATE DATABASE compliant_prod;
CREATE USER prod_user WITH PASSWORD 'StrongPassword123!';
GRANT ALL PRIVILEGES ON DATABASE compliant_prod TO prod_user;
```

### Redis

**Option A: Managed Service (Recommended)**
- AWS ElastiCache, Redis Cloud, etc.
- Enable authentication
- Note connection string

**Option B: Self-Hosted**
```bash
# Install Redis
sudo apt-get install redis-server

# Configure password
sudo nano /etc/redis/redis.conf
# Add: requirepass YourStrongPassword

# Restart
sudo systemctl restart redis
```

### Email Service

**Option A: SendGrid (Easiest)**
1. Sign up at https://sendgrid.com
2. Verify sender email/domain
3. Create API key (Settings > API Keys)

**Option B: AWS SES**
1. Sign up for AWS SES
2. Verify domain
3. Request production access (move out of sandbox)
4. Create IAM user with SES permissions

**Option C: SMTP (Microsoft 365, Gmail)**
1. Use existing email service
2. Get SMTP credentials
3. Enable "app passwords" if MFA is enabled

## Step 3: Configure Environment (5 minutes)

```bash
# Copy template
cd packages/backend
cp .env.production.template .env.production

# Edit with your values
nano .env.production
```

**Minimum required values:**
```bash
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
JWT_SECRET="[generated in step 1]"
JWT_REFRESH_SECRET="[generated in step 1]"
ENCRYPTION_KEY="[generated in step 1]"
ENCRYPTION_SALT="[generated in step 1]"
REDIS_URL="redis://:password@host:6379/0"
EMAIL_PROVIDER="sendgrid"
SENDGRID_API_KEY="SG.xxxx"
EMAIL_FROM="noreply@yourdomain.com"
NODE_ENV="production"
CORS_ORIGIN="https://app.yourdomain.com"
```

## Step 4: Validate Configuration (2 minutes)

```bash
# Run validation script
node scripts/validate-production-env.js --env-file=packages/backend/.env.production

# Should output: "✅ Validation PASSED"
```

## Step 5: Deploy (5 minutes)

### Option A: Docker (Recommended)

```bash
# Build and run
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend pnpm prisma migrate deploy

# Check health
curl https://api.yourdomain.com/health
```

### Option B: Kubernetes

```bash
# Create namespace
kubectl create namespace compliant-prod

# Create secrets from .env.production
kubectl create secret generic app-secrets \
  --from-env-file=packages/backend/.env.production \
  -n compliant-prod

# Apply configs
kubectl apply -f k8s/production/ -n compliant-prod

# Run migrations
kubectl apply -f k8s/migrations-job.yaml -n compliant-prod

# Check status
kubectl get pods -n compliant-prod
```

### Option C: Platform-as-a-Service (Vercel + Railway)

**Backend (Railway):**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway up

# Add environment variables in Railway dashboard
# https://railway.app/dashboard
```

**Frontend (Vercel):**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd packages/frontend
vercel --prod

# Add environment variables in Vercel dashboard
# https://vercel.com/dashboard
```

## Step 6: Verify Deployment (3 minutes)

```bash
# 1. Check API health
curl https://api.yourdomain.com/health
# Expected: {"status":"ok"}

# 2. Check API docs
open https://api.yourdomain.com/api/docs

# 3. Test authentication
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourdomain.com","password":"password"}'
# Should return JWT token

# 4. Check logs
docker logs compliant-backend --tail 50
# Or: kubectl logs -f deployment/backend -n compliant-prod
```

## Step 7: Set Up Monitoring (Optional but Recommended)

### Uptime Monitoring (UptimeRobot - Free)
1. Sign up at https://uptimerobot.com
2. Add monitor for `https://api.yourdomain.com/health`
3. Set up email/SMS alerts

### Error Tracking (Sentry - Free tier)
1. Sign up at https://sentry.io
2. Create new project
3. Add `SENTRY_DSN` to environment variables
4. Redeploy

### Application Monitoring (New Relic - Free tier)
1. Sign up at https://newrelic.com
2. Get license key
3. Add `NEW_RELIC_LICENSE_KEY` to environment variables
4. Redeploy

## Troubleshooting

### Issue: Database connection fails
```bash
# Test connection
psql $DATABASE_URL -c 'SELECT version();'

# Check SSL mode
echo $DATABASE_URL | grep sslmode=require

# Verify firewall rules allow connection
```

### Issue: Email not sending
```bash
# Check email provider config
echo $EMAIL_PROVIDER
echo $SENDGRID_API_KEY  # Should start with SG.

# Check sender verification
# SendGrid: https://app.sendgrid.com/settings/sender_auth
# AWS SES: Check verified identities

# Test SMTP connection
telnet smtp.office365.com 587
```

### Issue: CORS errors in browser
```bash
# Check CORS origin
echo $CORS_ORIGIN  # Should match frontend URL

# Check frontend environment
echo $NEXT_PUBLIC_API_URL  # Should match backend URL

# Test from browser console
fetch('https://api.yourdomain.com/health', {credentials: 'include'})
```

### Issue: Cron jobs not running
```bash
# Check logs for cron execution
docker logs compliant-backend | grep "RemindersService"

# Manually trigger
curl -X POST https://api.yourdomain.com/api/reminders/check-expiring-policies \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Verify scheduler is enabled in code
grep "@nestjs/schedule" packages/backend/package.json
```

## Post-Deployment Checklist

- [ ] API health endpoint returns 200
- [ ] Authentication works (login/logout)
- [ ] Create test contractor → receive welcome email
- [ ] Upload test COI document
- [ ] Verify renewal reminder cron is scheduled
- [ ] Test hold harmless auto-generation
- [ ] SSL certificate is valid (check with browser)
- [ ] CORS works with frontend
- [ ] Logs show no errors
- [ ] Monitoring alerts are configured

## What's Next?

1. **Create first admin user**
   ```bash
   # Connect to database
   psql $DATABASE_URL
   
   # Create admin (password: use bcrypt hash)
   INSERT INTO users (id, email, password, "firstName", "lastName", role, "isActive")
   VALUES (gen_random_uuid(), 'admin@yourdomain.com', '$2b$10$...', 'Admin', 'User', 'SUPER_ADMIN', true);
   ```

2. **Set up backups**
   - Database: Daily automated backups
   - Retention: 30 days minimum
   - Test restore procedure

3. **Review security**
   ```bash
   # Run security audit
   npm audit --production
   
   # Check SSL configuration
   openssl s_client -connect api.yourdomain.com:443
   ```

4. **Train team**
   - Share API documentation
   - Review user roles and permissions
   - Document common workflows

## Need Help?

- **Documentation:** See `PRODUCTION_READINESS_GUIDE.md` for detailed guide
- **Validation:** Run `node scripts/validate-production-env.js`
- **Checklist:** Run `./scripts/production-deployment-checklist.sh`
- **API Docs:** Visit `/api/docs` on your deployment

## Summary

You now have:
- ✅ Production infrastructure configured
- ✅ Secure secrets generated
- ✅ Application deployed
- ✅ Health checks passing
- ✅ Monitoring set up

**Your platform is live! 🎉**

Time to production: **~30 minutes**

---

**Estimated Costs:**
- Database (PostgreSQL): $15-50/month
- Redis: $10-30/month
- Email (SendGrid): $0-20/month (free tier available)
- Storage (S3): $5-20/month
- Hosting: $10-50/month (Docker) or $0-20/month (PaaS free tiers)

**Total:** ~$40-170/month depending on scale and providers
