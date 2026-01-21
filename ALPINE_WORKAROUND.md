# Alpine Linux + Prisma Workaround

## Current Issue
The Codespace is running Alpine Linux 3.22, which uses OpenSSL 3.x. Prisma's binary engines are currently compiled against OpenSSL 1.1.x and cannot load the required symbols (`SSL_get_peer_certificate`).

## Status
- ✅ **Frontend**: Fully operational on http://localhost:3000
- ✅ **PostgreSQL**: Running on localhost:5432 (no password required)
- ✅ **Email**: Configured via SMTP (Office 365)
- ⚠️ **Backend API**: Compiles successfully but Prisma runtime fails

## Testing Options

### Option 1: Frontend Testing (Available Now)
The frontend is fully operational and can be tested at http://localhost:3000. It will show connection errors when trying to reach the backend API.

### Option 2: Fix Prisma (Recommended)
Rebuild the Codespace with a Debian-based image that has proper OpenSSL compatibility:

1. Update `.devcontainer/devcontainer.json` to use Debian:
```json
{
  "image": "mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye"
}
```

2. Rebuild the container: Command Palette → "Codespaces: Rebuild Container"

### Option 3: Use Prisma Accelerate
Configure Prisma to use a cloud-based query engine that doesn't require local binaries.

## Quick Fix Attempt
If you have sudo access, try:
```bash
sudo apk add openssl1.1-compat
```

Note: This package doesn't exist in Alpine 3.22, but may work in other versions.

## Current Configuration
- Prisma: 5.22.0
- Binary Target: `linux-musl-openssl-3.0.x`
- Node: 22.16.0
- Environment: Alpine Linux 3.22
