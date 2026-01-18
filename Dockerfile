# Multi-stage Dockerfile for Compliant Platform
# This Dockerfile builds both backend and frontend for production deployment

FROM node:20-alpine AS builder

WORKDIR /app

# Install system dependencies for building native modules
# postgresql-client is NOT needed for build, only for runtime
RUN for i in 1 2 3; do apk update && break || sleep 5; done && \
    apk add --no-cache python3 make g++

# Install pnpm
RUN npm install -g pnpm@8.15.0

# Copy dependency manifests first (better layer caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy application source code
COPY packages/backend/src ./packages/backend/src
COPY packages/backend/prisma ./packages/backend/prisma
COPY packages/backend/tsconfig*.json ./packages/backend/
COPY packages/backend/nest-cli.json ./packages/backend/
COPY packages/frontend/app ./packages/frontend/app
COPY packages/frontend/components ./packages/frontend/components
COPY packages/frontend/lib ./packages/frontend/lib
COPY packages/frontend/public ./packages/frontend/public
COPY packages/frontend/next.config.js ./packages/frontend/
COPY packages/frontend/tsconfig*.json ./packages/frontend/
COPY packages/frontend/tailwind.config.js ./packages/frontend/
COPY packages/frontend/postcss.config.js ./packages/frontend/
COPY packages/shared/src ./packages/shared/src
COPY packages/shared/tsconfig*.json ./packages/shared/
COPY turbo.json tsconfig.json ./

# Generate Prisma client before building
RUN cd packages/backend && pnpm db:generate

# Build the application
RUN pnpm build

# Production stage - minimal image without dev dependencies
FROM node:20-alpine AS production

WORKDIR /app

# Install runtime dependencies
# Note: Prisma Client doesn't require postgresql-client binaries
# They're only useful for manual database operations/debugging
# Security: Install only if absolutely needed for production operations
RUN apk update && \
    apk add --no-cache ca-certificates && \
    rm -rf /var/cache/apk/*

# Install pnpm
RUN npm install -g pnpm@8.15.0

# Copy dependency manifests
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages/backend/package.json ./packages/backend/
COPY --from=builder /app/packages/frontend/package.json ./packages/frontend/
COPY --from=builder /app/packages/shared/package.json ./packages/shared/

# Copy Prisma schema BEFORE installing dependencies
# This ensures the schema is available when Prisma's postinstall runs
COPY --from=builder /app/packages/backend/prisma ./packages/backend/prisma

# Install production dependencies only
# Prisma will automatically generate the client during postinstall
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/frontend/.next ./packages/frontend/.next
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Set production environment
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Add healthcheck for container orchestration
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health/liveness', {headers: {'X-API-Version': '1'}}, (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Expose ports for backend and frontend
EXPOSE 3000 3001

# Default command runs the backend
CMD ["node", "packages/backend/dist/main.js"]
