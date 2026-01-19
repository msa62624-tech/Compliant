# Deployment Guide

This guide provides comprehensive instructions for deploying the Compliant.team insurance tracking platform to production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Shared Package Deployment](#shared-package-deployment)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Database Setup](#database-setup)
6. [Environment Variables](#environment-variables)
7. [CI/CD Workflow](#cicd-workflow)
8. [Platform-Specific Guides](#platform-specific-guides)
9. [Post-Deployment Verification](#post-deployment-verification)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- **Node.js**: >= 20.0.0
- **pnpm**: >= 8.0.0 (Install: `npm install -g pnpm`)
- **PostgreSQL**: >= 15.0 (Managed database recommended)
- **Git**: For version control and deployment
- Access to your deployment platform (AWS, Vercel, Heroku, etc.)
- Domain name configured (optional but recommended)

---

## Shared Package Deployment

The `@compliant/shared` package contains shared TypeScript types, Zod validators, and constants used by both backend and frontend. **It must be built before deploying other packages.**

### Why the Shared Package Matters

The shared package provides:
- Type safety across the monorepo
- Consistent validation schemas
- Shared business logic and constants

### Building the Shared Package

```bash
# From the root directory
cd packages/shared
pnpm build
```

This generates the `dist/` folder with:
- Compiled JavaScript files (`.js`)
- TypeScript declaration files (`.d.ts`)
- Source maps (`.js.map`, `.d.ts.map`)

### In CI/CD

The shared package is automatically built in the deployment workflow:

```yaml
# .github/workflows/deploy.yml (lines 57-58, 103-104)
- name: Build shared package
  run: cd packages/shared && pnpm build
```

**Important**: Always build the shared package first, before building backend or frontend packages.

### Verification

```bash
# Check that dist folder exists and contains files
ls -la packages/shared/dist/

# Verify package exports
node -e "console.log(require('./packages/shared/dist/index.js'))"
```

---

## Backend Deployment

The NestJS backend can be deployed to various platforms. Here are detailed instructions for each.

### General Steps

1. **Build the shared package** (see above)
2. **Generate Prisma Client**
3. **Build the backend**
4. **Run database migrations**
5. **Start the server**

### Build Commands

```bash
# From repository root
cd packages/backend

# Generate Prisma Client
pnpm db:generate

# Build the backend
pnpm build

# The built files will be in packages/backend/dist/
```

### Platform-Specific Deployment

#### AWS ECS (Recommended for Enterprise)

**Prerequisites:**
- AWS CLI configured
- Docker installed
- ECR repository created

**Steps:**

1. **Build Docker Image**
   ```bash
   # From repository root
   docker build -f Dockerfile -t compliant-backend:latest .
   ```

2. **Tag and Push to ECR**
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
   
   docker tag compliant-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/compliant-backend:latest
   
   docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/compliant-backend:latest
   ```

3. **Update ECS Task Definition**
   ```bash
   aws ecs update-service --cluster compliant-cluster --service compliant-backend --force-new-deployment
   ```

4. **Configure Environment Variables**
   - Set in ECS Task Definition or use AWS Systems Manager Parameter Store
   - See [Environment Variables](#environment-variables) section

#### Heroku

**Prerequisites:**
- Heroku CLI installed
- Heroku app created

**Steps:**

1. **Install Heroku Buildpack**
   ```bash
   heroku buildpacks:set heroku/nodejs --app your-app-name
   ```

2. **Add PostgreSQL Add-on**
   ```bash
   heroku addons:create heroku-postgresql:standard-0 --app your-app-name
   ```

3. **Configure Build Settings**
   
   Create `Procfile` in repository root:
   ```
   web: cd packages/backend && pnpm db:migrate:deploy && pnpm start:prod
   release: cd packages/shared && pnpm build && cd ../backend && pnpm db:generate
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production --app your-app-name
   heroku config:set JWT_SECRET=your-secret-key --app your-app-name
   # ... other environment variables
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

#### Railway

**Prerequisites:**
- Railway account
- Railway CLI installed (optional)

**Steps:**

1. **Connect Repository**
   - Link your GitHub repository in Railway dashboard
   - Railway auto-detects the monorepo structure

2. **Configure Build Settings**
   - Root Directory: `packages/backend`
   - Build Command: 
     ```bash
     cd ../../packages/shared && pnpm build && cd ../backend && pnpm install && pnpm db:generate && pnpm build
     ```
   - Start Command: `pnpm start:prod`

3. **Add PostgreSQL**
   - Add PostgreSQL plugin from Railway dashboard
   - Railway automatically sets `DATABASE_URL`

4. **Set Environment Variables**
   - Configure in Railway dashboard (Variables section)
   - See [Environment Variables](#environment-variables)

5. **Deploy**
   - Push to main branch (auto-deploys)
   - Or trigger manual deploy from dashboard

#### Render

**Prerequisites:**
- Render account

**Steps:**

1. **Create Web Service**
   - Connect GitHub repository
   - Select "Web Service"

2. **Configure Service**
   - Name: `compliant-backend`
   - Root Directory: `packages/backend`
   - Build Command:
     ```bash
     cd ../../packages/shared && pnpm build && cd ../backend && pnpm install && pnpm db:generate && pnpm build
     ```
   - Start Command: `pnpm start:prod`
   - Plan: At least "Starter" for production

3. **Add PostgreSQL Database**
   - Create PostgreSQL database in Render
   - Link to web service
   - Copy connection string to `DATABASE_URL`

4. **Configure Environment Variables**
   - Set in Render dashboard under "Environment"
   - See [Environment Variables](#environment-variables)

5. **Deploy**
   - Render auto-deploys on push to main

#### DigitalOcean App Platform

**Prerequisites:**
- DigitalOcean account

**Steps:**

1. **Create App**
   - Connect GitHub repository
   - Select repository and branch

2. **Configure Component**
   - Type: Web Service
   - Source Directory: `packages/backend`
   - Build Command:
     ```bash
     cd ../../packages/shared && pnpm build && cd ../backend && pnpm install && pnpm db:generate && pnpm build
     ```
   - Run Command: `pnpm start:prod`

3. **Add Database**
   - Add managed PostgreSQL database
   - Bind to app (auto-sets `DATABASE_URL`)

4. **Set Environment Variables**
   - Configure in App Settings → Environment Variables
   - See [Environment Variables](#environment-variables)

5. **Deploy**
   - Save and deploy

---

## Frontend Deployment

The Next.js 14 frontend can be deployed to various platforms. Vercel is recommended for optimal Next.js performance.

### General Steps

1. **Build the shared package** (see above)
2. **Build the frontend**
3. **Deploy static files**

### Build Commands

```bash
# From repository root
cd packages/frontend

# Build for production
pnpm build

# The built files will be in packages/frontend/.next/
```

### Platform-Specific Deployment

#### Vercel (Recommended)

**Prerequisites:**
- Vercel account
- Vercel CLI installed (optional)

**Steps:**

1. **Connect Repository**
   - Import project in Vercel dashboard
   - Select your GitHub repository

2. **Configure Project**
   - Framework Preset: Next.js
   - Root Directory: `packages/frontend`
   - Build Command:
     ```bash
     cd ../../packages/shared && pnpm build && cd ../frontend && pnpm install && pnpm build
     ```
   - Output Directory: `.next`
   - Install Command: `pnpm install`

3. **Set Environment Variables**
   - `NEXT_PUBLIC_API_URL`: Your backend API URL (e.g., `https://api.compliant.team`)
   
   In Vercel dashboard:
   - Settings → Environment Variables
   - Add `NEXT_PUBLIC_API_URL` for Production, Preview, and Development

4. **Deploy**
   - Click "Deploy"
   - Or push to main branch (auto-deploys)

5. **Configure Domain** (Optional)
   - Settings → Domains
   - Add custom domain
   - Configure DNS records as instructed

#### AWS Amplify

**Prerequisites:**
- AWS account
- AWS CLI configured

**Steps:**

1. **Create Amplify App**
   ```bash
   aws amplify create-app --name compliant-frontend --repository https://github.com/your-org/compliant
   ```

2. **Configure Build Settings**
   
   Create `amplify.yml` in repository root:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm install -g pnpm@8.15.0
           - pnpm install --frozen-lockfile
           - cd packages/shared && pnpm build
       build:
         commands:
           - cd packages/frontend
           - pnpm build
     artifacts:
       baseDirectory: packages/frontend/.next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
         - packages/frontend/.next/cache/**/*
   ```

3. **Set Environment Variables**
   - AWS Amplify Console → App settings → Environment variables
   - Add `NEXT_PUBLIC_API_URL`

4. **Deploy**
   - Connect branch and deploy
   - Or use AWS CLI: `aws amplify start-deployment`

#### Netlify

**Prerequisites:**
- Netlify account

**Steps:**

1. **Create Site**
   - Import from Git
   - Select repository

2. **Configure Build**
   - Base directory: (leave empty)
   - Build command:
     ```bash
     cd packages/shared && pnpm build && cd ../frontend && pnpm install && pnpm build
     ```
   - Publish directory: `packages/frontend/.next`
   - Use Next.js runtime

3. **Install Next.js Plugin**
   - Netlify automatically detects Next.js
   - Or manually add: `@netlify/plugin-nextjs`

4. **Set Environment Variables**
   - Site settings → Environment variables
   - Add `NEXT_PUBLIC_API_URL`

5. **Deploy**
   - Deploy site
   - Netlify auto-deploys on git push

#### Self-Hosted (VPS/Dedicated Server)

**Prerequisites:**
- Linux server with Node.js and pnpm installed
- Nginx or Apache for reverse proxy
- PM2 for process management

**Steps:**

1. **Install PM2**
   ```bash
   npm install -g pm2
   ```

2. **Clone Repository**
   ```bash
   git clone https://github.com/your-org/compliant.git
   cd compliant
   pnpm install --frozen-lockfile
   ```

3. **Build Application**
   ```bash
   cd packages/shared && pnpm build
   cd ../frontend && pnpm build
   ```

4. **Create PM2 Ecosystem File**
   
   Create `ecosystem.config.js` in `packages/frontend/`:
   ```javascript
   module.exports = {
     apps: [{
       name: 'compliant-frontend',
       script: 'node_modules/next/dist/bin/next',
       args: 'start',
       cwd: '/path/to/compliant/packages/frontend',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         PORT: 3000,
         NEXT_PUBLIC_API_URL: 'https://api.compliant.team'
       }
     }]
   };
   ```

5. **Start with PM2**
   ```bash
   cd packages/frontend
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

6. **Configure Nginx**
   
   Create `/etc/nginx/sites-available/compliant-frontend`:
   ```nginx
   server {
       listen 80;
       server_name compliant.team www.compliant.team;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

7. **Enable Site**
   ```bash
   sudo ln -s /etc/nginx/sites-available/compliant-frontend /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

8. **Setup SSL with Let's Encrypt**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d compliant.team -d www.compliant.team
   ```

---

## Database Setup

### Managed Database Services (Recommended)

For production, use managed PostgreSQL services:

- **AWS RDS**: Reliable, scalable, automated backups
- **Supabase**: PostgreSQL + additional features
- **DigitalOcean Managed Databases**: Simple, affordable
- **Heroku Postgres**: Integrated with Heroku deployments
- **Render PostgreSQL**: Easy integration with Render services
- **Railway PostgreSQL**: Auto-configured with Railway apps

### Configuration

1. **Create Database Instance**
   - PostgreSQL version >= 15.0
   - At least 2GB RAM for production
   - Enable automated backups

2. **Get Connection String**
   ```
   postgresql://username:password@host:5432/database_name
   ```

3. **Set Environment Variable**
   ```bash
   DATABASE_URL="postgresql://username:password@host:5432/database_name"
   ```

4. **Run Migrations**
   ```bash
   cd packages/backend
   pnpm db:migrate:deploy
   ```

   This runs all pending migrations in production mode (cannot be rolled back).

5. **Verify Connection**
   ```bash
   cd packages/backend
   pnpm db:studio
   ```

### Migration Commands

```bash
# Deploy migrations (production)
pnpm db:migrate:deploy

# Create a new migration (development)
pnpm db:migrate:dev

# Reset database (development only - WARNING: deletes all data)
pnpm db:migrate:reset

# Generate Prisma Client
pnpm db:generate

# Push schema changes (development)
pnpm db:push

# Open Prisma Studio
pnpm db:studio
```

### Database Backup

**For AWS RDS:**
```bash
# Automated backups are enabled by default
# Manual snapshot:
aws rds create-db-snapshot --db-instance-identifier compliant-db --db-snapshot-identifier compliant-snapshot-$(date +%Y%m%d)
```

**For self-hosted PostgreSQL:**
```bash
# Backup
pg_dump -U username -d database_name > backup_$(date +%Y%m%d).sql

# Restore
psql -U username -d database_name < backup_20240119.sql
```

---

## Environment Variables

### Backend Environment Variables

**Required:**

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database_name"

# JWT Authentication
JWT_SECRET="your-very-long-secret-key-minimum-32-characters"
JWT_REFRESH_SECRET="your-very-long-refresh-secret-minimum-32-characters"
JWT_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# Server
NODE_ENV="production"
PORT=3001
```

**Optional but Recommended:**

```env
# CORS (if frontend is on different domain)
CORS_ORIGIN="https://compliant.team,https://www.compliant.team"

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Email (for renewal reminders)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@compliant.team"

# File Upload (if using S3)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="compliant-documents"

# Encryption (for sensitive data)
ENCRYPTION_KEY="your-32-character-encryption-key"

# Logging
LOG_LEVEL="info"

# Monitoring (optional)
SENTRY_DSN="https://your-sentry-dsn"
```

### Frontend Environment Variables

**Required:**

```env
NEXT_PUBLIC_API_URL="https://api.compliant.team"
```

**Optional:**

```env
# Analytics (optional)
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
```

### Security Best Practices

1. **Never commit secrets to git**
   - Use `.env` files (excluded in `.gitignore`)
   - Use platform secret management (AWS Secrets Manager, etc.)

2. **Generate strong secrets**
   ```bash
   # Generate JWT secrets
   openssl rand -base64 32
   
   # Generate encryption key
   openssl rand -hex 32
   ```

3. **Rotate secrets regularly**
   - JWT secrets: every 90 days
   - API keys: as needed
   - Database passwords: annually

4. **Use different secrets per environment**
   - Development
   - Staging
   - Production

---

## CI/CD Workflow

The project includes automated deployment via GitHub Actions (`.github/workflows/deploy.yml`).

### Workflow Overview

The deployment workflow consists of three jobs:

1. **Test Job**: Runs linting, builds, and tests
2. **Build Job**: Creates production bundles
3. **Deploy Job**: Deploys to production/staging

### Triggering Deployment

**Automatic (Push to Main):**
```bash
git push origin main
```

**Manual (via GitHub UI):**
1. Go to Actions tab
2. Select "Production Deployment" workflow
3. Click "Run workflow"
4. Choose environment (production/staging)

**Manual (via GitHub CLI):**
```bash
gh workflow run deploy.yml -f environment=production
```

### Workflow Steps

The workflow performs the following:

```yaml
# 1. Install dependencies
pnpm install --frozen-lockfile

# 2. Build shared package (CRITICAL)
cd packages/shared && pnpm build

# 3. Generate Prisma Client
cd packages/backend && pnpm db:generate

# 4. Run linting
pnpm lint

# 5. Build all packages
pnpm build

# 6. Run tests
pnpm test

# 7. Upload build artifacts
# Includes: packages/*/dist, packages/*/build, packages/*/.next

# 8. Download artifacts and deploy
# (Configure based on your platform)
```

### Configuring Deployment

Edit `.github/workflows/deploy.yml` to add your deployment commands:

**For AWS:**
```yaml
- name: Deploy to environment
  run: |
    aws ecs update-service --cluster compliant-cluster --service compliant-backend --force-new-deployment
```

**For Heroku:**
```yaml
- name: Deploy to Heroku
  run: |
    git push https://heroku:${{ secrets.HEROKU_API_KEY }}@git.heroku.com/your-app-name.git main
```

**For Vercel:**
```yaml
- name: Deploy to Vercel
  run: |
    npm install -g vercel
    vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### Required GitHub Secrets

Add these in repository Settings → Secrets and variables → Actions:

- `HEROKU_API_KEY` (if using Heroku)
- `VERCEL_TOKEN` (if using Vercel)
- `AWS_ACCESS_KEY_ID` (if using AWS)
- `AWS_SECRET_ACCESS_KEY` (if using AWS)
- Other platform-specific secrets

---

## Platform-Specific Guides

### Deploying Full Stack to Single Platform

#### Railway (Full Stack)

1. **Create Project**
2. **Add PostgreSQL Service**
3. **Add Backend Service**
   - Root Directory: `packages/backend`
   - Build Command: `cd ../../packages/shared && pnpm build && cd ../backend && pnpm install && pnpm db:generate && pnpm build`
   - Start Command: `pnpm start:prod`
4. **Add Frontend Service**
   - Root Directory: `packages/frontend`
   - Build Command: `cd ../../packages/shared && pnpm build && cd ../frontend && pnpm install && pnpm build`
   - Start Command: `pnpm start`
5. **Link Services**
   - Backend → PostgreSQL (auto-linked)
   - Frontend → Backend (set `NEXT_PUBLIC_API_URL` to backend URL)

#### Render (Full Stack)

1. **Create PostgreSQL Database**
2. **Create Backend Web Service**
   - Link to database
   - Configure build/start commands
3. **Create Frontend Static Site**
   - Set `NEXT_PUBLIC_API_URL` to backend URL
   - Configure build command

### Deploying to Kubernetes

For advanced deployments, use Kubernetes:

1. **Create Docker Images**
   - Backend: Uses `Dockerfile` in repository root
   - Frontend: Create similar Dockerfile for frontend

2. **Push to Container Registry**
   - Docker Hub
   - AWS ECR
   - Google Container Registry

3. **Create Kubernetes Manifests**
   - Deployments
   - Services
   - Ingress
   - ConfigMaps/Secrets

4. **Deploy**
   ```bash
   kubectl apply -f k8s/
   ```

Example Kubernetes manifests can be created upon request.

---

## Post-Deployment Verification

### Health Checks

**Backend:**
```bash
curl https://api.compliant.team/api/health

# Expected response:
# {"status":"ok","timestamp":"2024-01-19T..."}
```

**Frontend:**
```bash
curl -I https://compliant.team

# Expected: HTTP 200 OK
```

### API Documentation

Visit your backend's Swagger UI:
```
https://api.compliant.team/api/docs
```

### Database Connectivity

```bash
cd packages/backend
pnpm db:studio

# Should connect successfully and show tables
```

### Smoke Tests

Run basic functionality tests:

1. **Authentication**
   - Register new user
   - Login
   - Token refresh

2. **CRUD Operations**
   - Create contractor
   - List contractors
   - Update contractor
   - Delete contractor

3. **File Upload** (if applicable)
   - Upload document
   - Retrieve document

### Monitoring

Set up monitoring for:

- **Application Performance**
  - Response times
  - Error rates
  - CPU/Memory usage

- **Database Performance**
  - Query performance
  - Connection pool status
  - Storage usage

- **Infrastructure**
  - Server uptime
  - Network latency
  - SSL certificate expiration

**Recommended Tools:**
- Application: New Relic, DataDog, Sentry
- Infrastructure: CloudWatch (AWS), Render Metrics
- Logs: Logtail, Papertrail, CloudWatch Logs

---

## Troubleshooting

### Common Issues

#### 1. "Cannot find module '@compliant/shared'"

**Cause**: Shared package not built before building other packages.

**Solution**:
```bash
cd packages/shared
pnpm build
```

Then rebuild backend/frontend.

#### 2. "Prisma Client is not generated"

**Cause**: Prisma Client needs to be generated after schema changes.

**Solution**:
```bash
cd packages/backend
pnpm db:generate
```

#### 3. "Database connection failed"

**Causes**:
- Incorrect `DATABASE_URL`
- Database not accessible from deployment environment
- SSL required but not configured

**Solution**:
```bash
# Verify connection string format
echo $DATABASE_URL

# Test connection
cd packages/backend
pnpm db:studio

# For SSL issues, add to DATABASE_URL:
# postgresql://user:pass@host:5432/db?sslmode=require
```

#### 4. "CORS errors in browser"

**Cause**: Frontend domain not allowed in backend CORS configuration.

**Solution**:

In `packages/backend/src/main.ts`:
```typescript
app.enableCors({
  origin: ['https://compliant.team', 'https://www.compliant.team'],
  credentials: true,
});
```

Or set `CORS_ORIGIN` environment variable.

#### 5. "Build fails on platform"

**Cause**: Incorrect build command or missing dependencies.

**Solution**:
```bash
# Ensure build command includes shared package:
cd ../../packages/shared && pnpm build && cd ../[backend|frontend] && pnpm install && pnpm build

# Check build logs for specific errors
# Verify Node version (should be 20+)
```

#### 6. "JWT token errors"

**Cause**: 
- JWT secrets not set
- Secrets too short
- Clock skew between servers

**Solution**:
```bash
# Generate proper secrets (32+ characters)
openssl rand -base64 32

# Set in environment variables
JWT_SECRET="generated-secret"
JWT_REFRESH_SECRET="another-generated-secret"

# Verify secrets are loaded
# (Check application logs)
```

#### 7. "Port already in use"

**Cause**: Another process using the port.

**Solution**:
```bash
# Find process using port
lsof -ti:3001

# Kill process
kill -9 <PID>

# Or change port
PORT=3002 pnpm start:prod
```

#### 8. "Memory issues in production"

**Cause**: Insufficient memory allocation.

**Solution**:
```bash
# Increase Node memory limit
NODE_OPTIONS="--max-old-space-size=4096" pnpm start:prod

# Or configure in platform settings
# (e.g., Railway: 2GB+ recommended)
```

### Getting Help

- **Documentation**: Check other docs in `/docs` folder
- **Issues**: Create GitHub issue with deployment logs
- **Logs**: Include relevant error messages
- **Environment**: Specify platform and Node version

### Rollback Procedure

If deployment fails:

1. **Via Git**:
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Via Platform**:
   - Vercel: Rollback to previous deployment in dashboard
   - Heroku: `heroku rollback`
   - AWS: Update ECS service to previous task definition
   - Railway: Redeploy previous version from dashboard

3. **Database Migrations**:
   - Migrations cannot be rolled back automatically
   - May need to write down migration manually
   - Keep database backups before major deployments

---

## Summary

This deployment guide covers:

✅ Shared package build requirements  
✅ Backend deployment to multiple platforms  
✅ Frontend deployment options  
✅ Database setup and migrations  
✅ Environment variable configuration  
✅ CI/CD workflow usage  
✅ Post-deployment verification  
✅ Troubleshooting common issues  

For additional help, refer to:
- [Implementation Guidelines](IMPLEMENTATION_GUIDELINES.md)
- [Testing Guide](TESTING_GUIDE.md)
- [Workflow Implementation](WORKFLOW_IMPLEMENTATION.md)

---

**Built with ❤️ for reliable production deployments**
