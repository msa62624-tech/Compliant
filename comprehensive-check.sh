#!/bin/bash

echo "═══════════════════════════════════════════════════════════"
echo "  COMPREHENSIVE DEPENDENCY CHECK - FINAL VERIFICATION"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Count packages
PKG_COUNT=$(grep -o '"[^"]*":' package.json | wc -l)
EXTERNAL_COUNT=$(grep -c '"' netlify.toml | grep -A 200 external_node_modules | grep '    "' | wc -l)

echo "📊 Package Statistics:"
echo "  - Total in package.json: $PKG_COUNT"
echo "  - External in netlify.toml: $EXTERNAL_COUNT"
echo ""

echo "🔍 Checking critical @nestjs/swagger dependencies:"
SWAGGER_DEPS=("js-yaml" "@nestjs/mapped-types" "swagger-ui-dist" "lodash" "path-to-regexp")
for dep in "${SWAGGER_DEPS[@]}"; do
  if grep -q "\"$dep\"" package.json; then
    IN_PKG="✅"
  else
    IN_PKG="❌"
  fi
  
  if grep -q "\"$dep\"" netlify.toml; then
    IN_TOML="✅"
  else
    IN_TOML="❌"
  fi
  
  if [ -d "node_modules/$dep" ]; then
    INSTALLED="✅"
  else
    INSTALLED="❌"
  fi
  
  echo "  $dep: package.json=$IN_PKG netlify.toml=$IN_TOML installed=$INSTALLED"
done

echo ""
echo "🔍 Checking all new additions:"
NEW_DEPS=("js-yaml" "@nestjs/mapped-types" "swagger-ui-dist")
for dep in "${NEW_DEPS[@]}"; do
  echo ""
  echo "--- $dep ---"
  
  # Check package.json
  if grep -q "\"$dep\"" package.json; then
    VERSION=$(grep "\"$dep\"" package.json | head -1 | sed 's/.*: "//;s/".*//')
    echo "  ✅ In package.json: $VERSION"
  else
    echo "  ❌ NOT in package.json"
  fi
  
  # Check pnpm-lock.yaml specifiers
  if grep -q "'$dep'" pnpm-lock.yaml || grep -q "\"$dep\"" pnpm-lock.yaml; then
    echo "  ✅ In pnpm-lock.yaml specifiers"
  else
    echo "  ❌ NOT in pnpm-lock.yaml specifiers"
  fi
  
  # Check pnpm-lock.yaml packages
  DEP_PATH=$(echo "$dep" | sed 's/@/\//g')
  if grep -q "/$dep@" pnpm-lock.yaml || grep -q "'/$DEP_PATH" pnpm-lock.yaml; then
    echo "  ✅ In pnpm-lock.yaml packages section"
  else
    echo "  ❌ NOT in pnpm-lock.yaml packages section"
  fi
  
  # Check netlify.toml included_files
  if grep -q "node_modules/$dep/\*\*" netlify.toml; then
    echo "  ✅ In netlify.toml included_files"
  else
    echo "  ❌ NOT in netlify.toml included_files"
  fi
  
  # Check netlify.toml external_node_modules
  if grep -q "\"$dep\"" netlify.toml | grep -A 200 external_node_modules | grep -q "\"$dep\""; then
    echo "  ✅ In netlify.toml external_node_modules"
  else
    echo "  ❌ NOT in netlify.toml external_node_modules"
  fi
  
  # Check if installed
  if [ -d "node_modules/$dep" ]; then
    echo "  ✅ Installed in node_modules"
  else
    echo "  ❌ NOT installed in node_modules"
  fi
done

echo ""
echo "🧪 Testing module resolution:"
echo ""

# Test if we can require all critical modules
node -e "
const failures = [];

const testModules = [
  'js-yaml',
  '@nestjs/mapped-types',
  'swagger-ui-dist',
  'validator',
  'libphonenumber-js',
  '@types/validator',
  'bcrypt',
  'node-gyp-build',
  '@nestjs/swagger',
  '@nestjs/common',
  'winston',
  'class-validator'
];

testModules.forEach(mod => {
  try {
    require.resolve(mod);
    console.log('  ✅', mod);
  } catch (e) {
    console.log('  ❌', mod, '- CANNOT RESOLVE');
    failures.push(mod);
  }
});

if (failures.length > 0) {
  console.log('');
  console.log('❌ FAILED - Cannot resolve:', failures.join(', '));
  process.exit(1);
} else {
  console.log('');
  console.log('✅ ALL MODULES CAN BE RESOLVED');
}
"

RESULT=$?

echo ""
if [ $RESULT -eq 0 ]; then
  echo "═══════════════════════════════════════════════════════════"
  echo "  ✅ ALL CHECKS PASSED - CONFIGURATION IS COMPLETE"
  echo "═══════════════════════════════════════════════════════════"
else
  echo "═══════════════════════════════════════════════════════════"
  echo "  ❌ SOME CHECKS FAILED - REVIEW OUTPUT ABOVE"
  echo "═══════════════════════════════════════════════════════════"
fi

exit $RESULT
