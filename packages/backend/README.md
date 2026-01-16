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

### API Versioning

The API supports header-based versioning. Include the `X-API-Version` header in your requests to specify the API version:

```bash
# Example with version 1 (default)
curl -H "X-API-Version: 1" http://localhost:3001/api/users

# If no header is provided, version 1 is used by default
curl http://localhost:3001/api/users
```

To version a controller or endpoint, use the `@Version()` decorator:

```typescript
import { Controller, Get, Version } from '@nestjs/common';

@Controller('users')
export class UsersController {
  // Available in version 1
  @Get()
  @Version('1')
  findAllV1() {
    return this.usersService.findAll();
  }

  // Available in version 2
  @Get()
  @Version('2')
  findAllV2() {
    return this.usersService.findAllWithNewFeatures();
  }
}

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
