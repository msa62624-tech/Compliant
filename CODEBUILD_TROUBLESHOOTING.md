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
- Optionally start a test build

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
