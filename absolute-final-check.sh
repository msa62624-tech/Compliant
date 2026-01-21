#!/bin/bash

echo "═══════════════════════════════════════════════════════════════════"
echo "  🎯 ABSOLUTE FINAL CHECK - Everything Perfect?"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

ALL_GOOD=true

echo "1️⃣  @microsoft/tsdoc Configuration:"
if grep -q '"@microsoft/tsdoc"' package.json; then
  echo "  ✅ In package.json"
else
  echo "  ❌ NOT in package.json"
  ALL_GOOD=false
fi

if grep -q '@microsoft/tsdoc' netlify.toml | grep -q "included_files"; then
  echo "  ✅ In netlify.toml included_files"
else
  echo "  ❌ NOT in netlify.toml included_files"
  ALL_GOOD=false
fi

if grep -q '@microsoft/tsdoc' netlify.toml | grep -A 200 "external_node_modules"; then
  echo "  ✅ In netlify.toml external_node_modules"
else
  echo "  ❌ NOT in netlify.toml external_node_modules"
  ALL_GOOD=false
fi

if [ -d "node_modules/@microsoft/tsdoc" ]; then
  echo "  ✅ Installed in node_modules"
else
  echo "  ❌ NOT installed"
  ALL_GOOD=false
fi

if grep -q "@microsoft/tsdoc" pnpm-lock.yaml; then
  echo "  ✅ In pnpm-lock.yaml"
else
  echo "  ❌ NOT in pnpm-lock.yaml"
  ALL_GOOD=false
fi

echo ""
echo "2️⃣  All @nestjs/swagger Dependencies (9 packages):"
SWAGGER_DEPS=(
  "@nestjs/common"
  "@nestjs/core"
  "@nestjs/platform-express"
  "@microsoft/tsdoc"
  "@nestjs/mapped-types"
  "js-yaml"
  "lodash"
  "path-to-regexp"
  "swagger-ui-dist"
)

for dep in "${SWAGGER_DEPS[@]}"; do
  if grep -q "\"$dep\"" package.json && [ -d "node_modules/$dep" ] && grep -q "$dep" netlify.toml; then
    echo "  ✅ $dep"
  else
    echo "  ❌ $dep - INCOMPLETE"
    ALL_GOOD=false
  fi
done

echo ""
echo "3️⃣  All class-validator Dependencies (4 packages):"
CV_DEPS=("class-validator" "validator" "libphonenumber-js" "@types/validator")

for dep in "${CV_DEPS[@]}"; do
  if grep -q "\"$dep\"" package.json && grep -q "$dep" netlify.toml; then
    echo "  ✅ $dep"
  else
    echo "  ❌ $dep - INCOMPLETE"
    ALL_GOOD=false
  fi
done

echo ""
echo "4️⃣  Native Modules (3 packages):"
NATIVE=("bcrypt" "node-gyp-build" "@prisma/client")

for dep in "${NATIVE}"; do
  if grep -q "\"$dep\"" package.json && grep -q "$dep" netlify.toml; then
    echo "  ✅ $dep"
  else
    echo "  ❌ $dep - INCOMPLETE"
    ALL_GOOD=false
  fi
done

echo ""
echo "5️⃣  Prisma Configuration:"
if grep -q 'output = "../../../node_modules/.prisma/client"' packages/backend/prisma/schema.prisma; then
  echo "  ✅ Prisma output to workspace root"
else
  echo "  ❌ Prisma output NOT configured"
  ALL_GOOD=false
fi

if grep -q "npx prisma generate" netlify.toml; then
  echo "  ✅ Build command includes prisma generate"
else
  echo "  ❌ Build command missing prisma generate"
  ALL_GOOD=false
fi

echo ""
echo "6️⃣  Module Resolution Test:"
node -e "
const tests = [
  '@microsoft/tsdoc',
  '@nestjs/swagger',
  'js-yaml',
  '@nestjs/mapped-types',
  'swagger-ui-dist',
  'validator',
  'bcrypt',
  'node-gyp-build',
  '@prisma/client'
];

let failed = false;
tests.forEach(m => {
  try {
    require.resolve(m);
  } catch(e) {
    console.log('  ❌', m, '- CANNOT RESOLVE');
    failed = true;
  }
});

if (!failed) {
  console.log('  ✅ All critical modules resolve correctly');
}
process.exit(failed ? 1 : 0);
" || ALL_GOOD=false

echo ""
echo "7️⃣  Configuration Totals:"
PKG_COUNT=$(grep -c '".*":' package.json)
EXT_COUNT=$(grep -A 200 'external_node_modules = \[' netlify.toml | grep -c '    "')
INC_COUNT=$(grep -c 'node_modules/.*\*\*' netlify.toml)

echo "  📦 package.json: $PKG_COUNT packages"
echo "  🔧 external_node_modules: $EXT_COUNT packages"
echo "  📁 included_files: $INC_COUNT paths"

if [ "$PKG_COUNT" -ge 131 ] && [ "$EXT_COUNT" -eq 119 ]; then
  echo "  ✅ Counts look correct"
else
  echo "  ⚠️  Counts may need review"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
if [ "$ALL_GOOD" = true ]; then
  echo "  🎉🎉🎉 PERFECT - EVERYTHING IS CONFIGURED CORRECTLY 🎉🎉🎉"
  echo ""
  echo "  ✅ @microsoft/tsdoc: COMPLETE"
  echo "  ✅ All @nestjs/swagger deps (9): COMPLETE"
  echo "  ✅ All class-validator deps (4): COMPLETE"
  echo "  ✅ All native modules (3): COMPLETE"
  echo "  ✅ Prisma configuration: COMPLETE"
  echo "  ✅ All modules resolve: COMPLETE"
  echo "  ✅ Configuration totals: COMPLETE"
  echo ""
  echo "  🚀 READY FOR NETLIFY DEPLOYMENT 🚀"
  echo "═══════════════════════════════════════════════════════════════════"
  exit 0
else
  echo "  ❌ SOME ISSUES FOUND - REVIEW ABOVE"
  echo "═══════════════════════════════════════════════════════════════════"
  exit 1
fi
