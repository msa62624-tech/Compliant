# 🚀 Compliant Platform - Complete Setup & Testing Guide

## What This Application Does

This is an **Insurance Tracking Platform** for General Contractors that manages:

- ✅ **Contractors** - Add, view, and manage subcontractors
- ✅ **Insurance Documents** - Track and verify insurance certificates
- ✅ **Projects** - Manage construction projects and contractor assignments
- ✅ **Users** - Role-based access (Admin, Manager, User)
- ✅ **Notifications** - Email alerts for expiring policies

## 🎯 Quick Start (3 Steps)

### Step 1: Open in GitHub Codespaces

Click the green **"Code"** button above → **Codespaces** → **Create codespace on [branch]**

Codespaces provides a complete development environment in your browser with everything pre-configured!

### Step 2: Run Setup Script

Once Codespace opens, run this ONE command:

```bash
./scripts/setup-and-run.sh
```

That's it! The script will:
- ✅ Install all dependencies
- ✅ Start PostgreSQL database
- ✅ Create database tables
- ✅ Add demo data (2 users, 3 contractors, sample insurance docs)
- ✅ Start backend API (port 3001)
- ✅ Start frontend UI (port 3000)

### Step 3: Access the Application

Codespaces will show port forwarding notifications. Click:
- **Port 3000** → Opens the frontend UI
- **Port 3001/api/docs** → Opens API documentation

## 🔐 Demo Login Credentials

**Administrator Account:**
- Email: `admin@compliant.com`
- Password: `Admin123!@#`
- Can: Manage everything

**Manager Account:**
- Email: `manager@compliant.com`
- Password: `Manager123!@#`
- Can: View and manage contractors

## 📱 What You'll See

### 1. Login Page
- Clean, professional authentication
- Role-based access control
- JWT token security

### 2. Dashboard
- Overview of contractors
- Insurance status at a glance
- Quick actions

### 3. Contractors Page
- List all contractors
- Filter by status (ACTIVE, PENDING, SUSPENDED)
- Add new contractors
- View insurance compliance

### 4. Contractor Details
- Contact information
- Insurance documents
- Project assignments
- Document upload

### 5. Projects Page
- Active construction projects
- Assigned contractors
- Timeline tracking

### 6. Insurance Tracking
- Document expiration dates
- Compliance status
- Upload/download documents

## 🔧 Manual Setup (If Not Using Codespaces)

### Prerequisites
- Node.js 20+
- pnpm 8+
- PostgreSQL 15+
- Docker (optional, for easy PostgreSQL)

### Installation

```bash
# 1. Install dependencies
pnpm install

# 2. Build shared package
cd packages/shared && pnpm build && cd ../..

# 3. Start PostgreSQL (using Docker)
docker run --name compliant-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=compliant_dev \
  -p 5432:5432 \
  -d postgres:15

# 4. Configure environment
cp packages/backend/.env.example packages/backend/.env

# 5. Setup database
cd packages/backend
npx prisma db push
npx prisma db seed
cd ../..

# 6. Start development servers
pnpm dev
```

### Access Points
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- API Documentation: http://localhost:3001/api/docs
- Database GUI: `cd packages/backend && npx prisma studio` → http://localhost:5555

## 🧪 Testing the Features

### Test 1: Authentication
1. Go to http://localhost:3000
2. Login with `admin@compliant.com` / `Admin123!@#`
3. ✅ Should redirect to dashboard

### Test 2: View Contractors
1. Click "Contractors" in navigation
2. ✅ Should see list of 3 contractors
3. ✅ Should show their insurance status

### Test 3: Add New Contractor
1. Click "Add Contractor" button
2. Fill in: Name, Email, Phone, Address
3. Click "Save"
4. ✅ New contractor appears in list

### Test 4: Upload Insurance Document
1. Click on a contractor
2. Click "Upload Document"
3. Select document type (General Liability, Workers Comp, etc.)
4. Add policy details
5. ✅ Document saved and tracked

### Test 5: View Projects
1. Click "Projects" in navigation
2. ✅ Should see sample project
3. ✅ Should show assigned contractors

### Test 6: API Documentation
1. Go to http://localhost:3001/api/docs
2. ✅ See all API endpoints
3. ✅ Test endpoints directly from Swagger UI

## 📊 Database Inspection

View the database tables and data:

```bash
cd packages/backend
npx prisma studio
```

Opens at http://localhost:5555 showing:
- **User** table - Admin and manager accounts
- **Contractor** table - All contractors
- **InsuranceDocument** table - Uploaded insurance docs
- **Project** table - Construction projects
- **ProjectContractor** table - Project assignments

## 🏗️ Architecture

```
compliant-platform/
├── packages/
│   ├── backend/          # NestJS REST API
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/           # JWT authentication
│   │   │   │   ├── users/          # User management
│   │   │   │   └── contractors/    # Contractor CRUD
│   │   │   └── config/
│   │   │       └── prisma.service.ts  # Database connection
│   │   └── prisma/
│   │       ├── schema.prisma      # Database schema
│   │       └── seed.ts            # Demo data
│   │
│   ├── frontend/         # Next.js 14 UI
│   │   ├── app/
│   │   │   ├── login/            # Login page
│   │   │   ├── dashboard/        # Main dashboard
│   │   │   └── layout.tsx        # App layout
│   │   └── lib/
│   │       ├── api/              # API client
│   │       └── auth/             # Auth context
│   │
│   └── shared/           # Shared TypeScript types
│       └── src/
│           ├── types/           # Type definitions
│           ├── validators/      # Zod schemas
│           └── constants/       # Shared constants
```

## 🛠️ Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Restart if needed
docker start compliant-postgres
```

### Module Not Found Errors
```bash
# Rebuild shared package
cd packages/shared && pnpm build && cd ../..

# Regenerate Prisma client
cd packages/backend && npx prisma generate && cd ../..
```

### Port Already in Use
```bash
# Kill processes on ports 3000 and 3001
kill $(lsof -t -i:3000)
kill $(lsof -t -i:3001)
```

## 📚 API Endpoints

All endpoints documented at http://localhost:3001/api/docs

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Contractors
- `GET /api/contractors` - List all contractors
- `POST /api/contractors` - Create contractor
- `GET /api/contractors/:id` - Get contractor details
- `PATCH /api/contractors/:id` - Update contractor
- `DELETE /api/contractors/:id` - Delete contractor
- `GET /api/contractors/:id/insurance-status` - Check insurance compliance

### Users (Admin only)
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## 🎨 Technology Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- React Query (data fetching)

**Backend:**
- NestJS 10
- Prisma ORM
- PostgreSQL 15
- JWT Authentication
- Swagger/OpenAPI

**Development:**
- pnpm (package manager)
- Turborepo (monorepo build system)
- TypeScript (type safety)
- ESLint (code quality)

## 🔒 Security Features

- ✅ JWT tokens with 15-minute expiration
- ✅ Refresh tokens for session persistence
- ✅ Password hashing with bcrypt
- ✅ Role-based access control (RBAC)
- ✅ SQL injection prevention (Prisma)
- ✅ CORS configuration
- ✅ Input validation (Zod schemas)

## 📈 What Makes This Enterprise-Grade

1. **Monorepo Structure** - Organized, scalable codebase
2. **Type Safety** - TypeScript end-to-end
3. **Modern Stack** - Latest frameworks and best practices
4. **API Documentation** - Auto-generated with Swagger
5. **Database Migrations** - Version-controlled schema
6. **Authentication** - Industry-standard JWT
7. **Role Management** - Flexible RBAC system
8. **Testing Ready** - Structure for unit/E2E tests
9. **Production Ready** - Built for deployment

## 🚀 Next Steps

After seeing it work, you can:

1. **Customize** - Add your own branding and features
2. **Deploy** - Push to Vercel (frontend) + AWS/Heroku (backend)
3. **Extend** - Add more insurance types, reporting, analytics
4. **Integrate** - Connect email services, cloud storage, etc.

## 💡 Need Help?

- Check the [API Documentation](http://localhost:3001/api/docs)
- Inspect database with Prisma Studio: `cd packages/backend && npx prisma studio`
- View backend logs in terminal where `pnpm dev` is running
- Frontend dev tools available in browser

---

**Built with modern enterprise architecture. Ready for production deployment.**
