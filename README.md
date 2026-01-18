# Compliant.team - Insurance Tracking Platform

Enterprise-grade insurance tracking application for General Contractors and their subcontractors. Built with NestJS backend, Next.js 14 frontend, and PostgreSQL database.

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
- **API Documentation**: Visit http://localhost:3001/api/docs when backend is running
- **Database Schema**: See `packages/backend/prisma/schema.prisma`
- **Getting Started Guide**: See [GETTING_STARTED.md](./GETTING_STARTED.md)
- **Implementation Guidelines**: See [docs/IMPLEMENTATION_GUIDELINES.md](./docs/IMPLEMENTATION_GUIDELINES.md)
- **Additional Documentation**: See [docs/](./docs/) directory for feature requirements and workflow details

### Production Deployment 🚀
- **Quick Start (30 min)**: [QUICK_START_PRODUCTION.md](./QUICK_START_PRODUCTION.md) - Fast production deployment
- **Complete Guide**: [PRODUCTION_READINESS_GUIDE.md](./PRODUCTION_READINESS_GUIDE.md) - Comprehensive deployment documentation
- **Deployment Guide**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Enterprise deployment strategies
- **Configuration Template**: `packages/backend/.env.production.template` - Production environment template

### Tools & Scripts
- **Validate Config**: `node scripts/validate-production-env.js` - Verify environment variables
- **Deployment Checklist**: `./scripts/production-deployment-checklist.sh` - Interactive deployment guide

### Business Logic Status
- **Implementation Status**: [BUSINESS_LOGIC_STATUS.md](./BUSINESS_LOGIC_STATUS.md) - Current feature implementation status

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
```

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
```

## 🚢 Deployment

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
