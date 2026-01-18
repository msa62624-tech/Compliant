# Docker Security Best Practices

This document outlines the security best practices implemented in this project's Docker configurations.

## 🔒 Security Fix: Secret Leakage Prevention

### The Problem

The original `security-scan.yml` workflow contained a critical security vulnerability:

```dockerfile
# ❌ INSECURE - DO NOT USE
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY pnpm-*.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY . .  # ⚠️ COPIES ALL FILES INCLUDING SECRETS!
```

**Risk**: The `COPY . .` command copies **all files** in the repository, including:
- `.env` files with database credentials
- `.env.production` with production secrets
- Private keys and certificates
- API tokens and passwords
- Any other sensitive configuration files

Even with `.gitignore`, these files can exist locally and get copied into the Docker image, where they can be extracted by anyone with access to the image.

### The Solution

We implemented a multi-stage Docker build with explicit file copying:

```dockerfile
# ✅ SECURE - RECOMMENDED APPROACH
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
RUN apk add --no-cache postgresql-client python3 make g++
RUN npm install -g pnpm@8.15.0

# Copy only dependency manifests (layer caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/

# Install dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy ONLY necessary application files (explicit list)
COPY packages/backend/src ./packages/backend/src
COPY packages/backend/prisma ./packages/backend/prisma
COPY packages/backend/tsconfig*.json ./packages/backend/
COPY packages/frontend/src ./packages/frontend/src
COPY packages/frontend/public ./packages/frontend/public
# ... (explicit file copying)

# Build
RUN pnpm build

# Production stage - minimal image
FROM node:20-alpine AS production
WORKDIR /app

# Copy only built artifacts (no source, no secrets)
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/frontend/.next ./packages/frontend/.next
# ... (only production files)

# Non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000 3001
```

---

## 🛡️ Defense in Depth

### 1. .dockerignore File

The `.dockerignore` file provides the first line of defense:

```dockerignore
# Environment files (may contain secrets)
.env
.env.*
*.env
.env.local
.env.production

# Git directory
.git
.github

# Node modules
node_modules

# Build outputs
dist
build
.next

# Sensitive files
*.key
*.pem
*.crt
secrets/
```

**Benefits**:
- Prevents accidental copying of sensitive files
- Reduces image size
- Faster builds (fewer files to copy)
- Works even with `COPY . .` (but still not recommended)

### 2. Multi-Stage Builds

Multi-stage builds separate build-time and runtime:

**Stage 1: Builder**
- Has build tools (compilers, dev dependencies)
- Contains source code
- Larger size
- NOT used in production

**Stage 2: Production**
- Minimal runtime dependencies
- Only built artifacts
- Smaller size
- Runs in production

**Benefits**:
- Build artifacts are isolated from source code
- Secrets in build stage don't reach production stage
- Smaller production images
- Reduced attack surface

### 3. Explicit File Copying

Instead of `COPY . .`, we explicitly list each file/directory:

```dockerfile
# ✅ Explicit - you control what goes in
COPY packages/backend/src ./packages/backend/src
COPY packages/backend/prisma ./packages/backend/prisma

# ❌ Wildcard - you might copy secrets accidentally
COPY . .
```

**Benefits**:
- Clear visibility of what's in the image
- Prevents accidental secret inclusion
- Forces developers to think about each file
- Easier security audits

### 4. Non-Root User

Always run containers as non-root:

```dockerfile
# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs
```

**Benefits**:
- Limits damage from container escape
- Follows principle of least privilege
- Required by many security policies
- Best practice for production

---

## 🔍 Verification

### Check Image for Secrets

```bash
# Build the image
docker build -f Dockerfile.scan -t compliant-app:scan .

# Check for environment files
docker run --rm compliant-app:scan find / -name "*.env*" 2>/dev/null

# Check for common secret patterns
docker run --rm compliant-app:scan sh -c "find / -type f -name '*secret*' -o -name '*key*' -o -name '*.pem'" 2>/dev/null

# Use dive to inspect layers
dive compliant-app:scan
```

### Scan for Secrets

```bash
# Use Trivy to scan for secrets
trivy image --scanners secret compliant-app:scan

# Use Grype
grype compliant-app:scan

# Manual inspection
docker history compliant-app:scan
```

---

## 📋 Checklist: Building Secure Docker Images

### Before Building

- [ ] Review all `COPY` commands
- [ ] Ensure `.dockerignore` is comprehensive
- [ ] Remove any hardcoded secrets from Dockerfile
- [ ] Use build arguments for configuration (not secrets)

### During Build

- [ ] Use multi-stage builds
- [ ] Copy only necessary files explicitly
- [ ] Never use `COPY . .` in production images
- [ ] Install only production dependencies in final stage
- [ ] Create and use non-root user

### After Building

- [ ] Scan image with Trivy
- [ ] Scan image with Grype
- [ ] Check image with Dockle
- [ ] Inspect image layers with dive
- [ ] Verify no secrets in image

### In CI/CD

- [ ] Automated security scanning
- [ ] SBOM generation
- [ ] Fail build on critical vulnerabilities
- [ ] Upload results to security dashboard

---

## 🚨 Common Pitfalls

### Pitfall 1: Secrets in Build Arguments

```dockerfile
# ❌ INSECURE - Build args are visible in image history
ARG DATABASE_PASSWORD
RUN echo "DB_PASS=${DATABASE_PASSWORD}" > config.txt
```

**Solution**: Use runtime secrets or secret managers
```dockerfile
# ✅ Use runtime environment variables
ENV DATABASE_PASSWORD_FILE=/run/secrets/db_password
```

### Pitfall 2: Secrets in Layer History

```dockerfile
# ❌ Secret remains in layer even after deletion
COPY .env /app/.env
RUN process-config
RUN rm /app/.env  # Too late! Secret is in previous layer
```

**Solution**: Never copy secrets into image
```dockerfile
# ✅ Mount secrets at runtime
# docker run -v /path/to/secrets:/run/secrets:ro app
```

### Pitfall 3: Overly Permissive .dockerignore

```dockerignore
# ❌ Too broad - might not catch all secrets
*.log
*.tmp
```

**Solution**: Explicitly list all sensitive patterns
```dockerignore
# ✅ Comprehensive
.env*
*.key
*.pem
secrets/
credentials/
```

### Pitfall 4: Root User

```dockerfile
# ❌ Running as root
FROM node:20-alpine
WORKDIR /app
COPY . .
CMD ["node", "server.js"]  # Runs as root!
```

**Solution**: Always create and use non-root user
```dockerfile
# ✅ Non-root user
FROM node:20-alpine
WORKDIR /app
COPY --chown=node:node . .
USER node
CMD ["node", "server.js"]
```

---

## 🔧 Tools and Resources

### Security Scanning Tools

1. **Trivy** - Comprehensive vulnerability scanner
   ```bash
   trivy image --severity CRITICAL,HIGH myimage:tag
   ```

2. **Grype** - Vulnerability scanner by Anchore
   ```bash
   grype myimage:tag --fail-on high
   ```

3. **Dockle** - Container linter for security best practices
   ```bash
   dockle myimage:tag
   ```

4. **Dive** - Layer analysis tool
   ```bash
   dive myimage:tag
   ```

5. **Snyk** - Vulnerability and license scanning
   ```bash
   snyk container test myimage:tag
   ```

### Secret Detection

1. **git-secrets** - Prevent committing secrets
   ```bash
   git secrets --scan
   ```

2. **TruffleHog** - Find secrets in git history
   ```bash
   trufflehog git file://.
   ```

3. **detect-secrets** - Prevent secrets in commits
   ```bash
   detect-secrets scan
   ```

### Best Practice Guides

- [OWASP Docker Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html)
- [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker)
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)
- [NIST Container Security Guide](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-190.pdf)

---

## 📊 Security Scanning in CI/CD

Our workflows implement comprehensive security scanning:

### Container Security Workflow

```yaml
# .github/workflows/security-scan.yml
- Trivy vulnerability scanning
- Trivy secret detection
- Trivy configuration scanning
- Grype vulnerability scanning
- Dockle best practices checking
- SBOM generation (CycloneDX)
- SARIF upload to GitHub Security
```

### Severity Handling

| Severity | Action |
|----------|--------|
| CRITICAL | Fail build, immediate fix required |
| HIGH | Warn, fix before production |
| MEDIUM | Log, plan fix |
| LOW | Informational only |

### Automatic Remediation

1. **Dependabot**: Automatic dependency updates
2. **Renovate**: Alternative dependency management
3. **Snyk**: Automated fix PRs

---

## 🎯 Implementation Status

### ✅ Implemented

- [x] .dockerignore file
- [x] Multi-stage Docker builds
- [x] Explicit file copying
- [x] Non-root user
- [x] Trivy scanning
- [x] Grype scanning
- [x] Dockle validation
- [x] SBOM generation
- [x] Secret scanning
- [x] CI/CD integration

### 🎯 Recommended Next Steps

- [ ] Runtime secret management (HashiCorp Vault, AWS Secrets Manager)
- [ ] Image signing (Cosign, Notary)
- [ ] Runtime security (Falco, Sysdig)
- [ ] Policy enforcement (OPA, Kyverno)
- [ ] Registry scanning (Harbor, Quay)

---

## 📞 Support

For security concerns or questions:

1. **Security Issues**: Report via GitHub Security Advisories
2. **General Questions**: Open a GitHub Discussion
3. **Urgent Security**: Contact security team directly

---

## 🔄 Document Updates

This document should be reviewed and updated:
- When new security tools are added
- When Docker configurations change
- After security incidents
- Quarterly security reviews

Last updated: 2026-01-18
