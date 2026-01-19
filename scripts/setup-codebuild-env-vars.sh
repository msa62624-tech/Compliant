#!/bin/bash
# Script to configure environment variables for CodeBuild project
# Specifically sets up DATABASE_URL required for Prisma Client generation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEFAULT_PROJECT_NAME="compliant-build"
DEFAULT_DB_URL="postgresql://user:pass@localhost:5432/dbname"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  CodeBuild Environment Variables Setup                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ Error: AWS CLI is not installed${NC}"
    echo "Please install AWS CLI: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ Error: jq is not installed${NC}"
    echo "jq is required for this script to work."
    echo "Install jq: https://stedolan.github.io/jq/download/"
    echo ""
    echo -e "${YELLOW}Alternative: Set environment variables manually${NC}"
    echo "  1. Go to AWS CodeBuild Console"
    echo "  2. Select your project"
    echo "  3. Click Edit > Environment"
    echo "  4. Add environment variables as needed"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ Error: AWS credentials are not configured${NC}"
    echo "Please configure AWS CLI credentials:"
    echo "  aws configure"
    exit 1
fi

echo -e "${GREEN}✓ AWS CLI and jq are configured${NC}"
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

# Get current environment variables
echo -e "${BLUE}Current environment variables:${NC}"
aws codebuild batch-get-projects --names "${PROJECT_NAME}" --query 'projects[0].environment.environmentVariables[*].[name,type]' --output table
echo ""

# Ask which environment variable to set
echo "Common environment variables needed for this project:"
echo "  1. DATABASE_URL - Required for Prisma Client generation"
echo "  2. Custom variable"
echo ""

read -p "Choose option (1-2) or press Enter to set DATABASE_URL: " OPTION
OPTION=${OPTION:-1}

if [ "$OPTION" = "1" ]; then
    VAR_NAME="DATABASE_URL"
    echo ""
    echo "DATABASE_URL is required for Prisma Client generation during build."
    echo ""
    echo "Options:"
    echo "  1. Use placeholder value (for CI builds): ${DEFAULT_DB_URL}"
    echo "  2. Use AWS Secrets Manager (recommended for production)"
    echo "  3. Enter custom value"
    echo ""
    read -p "Choose option (1-3) [1]: " DB_OPTION
    DB_OPTION=${DB_OPTION:-1}
    
    case $DB_OPTION in
        1)
            VAR_VALUE="${DEFAULT_DB_URL}"
            VAR_TYPE="PLAINTEXT"
            echo -e "${YELLOW}Note: This is a placeholder value suitable for builds only${NC}"
            ;;
        2)
            read -p "Enter AWS Secrets Manager ARN: " VAR_VALUE
            VAR_TYPE="SECRETS_MANAGER"
            echo -e "${GREEN}Using Secrets Manager (recommended for production)${NC}"
            ;;
        3)
            read -p "Enter DATABASE_URL value: " VAR_VALUE
            VAR_TYPE="PLAINTEXT"
            echo -e "${YELLOW}Note: For production, use AWS Secrets Manager instead${NC}"
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            exit 1
            ;;
    esac
elif [ "$OPTION" = "2" ]; then
    read -p "Enter environment variable name: " VAR_NAME
    read -p "Enter value: " VAR_VALUE
    echo "Select type:"
    echo "  1. PLAINTEXT"
    echo "  2. PARAMETER_STORE"
    echo "  3. SECRETS_MANAGER"
    read -p "Choose option (1-3) [1]: " TYPE_OPTION
    TYPE_OPTION=${TYPE_OPTION:-1}
    
    case $TYPE_OPTION in
        1) VAR_TYPE="PLAINTEXT" ;;
        2) VAR_TYPE="PARAMETER_STORE" ;;
        3) VAR_TYPE="SECRETS_MANAGER" ;;
        *) VAR_TYPE="PLAINTEXT" ;;
    esac
else
    echo -e "${RED}Invalid option${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Updating environment variables...${NC}"
echo "  Name: ${VAR_NAME}"
echo "  Type: ${VAR_TYPE}"

# Get current environment configuration
CURRENT_ENV=$(aws codebuild batch-get-projects --names "${PROJECT_NAME}" --query 'projects[0].environment' --output json)

# Check if variable already exists
EXISTING_VAR=$(aws codebuild batch-get-projects --names "${PROJECT_NAME}" --query "projects[0].environment.environmentVariables[?name==\`${VAR_NAME}\`].name" --output text)

if [ -n "$EXISTING_VAR" ]; then
    echo -e "${YELLOW}⚠ Variable '${VAR_NAME}' already exists${NC}"
    read -p "Would you like to update it? (y/N): " UPDATE_VAR
    if [[ ! $UPDATE_VAR =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi
    # Remove existing variable using jq --arg for safe variable interpolation
    UPDATED_ENV=$(echo "$CURRENT_ENV" | jq --arg varname "$VAR_NAME" 'del(.environmentVariables[] | select(.name==$varname))')
else
    UPDATED_ENV="$CURRENT_ENV"
fi

# Add new/updated variable using jq --arg for safe variable interpolation
UPDATED_ENV=$(echo "$UPDATED_ENV" | jq --arg name "$VAR_NAME" --arg value "$VAR_VALUE" --arg type "$VAR_TYPE" '.environmentVariables += [{"name":$name,"value":$value,"type":$type}]')

# Update the project
if aws codebuild update-project \
    --name "${PROJECT_NAME}" \
    --environment "$UPDATED_ENV" \
    --output json > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Environment variable configured successfully${NC}"
else
    echo -e "${RED}❌ Error: Failed to update environment variables${NC}"
    echo ""
    echo "You can set it manually:"
    echo "  1. Go to AWS CodeBuild Console"
    echo "  2. Select project: ${PROJECT_NAME}"
    echo "  3. Click Edit > Environment"
    echo "  4. Add/update environment variable:"
    echo "     Name: ${VAR_NAME}"
    echo "     Type: ${VAR_TYPE}"
    exit 1
fi

echo ""
echo -e "${BLUE}Updated environment variables:${NC}"
aws codebuild batch-get-projects --names "${PROJECT_NAME}" --query 'projects[0].environment.environmentVariables[*].[name,type]' --output table

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✓ Done!                                                   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Your CodeBuild project is now configured with the required environment variables."
echo ""
echo "Next steps:"
echo "  1. Start a build: aws codebuild start-build --project-name ${PROJECT_NAME}"
echo "  2. Monitor logs in CloudWatch"
echo ""
echo "For more information, see:"
echo "  - CODEBUILD_TROUBLESHOOTING.md"
echo "  - docs/AWS_CODEBUILD_SETUP.md"
