#!/usr/bin/env node

/**
 * Production Environment Variables Validation Script
 * 
 * This script validates that all required production environment variables
 * are set and meet security requirements.
 * 
 * Usage:
 *   node scripts/validate-production-env.js
 *   node scripts/validate-production-env.js --env-file=.env.production
 */

const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Parse command line arguments
const args = process.argv.slice(2);
const envFileArg = args.find(arg => arg.startsWith('--env-file='));
const envFilePath = envFileArg 
  ? path.resolve(envFileArg.split('=')[1])
  : path.resolve(process.cwd(), 'packages', 'backend', '.env');

// Load environment variables from file if specified
if (envFileArg && fs.existsSync(envFilePath)) {
  const envContent = fs.readFileSync(envFilePath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

// Required environment variables with validation rules
const requiredVars = [
  {
    name: 'DATABASE_URL',
    required: true,
    validate: (val) => {
      if (!val.startsWith('postgresql://')) {
        return 'Must start with postgresql://';
      }
      if (val.includes('localhost') || val.includes('127.0.0.1')) {
        return 'Warning: Using localhost in production';
      }
      if (!val.includes('sslmode=require')) {
        return 'Warning: SSL not enforced (add ?sslmode=require)';
      }
      return null;
    },
    category: 'Database',
  },
  {
    name: 'JWT_SECRET',
    required: true,
    validate: (val) => {
      if (val.length < 32) {
        return 'Must be at least 32 characters';
      }
      if (val.includes('change-in-production') || val.includes('your-secret')) {
        return 'Still using placeholder value - must change!';
      }
      return null;
    },
    category: 'Authentication',
  },
  {
    name: 'JWT_REFRESH_SECRET',
    required: true,
    validate: (val) => {
      if (val.length < 32) {
        return 'Must be at least 32 characters';
      }
      if (val.includes('change-in-production') || val.includes('your-secret')) {
        return 'Still using placeholder value - must change!';
      }
      if (val === process.env.JWT_SECRET) {
        return 'Must be different from JWT_SECRET';
      }
      return null;
    },
    category: 'Authentication',
  },
  {
    name: 'JWT_EXPIRATION',
    required: true,
    validate: (val) => {
      if (!val.match(/^\d+[smhd]$/)) {
        return 'Invalid format (use: 15m, 1h, 7d)';
      }
      return null;
    },
    category: 'Authentication',
  },
  {
    name: 'JWT_REFRESH_EXPIRATION',
    required: true,
    validate: (val) => {
      if (!val.match(/^\d+[smhd]$/)) {
        return 'Invalid format (use: 15m, 1h, 7d)';
      }
      return null;
    },
    category: 'Authentication',
  },
  {
    name: 'REDIS_URL',
    required: true,
    validate: (val) => {
      if (!val.startsWith('redis://') && !val.startsWith('rediss://')) {
        return 'Must start with redis:// or rediss://';
      }
      if (val.includes('localhost') || val.includes('127.0.0.1')) {
        return 'Warning: Using localhost in production';
      }
      return null;
    },
    category: 'Redis',
  },
  {
    name: 'EMAIL_PROVIDER',
    required: true,
    validate: (val) => {
      if (!['sendgrid', 'aws_ses', 'smtp'].includes(val)) {
        return 'Must be: sendgrid, aws_ses, or smtp';
      }
      return null;
    },
    category: 'Email',
  },
  {
    name: 'EMAIL_FROM',
    required: true,
    validate: (val) => {
      if (!val.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return 'Invalid email format';
      }
      return null;
    },
    category: 'Email',
  },
  {
    name: 'ENCRYPTION_KEY',
    required: true,
    validate: (val) => {
      if (!val || val === '') {
        return 'Required for field-level encryption';
      }
      if (val.length < 32) {
        return 'Must be at least 32 characters';
      }
      return null;
    },
    category: 'Encryption',
  },
  {
    name: 'ENCRYPTION_SALT',
    required: true,
    validate: (val) => {
      if (!val || val === '') {
        return 'Required for field-level encryption';
      }
      if (val.length < 16) {
        return 'Must be at least 16 characters';
      }
      return null;
    },
    category: 'Encryption',
  },
  {
    name: 'NODE_ENV',
    required: true,
    validate: (val) => {
      if (val !== 'production') {
        return 'Warning: Should be "production" in production environment';
      }
      return null;
    },
    category: 'Server',
  },
  {
    name: 'CORS_ORIGIN',
    required: true,
    validate: (val) => {
      if (val.includes('localhost') || val.includes('127.0.0.1')) {
        return 'Warning: localhost in CORS origins for production';
      }
      const origins = val.split(',');
      for (const origin of origins) {
        if (!origin.startsWith('http://') && !origin.startsWith('https://')) {
          return `Invalid origin: ${origin} (must start with http:// or https://)`;
        }
      }
      return null;
    },
    category: 'Security',
  },
  {
    name: 'ADMIN_EMAIL',
    required: true,
    validate: (val) => {
      if (!val.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return 'Invalid email format';
      }
      return null;
    },
    category: 'Admin',
  },
];

// Conditional required variables (based on EMAIL_PROVIDER)
const emailProvider = process.env.EMAIL_PROVIDER;
if (emailProvider === 'sendgrid') {
  requiredVars.push({
    name: 'SENDGRID_API_KEY',
    required: true,
    validate: (val) => {
      if (!val.startsWith('SG.')) {
        return 'Invalid SendGrid API key format';
      }
      return null;
    },
    category: 'Email',
  });
} else if (emailProvider === 'aws_ses') {
  requiredVars.push(
    {
      name: 'AWS_SES_REGION',
      required: true,
      category: 'Email',
    },
    {
      name: 'AWS_SES_ACCESS_KEY',
      required: true,
      category: 'Email',
    },
    {
      name: 'AWS_SES_SECRET_KEY',
      required: true,
      category: 'Email',
    }
  );
} else if (emailProvider === 'smtp') {
  requiredVars.push(
    {
      name: 'SMTP_HOST',
      required: true,
      category: 'Email',
    },
    {
      name: 'SMTP_PORT',
      required: true,
      validate: (val) => {
        const port = parseInt(val);
        if (isNaN(port) || port < 1 || port > 65535) {
          return 'Invalid port number';
        }
        return null;
      },
      category: 'Email',
    },
    {
      name: 'SMTP_USER',
      required: true,
      category: 'Email',
    },
    {
      name: 'SMTP_PASS',
      required: true,
      category: 'Email',
    }
  );
}

// Conditional for storage provider
const storageProvider = process.env.STORAGE_PROVIDER;
if (storageProvider === 's3') {
  requiredVars.push(
    {
      name: 'AWS_S3_BUCKET',
      required: true,
      category: 'Storage',
    },
    {
      name: 'AWS_S3_REGION',
      required: true,
      category: 'Storage',
    },
    {
      name: 'AWS_S3_ACCESS_KEY',
      required: true,
      category: 'Storage',
    },
    {
      name: 'AWS_S3_SECRET_KEY',
      required: true,
      category: 'Storage',
    }
  );
} else if (storageProvider === 'azure') {
  requiredVars.push(
    {
      name: 'AZURE_STORAGE_CONNECTION_STRING',
      required: true,
      category: 'Storage',
    },
    {
      name: 'AZURE_STORAGE_CONTAINER',
      required: true,
      category: 'Storage',
    }
  );
}

// Validation results
const results = {
  passed: [],
  warnings: [],
  errors: [],
};

console.log(`\n${colors.cyan}╔════════════════════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.cyan}║   Production Environment Variables Validation                 ║${colors.reset}`);
console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════════╝${colors.reset}\n`);

if (envFileArg) {
  console.log(`${colors.blue}Loading environment from: ${envFilePath}${colors.reset}\n`);
}

// Group by category
const categories = [...new Set(requiredVars.map(v => v.category))];

categories.forEach(category => {
  console.log(`\n${colors.magenta}━━━ ${category} ━━━${colors.reset}\n`);
  
  const categoryVars = requiredVars.filter(v => v.category === category);
  
  categoryVars.forEach(varConfig => {
    const value = process.env[varConfig.name];
    const isSet = value !== undefined && value !== '';
    
    if (!isSet) {
      if (varConfig.required) {
        console.log(`  ${colors.red}✗${colors.reset} ${varConfig.name}: ${colors.red}MISSING${colors.reset}`);
        results.errors.push(`${varConfig.name}: Required but not set`);
      } else {
        console.log(`  ${colors.yellow}⚠${colors.reset} ${varConfig.name}: ${colors.yellow}Optional (not set)${colors.reset}`);
        results.warnings.push(`${varConfig.name}: Optional but not set`);
      }
    } else {
      // Validate the value
      const validationError = varConfig.validate ? varConfig.validate(value) : null;
      
      if (validationError) {
        if (validationError.startsWith('Warning:')) {
          console.log(`  ${colors.yellow}⚠${colors.reset} ${varConfig.name}: ${colors.yellow}${validationError}${colors.reset}`);
          results.warnings.push(`${varConfig.name}: ${validationError}`);
        } else {
          console.log(`  ${colors.red}✗${colors.reset} ${varConfig.name}: ${colors.red}${validationError}${colors.reset}`);
          results.errors.push(`${varConfig.name}: ${validationError}`);
        }
      } else {
        // Mask sensitive values in output - use fixed pattern for security
        const displayValue = value.length > 12 
          ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
          : '****...****';
        console.log(`  ${colors.green}✓${colors.reset} ${varConfig.name}: ${colors.green}Valid${colors.reset} (${displayValue})`);
        results.passed.push(varConfig.name);
      }
    }
  });
});

// Print summary
console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
console.log(`${colors.green}✓ Passed:${colors.reset} ${results.passed.length}`);
console.log(`${colors.yellow}⚠ Warnings:${colors.reset} ${results.warnings.length}`);
console.log(`${colors.red}✗ Errors:${colors.reset} ${results.errors.length}`);

// Print detailed errors and warnings
if (results.warnings.length > 0) {
  console.log(`\n${colors.yellow}Warnings:${colors.reset}`);
  results.warnings.forEach(warning => {
    console.log(`  ${colors.yellow}⚠${colors.reset} ${warning}`);
  });
}

if (results.errors.length > 0) {
  console.log(`\n${colors.red}Errors:${colors.reset}`);
  results.errors.forEach(error => {
    console.log(`  ${colors.red}✗${colors.reset} ${error}`);
  });
}

// Security recommendations
console.log(`\n${colors.cyan}━━━ Security Recommendations ━━━${colors.reset}\n`);
console.log(`  1. Generate secrets with: ${colors.blue}openssl rand -base64 32${colors.reset}`);
console.log(`  2. Use strong database passwords (20+ characters)`);
console.log(`  3. Enable SSL for database and Redis connections`);
console.log(`  4. Restrict CORS origins to production domains only`);
console.log(`  5. Use environment-specific secrets (never share between environments)`);
console.log(`  6. Rotate secrets regularly (quarterly recommended)`);
console.log(`  7. Never commit secrets to version control`);

// Quick fix commands
if (results.errors.some(e => e.includes('JWT_SECRET') || e.includes('ENCRYPTION'))) {
  console.log(`\n${colors.yellow}━━━ Quick Fix Commands ━━━${colors.reset}\n`);
  console.log(`  Generate JWT secrets:`);
  console.log(`  ${colors.blue}echo "JWT_SECRET=$(openssl rand -base64 32)"${colors.reset}`);
  console.log(`  ${colors.blue}echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32)"${colors.reset}`);
  console.log('');
  console.log(`  Generate encryption keys:`);
  console.log(`  ${colors.blue}echo "ENCRYPTION_KEY=$(openssl rand -base64 32)"${colors.reset}`);
  console.log(`  ${colors.blue}echo "ENCRYPTION_SALT=$(openssl rand -hex 16)"${colors.reset}`);
}

console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

// Exit with appropriate code
if (results.errors.length > 0) {
  console.log(`${colors.red}❌ Validation FAILED - Fix errors before deploying to production${colors.reset}\n`);
  process.exit(1);
} else if (results.warnings.length > 0) {
  console.log(`${colors.yellow}⚠️  Validation PASSED with warnings - Review warnings before deploying${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`${colors.green}✅ Validation PASSED - Environment is production-ready${colors.reset}\n`);
  process.exit(0);
}
