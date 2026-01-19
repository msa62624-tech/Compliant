# Shared Package

Shared TypeScript types, validators, and constants used across the monorepo.

## Usage

```typescript
import { User, createUserSchema, API_PREFIX } from '@compliant/shared';
```

## Contents

- **types/** - TypeScript interfaces and types
- **validators/** - Zod validation schemas
- **constants/** - Shared constants and configurations

## Deployment

**⚠️ Critical for Deployment**: This package must be built **before** building the backend or frontend packages.

### Build Command

```bash
pnpm build
```

This generates the `dist/` folder with:
- Compiled JavaScript files (`.js`)
- TypeScript declaration files (`.d.ts`)
- Source maps

### In CI/CD

The shared package is automatically built first in deployment workflows:

```yaml
- name: Build shared package
  run: cd packages/shared && pnpm build
```

### Verification

Check that the build succeeded:

```bash
# Verify dist folder exists
ls -la dist/

# Test package import
node -e "console.log(require('./dist/index.js'))"
```

For complete deployment instructions, see [../../docs/DEPLOYMENT.md](../../docs/DEPLOYMENT.md).
