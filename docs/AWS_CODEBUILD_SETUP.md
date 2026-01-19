# AWS CodeBuild Setup Guide

## Overview

This document provides instructions for setting up and troubleshooting AWS CodeBuild for the Compliant platform.

## Common Error: "reference not found for primary source"

### Symptoms
```
[Container] 2026/01/19 19:38:15.959538 Running on CodeBuild On-demand
[Container] 2026/01/19 19:38:15.959552 Waiting for agent ping
[Container] 2026/01/19 19:38:16.465646 Waiting for DOWNLOAD_SOURCE
reference not found for primary source
```

### Root Cause
This error occurs during the `DOWNLOAD_SOURCE` phase, **before** the buildspec.yml is read. It means AWS CodeBuild cannot find the git reference (branch, tag, or commit SHA) specified in the CodeBuild project's source configuration.

### Common Causes

1. **Branch Name Mismatch**: The CodeBuild project is configured to build from a branch that doesn't exist
   - Example: CodeBuild is set to use `develop` branch, but only `main` exists
   
2. **Outdated Commit SHA**: The project is configured with a specific commit SHA that no longer exists

3. **Missing Source Reference**: The sourceVersion parameter is incorrect or empty

4. **Permissions Issues**: CodeBuild doesn't have permission to access the repository

### Solutions

#### Fix 1: Update CodeBuild Source Configuration

1. Go to AWS CodeBuild Console
2. Select your build project
3. Click "Edit" → "Source"
4. Check the following settings:

   **For automatic builds from main branch:**
   ```
   Source provider: GitHub (or your Git provider)
   Repository: hml-brokerage/compliant-
   Source version: refs/heads/main
   ```

   **For pull request builds:**
   ```
   Source version: (leave empty or use refs/heads/main as default)
   ```

5. Click "Update source"

#### Fix 2: Using AWS CLI

Update the CodeBuild project source version:

```bash
aws codebuild update-project \
  --name your-project-name \
  --source type=GITHUB,location=https://github.com/hml-brokerage/compliant-.git,gitCloneDepth=1,buildspec=buildspec.yml
```

To set the default branch:
```bash
aws codebuild update-project \
  --name your-project-name \
  --source-version refs/heads/main
```

#### Fix 3: Using CloudFormation/Terraform

**CloudFormation:**
```yaml
CodeBuildProject:
  Type: AWS::CodeBuild::Project
  Properties:
    Source:
      Type: GITHUB
      Location: https://github.com/hml-brokerage/compliant-.git
      BuildSpec: buildspec.yml
      GitCloneDepth: 1
    SourceVersion: refs/heads/main  # Ensure this points to an existing branch
```

**Terraform:**
```hcl
resource "aws_codebuild_project" "compliant" {
  name          = "compliant-build"
  
  source {
    type            = "GITHUB"
    location        = "https://github.com/hml-brokerage/compliant-.git"
    buildspec       = "buildspec.yml"
    git_clone_depth = 1
  }
  
  source_version = "refs/heads/main"  # Ensure this points to an existing branch
}
```

#### Fix 4: For Webhook/Automated Builds

If using webhooks for automated builds on PR/push events:

1. Ensure the webhook is configured correctly
2. The webhook should NOT specify a sourceVersion (it will use the PR/branch from the event)
3. Set a default sourceVersion only as a fallback

## Repository Branch Structure

This repository uses the following branches:

- **`main`**: Primary/default branch (production-ready code)
- Feature branches follow the pattern: `copilot/*`, `feature/*`, etc.

## CodeBuild Project Configuration Checklist

When setting up a new CodeBuild project:

- [ ] Source provider is correctly set (GitHub)
- [ ] Repository URL is correct: `https://github.com/hml-brokerage/compliant-.git`
- [ ] Source version points to `refs/heads/main` (or leave empty for PR builds)
- [ ] Buildspec location: `buildspec.yml` (in root directory)
- [ ] Service role has permissions to access the repository
- [ ] OAuth/GitHub App connection is authorized
- [ ] Webhook is configured (if automatic builds are needed)

## Testing Your Configuration

After updating the configuration:

1. Start a manual build:
   ```bash
   aws codebuild start-build --project-name your-project-name
   ```

2. Check the build logs:
   ```bash
   aws codebuild batch-get-builds --ids <build-id>
   ```

3. Verify the build downloads the source successfully

## Additional Resources

- [AWS CodeBuild Documentation](https://docs.aws.amazon.com/codebuild/)
- [Buildspec Reference](https://docs.aws.amazon.com/codebuild/latest/userguide/build-spec-ref.html)
- [Source Configuration](https://docs.aws.amazon.com/codebuild/latest/userguide/sample-source-version.html)

## Support

If you continue to experience issues:

1. Verify the branch exists: `git ls-remote --heads https://github.com/hml-brokerage/compliant-.git`
2. Check CodeBuild service role permissions
3. Review CloudWatch logs for detailed error messages
4. Contact the DevOps team for assistance
