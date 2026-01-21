# VS Code Development Setup Guide

Complete guide for setting up and using Visual Studio Code with this project.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [PostgreSQL Configuration](#postgresql-configuration)
- [Development Workflow](#development-workflow)
- [Extensions](#extensions)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Visual Studio Code**: [Download here](https://code.visualstudio.com/)
2. **Docker Desktop**: [Download here](https://www.docker.com/products/docker-desktop/)
   - Ensure Docker Desktop is running before opening the project
   - Recommended: 4GB+ RAM allocation for Docker
3. **Dev Containers Extension**: Install from VS Code marketplace
   ```
   ext install ms-vscode-remote.remote-containers
   ```

## Initial Setup

### Step 1: Clone and Open

```bash
git clone https://github.com/hml-brokerage/Compliant-.git
cd Compliant-
code .
```

### Step 2: Open in Dev Container

1. VS Code will detect the `.devcontainer` configuration
2. You'll see a prompt: "Reopen in Container"
   - Click **Reopen in Container**
   - Or: Press `F1` → `Dev Containers: Reopen in Container`

3. VS Code will:
   - Build the development container
   - Start PostgreSQL container
   - Install all dependencies
   - Configure the environment

**First-time setup takes 3-5 minutes** as it downloads Docker images and installs dependencies.

### Step 3: Wait for Post-Start Scripts

The devcontainer automatically runs post-start scripts that:
- Copy environment files from `.env.example`
- Push the Prisma database schema
- Seed the database with demo data

Watch the terminal output to see progress.

## PostgreSQL Configuration

### Database Credentials (Pre-configured)

The devcontainer automatically configures PostgreSQL with these credentials:

| Setting | Value |
|---------|-------|
| **Host** | `postgres` (container name) |
| **Port** | `5432` |
| **Database** | `compliant_dev` |
| **Username** | `postgres` |
| **Password** | `postgres` |

### Connection String

The `DATABASE_URL` is automatically set in your environment:
```
postgresql://postgres:postgres@postgres:5432/compliant_dev
```

**Note**: You don't need to manually configure this. It's pre-configured in:
- `.devcontainer/devcontainer.json` → `containerEnv.DATABASE_URL`
- `docker-compose.yml` → PostgreSQL environment variables
- `packages/backend/.env` (created automatically)

### Accessing PostgreSQL

#### From VS Code Terminal (Inside Container)

```bash
# Connect to PostgreSQL
docker exec -it compliant-postgres psql -U postgres -d compliant_dev

# Common commands:
\\dt              # List tables
\\d tablename     # Describe table
\\l               # List databases
\\q               # Quit
```

#### Using Prisma Studio

```bash
# Open Prisma Studio (GUI for database)
pnpm db:studio

# Visit: http://localhost:5555
```

#### From Host Machine

```bash
# If you need to connect from outside the container:
docker exec -it compliant-postgres psql -U postgres -d compliant_dev

# Or use any PostgreSQL client with:
# Host: localhost, Port: 5432, User: postgres, Password: postgres
```

### Database Management Commands

```bash
# Push schema changes (without migrations)
pnpm db:push

# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed database with demo data
pnpm -C packages/backend db:seed

# Reset database (WARNING: deletes all data)
pnpm db:reset
```

## Development Workflow

### Starting Development Servers

```bash
# Start both frontend and backend
pnpm dev

# Or start individually:
pnpm backend    # Backend only (http://localhost:3001)
pnpm frontend   # Frontend only (http://localhost:3000)
```

### Ports and Services

The devcontainer forwards these ports to your host machine:

| Port | Service | URL |
|------|---------|-----|
| 3000 | Frontend | http://localhost:3000 |
| 3001 | Backend API | http://localhost:3001/api |
| 3001 | API Docs | http://localhost:3001/api/docs |
| 5432 | PostgreSQL | localhost:5432 |
| 5555 | Prisma Studio | http://localhost:5555 (when running) |

### Code Quality Tools

The devcontainer is pre-configured with:

```bash
# Linting
pnpm lint           # Lint all packages
pnpm lint:fix       # Auto-fix linting issues

# Type checking
pnpm type-check     # Run TypeScript compiler

# Testing
pnpm test           # Run unit tests
pnpm test:e2e       # Run E2E tests
pnpm test:cov       # Generate coverage report

# Building
pnpm build          # Build all packages
```

## Extensions

The devcontainer automatically installs these VS Code extensions:

### Pre-installed Extensions

1. **ESLint** (`dbaeumer.vscode-eslint`)
   - Real-time linting
   - Auto-fix on save

2. **Prettier** (`esbenp.prettier-vscode`)
   - Code formatting
   - Format on save enabled

3. **Prisma** (`Prisma.prisma`)
   - Syntax highlighting for `.prisma` files
   - Prisma schema validation

### Recommended Additional Extensions

You may want to install these manually from VS Code:

1. Open VS Code Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Type "Extensions: Install Extensions"
3. Search for and install:
   - **PostgreSQL Client** (`cweijan.vscode-postgresql-client2`) - Database management
   - **GitLens** (`eamodio.gitlens`) - Enhanced Git integration
   - **Jest** (`orta.vscode-jest`) - Testing support

## Troubleshooting

### Container Fails to Start

**Problem**: "Failed to create container" or timeout errors

**Solutions**:
1. Ensure Docker Desktop is running
2. Check Docker resources:
   - Docker Desktop → Settings → Resources
   - Allocate at least 4GB RAM, 2 CPUs
3. Clean Docker:
   ```bash
   docker system prune -a
   ```
4. Rebuild container:
   - `F1` → `Dev Containers: Rebuild Container`

### PostgreSQL Connection Errors

**Problem**: "Could not connect to database" or `ECONNREFUSED`

**Solutions**:
1. **Wait for initialization**: PostgreSQL container needs 10-20 seconds to start
2. **Check container health**:
   ```bash
   docker ps
   docker logs compliant-postgres
   ```
3. **Verify connection**:
   ```bash
   docker exec compliant-postgres pg_isready -U postgres
   ```
4. **Restart PostgreSQL**:
   ```bash
   docker restart compliant-postgres
   ```

### Database Schema Issues

**Problem**: "Table does not exist" or Prisma errors

**Solutions**:
1. **Push schema again**:
   ```bash
   pnpm db:push
   ```
2. **Regenerate Prisma client**:
   ```bash
   pnpm db:generate
   ```
3. **Reset database** (WARNING: deletes data):
   ```bash
   pnpm db:reset
   ```

### Environment Variables Not Set

**Problem**: Missing `DATABASE_URL` or other environment variables

**Solutions**:
1. **Check `.env` files exist**:
   ```bash
   ls -la packages/backend/.env
   ls -la packages/frontend/.env.local
   ```
2. **Recreate from examples**:
   ```bash
   cp packages/backend/.env.example packages/backend/.env
   cp packages/frontend/.env.example packages/frontend/.env.local
   ```
3. **Rebuild container**: `F1` → `Dev Containers: Rebuild Container`

### Port Already in Use

**Problem**: "Port 3000 is already in use" or "Port 5432 is already in use"

**Solutions**:
1. **Find and kill process**:
   ```bash
   # On Linux/Mac:
   lsof -ti:3000 | xargs kill -9
   lsof -ti:5432 | xargs kill -9
   
   # On Windows (PowerShell):
   Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
   ```
2. **Stop conflicting containers**:
   ```bash
   docker ps
   docker stop <container-name>
   ```

### Dependencies Not Installing

**Problem**: `pnpm install` fails or packages are missing

**Solutions**:
1. **Clear pnpm cache**:
   ```bash
   pnpm store prune
   rm -rf node_modules
   pnpm install
   ```
2. **Use correct Node version**:
   ```bash
   node --version  # Should be 20.x
   ```
3. **Rebuild container with no cache**:
   - `F1` → `Dev Containers: Rebuild Container Without Cache`

### File Permissions Issues

**Problem**: "Permission denied" when running commands

**Solutions**:
1. The devcontainer runs as user `node`, not `root`
2. Files are mounted with cached mode for performance
3. If you need to modify file permissions:
   ```bash
   # Inside container:
   sudo chown -R node:node /workspace
   ```

## Advanced Configuration

### Custom Database Configuration

If you need to change the default PostgreSQL password:

1. **Edit `docker-compose.yml`**:
   ```yaml
   environment:
     POSTGRES_PASSWORD: your_password_here
   ```

2. **Edit `.devcontainer/devcontainer.json`**:
   ```json
   "containerEnv": {
     "DATABASE_URL": "postgresql://postgres:your_password_here@postgres:5432/compliant_dev"
   }
   ```

3. **Rebuild container**: `F1` → `Dev Containers: Rebuild Container`

### Adding Custom Environment Variables

1. **Edit `.devcontainer/devcontainer.json`**:
   ```json
   "containerEnv": {
     "DATABASE_URL": "...",
     "YOUR_CUSTOM_VAR": "value"
   }
   ```

2. **Or edit packages/backend/.env** directly inside the container

### Modifying Post-Start Script

Edit `.devcontainer/postStart.sh` to customize what happens after the container starts.

## Support

For more help:
- **Project README**: [README.md](../README.md)
- **Database Setup**: [README.md#database-setup](../README.md#database-setup)
- **Testing Guide**: [docs/TESTING_GUIDE.md](./TESTING_GUIDE.md)
- **Implementation Guide**: [docs/IMPLEMENTATION_GUIDELINES.md](./IMPLEMENTATION_GUIDELINES.md)

## Quick Reference

### Essential Commands

```bash
# Development
pnpm dev                    # Start all services
pnpm backend               # Backend only
pnpm frontend              # Frontend only

# Database
pnpm db:push               # Push schema
pnpm db:studio             # Open GUI
pnpm -C packages/backend db:seed  # Seed data

# Quality
pnpm lint                  # Lint code
pnpm test                  # Run tests
pnpm build                 # Build all

# Container
F1 → "Dev Containers: Rebuild Container"
F1 → "Dev Containers: Reopen Folder Locally"
```

### PostgreSQL Quick Access

```bash
# Connect to database
docker exec -it compliant-postgres psql -U postgres -d compliant_dev

# Check if running
docker ps | grep postgres

# View logs
docker logs compliant-postgres

# Restart
docker restart compliant-postgres
```
