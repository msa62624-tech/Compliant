# 🚀 Getting Started - Compliant Platform Monorepo

This guide will help you get the complete monorepo up and running in minutes.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: >= 20.0.0 ([Download](https://nodejs.org/))
- **pnpm**: >= 8.0.0 (Install: `npm install -g pnpm`)
- **PostgreSQL**: >= 15.0 ([Download](https://www.postgresql.org/download/))
  - Or use Docker: `docker run --name compliant-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=compliant_dev -p 5432:5432 -d postgres:15`

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
cd new-architecture
pnpm install
```

This will install all dependencies for the monorepo and all packages.

### 2. Set Up Environment Variables

#### Backend Configuration

```bash
cd packages/backend
cp .env.example .env
```

Edit `packages/backend/.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/compliant_dev"
JWT_SECRET="your-super-secret-jwt-key-change-in-production-min-32-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production-min-32-chars"
JWT_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"
PORT=3001
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"
```

#### Frontend Configuration

```bash
cd packages/frontend
cp .env.example .env.local
```

Edit `packages/frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### 3. Set Up Database

#### Create Database (if not using Docker)

```bash
# Using psql
createdb compliant_dev

# OR using PostgreSQL client
psql -U postgres
CREATE DATABASE compliant_dev;
\q
```

#### Push Prisma Schema

```bash
# From monorepo root
pnpm db:push
```

This will create all tables in your database.

#### Seed Database (Optional but Recommended)

```bash
# From monorepo root
cd packages/backend
pnpm db:seed
```

This creates demo users:
- **Admin**: `admin@compliant.com` / `Admin123!@#`
- **Manager**: `manager@compliant.com` / `Manager123!@#`

### 4. Start Development Servers

#### Option A: Start Everything (Recommended)

```bash
# From monorepo root
pnpm dev
```

This starts both backend and frontend concurrently.

#### Option B: Start Individually

```bash
# Terminal 1 - Backend
pnpm backend

# Terminal 2 - Frontend  
pnpm frontend
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api/v1
- **Swagger Docs**: http://localhost:3001/api/docs
- **Prisma Studio**: Run `pnpm db:studio` then visit http://localhost:5555

## 🎯 What You Get

### Backend (NestJS)
- ✅ RESTful API with Swagger documentation
- ✅ JWT authentication with refresh tokens
- ✅ Role-based access control (ADMIN, MANAGER, USER)
- ✅ PostgreSQL database with Prisma ORM
- ✅ Comprehensive error handling
- ✅ Request validation
- ✅ Seed data for testing

### Frontend (Next.js 14)
- ✅ Modern App Router architecture
- ✅ TypeScript for type safety
- ✅ Tailwind CSS for styling
- ✅ React Query for data fetching
- ✅ JWT authentication with auto-refresh
- ✅ Login and Dashboard pages
- ✅ Responsive design

### Shared Package
- ✅ TypeScript types shared between frontend and backend
- ✅ Zod validators for data validation
- ✅ Constants and utilities

## 📚 Common Tasks

### Database Management

```bash
# Open Prisma Studio (Visual DB Browser)
pnpm db:studio

# Create a migration
pnpm db:migrate

# Push schema changes (dev only)
pnpm db:push

# Seed database
cd packages/backend && pnpm db:seed
```

### Running Tests

```bash
# Backend tests
cd packages/backend
pnpm test              # Unit tests
pnpm test:e2e          # E2E tests
pnpm test:cov          # With coverage

# Frontend tests
cd packages/frontend
pnpm test              # Component tests
```

### Building for Production

```bash
# Build all packages
pnpm build

# Build individually
cd packages/backend && pnpm build
cd packages/frontend && pnpm build
```

### Code Quality

```bash
# Lint all packages
pnpm lint

# Format code
pnpm format
```

## 🔐 Testing Authentication

### Using the UI

1. Go to http://localhost:3000
2. Click "Get Started" or navigate to http://localhost:3000/login
3. Use demo credentials:
   - Email: `admin@compliant.com`
   - Password: `Admin123!@#`
4. You'll be redirected to the dashboard

### Using Swagger UI

1. Go to http://localhost:3001/api/docs
2. Click "Authorize" button (top right)
3. Get a token:
   - POST `/api/v1/auth/login`
   - Body: `{ "email": "admin@compliant.com", "password": "Admin123!@#" }`
   - Copy the `accessToken` from response
4. Enter token in format: `Bearer YOUR_ACCESS_TOKEN`
5. Click "Authorize"
6. Now you can test all protected endpoints

### Using cURL

```bash
# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@compliant.com","password":"Admin123!@#"}'

# Use the access token from response
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Get contractors
curl http://localhost:3001/api/v1/contractors \
  -H "Authorization: Bearer $TOKEN"
```

## 🔧 Troubleshooting

### Database Connection Issues

**Problem**: Can't connect to PostgreSQL

**Solution**:
```bash
# Check if PostgreSQL is running
pg_isready

# If using Docker, check container
docker ps | grep postgres

# Test connection
psql -U postgres -d compliant_dev
```

### Port Already in Use

**Problem**: Port 3000 or 3001 is already in use

**Solution**:
```bash
# Kill process on port 3001 (backend)
lsof -ti:3001 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9

# OR change ports in .env files
```

### Prisma Issues

**Problem**: Prisma Client errors

**Solution**:
```bash
cd packages/backend

# Regenerate Prisma Client
npx prisma generate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### TypeScript Errors

**Problem**: Type errors in shared package

**Solution**:
```bash
# Clean and rebuild
pnpm clean
pnpm install
```

### Authentication Issues

**Problem**: "Invalid token" or "Unauthorized" errors

**Solution**:
```bash
# Clear browser localStorage
# In browser console:
localStorage.clear()

# Or manually remove items:
localStorage.removeItem('accessToken')
localStorage.removeItem('refreshToken')

# Then login again
```

## 📖 Next Steps

### 1. Explore the Codebase

- **Backend**: `packages/backend/src/`
  - `modules/` - Feature modules (auth, users, contractors)
  - `common/` - Shared utilities (guards, decorators, interceptors)
  - `config/` - Configuration (Prisma, environment)

- **Frontend**: `packages/frontend/`
  - `app/` - Next.js App Router pages
  - `lib/` - API client, authentication, utilities
  - `components/` - Reusable React components

- **Shared**: `packages/shared/src/`
  - `types/` - TypeScript interfaces
  - `validators/` - Zod schemas
  - `constants/` - Shared constants

### 2. Add New Features

#### Add a New Backend Module

```bash
cd packages/backend
npx nest g module modules/projects
npx nest g controller modules/projects
npx nest g service modules/projects
```

#### Add a New Frontend Page

```bash
cd packages/frontend/app
mkdir projects
# Create projects/page.tsx
```

### 3. Customize the Schema

Edit `packages/backend/prisma/schema.prisma` and run:
```bash
pnpm db:push
```

### 4. Deploy to Production

See deployment guides in:
- Backend: `packages/backend/README.md`
- Frontend: `packages/frontend/README.md`

## 🆘 Getting Help

- **Architecture Docs**: `/ARCHITECTURE_RECOMMENDATION.md`
- **Refactoring Plan**: `/REFACTORING_PLAN.md`
- **Backend README**: `/packages/backend/README.md`
- **Frontend README**: `/packages/frontend/README.md`
- **API Documentation**: http://localhost:3001/api/docs (when running)

## 📝 Summary

You now have a complete, working monorepo with:
- ✅ Professional NestJS backend with JWT auth
- ✅ Modern Next.js 14 frontend with App Router
- ✅ PostgreSQL database with Prisma ORM
- ✅ Shared types between frontend and backend
- ✅ Hot reload for development
- ✅ Production-ready architecture

**Happy coding! 🚀**
