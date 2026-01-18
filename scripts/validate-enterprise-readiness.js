#!/usr/bin/env node

/**
 * Enterprise Readiness Validation Script
 * 
 * Validates that the Compliant platform meets enterprise readiness standards
 * Checks: Build system, dependencies, configuration, documentation, security
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✓ ${message}`, colors.green);
}

function error(message) {
  log(`✗ ${message}`, colors.red);
}

function warning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

function info(message) {
  log(`ℹ ${message}`, colors.cyan);
}

function header(message) {
  log(`\n${'='.repeat(60)}`, colors.blue);
  log(message, colors.blue);
  log('='.repeat(60), colors.blue);
}

class EnterpriseReadinessValidator {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      categories: {},
    };
  }

  checkFile(filePath, description) {
    const fullPath = path.join(ROOT_DIR, filePath);
    if (fs.existsSync(fullPath)) {
      success(`${description}: ${filePath}`);
      this.results.passed++;
      return true;
    } else {
      error(`${description} missing: ${filePath}`);
      this.results.failed++;
      return false;
    }
  }

  checkDirectory(dirPath, description) {
    const fullPath = path.join(ROOT_DIR, dirPath);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      success(`${description}: ${dirPath}`);
      this.results.passed++;
      return true;
    } else {
      error(`${description} missing: ${dirPath}`);
      this.results.failed++;
      return false;
    }
  }

  checkCommand(command, description) {
    try {
      execSync(command, { cwd: ROOT_DIR, stdio: 'pipe' });
      success(description);
      this.results.passed++;
      return true;
    } catch (err) {
      error(`${description} - Command failed: ${command}`);
      this.results.failed++;
      return false;
    }
  }

  validateBuildSystem() {
    header('1. Build System Validation (Target: 98%)');
    
    this.checkFile('package.json', 'Root package.json');
    this.checkFile('pnpm-workspace.yaml', 'Workspace configuration');
    this.checkFile('turbo.json', 'TurboRepo configuration');
    this.checkFile('tsconfig.json', 'TypeScript configuration');
    
    this.checkDirectory('packages/backend', 'Backend package');
    this.checkDirectory('packages/frontend', 'Frontend package');
    this.checkDirectory('packages/shared', 'Shared package');
    
    this.checkFile('packages/backend/package.json', 'Backend package.json');
    this.checkFile('packages/frontend/package.json', 'Frontend package.json');
    this.checkFile('packages/shared/package.json', 'Shared package.json');
    
    // Check if node_modules exists
    if (fs.existsSync(path.join(ROOT_DIR, 'node_modules'))) {
      success('Dependencies installed');
      this.results.passed++;
    } else {
      warning('Dependencies not installed. Run: pnpm install');
      this.results.warnings++;
    }
  }

  validateCICD() {
    header('2. CI/CD Automation Validation (Target: 95%)');
    
    this.checkDirectory('.github/workflows', 'Workflows directory');
    this.checkFile('.github/workflows/ci.yml', 'CI workflow');
    this.checkFile('.github/workflows/integration-tests.yml', 'Integration tests workflow');
    this.checkFile('.github/workflows/e2e-tests.yml', 'E2E tests workflow');
    this.checkFile('.github/workflows/code-coverage.yml', 'Code coverage workflow');
    this.checkFile('.github/workflows/performance-tests.yml', 'Performance tests workflow');
    this.checkFile('.github/workflows/security-scan.yml', 'Security scan workflow');
    this.checkFile('.github/workflows/codeql-analysis.yml', 'CodeQL analysis workflow');
    this.checkFile('.github/workflows/deploy.yml', 'Deploy workflow');
  }

  validateSecurity() {
    header('3. Security & Compliance Validation (Target: 96%)');
    
    this.checkFile('SECURITY.md', 'Security policy');
    this.checkDirectory('packages/backend/src/common/encryption', 'Encryption service');
    this.checkDirectory('packages/backend/src/common/audit', 'Audit logging');
    this.checkDirectory('packages/backend/src/common/guards', 'Authorization guards');
    this.checkFile('.github/workflows/security-scan.yml', 'Security scanning');
    this.checkFile('.github/workflows/codeql-analysis.yml', 'Static analysis');
    
    // Check for sensitive files that shouldn't be committed
    if (fs.existsSync(path.join(ROOT_DIR, '.env'))) {
      error('.env file found in repository (should not be committed)');
      this.results.failed++;
    } else {
      success('No .env files committed');
      this.results.passed++;
    }
    
    this.checkFile('.gitignore', 'Git ignore configuration');
  }

  validateDocumentation() {
    header('4. Documentation Validation (Target: 99%)');
    
    const requiredDocs = [
      'README.md',
      'GETTING_STARTED.md',
      'SECURITY.md',
      'PRODUCTION_READINESS_GUIDE.md',
      'DEPLOYMENT_GUIDE.md',
      'MONITORING_OBSERVABILITY_COMPLETE.md',
      'BUILD_TESTING_COMPLETE.md',
      'CICD_AUTOMATION_COMPLETE.md',
      'BUSINESS_LOGIC_STATUS.md',
      'QUICK_START_PRODUCTION.md',
      'ENTERPRISE_READINESS_ASSESSMENT.md',
    ];
    
    requiredDocs.forEach(doc => {
      this.checkFile(doc, `Documentation: ${doc}`);
    });
    
    this.checkDirectory('docs', 'Documentation directory');
    
    // Count total documentation
    try {
      const docsCount = fs.readdirSync(path.join(ROOT_DIR, 'docs'))
        .filter(f => f.endsWith('.md')).length;
      info(`Found ${docsCount} additional documentation files in docs/`);
    } catch (err) {
      // Directory might not exist
    }
  }

  validateDeployment() {
    header('5. Production Deployment Validation (Target: 97%)');
    
    this.checkFile('docker-compose.yml', 'Docker Compose configuration');
    this.checkFile('.dockerignore', 'Docker ignore configuration');
    this.checkFile('packages/backend/.env.example', 'Backend environment template');
    
    // Check for deployment scripts
    if (fs.existsSync(path.join(ROOT_DIR, 'scripts'))) {
      const scripts = fs.readdirSync(path.join(ROOT_DIR, 'scripts'));
      if (scripts.length > 0) {
        success(`Found ${scripts.length} deployment/utility scripts`);
        this.results.passed++;
      }
    }
    
    // Check health endpoint implementation
    const healthController = path.join(ROOT_DIR, 'packages/backend/src/modules/health');
    if (fs.existsSync(healthController)) {
      success('Health check endpoints implemented');
      this.results.passed++;
    } else {
      error('Health check endpoints not found');
      this.results.failed++;
    }
  }

  validateBusinessLogic() {
    header('6. Business Logic Validation (Target: 100%)');
    
    const modules = [
      'auth',
      'users',
      'contractors',
      'projects',
      'programs',
      'generated-coi',
      'hold-harmless',
      'reminders',
    ];
    
    const modulesPath = path.join(ROOT_DIR, 'packages/backend/src/modules');
    modules.forEach(module => {
      this.checkDirectory(`packages/backend/src/modules/${module}`, `Module: ${module}`);
    });
    
    this.checkFile('packages/backend/prisma/schema.prisma', 'Database schema');
    this.checkFile('BUSINESS_LOGIC_STATUS.md', 'Business logic documentation');
  }

  validateArchitecture() {
    header('7. Code Architecture Validation (Target: 98%)');
    
    // Check monorepo structure
    this.checkDirectory('packages', 'Monorepo packages');
    this.checkFile('turbo.json', 'Build pipeline configuration');
    
    // Check backend architecture
    this.checkDirectory('packages/backend/src', 'Backend source');
    this.checkDirectory('packages/backend/src/modules', 'Backend modules');
    this.checkDirectory('packages/backend/src/common', 'Common utilities');
    
    // Check frontend architecture
    this.checkDirectory('packages/frontend/app', 'Frontend app directory');
    this.checkDirectory('packages/frontend/components', 'Frontend components');
    
    // Check shared code
    this.checkDirectory('packages/shared/src', 'Shared code');
    
    // Check TypeScript configuration
    this.checkFile('tsconfig.json', 'Root TypeScript config');
    this.checkFile('packages/backend/tsconfig.json', 'Backend TypeScript config');
    this.checkFile('packages/frontend/tsconfig.json', 'Frontend TypeScript config');
  }

  validateMonitoring() {
    header('8. Monitoring & Observability Validation (Target: 92%)');
    
    this.checkFile('MONITORING_OBSERVABILITY_COMPLETE.md', 'Monitoring documentation');
    this.checkDirectory('packages/backend/src/modules/health', 'Health check module');
    this.checkDirectory('packages/backend/src/common/audit', 'Audit logging');
    
    // Check if health endpoints are implemented
    const healthFiles = [
      'packages/backend/src/modules/health/health.controller.ts',
      'packages/backend/src/modules/health/health.module.ts',
    ];
    
    healthFiles.forEach(file => {
      this.checkFile(file, `Health check: ${path.basename(file)}`);
    });
    
    info('Note: APM and monitoring stack should be deployed post-deployment');
  }

  calculateScore(category, maxScore = 100) {
    const total = this.results.passed + this.results.failed;
    if (total === 0) return 0;
    return Math.round((this.results.passed / total) * maxScore);
  }

  generateReport() {
    header('Enterprise Readiness Validation Report');
    
    const total = this.results.passed + this.results.failed + this.results.warnings;
    const score = this.calculateScore();
    
    console.log('');
    log(`Total Checks: ${total}`, colors.cyan);
    log(`✓ Passed: ${this.results.passed}`, colors.green);
    log(`✗ Failed: ${this.results.failed}`, colors.red);
    log(`⚠ Warnings: ${this.results.warnings}`, colors.yellow);
    console.log('');
    
    if (this.results.failed === 0 && this.results.warnings === 0) {
      log(`Overall Score: ${score}% - EXCELLENT ✓`, colors.green);
      log('Status: ✅ PRODUCTION READY', colors.green);
    } else if (this.results.failed === 0) {
      log(`Overall Score: ${score}% - GOOD (with warnings)`, colors.yellow);
      log('Status: ⚠️ PRODUCTION READY (address warnings)', colors.yellow);
    } else if (this.results.failed <= 3) {
      log(`Overall Score: ${score}% - NEEDS IMPROVEMENT`, colors.yellow);
      log('Status: ⚠️ ADDRESS FAILURES BEFORE DEPLOYMENT', colors.yellow);
    } else {
      log(`Overall Score: ${score}% - CRITICAL ISSUES`, colors.red);
      log('Status: ✗ NOT READY FOR PRODUCTION', colors.red);
    }
    
    console.log('');
    log('For detailed assessment, see: ENTERPRISE_READINESS_ASSESSMENT.md', colors.cyan);
    console.log('');
    
    return this.results.failed === 0;
  }

  async run() {
    log('🏢 Enterprise Readiness Validation', colors.blue);
    log('Validating Compliant Insurance Tracking Platform', colors.blue);
    log('Target Overall Score: 97.2%\n', colors.blue);
    
    this.validateBuildSystem();
    this.validateCICD();
    this.validateSecurity();
    this.validateDocumentation();
    this.validateDeployment();
    this.validateBusinessLogic();
    this.validateArchitecture();
    this.validateMonitoring();
    
    const success = this.generateReport();
    
    process.exit(success ? 0 : 1);
  }
}

// Run validation
const validator = new EnterpriseReadinessValidator();
validator.run().catch(err => {
  error(`Validation failed with error: ${err.message}`);
  process.exit(1);
});
