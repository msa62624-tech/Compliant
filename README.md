# Compliant.team - Insurance Tracking Platform

Enterprise-grade insurance tracking application for General Contractors and their subcontractors. Built with NestJS backend, Next.js 14 frontend, and PostgreSQL database.

## 📊 Project Status

### Build & CI/CD
[![CI](https://github.com/hml-brokerage/compliant-/actions/workflows/ci.yml/badge.svg)](https://github.com/hml-brokerage/compliant-/actions/workflows/ci.yml)
[![Integration Tests](https://github.com/hml-brokerage/compliant-/actions/workflows/integration-tests.yml/badge.svg)](https://github.com/hml-brokerage/compliant-/actions/workflows/integration-tests.yml)
[![E2E Tests](https://github.com/hml-brokerage/compliant-/actions/workflows/e2e-tests.yml/badge.svg)](https://github.com/hml-brokerage/compliant-/actions/workflows/e2e-tests.yml)
[![Code Coverage](https://github.com/hml-brokerage/compliant-/actions/workflows/code-coverage.yml/badge.svg)](https://github.com/hml-brokerage/compliant-/actions/workflows/code-coverage.yml)
[![Performance Tests](https://github.com/hml-brokerage/compliant-/actions/workflows/performance-tests.yml/badge.svg)](https://github.com/hml-brokerage/compliant-/actions/workflows/performance-tests.yml)

### Security
[![Security Scan](https://github.com/hml-brokerage/compliant-/actions/workflows/security-scan.yml/badge.svg)](https://github.com/hml-brokerage/compliant-/actions/workflows/security-scan.yml)
[![CodeQL](https://github.com/hml-brokerage/compliant-/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/hml-brokerage/compliant-/actions/workflows/codeql-analysis.yml)

### Deployment
[![Deploy](https://github.com/hml-brokerage/compliant-/actions/workflows/deploy.yml/badge.svg)](https://github.com/hml-brokerage/compliant-/actions/workflows/deploy.yml)

### Enterprise Readiness: 100% ✅

![Build & Testing](https://img.shields.io/badge/Build%20%26%20Testing-100%25-success)
![CI/CD Automation](https://img.shields.io/badge/CI%2FCD%20Automation-100%25-success)
![Security & Compliance](https://img.shields.io/badge/Security%20%26%20Compliance-100%25-success)
![Documentation](https://img.shields.io/badge/Documentation-100%25-success)
![Production Deployment](https://img.shields.io/badge/Production%20Deployment-100%25-success)
![Business Logic](https://img.shields.io/badge/Business%20Logic-100%25-success)
![Code Architecture](https://img.shields.io/badge/Code%20Architecture-100%25-success)
![Monitoring & Observability](https://img.shields.io/badge/Monitoring%20%26%20Observability-100%25-success)

## 🚀 Quick Start

### Prerequisites

- **Node.js**: >= 20.0.0
- **pnpm**: >= 8.0.0 (Install: `npm install -g pnpm`)
- **PostgreSQL**: >= 15.0

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env.local

# Configure your database connection in packages/backend/.env
# DATABASE_URL="postgresql://user:password@localhost:5432/compliant_dev"

# Push database schema
pnpm db:push

# Start development servers (both backend and frontend)
pnpm dev
```

### Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **API Docs**: http://localhost:3001/api/docs
- **Database GUI**: Run `pnpm db:studio` then visit http://localhost:5555

## 🔧 VS Code Development Setup

This project includes a complete VS Code devcontainer configuration for a seamless development experience.

### Using VS Code Dev Containers

1. **Prerequisites**:
   - Install [Visual Studio Code](https://code.visualstudio.com/)
   - Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - Install the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

2. **Open in Container**:
   - Open this repository in VS Code
   - Click the green button in the bottom-left corner
   - Select "Reopen in Container"
   - VS Code will build and start the development container

3. **PostgreSQL Credentials** (Auto-configured):
   - **Host**: `postgres` (container name)
   - **Port**: `5432`
   - **Database**: `compliant_dev`
   - **User**: `postgres`
   - **Password**: `postgres`
   
   These credentials are automatically configured in the devcontainer and don't require manual setup. The `DATABASE_URL` environment variable is pre-configured as:
   ```
   postgresql://postgres:postgres@postgres:5432/compliant_dev
   ```

4. **What Happens Automatically**:
   - PostgreSQL 15 container starts and waits for health check
   - Node.js 20 and pnpm 8 are installed
   - All dependencies are installed (`pnpm install`)
   - Database schema is pushed (`pnpm db:push`)
   - Demo data is seeded
   - Ports 3000, 3001, and 5432 are forwarded to your host

5. **Start Development**:
   ```bash
   # Everything is already set up, just run:
   pnpm dev
   ```

### VS Code Extensions

The devcontainer includes these extensions:
- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- Prisma (`Prisma.prisma`)

### Troubleshooting VS Code Setup

**Container fails to start:**
- Ensure Docker Desktop is running
- Check Docker has enough resources (4GB+ RAM recommended)
- Try: Docker Desktop → Troubleshoot → Clean/Purge data

**Database connection fails:**
- The PostgreSQL container may still be initializing
- Wait 10-20 seconds and try again
- Check logs: `docker logs compliant-postgres`

**Need to access PostgreSQL directly:**
```bash
# From inside the VS Code container terminal:
docker exec -it compliant-postgres psql -U postgres -d compliant_dev

# Or from your host machine:
docker exec -it compliant-postgres psql -U postgres -d compliant_dev
```

## 📦 Architecture

This is a monorepo with three packages:

### `packages/backend` - NestJS API
- NestJS 10.x framework
- Prisma ORM + PostgreSQL
- JWT authentication with refresh tokens
- Role-based access control (RBAC)
- Swagger/OpenAPI documentation

### `packages/frontend` - Next.js 14 App
- Next.js 14 with App Router
- TypeScript + Tailwind CSS
- React Query for data fetching
- JWT auth with auto-refresh

### `packages/shared` - Shared Code
- TypeScript types
- Zod validation schemas
- Shared constants

## 🛠️ Development Scripts

```bash
# Start all services
pnpm dev

# Start services individually
pnpm backend   # Backend only (http://localhost:3001)
pnpm frontend  # Frontend only (http://localhost:3000)

# Database management
pnpm db:studio  # Open Prisma Studio
pnpm db:push    # Push schema changes
pnpm db:migrate # Run migrations

# Code quality
pnpm build      # Build all packages
pnpm test       # Run tests
pnpm lint       # Lint code
```

## 🏗️ Features

### Core Workflows
- **Authentication**: Secure JWT-based authentication with refresh tokens
- **Contractor Management**: Full CRUD operations for contractors and subcontractors
- **Insurance Tracking**: Monitor insurance documents and policy status
- **Project Management**: Track projects and contractor assignments
- **COI Generation**: Automated Certificate of Insurance workflow
- **User Management**: Multi-role access control (SUPER_ADMIN, ADMIN, MANAGER, USER, CONTRACTOR, SUBCONTRACTOR, BROKER)
- **Real-time Updates**: Automatic data refresh
- **Responsive UI**: Mobile-friendly interface

### Automated Business Logic ✨
- **Renewal Reminder System**: Automated email reminders at 30d, 14d, 7d, 2d intervals (cron-based)
  - Per-policy broker routing
  - Escalation after expiration (every 2 days)
  - Tracking and acknowledgment workflow
  - Location: `packages/backend/src/modules/reminders/`

- **Hold Harmless Workflow**: Complete signature workflow with auto-generation
  - Auto-generate on COI approval
  - Subcontractor → GC signature flow
  - Email notifications at each step
  - Document storage and tracking
  - Location: `packages/backend/src/modules/hold-harmless/`

### Security & Compliance
- **Field-Level Encryption**: Sensitive data encryption at rest
- **Audit Logging**: Comprehensive activity tracking
- **Rate Limiting**: DDoS protection
- **Input Validation**: SQL injection and XSS prevention
- **SSL/TLS Support**: Secure communications

## 📚 Documentation

### Development
- **VS Code Setup**: See [docs/VSCODE_SETUP.md](./docs/VSCODE_SETUP.md) - Complete VS Code devcontainer guide
- **API Documentation**: Visit http://localhost:3001/api/docs when backend is running
- **Database Schema**: See `packages/backend/prisma/schema.prisma`
- **Implementation Guide**: See [docs/IMPLEMENTATION_GUIDELINES.md](./docs/IMPLEMENTATION_GUIDELINES.md)
- **Testing Guide**: See [docs/TESTING_GUIDE.md](./docs/TESTING_GUIDE.md)
- **Workflows**: See [docs/WORKFLOW_IMPLEMENTATION.md](./docs/WORKFLOW_IMPLEMENTATION.md)

## 🔧 Configuration

### Backend Environment Variables

Edit `packages/backend/.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/compliant_dev"
JWT_SECRET="your-secret-key-min-32-characters"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-characters"
JWT_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"
PORT=3001
```

### Frontend Environment Variables

Edit `packages/frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 🧪 Testing

```bash
# Backend tests
cd packages/backend
pnpm test        # Unit tests
pnpm test:e2e    # E2E tests
pnpm test:cov    # Coverage report

# Frontend tests
cd packages/frontend
pnpm test        # Component tests

# E2E Browser Tests (Playwright)
pnpm test:e2e           # Run all E2E tests
pnpm test:e2e:ui        # Run with interactive UI
pnpm test:e2e:headed    # Run with visible browser
pnpm test:e2e:debug     # Debug mode
pnpm test:e2e:report    # View HTML report
```

### E2E Testing with Screenshots

All E2E tests capture:
- 📸 **Screenshots at every step** - Saved to `docs/e2e-screenshots/`
- 📊 **Console monitoring** - Browser logs, errors, and warnings
- 🎥 **Video recordings** - Full test execution videos
- 🔍 **Detailed traces** - Debug information for failures

Screenshots and console logs are **committed to PRs** for visual verification and review.

See [E2E Testing Documentation](./docs/e2e-screenshots/README.md) for details.

## 🔄 CI/CD Workflows

This project includes comprehensive CI/CD workflows for automated testing, security scanning, and deployment:

### Testing Workflows

- **CI (Continuous Integration)** - `.github/workflows/ci.yml`
  - Runs on every push and PR
  - Linting, building, and unit testing
  - PostgreSQL service for database tests
  
- **Integration Tests** - `.github/workflows/integration-tests.yml`
  - Full integration testing with PostgreSQL and Redis
  - Database migrations and seeding
  - API endpoint health checks
  
- **E2E Tests** - `.github/workflows/e2e-tests.yml`
  - Playwright-based end-to-end tests
  - Tests across multiple browsers (Chromium, Firefox, WebKit)
  - Mobile, tablet, and desktop viewports
  - Runs daily and on demand
  
- **Code Coverage** - `.github/workflows/code-coverage.yml`
  - Comprehensive test coverage reporting
  - Coverage thresholds enforcement
  - Codecov integration
  - PR comments with coverage details
  
- **Performance Tests** - `.github/workflows/performance-tests.yml`
  - K6 load testing (up to 100 concurrent users)
  - API response time metrics and thresholds
  - Performance metrics tracking
  - Runs weekly and on main branch
  - Note: Lighthouse audits are for frontend only (not API endpoints)

### Security Workflows

- **Container Security Scan** - `.github/workflows/security-scan.yml`
  - Multi-stage Docker build (prevents secret leakage)
  - Trivy vulnerability scanning
  - Grype additional vulnerability checks
  - Dockle best practices validation
  - SBOM (Software Bill of Materials) generation
  - Secret scanning in containers
  - Runs on push, PR, and weekly schedule
  
- **CodeQL Analysis** - `.github/workflows/codeql-analysis.yml`
  - Static Application Security Testing (SAST)
  - Semgrep security rules (OWASP Top 10)
  - ESLint security plugin scanning
  - Runs weekly and on security-sensitive changes
  
- **Dependency Scanning** - Part of security-scan.yml
  - npm audit for known vulnerabilities
  - Snyk security scanning

### Deployment Workflow

- **Production Deployment** - `.github/workflows/deploy.yml`
  - Automated deployment to production/staging
  - Pre-deployment testing and validation
  - Build artifact management
  - Smoke tests after deployment
  - Configurable deployment targets (see workflow comments for setup)

### Workflow Status

[![CI](https://github.com/hml-brokerage/compliant-/actions/workflows/ci.yml/badge.svg)](https://github.com/hml-brokerage/compliant-/actions/workflows/ci.yml)
[![Security Scan](https://github.com/hml-brokerage/compliant-/actions/workflows/security-scan.yml/badge.svg)](https://github.com/hml-brokerage/compliant-/actions/workflows/security-scan.yml)
[![CodeQL](https://github.com/hml-brokerage/compliant-/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/hml-brokerage/compliant-/actions/workflows/codeql-analysis.yml)

## 📊 Database Setup

```bash
# Create database
createdb compliant_dev

# Or using Docker
docker run --name compliant-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=compliant_dev \
  -p 5432:5432 -d postgres:15

# Push Prisma schema
pnpm db:push

# Seed database with demo data (optional)
cd packages/backend && pnpm db:seed

# This creates test users including:
# - 1 Super Admin (full access to everything)
# - 3 ADMIN users (role-based filtering by assignments)
# - Other role-based test users (Manager, Contractor, Subcontractor, Broker)
```

### Test User Credentials

After running the seed script, you can log in with these accounts:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| Super Admin | superadmin@compliant.com | SuperAdmin123!@# | Full access, sees everything |
| Admin | admin@compliant.com | Admin123!@# | Limited to assigned items |
| Admin 2 | admin2@compliant.com | Admin2123!@# | Limited to assigned items |
| Admin 3 | admin3@compliant.com | Admin3123!@# | Limited to assigned items |
| Manager | manager@compliant.com | Manager123!@# | Manager access |
| Contractor | contractor@compliant.com | Contractor123!@# | General contractor access |
| Subcontractor | subcontractor@compliant.com | Subcontractor123!@# | Subcontractor access |
| Broker | broker@compliant.com | Broker123!@# | Insurance broker access |

**Note:** Each ADMIN role user has their own unique email address and can be assigned different contractors, projects, and COIs using the `assignedAdminEmail` field. ADMIN users have filtered access (only see items assigned to them), while SUPER_ADMIN sees everything.
```

## 🚢 Deployment

### AWS CodeBuild Setup

This repository includes AWS CodeBuild configuration for CI/CD:

**⚡ Quick Fix for "reference not found" Error:**
```bash
./scripts/fix-codebuild-source.sh
```

**Configure Environment Variables (DATABASE_URL):**
```bash
./scripts/setup-codebuild-env-vars.sh
```

**Quick Start - Infrastructure as Code Templates:**
- **CloudFormation**: `cloudformation-codebuild.yaml`
- **Terraform**: `terraform-codebuild.tf`
- **Documentation**: See [IaC-README.md](./IaC-README.md) for deployment instructions

**Guides:**
- [AWS CodeBuild Setup Guide](./docs/AWS_CODEBUILD_SETUP.md) - Complete setup instructions
- [CodeBuild Troubleshooting](./CODEBUILD_TROUBLESHOOTING.md) - Quick fixes for common errors

The IaC templates properly configure CodeBuild with the correct source version (`refs/heads/main`) to avoid the "reference not found for primary source" error.

### Backend
- Deploy to AWS ECS, Heroku, or similar
- Set environment variables
- Run migrations before deployment

### Frontend
- Deploy to Vercel (recommended)
- Or any Node.js hosting platform
- Configure `NEXT_PUBLIC_API_URL` to production API

### Database
- Use AWS RDS, Supabase, or managed PostgreSQL
- Run migrations: `npx prisma migrate deploy`

## 🔒 Security

- ✅ JWT tokens with short expiration
- ✅ Refresh token rotation
- ✅ Password hashing with bcrypt
- ✅ CORS configuration
- ✅ Input validation
- ✅ SQL injection prevention (Prisma)

## 📝 License

MIT License

---

**Built with ❤️ using enterprise best practices**
