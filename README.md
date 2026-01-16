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
- **Backend API**: http://localhost:3001/api/v1
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

- **Authentication**: Secure JWT-based authentication
- **Contractor Management**: Full CRUD operations for contractors
- **Insurance Tracking**: Monitor insurance documents and status
- **Project Management**: Track projects and contractor assignments
- **User Management**: Admin, Manager, and User roles
- **Real-time Updates**: Automatic data refresh
- **Responsive UI**: Mobile-friendly interface

## 📚 Documentation

- **API Documentation**: Visit http://localhost:3001/api/docs when backend is running
- **Database Schema**: See `packages/backend/prisma/schema.prisma`

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
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
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
