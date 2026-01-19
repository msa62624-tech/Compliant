# AWS CodeBuild Terraform Configuration for Compliant Platform
# Fixes "reference not found for primary source" error by properly setting source_version

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Variables
variable "project_name" {
  description = "Name for the CodeBuild project"
  type        = string
  default     = "compliant-build"
}

variable "github_repository_url" {
  description = "GitHub repository URL"
  type        = string
  default     = "https://github.com/hml-brokerage/compliant-"
}

variable "source_version" {
  description = "Git reference to build (branch, tag, or commit). Use refs/heads/main for main branch."
  type        = string
  default     = "refs/heads/main"
}

variable "github_token_secret_arn" {
  description = "(Optional) ARN of AWS Secrets Manager secret containing GitHub personal access token. Leave empty when using OAuth authentication (recommended)."
  type        = string
  default     = ""
  sensitive   = true
}

variable "database_url" {
  description = <<-EOT
    Database URL for build (placeholder only for Prisma Client generation).
    For production, store the actual DATABASE_URL in AWS Secrets Manager and
    reference it using SECRETS_MANAGER type in environment variables instead of PLAINTEXT.
  EOT
  type        = string
  default     = "postgresql://user:pass@localhost:5432/dbname"
  sensitive   = true
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

# Provider configuration
provider "aws" {
  region = var.aws_region
}

# S3 bucket for artifacts
resource "aws_s3_bucket" "artifacts" {
  bucket = "${var.project_name}-artifacts-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_versioning" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  rule {
    id     = "delete-old-artifacts"
    status = "Enabled"

    expiration {
      days = 30
    }
  }
}

# IAM role for CodeBuild
resource "aws_iam_role" "codebuild" {
  name = "${var.project_name}-codebuild-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "codebuild.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy" "codebuild" {
  name = "${var.project_name}-codebuild-policy"
  role = aws_iam_role.codebuild.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/codebuild/${var.project_name}",
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/codebuild/${var.project_name}:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:GetObjectVersion"
        ]
        Resource = "${aws_s3_bucket.artifacts.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.artifacts.arn
      }
    ]
  })
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "codebuild" {
  name              = "/aws/codebuild/${var.project_name}"
  retention_in_days = 7
}

# CodeBuild project
resource "aws_codebuild_project" "compliant" {
  name          = var.project_name
  description   = "Build project for Compliant platform"
  service_role  = aws_iam_role.codebuild.arn
  build_timeout = 60

  artifacts {
    type                = "S3"
    location            = aws_s3_bucket.artifacts.id
    name                = "build-output"
    encryption_disabled = false
  }

  cache {
    type  = "LOCAL"
    modes = ["LOCAL_SOURCE_CACHE", "LOCAL_CUSTOM_CACHE"]
  }

  environment {
    compute_type                = "BUILD_GENERAL1_MEDIUM"
    image                       = "aws/codebuild/standard:7.0"
    type                        = "LINUX_CONTAINER"
    privileged_mode             = false
    image_pull_credentials_type = "CODEBUILD"

    # Note: For production use, store DATABASE_URL in AWS Secrets Manager
    # and use SECRETS_MANAGER type instead of PLAINTEXT
    environment_variable {
      name  = "DATABASE_URL"
      value = var.database_url
      type  = "PLAINTEXT"
    }
  }

  logs_config {
    cloudwatch_logs {
      status     = "ENABLED"
      group_name = aws_cloudwatch_log_group.codebuild.name
    }
  }

  source {
    type            = "GITHUB"
    location        = var.github_repository_url
    git_clone_depth = 1
    buildspec       = "buildspec.yml"

    auth {
      type = "OAUTH"
    }
  }

  # CRITICAL: This fixes the "reference not found for primary source" error
  # Always ensure this points to an existing branch/tag/commit
  source_version = var.source_version

  # Webhook configuration for automatic builds on PR and push events
  webhook {
    filter_group {
      filter {
        type    = "EVENT"
        pattern = "PULL_REQUEST_CREATED,PULL_REQUEST_UPDATED,PULL_REQUEST_REOPENED"
      }
    }

    filter_group {
      filter {
        type    = "EVENT"
        pattern = "PUSH"
      }
      filter {
        type    = "HEAD_REF"
        pattern = "^refs/heads/main$"
      }
    }
  }
}

# Data sources
data "aws_caller_identity" "current" {}

# Outputs
output "codebuild_project_name" {
  description = "Name of the CodeBuild project"
  value       = aws_codebuild_project.compliant.name
}

output "codebuild_project_arn" {
  description = "ARN of the CodeBuild project"
  value       = aws_codebuild_project.compliant.arn
}

output "artifact_bucket_name" {
  description = "S3 bucket for build artifacts"
  value       = aws_s3_bucket.artifacts.id
}

output "service_role_arn" {
  description = "ARN of the CodeBuild service role"
  value       = aws_iam_role.codebuild.arn
}
