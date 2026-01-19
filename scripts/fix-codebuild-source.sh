#!/bin/bash
# Quick fix script for CodeBuild "reference not found for primary source" error
# This script updates an existing CodeBuild project to use the correct source version

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEFAULT_PROJECT_NAME="compliant-build"
DEFAULT_SOURCE_VERSION="refs/heads/main"
REPO_URL="https://github.com/hml-brokerage/Compliant-"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  CodeBuild Source Reference Fix Script                    ║${NC}"
echo -e "${BLUE}║  Fixes: 'reference not found for primary source' error    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ Error: AWS CLI is not installed${NC}"
    echo "Please install AWS CLI: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ Error: AWS credentials are not configured${NC}"
    echo "Please configure AWS CLI credentials:"
    echo "  aws configure"
    exit 1
fi

echo -e "${GREEN}✓ AWS CLI is configured${NC}"
echo ""

# Get project name from user or use default
read -p "Enter CodeBuild project name [${DEFAULT_PROJECT_NAME}]: " PROJECT_NAME
PROJECT_NAME=${PROJECT_NAME:-$DEFAULT_PROJECT_NAME}

# Verify project exists
echo -e "${BLUE}Checking if project '${PROJECT_NAME}' exists...${NC}"
if ! aws codebuild batch-get-projects --names "${PROJECT_NAME}" --query 'projects[0].name' --output text 2>/dev/null | grep -q "${PROJECT_NAME}"; then
    echo -e "${RED}❌ Error: CodeBuild project '${PROJECT_NAME}' not found${NC}"
    echo ""
    echo "Available projects:"
    aws codebuild list-projects --query 'projects' --output table
    exit 1
fi

echo -e "${GREEN}✓ Project found${NC}"
echo ""

# Get current source version
CURRENT_SOURCE=$(aws codebuild batch-get-projects --names "${PROJECT_NAME}" --query 'projects[0].sourceVersion' --output text)
echo -e "${YELLOW}Current source version: ${CURRENT_SOURCE}${NC}"

# Get desired source version from user or use default
read -p "Enter new source version [${DEFAULT_SOURCE_VERSION}]: " SOURCE_VERSION
SOURCE_VERSION=${SOURCE_VERSION:-$DEFAULT_SOURCE_VERSION}

# Verify the branch exists in the repository
echo -e "${BLUE}Verifying that '${SOURCE_VERSION}' exists in repository...${NC}"
if git ls-remote "${REPO_URL}" "${SOURCE_VERSION}" | grep -q "${SOURCE_VERSION}"; then
    echo -e "${GREEN}✓ Branch verified${NC}"
else
    echo -e "${YELLOW}⚠ Warning: Could not verify branch '${SOURCE_VERSION}' exists${NC}"
    echo "This might cause the build to fail if the reference doesn't exist."
    read -p "Continue anyway? (y/N): " CONTINUE
    if [[ ! $CONTINUE =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi
fi
echo ""

# Update the project
echo -e "${BLUE}Updating CodeBuild project...${NC}"
if aws codebuild update-project \
    --name "${PROJECT_NAME}" \
    --source-version "${SOURCE_VERSION}" \
    --output json > /dev/null; then
    echo -e "${GREEN}✓ Project updated successfully!${NC}"
else
    echo -e "${RED}❌ Error: Failed to update project${NC}"
    exit 1
fi
echo ""

# Verify the update
NEW_SOURCE=$(aws codebuild batch-get-projects --names "${PROJECT_NAME}" --query 'projects[0].sourceVersion' --output text)
echo -e "${GREEN}New source version: ${NEW_SOURCE}${NC}"
echo ""

# Offer to start a test build
read -p "Would you like to start a test build? (y/N): " START_BUILD
if [[ $START_BUILD =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Starting build...${NC}"
    BUILD_ID=$(aws codebuild start-build --project-name "${PROJECT_NAME}" --query 'build.id' --output text)
    echo -e "${GREEN}✓ Build started: ${BUILD_ID}${NC}"
    echo ""
    echo "Monitor build status:"
    echo "  aws codebuild batch-get-builds --ids ${BUILD_ID}"
    echo ""
    echo "View logs in CloudWatch:"
    echo "  https://console.aws.amazon.com/cloudwatch/home?region=$(aws configure get region)#logsV2:log-groups/log-group/\$252Faws\$252Fcodebuild\$252F${PROJECT_NAME}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✓ Done!                                                   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "For more information, see:"
echo "  - CODEBUILD_TROUBLESHOOTING.md"
echo "  - docs/AWS_CODEBUILD_SETUP.md"
echo "  - IaC-README.md (for Infrastructure as Code templates)"
