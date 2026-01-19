# AWS CodeBuild Infrastructure as Code (IaC)

This directory contains Infrastructure as Code (IaC) templates to properly configure AWS CodeBuild for the Compliant platform and avoid the "reference not found for primary source" error.

> **Note**: The repository URL `https://github.com/hml-brokerage/Compliant-` is correct and ends with a hyphen. This is the actual repository name.

## 🎯 Problem Statement

The error "reference not found for primary source" occurs when AWS CodeBuild is configured to build from a git reference (branch, tag, or commit) that doesn't exist in the repository. This happens during the `DOWNLOAD_SOURCE` phase, before the buildspec.yml is even read.

## 🛠️ Available Templates

### 1. CloudFormation Template

**File**: `cloudformation-codebuild.yaml`

Deploy using AWS CLI:

```bash
# Create a stack with the CloudFormation template
aws cloudformation create-stack \
  --stack-name compliant-codebuild \
  --template-body file://cloudformation-codebuild.yaml \
  --parameters \
    ParameterKey=ProjectName,ParameterValue=compliant-build \
    ParameterKey=GitHubRepositoryUrl,ParameterValue=https://github.com/hml-brokerage/Compliant- \
    ParameterKey=SourceVersion,ParameterValue=refs/heads/main \
    ParameterKey=GitHubTokenSecretArn,ParameterValue=arn:aws:secretsmanager:us-east-1:123456789012:secret:github-token \
    ParameterKey=DatabaseUrl,ParameterValue=postgresql://user:pass@localhost:5432/dbname \
  --capabilities CAPABILITY_IAM \
  --region us-east-1

# Note: DatabaseUrl is a placeholder for Prisma Client generation during build.
# Override with actual production DATABASE_URL in CodeBuild environment variables if needed.

# Check stack status
aws cloudformation describe-stacks \
  --stack-name compliant-codebuild \
  --region us-east-1
```

Deploy using AWS Console:

1. Go to [CloudFormation Console](https://console.aws.amazon.com/cloudformation/)
2. Click "Create stack" → "With new resources"
3. Choose "Upload a template file" and upload `cloudformation-codebuild.yaml`
4. Fill in the parameters:
   - **ProjectName**: `compliant-build`
   - **GitHubRepositoryUrl**: `https://github.com/hml-brokerage/Compliant-`
   - **SourceVersion**: `refs/heads/main`
   - **GitHubTokenSecretArn**: Your GitHub token secret ARN
5. Click through to create the stack

### 2. Terraform Configuration

**File**: `terraform-codebuild.tf`

Deploy using Terraform:

```bash
# Initialize Terraform
terraform init

# Create a terraform.tfvars file with your variables
cat > terraform.tfvars <<EOF
project_name             = "compliant-build"
github_repository_url    = "https://github.com/hml-brokerage/Compliant-"
source_version          = "refs/heads/main"
github_token_secret_arn = "arn:aws:secretsmanager:us-east-1:123456789012:secret:github-token"
database_url            = "postgresql://user:pass@localhost:5432/dbname"
aws_region              = "us-east-1"
EOF

# Note: database_url is a placeholder for Prisma Client generation during build.
# Override with actual production DATABASE_URL in CodeBuild environment variables if needed.

# Plan the deployment
terraform plan

# Apply the configuration
terraform apply

# View outputs
terraform output
```

## 🔑 Prerequisites

Before deploying either template:

1. **AWS Account**: You need an AWS account with appropriate permissions
2. **GitHub OAuth**: Set up GitHub OAuth connection in CodeBuild console
   - Go to [CodeBuild Console](https://console.aws.amazon.com/codebuild/)
   - Click "Settings" → "Source provider connections"
   - Connect your GitHub account
3. **GitHub Token** (Optional): Store in AWS Secrets Manager if not using OAuth
   ```bash
   aws secretsmanager create-secret \
     --name github-token \
     --secret-string '{"token":"ghp_xxxxxxxxxxxxxxxxxxxx"}' \
     --region us-east-1
   ```

## 🔒 Security Best Practices

The templates include default configurations for getting started quickly, but for production use:

1. **DATABASE_URL**: The templates use PLAINTEXT type with a placeholder value. For production:
   - Store your actual DATABASE_URL in AWS Secrets Manager
   - Update the environment variable to use `Type: SECRETS_MANAGER`
   - Example:
     ```yaml
     - Name: DATABASE_URL
       Value: arn:aws:secretsmanager:region:account:secret:database-url
       Type: SECRETS_MANAGER
     ```

2. **GitHub Tokens**: Always use AWS Secrets Manager for GitHub tokens

3. **IAM Permissions**: The templates follow least-privilege principles with specific permissions

4. **Artifact Encryption**: S3 artifacts are encrypted by default with AES256

## ✅ Key Configuration

Both templates include the critical configuration that fixes the "reference not found" error:

**CloudFormation**:
```yaml
SourceVersion: refs/heads/main
```

**Terraform**:
```hcl
source_version = "refs/heads/main"
```

This ensures CodeBuild always knows which git reference to checkout.

## 🎛️ Customization

### For Different Branches

To build from a different branch, update the `SourceVersion` (CloudFormation) or `source_version` (Terraform) parameter:

- Main branch: `refs/heads/main`
- Develop branch: `refs/heads/develop`
- Specific tag: `refs/tags/v1.0.0`
- Specific commit: `commit-sha`

### For Pull Request Builds

The templates are pre-configured with webhooks for automatic PR builds. When a webhook triggers a build from a PR, it automatically uses the PR branch, ignoring the default `source_version`.

### Environment Variables

To add environment variables to the build:

**CloudFormation** - Add to `EnvironmentVariables` section:
```yaml
- Name: MY_VARIABLE
  Value: my-value
  Type: PLAINTEXT
```

**Terraform** - Add to `environment_variable` block:
```hcl
environment_variable {
  name  = "MY_VARIABLE"
  value = "my-value"
  type  = "PLAINTEXT"
}
```

**For sensitive values**, use AWS Secrets Manager or Systems Manager Parameter Store:

**CloudFormation**:
```yaml
- Name: DATABASE_URL
  Value: arn:aws:secretsmanager:us-east-1:123456789012:secret:db-url
  Type: SECRETS_MANAGER
```

**Terraform**:
```hcl
environment_variable {
  name  = "DATABASE_URL"
  value = "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-url"
  type  = "SECRETS_MANAGER"
}
```

## 📊 Outputs

Both templates provide the following outputs:

- **CodeBuildProjectName**: Name of the created CodeBuild project
- **CodeBuildProjectArn**: ARN of the CodeBuild project
- **ArtifactBucketName**: S3 bucket for storing build artifacts
- **ServiceRoleArn**: IAM role ARN used by CodeBuild

## 🧹 Cleanup

### CloudFormation
```bash
aws cloudformation delete-stack \
  --stack-name compliant-codebuild \
  --region us-east-1
```

### Terraform
```bash
terraform destroy
```

## 🆘 Troubleshooting

If you still encounter the "reference not found" error after deployment:

1. **Verify the branch exists**:
   ```bash
   git ls-remote --heads https://github.com/hml-brokerage/Compliant-
   ```

2. **Check CodeBuild configuration**:
   ```bash
   aws codebuild batch-get-projects --names compliant-build
   ```

3. **Test a manual build**:
   ```bash
   aws codebuild start-build --project-name compliant-build
   ```

4. **Review CloudWatch logs**:
   ```bash
   aws logs tail /aws/codebuild/compliant-build --follow
   ```

## 📚 Additional Resources

- [CODEBUILD_TROUBLESHOOTING.md](./CODEBUILD_TROUBLESHOOTING.md) - Quick troubleshooting guide
- [docs/AWS_CODEBUILD_SETUP.md](./docs/AWS_CODEBUILD_SETUP.md) - Detailed setup guide
- [AWS CodeBuild Documentation](https://docs.aws.amazon.com/codebuild/)
- [buildspec.yml](./buildspec.yml) - Build specification file

## 💡 Best Practices

1. **Always use full git references**: Use `refs/heads/main` instead of just `main`
2. **Store secrets securely**: Use AWS Secrets Manager for sensitive values
3. **Enable caching**: Both templates enable local caching to speed up builds
4. **Monitor builds**: Use CloudWatch Logs for troubleshooting
5. **Use webhooks**: Automate builds on PR and push events
6. **Clean up artifacts**: Both templates include lifecycle policies to delete old artifacts after 30 days
