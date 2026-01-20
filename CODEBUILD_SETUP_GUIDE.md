# AWS CodeBuild Setup and Troubleshooting Guide

Complete guide for setting up, configuring, and troubleshooting AWS CodeBuild for this project.

---

## Quick Start

### ⚡ Automated Setup (Recommended)

Use the automated scripts to set up CodeBuild quickly:

```bash
# Fix common source reference issues
./scripts/fix-codebuild-source.sh

# Configure environment variables
./scripts/setup-codebuild-env-vars.sh
```

### 📋 Infrastructure as Code Templates

Deploy CodeBuild infrastructure using:
- **CloudFormation**: `cloudformation-codebuild.yaml`
- **Terraform**: `terraform-codebuild.tf`

See [IaC-README.md](./IaC-README.md) for detailed deployment instructions.

---

## Configuration Checklist

### 1. Source Configuration ✅

**Source Version** (CRITICAL):
- Must be set to: `refs/heads/main`
- **Not** `main`, `master`, or empty

**Verify:**
```bash
aws codebuild batch-get-projects --names YOUR_PROJECT_NAME \
  --query 'projects[0].sourceVersion' --output text
```

**Expected Output:** `refs/heads/main`

**Fix if incorrect:**
```bash
./scripts/fix-codebuild-source.sh
# Or manually:
aws codebuild update-project \
  --name YOUR_PROJECT_NAME \
  --source-version refs/heads/main
```

---

### 2. Repository Settings ✅

**Repository URL:**
```bash
aws codebuild batch-get-projects --names YOUR_PROJECT_NAME \
  --query 'projects[0].source.location' --output text
```

**Expected:** `https://github.com/hml-brokerage/compliant-`

**Auth Type:**
```bash
aws codebuild batch-get-projects --names YOUR_PROJECT_NAME \
  --query 'projects[0].source.auth.type' --output text
```

**Expected:** `OAUTH`

---

### 3. Environment Variables ✅

**Required: DATABASE_URL**

The build requires `DATABASE_URL` for Prisma Client generation:

```bash
# Automated setup:
./scripts/setup-codebuild-env-vars.sh

# Manual verification:
aws codebuild batch-get-projects --names YOUR_PROJECT_NAME \
  --query 'projects[0].environment.environmentVariables[?name==`DATABASE_URL`]' --output table
```

**Correct Format:**
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
```

**Note:** For build-only purposes, a placeholder value is sufficient since the actual database is not accessed during build.

**Manual Setup via AWS Console:**
1. Go to [AWS CodeBuild Console](https://console.aws.amazon.com/codebuild/)
2. Select your project
3. Click **Edit** → **Environment**
4. Scroll to **Environment variables**
5. Click **Add environment variable**
6. Set:
   - **Name**: `DATABASE_URL`
   - **Value**: `postgresql://user:pass@localhost:5432/dbname`
   - **Type**: `Plaintext` (or `PARAMETER_STORE`/`SECRETS_MANAGER` for production)
7. Click **Update environment**

---

### 4. Build Environment ✅

**Compute Type:**
```bash
aws codebuild batch-get-projects --names YOUR_PROJECT_NAME \
  --query 'projects[0].environment.computeType' --output text
```

**Recommended:** `BUILD_GENERAL1_MEDIUM` or higher

**Docker Image:**
```bash
aws codebuild batch-get-projects --names YOUR_PROJECT_NAME \
  --query 'projects[0].environment.image' --output text
```

**Recommended:** `aws/codebuild/standard:7.0` (includes Node.js 20)

---

### 5. Webhook Configuration ✅

**For automatic builds on push/PR:**

```bash
# Check if webhook exists:
aws codebuild batch-get-projects --names YOUR_PROJECT_NAME \
  --query 'projects[0].webhook.url' --output text
```

**Expected:** A webhook URL (not empty/None)

**Filter Groups:**
```bash
aws codebuild batch-get-projects --names YOUR_PROJECT_NAME \
  --query 'projects[0].webhook.filterGroups' --output json
```

**Typical Configuration:**
- Trigger on: `PUSH` events to `main` branch
- Trigger on: `PULL_REQUEST_CREATED`, `PULL_REQUEST_UPDATED`

---

### 6. IAM Permissions ✅

**Service Role Requirements:**
- CloudWatch Logs (create log groups, streams, put events)
- S3 (put/get objects for artifacts)
- Source repository access (via OAuth)

```bash
aws codebuild batch-get-projects --names YOUR_PROJECT_NAME \
  --query 'projects[0].serviceRole' --output text
```

---

## Common Issues and Solutions

### Issue 1: "reference not found for primary source"

**Cause:** `sourceVersion` is not set to correct branch reference.

**Solution:**
```bash
# Automated fix:
./scripts/fix-codebuild-source.sh

# Manual fix:
aws codebuild update-project \
  --name YOUR_PROJECT_NAME \
  --source-version refs/heads/main
```

---

### Issue 2: Prisma Client Generation Fails

**Error Message:** `Error: DATABASE_URL environment variable is not set`

**Cause:** DATABASE_URL environment variable not configured.

**Solution:**
```bash
# Automated setup:
./scripts/setup-codebuild-env-vars.sh

# Or manually add via AWS Console (see Section 3 above)
```

---

### Issue 3: Build Hangs or Times Out

**Possible Causes:**
- Insufficient compute resources
- Memory issues during builds
- Network/dependency download issues

**Solutions:**
1. Increase compute type to `BUILD_GENERAL1_LARGE`
2. Check buildspec.yml for memory-intensive operations
3. Consider using build caching

---

### Issue 4: pnpm Not Found

**Cause:** Build image doesn't have pnpm installed, or using old image.

**Solution:**
1. Ensure image is `aws/codebuild/standard:7.0` or higher
2. The buildspec.yml includes pnpm installation:
   ```yaml
   install:
     commands:
       - npm install -g pnpm@8.15.0
   ```

---

## Testing Your Configuration

### Step 1: Trigger a Manual Build

```bash
aws codebuild start-build --project-name YOUR_PROJECT_NAME
```

### Step 2: Watch Build Progress

```bash
# Get the latest build ID
BUILD_ID=$(aws codebuild list-builds-for-project \
  --project-name YOUR_PROJECT_NAME \
  --query 'ids[0]' --output text)

# Check build status
aws codebuild batch-get-builds --ids $BUILD_ID \
  --query 'builds[0].buildStatus' --output text
```

### Step 3: Test Webhook (for automatic builds)

```bash
# Make an empty commit to trigger the webhook
git commit --allow-empty -m "Test CodeBuild webhook"
git push origin main
```

---

## Verification Commands Reference

**Complete Configuration Check:**
```bash
PROJECT_NAME="YOUR_PROJECT_NAME"

echo "=== Source Configuration ==="
aws codebuild batch-get-projects --names $PROJECT_NAME \
  --query 'projects[0].{SourceVersion:sourceVersion,Location:source.location,Auth:source.auth.type}' \
  --output table

echo "=== Environment ==="
aws codebuild batch-get-projects --names $PROJECT_NAME \
  --query 'projects[0].environment.{ComputeType:computeType,Image:image}' \
  --output table

echo "=== Environment Variables ==="
aws codebuild batch-get-projects --names $PROJECT_NAME \
  --query 'projects[0].environment.environmentVariables[*].{Name:name,Value:value}' \
  --output table

echo "=== Webhook ==="
aws codebuild batch-get-projects --names $PROJECT_NAME \
  --query 'projects[0].webhook.url' \
  --output text
```

---

## Additional Resources

- **AWS CodeBuild Documentation**: https://docs.aws.amazon.com/codebuild/
- **Build Specification Reference**: https://docs.aws.amazon.com/codebuild/latest/userguide/build-spec-ref.html
- **IaC Templates**: See `IaC-README.md` for CloudFormation and Terraform setup
- **Complete AWS Setup Guide**: See `docs/AWS_CODEBUILD_SETUP.md`

---

## Support

If you encounter issues not covered in this guide:
1. Check CloudWatch Logs for detailed error messages
2. Review the buildspec.yml file for configuration errors
3. Verify IAM permissions for the CodeBuild service role
4. Consult the complete setup guide in `docs/AWS_CODEBUILD_SETUP.md`
