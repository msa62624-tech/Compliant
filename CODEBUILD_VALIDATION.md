# CodeBuild Configuration Validation Checklist

This document helps you verify that your CodeBuild project is correctly configured.

## ✅ Pre-Flight Checklist

### 1. Source Configuration

- [ ] **Source Version**: Set to `refs/heads/main`
  ```bash
  aws codebuild batch-get-projects --names YOUR_PROJECT_NAME \
    --query 'projects[0].sourceVersion' --output text
  ```
  Expected: `refs/heads/main`

- [ ] **Repository URL**: Correct GitHub repository
  ```bash
  aws codebuild batch-get-projects --names YOUR_PROJECT_NAME \
    --query 'projects[0].source.location' --output text
  ```
  Expected: `https://github.com/hml-brokerage/compliant-` (Note: Repository name ends with hyphen)

- [ ] **Auth Type**: OAUTH configured
  ```bash
  aws codebuild batch-get-projects --names YOUR_PROJECT_NAME \
    --query 'projects[0].source.auth.type' --output text
  ```
  Expected: `OAUTH`

### 2. Environment Variables

- [ ] **DATABASE_URL**: Required for Prisma Client generation
  ```bash
  aws codebuild batch-get-projects --names YOUR_PROJECT_NAME \
    --query 'projects[0].environment.environmentVariables[?name==`DATABASE_URL`]' --output table
  ```
  Expected: Should show DATABASE_URL with a value (placeholder or actual connection string)

  **Correct value format**: `postgresql://user:pass@localhost:5432/dbname`

### 3. Build Environment

- [ ] **Compute Type**: BUILD_GENERAL1_MEDIUM (or higher)
  ```bash
  aws codebuild batch-get-projects --names YOUR_PROJECT_NAME \
    --query 'projects[0].environment.computeType' --output text
  ```

- [ ] **Image**: aws/codebuild/standard:7.0 (Node.js 20 support)
  ```bash
  aws codebuild batch-get-projects --names YOUR_PROJECT_NAME \
    --query 'projects[0].environment.image' --output text
  ```

### 4. Webhook Configuration (for automatic builds)

- [ ] **Webhook Enabled**: Should be true
  ```bash
  aws codebuild batch-get-projects --names YOUR_PROJECT_NAME \
    --query 'projects[0].webhook.url' --output text
  ```
  Expected: A webhook URL (not empty/None)

- [ ] **Filter Groups**: Configured for PR and push events
  ```bash
  aws codebuild batch-get-projects --names YOUR_PROJECT_NAME \
    --query 'projects[0].webhook.filterGroups' --output json
  ```

### 5. Buildspec Configuration

- [ ] **Buildspec File**: Located at repository root as `buildspec.yml`
  ```bash
  ls -la buildspec.yml
  ```

- [ ] **Build Script**: Contains correct pnpm commands
  ```bash
  grep "pnpm build" buildspec.yml
  ```

### 6. IAM Permissions

- [ ] **Service Role**: CodeBuild has permissions for:
  - CloudWatch Logs (create log groups, streams, put events)
  - S3 (put/get objects for artifacts)
  - Source repository access (via OAuth)

  ```bash
  aws codebuild batch-get-projects --names YOUR_PROJECT_NAME \
    --query 'projects[0].serviceRole' --output text
  ```

## 🔧 Quick Fix Commands

### Fix Source Version Issue
```bash
./scripts/fix-codebuild-source.sh
```

### Configure Environment Variables
```bash
./scripts/setup-codebuild-env-vars.sh
```

### Manual Verification via AWS CLI
```bash
# Get complete project configuration
aws codebuild batch-get-projects --names YOUR_PROJECT_NAME --output json > codebuild-config.json

# Check specific settings
cat codebuild-config.json | jq '.projects[0] | {
  name: .name,
  sourceVersion: .sourceVersion,
  source: .source.location,
  auth: .source.auth.type,
  environmentVariables: .environment.environmentVariables,
  webhookUrl: .webhook.url
}'
```

## 🧪 Test Your Configuration

### Test 1: Manual Build
```bash
# Start a manual build
BUILD_ID=$(aws codebuild start-build --project-name YOUR_PROJECT_NAME --query 'build.id' --output text)
echo "Build started: $BUILD_ID"

# Wait a few seconds, then check status
sleep 10
aws codebuild batch-get-builds --ids $BUILD_ID --query 'builds[0].buildStatus' --output text
```

### Test 2: Webhook Build (Push to Repository)
```bash
# Make an empty commit to trigger webhook
git commit --allow-empty -m "Test CodeBuild webhook"
git push origin main
```

### Test 3: Check Build Logs
```bash
# Get the latest build
BUILD_ID=$(aws codebuild list-builds-for-project --project-name YOUR_PROJECT_NAME --query 'ids[0]' --output text)

# Stream the logs
aws logs tail /aws/codebuild/YOUR_PROJECT_NAME --follow
```

## 🐛 Common Issues and Solutions

### Issue 1: "reference not found for primary source"
**Cause**: Source version not set or points to non-existent branch

**Solution**:
```bash
aws codebuild update-project \
  --name YOUR_PROJECT_NAME \
  --source-version refs/heads/main
```

### Issue 2: "DATABASE_URL is not defined"
**Cause**: Environment variable not configured

**Solution**: Run `./scripts/setup-codebuild-env-vars.sh` or:
```bash
# Using AWS CLI (requires jq)
aws codebuild batch-get-projects --names YOUR_PROJECT_NAME \
  --query 'projects[0].environment' --output json > env.json

cat env.json | jq '.environmentVariables += [{"name":"DATABASE_URL","value":"postgresql://user:pass@localhost:5432/dbname","type":"PLAINTEXT"}]' > updated-env.json

aws codebuild update-project \
  --name YOUR_PROJECT_NAME \
  --environment file://updated-env.json
```

### Issue 3: Build times out or fails during pnpm install
**Cause**: Insufficient compute resources or cache not configured

**Solution**:
- Increase compute type to BUILD_GENERAL1_LARGE
- Enable caching:
  ```bash
  aws codebuild update-project \
    --name YOUR_PROJECT_NAME \
    --cache type=LOCAL,modes=LOCAL_SOURCE_CACHE,LOCAL_CUSTOM_CACHE
  ```

### Issue 4: Prisma Client generation fails
**Cause**: DATABASE_URL format incorrect or missing

**Solution**: Ensure DATABASE_URL follows this exact format:
```
postgresql://user:pass@localhost:5432/dbname
```

The user/pass/host/port can be placeholders - Prisma just needs a valid connection string format for client generation (actual DB connection is not needed for builds).

## 📋 Expected Build Output

A successful build should show:

1. **Install Phase**:
   - Node.js 20 runtime loaded
   - pnpm installed globally
   - Environment info displayed

2. **Pre-Build Phase**:
   - `pnpm install --frozen-lockfile` completes successfully
   - All dependencies installed

3. **Build Phase**:
   - DATABASE_URL set (from environment or fallback)
   - Prisma Client generated
   - All packages built via turbo:
     - `packages/shared` → TypeScript compiled to `dist/`
     - `packages/backend` → NestJS built to `dist/`
     - `packages/frontend` → Next.js built to `.next/`

4. **Artifacts**:
   - Uploaded to S3:
     - `packages/*/dist/**/*`
     - `packages/*/.next/**/*` (excluding cache)

## 🔒 Security Best Practices

- [ ] **Never commit real DATABASE_URL**: Use placeholder for builds
- [ ] **Use AWS Secrets Manager**: For production database credentials
- [ ] **Enable S3 encryption**: For artifact storage (enabled by default in templates)
- [ ] **Restrict IAM permissions**: Service role should follow least-privilege principle
- [ ] **Use OAuth for GitHub**: Instead of personal access tokens

## 📚 Additional Resources

- [buildspec.yml](../buildspec.yml) - Build specification
- [IaC-README.md](../IaC-README.md) - Infrastructure as Code templates
- [CODEBUILD_TROUBLESHOOTING.md](../CODEBUILD_TROUBLESHOOTING.md) - Quick troubleshooting guide
- [AWS CodeBuild Documentation](https://docs.aws.amazon.com/codebuild/)

## ✅ Final Verification

Run all checks at once:

```bash
#!/bin/bash
PROJECT_NAME="YOUR_PROJECT_NAME"

echo "=== CodeBuild Configuration Check ==="
echo ""

echo "1. Source Version:"
aws codebuild batch-get-projects --names $PROJECT_NAME --query 'projects[0].sourceVersion' --output text

echo ""
echo "2. DATABASE_URL configured:"
aws codebuild batch-get-projects --names $PROJECT_NAME --query 'projects[0].environment.environmentVariables[?name==`DATABASE_URL`].name' --output text

echo ""
echo "3. Webhook enabled:"
aws codebuild batch-get-projects --names $PROJECT_NAME --query 'projects[0].webhook.url' --output text | grep -q "http" && echo "Yes" || echo "No"

echo ""
echo "4. Build image:"
aws codebuild batch-get-projects --names $PROJECT_NAME --query 'projects[0].environment.image' --output text

echo ""
echo "=== Starting test build ==="
BUILD_ID=$(aws codebuild start-build --project-name $PROJECT_NAME --query 'build.id' --output text)
echo "Build ID: $BUILD_ID"
echo ""
echo "Monitor in console: https://console.aws.amazon.com/codebuild/"
echo "View logs: aws logs tail /aws/codebuild/$PROJECT_NAME --follow"
```

Save as `verify-codebuild.sh`, make executable with `chmod +x verify-codebuild.sh`, and run it.
