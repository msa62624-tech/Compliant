# Compliant Platform - Professional Monorepo

> **Enterprise-grade monorepo starter** with NestJS backend, Next.js 14 frontend, PostgreSQL database, and Prisma ORM.

## 🏗️ Architecture Overview

This monorepo implements a professional, production-ready architecture following enterprise best practices:

```
┌─────────────────────────────────────────────────────────────┐
│                      MONOREPO ROOT                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Backend    │  │   Frontend   │  │    Shared    │    │
│  │   (NestJS)   │  │  (Next.js)   │  │    Types     │    │
│  │              │  │              │  │              │    │
│  │  - Auth      │  │  - App Dir   │  │  - Types     │    │
│  │  - Entities  │  │  - Pages     │  │  - Validators│    │
│  │  - Prisma    │  │  - API Client│  │  - Constants │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│         │                 │                  │             │
│         └─────────────────┴──────────────────┘             │
│                          │                                  │
│                   ┌──────▼──────┐                          │
│                   │  PostgreSQL │                          │
│                   │   Database  │                          │
│                   └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Package Structure

### `packages/backend` - NestJS API
- **Framework:** NestJS 10.x
- **Database:** Prisma + PostgreSQL
- **Auth:** JWT + Refresh Tokens
- **Testing:** Jest (unit + integration)
- **Documentation:** Auto-generated Swagger/OpenAPI

### `packages/frontend` - Next.js 14 App
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** React Query (TanStack Query)
- **Auth:** Context-based with JWT
- **Testing:** Playwright (E2E)

### `packages/shared` - Shared Code
- **Types:** Shared TypeScript interfaces
- **Validators:** Zod schemas for validation
- **Constants:** Shared constants and enums

## 🚀 Quick Start

### Prerequisites

- **Node.js:** >= 20.0.0
- **pnpm:** >= 8.0.0
- **PostgreSQL:** >= 15.0 (or Docker)

### Installation

```bash
# Install pnpm if not already installed
npm install -g pnpm

# Clone and navigate to monorepo
cd new-architecture

# Install all dependencies
pnpm install

# Set up environment variables
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env

# Edit .env files with your configuration
# packages/backend/.env - Add DATABASE_URL, JWT_SECRET, etc.
# packages/frontend/.env.local - Add NEXT_PUBLIC_API_URL

# Set up database
pnpm db:push  # Push Prisma schema to database
# OR
pnpm db:migrate  # Run migrations

# Start development servers (both backend and frontend)
pnpm dev

# OR start individually
pnpm backend   # Backend only (http://localhost:3001)
pnpm frontend  # Frontend only (http://localhost:3000)
```

### First Time Setup

1. **Database Setup:**
   ```bash
   # Option 1: Local PostgreSQL
   createdb compliant_dev
   
   # Option 2: Docker
   docker run --name compliant-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=compliant_dev -p 5432:5432 -d postgres:15
   ```

2. **Configure Backend (.env):**
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/compliant_dev"
   JWT_SECRET="your-super-secret-jwt-key-change-in-production"
   JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
   JWT_EXPIRATION="15m"
   JWT_REFRESH_EXPIRATION="7d"
   PORT=3001
   ```

3. **Configure Frontend (.env.local):**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

4. **Push Database Schema:**
   ```bash
   pnpm db:push
   ```

5. **Start Development:**
   ```bash
   pnpm dev
   ```

## 🛠️ Available Scripts

### Root Level
- `pnpm dev` - Start all packages in development mode
- `pnpm build` - Build all packages for production
- `pnpm test` - Run all tests across packages
- `pnpm lint` - Lint all packages
- `pnpm format` - Format code with Prettier

### Database
- `pnpm db:studio` - Open Prisma Studio (database GUI)
- `pnpm db:migrate` - Run database migrations
- `pnpm db:push` - Push schema changes to database

### Individual Packages
- `pnpm backend` - Start backend only
- `pnpm frontend` - Start frontend only

## 📚 Documentation

### Architecture Documents
- See `/ARCHITECTURE_RECOMMENDATION.md` for architectural decisions
- See `/REFACTORING_PLAN.md` for migration timeline

### API Documentation
- **Swagger UI:** http://localhost:3001/api/docs (when backend is running)
- **OpenAPI JSON:** http://localhost:3001/api/docs-json

### Database
- **Prisma Studio:** Run `pnpm db:studio` and open http://localhost:5555

## 🔐 Authentication Flow

This starter implements secure JWT authentication with refresh tokens:

1. **Login:** POST `/api/auth/login` → Returns access token + refresh token
2. **Access:** Include `Authorization: Bearer {token}` in requests
3. **Refresh:** POST `/api/auth/refresh` with refresh token when access token expires
4. **Logout:** POST `/api/auth/logout` to invalidate refresh token

### Example Flow

```typescript
// Login
const { accessToken, refreshToken } = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
}).then(r => r.json());

// Authenticated request
const data = await fetch('/api/contractors', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
}).then(r => r.json());

// Refresh when expired
const { accessToken: newToken } = await fetch('/api/auth/refresh', {
  method: 'POST',
  body: JSON.stringify({ refreshToken })
}).then(r => r.json());
```

## 🧪 Testing

### Backend Tests
```bash
cd packages/backend
pnpm test        # Unit tests
pnpm test:watch  # Watch mode
pnpm test:cov    # Coverage report
pnpm test:e2e    # E2E tests
```

### Frontend Tests
```bash
cd packages/frontend
pnpm test        # Component tests
pnpm test:e2e    # Playwright E2E tests
```

## 📁 Project Structure

```
new-architecture/
├── packages/
│   ├── backend/                    # NestJS API
│   │   ├── prisma/
│   │   │   ├── schema.prisma      # Database schema
│   │   │   └── seed.ts            # Database seeding
│   │   ├── src/
│   │   │   ├── modules/           # Feature modules
│   │   │   │   ├── auth/          # Authentication
│   │   │   │   ├── contractors/   # Contractor management
│   │   │   │   └── users/         # User management
│   │   │   ├── common/            # Shared utilities
│   │   │   │   ├── decorators/    # Custom decorators
│   │   │   │   ├── guards/        # Auth guards
│   │   │   │   ├── interceptors/  # Request/response interceptors
│   │   │   │   └── filters/       # Exception filters
│   │   │   ├── config/            # Configuration
│   │   │   └── main.ts            # Application entry
│   │   ├── test/                  # E2E tests
│   │   └── package.json
│   │
│   ├── frontend/                   # Next.js 14 App
│   │   ├── app/                   # App router
│   │   │   ├── (auth)/            # Auth routes
│   │   │   ├── (dashboard)/       # Protected routes
│   │   │   ├── api/               # API routes (optional)
│   │   │   ├── layout.tsx         # Root layout
│   │   │   └── page.tsx           # Home page
│   │   ├── components/            # React components
│   │   │   ├── ui/                # shadcn/ui components
│   │   │   ├── layout/            # Layout components
│   │   │   └── forms/             # Form components
│   │   ├── lib/                   # Utilities
│   │   │   ├── api/               # API client
│   │   │   ├── auth/              # Auth utilities
│   │   │   └── utils.ts           # Helpers
│   │   ├── public/                # Static assets
│   │   └── package.json
│   │
│   └── shared/                     # Shared code
│       ├── src/
│       │   ├── types/             # TypeScript types
│       │   ├── validators/        # Zod schemas
│       │   └── constants/         # Constants
│       └── package.json
│
├── package.json                    # Root package.json
├── turbo.json                      # Turborepo config
├── tsconfig.json                   # Base TypeScript config
├── .gitignore
└── README.md                       # This file
```

## 🔧 Configuration

### Environment Variables

#### Backend (`packages/backend/.env`)
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# JWT Authentication
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# Server
PORT=3001
NODE_ENV="development"

# CORS
CORS_ORIGIN="http://localhost:3000"
```

#### Frontend (`packages/frontend/.env.local`)
```env
# API
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Optional: Analytics, etc.
# NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
```

## 🚢 Deployment

### Backend Deployment

**Option 1: Docker**
```bash
cd packages/backend
docker build -t compliant-backend .
docker run -p 3001:3001 compliant-backend
```

**Option 2: AWS ECS Fargate**
- See `/infrastructure/` directory (if added)
- Use Terraform or AWS CDK for IaC

**Option 3: Heroku**
```bash
cd packages/backend
heroku create compliant-backend
git push heroku main
```

### Frontend Deployment

**Option 1: Vercel (Recommended)**
```bash
cd packages/frontend
vercel
```

**Option 2: AWS Amplify**
- Connect your Git repository
- Configure build settings
- Deploy automatically on push

**Option 3: Docker + AWS**
```bash
cd packages/frontend
docker build -t compliant-frontend .
docker run -p 3000:3000 compliant-frontend
```

### Database Migration in Production

```bash
# Before deploying new code with schema changes
pnpm db:migrate

# Or use Prisma Migrate in CI/CD
cd packages/backend
npx prisma migrate deploy
```

## 🔒 Security Considerations

- ✅ JWT tokens with short expiration (15 minutes)
- ✅ Refresh tokens for long-lived sessions
- ✅ Password hashing with bcrypt
- ✅ CORS configuration
- ✅ Rate limiting (add express-rate-limit)
- ✅ Input validation with class-validator
- ✅ SQL injection prevention (Prisma)
- ⚠️ **TODO:** Add helmet.js for security headers
- ⚠️ **TODO:** Implement rate limiting
- ⚠️ **TODO:** Add CSRF protection for forms

## 📈 Performance

### Backend
- Database query optimization with Prisma
- Response caching where appropriate
- Connection pooling
- Gzip compression

### Frontend
- Server-side rendering (SSR)
- Automatic code splitting
- Image optimization (Next.js Image)
- Static generation where possible

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and test: `pnpm test`
3. Commit with conventional commits: `git commit -m "feat: add new feature"`
4. Push and create PR: `git push origin feature/your-feature`

## 📝 Code Style

- **TypeScript:** Strict mode enabled
- **Linting:** ESLint with recommended rules
- **Formatting:** Prettier with 2-space indentation
- **Commits:** Conventional Commits (feat, fix, docs, etc.)

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
psql -U postgres

# Reset database
pnpm db:push --force-reset
```

### Port Already in Use
```bash
# Kill process on port 3001 (backend)
lsof -ti:3001 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

### Prisma Issues
```bash
# Regenerate Prisma Client
cd packages/backend
npx prisma generate

# Reset database
npx prisma migrate reset
```

## 📞 Support

- **Documentation:** See individual package README files
- **Issues:** Open a GitHub issue
- **Architecture Questions:** See ARCHITECTURE_RECOMMENDATION.md

## 📄 License

MIT License - See LICENSE file for details

## 🎯 Next Steps

After setting up this starter:

1. ✅ **Customize the schema** - Edit `packages/backend/prisma/schema.prisma`
2. ✅ **Add business logic** - Create new modules in `packages/backend/src/modules`
3. ✅ **Build UI** - Add pages in `packages/frontend/app`
4. ✅ **Add tests** - Write unit and E2E tests
5. ✅ **Configure CI/CD** - Set up GitHub Actions
6. ✅ **Deploy** - Deploy to your preferred platform

---

**Built with ❤️ following enterprise best practices and architectural patterns from ARCHITECTURE_RECOMMENDATION.md**
