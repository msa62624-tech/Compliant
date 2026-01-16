# Backend - NestJS API

Professional NestJS backend with PostgreSQL, Prisma ORM, and JWT authentication.

## Features

- ✅ NestJS 10.x with TypeScript
- ✅ PostgreSQL database with Prisma ORM
- ✅ JWT authentication with refresh tokens
- ✅ Role-based access control (RBAC)
- ✅ Auto-generated Swagger/OpenAPI documentation
- ✅ Request validation with class-validator
- ✅ Comprehensive error handling
- ✅ Unit and E2E tests
- ✅ Database seeding

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Push database schema:
```bash
pnpm db:push
```

4. Seed database (optional):
```bash
pnpm db:seed
```

5. Start development server:
```bash
pnpm dev
```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start:prod` - Start production server
- `pnpm test` - Run unit tests
- `pnpm test:e2e` - Run E2E tests
- `pnpm db:push` - Push schema to database
- `pnpm db:migrate` - Run migrations
- `pnpm db:studio` - Open Prisma Studio
- `pnpm db:seed` - Seed database

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:3001/api/docs
- OpenAPI JSON: http://localhost:3001/api/docs-json

## Default Credentials

After seeding:
- Admin: `admin@compliant.com` / `Admin123!@#`
- Manager: `manager@compliant.com` / `Manager123!@#`

## Project Structure

```
src/
├── modules/           # Feature modules
│   ├── auth/          # Authentication
│   ├── users/         # User management
│   └── contractors/   # Contractor management
├── common/            # Shared utilities
│   ├── decorators/    # Custom decorators
│   ├── guards/        # Auth guards
│   ├── interceptors/  # Request/response interceptors
│   └── filters/       # Exception filters
├── config/            # Configuration
└── main.ts            # Application entry
```
