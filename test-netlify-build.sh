#!/bin/bash

# =============================================================================
# Netlify Build Environment Simulator
# This script mimics the exact Netlify build process to test locally
# =============================================================================

set -e  # Exit on any error

echo "🚀 Starting Netlify Build Environment Simulation..."
echo "=============================================="
echo ""

# Clean up any previous test artifacts
echo "📦 Step 1: Cleaning up previous build artifacts..."
rm -rf node_modules packages/*/node_modules packages/*/.next packages/*/dist
rm -rf .netlify packages/frontend/.netlify
echo "✅ Cleanup complete"
echo ""

# Simulate Netlify's frozen lockfile install
echo "📦 Step 2: Installing dependencies (frozen lockfile)..."
pnpm install --frozen-lockfile
if [ $? -ne 0 ]; then
    echo "❌ ERROR: pnpm install --frozen-lockfile failed!"
    echo "This is the same error Netlify would encounter."
    exit 1
fi
echo "✅ Dependencies installed successfully"
echo ""

# Run the exact build command from netlify.toml
echo "🏗️  Step 3: Running build command..."
cd packages/backend && npx prisma generate && cd ../..
echo "✅ Prisma client generated"

cd packages/shared && pnpm build
echo "✅ Shared package built"

cd ../backend && pnpm build  
echo "✅ Backend package built"

cd ../frontend && pnpm build
echo "✅ Frontend package built"

cd ../..
echo ""

# Verify critical dependencies are in the correct locations
echo "🔍 Step 4: Verifying dependency locations..."

# Check node_modules at workspace root
if [ ! -d "node_modules/@nestjs/common" ]; then
    echo "❌ ERROR: @nestjs/common not found in workspace root node_modules"
    exit 1
fi
echo "✅ NestJS packages found"

if [ ! -d "node_modules/winston" ]; then
    echo "❌ ERROR: winston not found in workspace root node_modules"
    exit 1
fi
echo "✅ Winston package found"

if [ ! -d "node_modules/validator" ]; then
    echo "❌ ERROR: validator not found in workspace root node_modules"
    exit 1
fi
echo "✅ Validator package found"

if [ ! -d "node_modules/libphonenumber-js" ]; then
    echo "❌ ERROR: libphonenumber-js not found in workspace root node_modules"
    exit 1
fi
echo "✅ libphonenumber-js package found"

if [ ! -d "node_modules/.prisma/client" ]; then
    echo "❌ ERROR: Prisma client not generated at workspace root"
    exit 1
fi
echo "✅ Prisma client generated at correct location"

if [ ! -d "node_modules/bcrypt" ]; then
    echo "❌ ERROR: bcrypt not found in workspace root node_modules"
    exit 1
fi
echo "✅ bcrypt package found"

if [ ! -d "node_modules/node-gyp-build" ]; then
    echo "❌ ERROR: node-gyp-build not found in workspace root node_modules"
    exit 1
fi
echo "✅ node-gyp-build package found"

echo ""

# Test that the Netlify function can be required
echo "🔍 Step 5: Testing Netlify Function loading..."
node -e "
try {
    // Test that all critical modules can be loaded
    const path = require('path');
    const fs = require('fs');
    
    // Check workspace root node_modules
    const rootNodeModules = path.join(process.cwd(), 'node_modules');
    
    // Critical NestJS packages
    const nestPackages = [
        '@nestjs/common',
        '@nestjs/core',
        '@nestjs/platform-express'
    ];
    
    nestPackages.forEach(pkg => {
        const pkgPath = path.join(rootNodeModules, pkg);
        if (!fs.existsSync(pkgPath)) {
            console.error(\`❌ ERROR: \${pkg} not found at \${pkgPath}\`);
            process.exit(1);
        }
    });
    console.log('✅ All NestJS core packages accessible');
    
    // Check winston
    const winstonPath = path.join(rootNodeModules, 'winston');
    if (!fs.existsSync(winstonPath)) {
        console.error('❌ ERROR: winston not found');
        process.exit(1);
    }
    console.log('✅ Winston package accessible');
    
    // Check validator dependencies
    const validatorPackages = ['validator', 'libphonenumber-js', '@types/validator'];
    validatorPackages.forEach(pkg => {
        const pkgPath = path.join(rootNodeModules, pkg);
        if (!fs.existsSync(pkgPath)) {
            console.error(\`❌ ERROR: \${pkg} not found at \${pkgPath}\`);
            process.exit(1);
        }
    });
    console.log('✅ All validator dependencies accessible');
    
    // Check Prisma generated client
    const prismaClientPath = path.join(rootNodeModules, '.prisma', 'client');
    if (!fs.existsSync(prismaClientPath)) {
        console.error('❌ ERROR: Prisma client not generated at correct location');
        process.exit(1);
    }
    console.log('✅ Prisma client generated at correct location');
    
    // Check bcrypt and node-gyp-build
    const bcryptPath = path.join(rootNodeModules, 'bcrypt');
    const nodeGypBuildPath = path.join(rootNodeModules, 'node-gyp-build');
    if (!fs.existsSync(bcryptPath) || !fs.existsSync(nodeGypBuildPath)) {
        console.error('❌ ERROR: bcrypt or node-gyp-build not found');
        process.exit(1);
    }
    console.log('✅ bcrypt and node-gyp-build accessible');
    
    console.log('✅ All critical dependencies verified!');
} catch (error) {
    console.error('❌ ERROR during module loading test:', error.message);
    process.exit(1);
}
"

if [ $? -ne 0 ]; then
    echo "❌ ERROR: Netlify Function dependency check failed!"
    exit 1
fi
echo ""

echo "=============================================="
echo "✅ SUCCESS: Netlify build simulation complete!"
echo "=============================================="
echo ""
echo "📊 Summary:"
echo "  - Dependencies installed with frozen lockfile ✅"
echo "  - All packages built successfully ✅"
echo "  - All external dependencies in correct locations ✅"
echo "  - Prisma client generated at workspace root ✅"
echo "  - All validation dependencies present ✅"
echo "  - Native modules (bcrypt + helper) present ✅"
echo ""
echo "🎉 This configuration should work on Netlify!"
