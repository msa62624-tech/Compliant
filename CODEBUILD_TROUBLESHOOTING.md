# CodeBuild Troubleshooting - Quick Reference

## Error: "reference not found for primary source"

### Quick Fix Commands

```bash
# Check what branches exist in the repository
git ls-remote --heads https://github.com/hml-brokerage/compliant-.git

# Expected output should include refs/heads/main
```

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

CloudFormation:
```yaml
SourceVersion: refs/heads/main
```

Terraform:
```hcl
source_version = "refs/heads/main"
```

### Need More Help?

See the complete guide: [docs/AWS_CODEBUILD_SETUP.md](./docs/AWS_CODEBUILD_SETUP.md)
