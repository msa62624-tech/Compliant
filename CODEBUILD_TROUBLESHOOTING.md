# CodeBuild Troubleshooting - Quick Reference

## Error: "reference not found for primary source"

### ⚡ Automated Fix (Recommended)

Run the automated fix script:

```bash
./scripts/fix-codebuild-source.sh
```

This interactive script will:
- Check if your AWS CLI is configured
- Verify your CodeBuild project exists
- Update the source version to `refs/heads/main`
- Check and optionally configure DATABASE_URL environment variable
- Optionally start a test build

**For environment variables only:**

```bash
./scripts/setup-codebuild-env-vars.sh
```

This script helps configure required environment variables like DATABASE_URL.

### 📋 Setup Instructions for Webhook-Connected CodeBuild

If you've connected CodeBuild via webhook (for automatic builds on push/PR):

**Step 1: Fix the Source Reference**

```bash
# Run the fix script
./scripts/fix-codebuild-source.sh

# When prompted:
# - Enter your project name (e.g., compliant-build)
# - Confirm source version: refs/heads/main
# - Say 'y' to configure DATABASE_URL if prompted
```

**Step 2: Configure Environment Variables**

The build requires `DATABASE_URL` for Prisma Client generation:

```bash
# Option A: Use the automated script
./scripts/setup-codebuild-env-vars.sh

# When prompted:
# - Enter your project name
# - Choose option 1 (DATABASE_URL)
# - Choose option 1 (use placeholder for builds)
```

**Option B: Manual setup via AWS Console:**

1. Go to [AWS CodeBuild Console](https://console.aws.amazon.com/codebuild/)
2. Select your project (e.g., "compliant-build")
3. Click **Edit** → **Environment**
4. Scroll to **Environment variables**
5. Click **Add environment variable**
6. Set:
   - **Name**: `DATABASE_URL`
   - **Value**: `postgresql://user:pass@localhost:5432/dbname`
   - **Type**: `Plaintext`
7. Click **Update environment**

**Step 3: Test the Webhook**

Trigger a build by pushing to your repository:

```bash
git commit --allow-empty -m "Test CodeBuild webhook"
git push origin main
```

Or manually start a build:

```bash
aws codebuild start-build --project-name YOUR_PROJECT_NAME
```

**Step 4: Monitor the Build**

Check the build status in:
- AWS CodeBuild Console: [View builds](https://console.aws.amazon.com/codebuild/)
- CloudWatch Logs: Look for `/aws/codebuild/YOUR_PROJECT_NAME`

### Quick Fix Commands

```bash
# Check what branches exist in the repository
git ls-remote --heads https://github.com/hml-brokerage/compliant-.git

# Expected output should include refs/heads/main
```

### Recommended: Use Infrastructure as Code (IaC) Templates

The best way to set up CodeBuild correctly from the start is to use our IaC templates:

- **CloudFormation**: `cloudformation-codebuild.yaml`
- **Terraform**: `terraform-codebuild.tf`

See [IaC-README.md](./IaC-README.md) for deployment instructions.

### AWS Console Fix (Fastest)

1. Go to [AWS CodeBuild Console](https://console.aws.amazon.com/codebuild/)
2. Find your project (e.g., "compliant-build" or similar)
3. Click **Edit** → **Source**
4. Update **Source version** to: `refs/heads/main`
5. Click **Update source**
6. Click **Start build** to test

### AWS CLI Fix

```bash
# Get your project name
aws codebuild list-projects

# Update the source version to point to main branch
aws codebuild update-project \
  --name YOUR_PROJECT_NAME \
  --source-version refs/heads/main

# Test the build
aws codebuild start-build --project-name YOUR_PROJECT_NAME
```

### Root Cause

The error happens because:
- CodeBuild tries to checkout a git reference (branch/tag/commit) that doesn't exist
- This happens BEFORE buildspec.yml is read
- Usually means the project is configured to use a non-existent branch

### Prevention

**When creating new CodeBuild projects:**
- Always use `refs/heads/main` as the source version
- For PR builds, leave source version empty (it uses the PR branch automatically)
- Verify the branch exists before configuring

**When using Infrastructure as Code:**

**Recommended Approach**: Use our pre-configured IaC templates (see [IaC-README.md](../IaC-README.md)):

CloudFormation (`cloudformation-codebuild.yaml`):
```yaml
SourceVersion: refs/heads/main
```

Terraform (`terraform-codebuild.tf`):
```hcl
source_version = "refs/heads/main"
```

### Need More Help?

See the complete guide: [docs/AWS_CODEBUILD_SETUP.md](./docs/AWS_CODEBUILD_SETUP.md)
