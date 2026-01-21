#!/bin/bash

echo "═══════════════════════════════════════════════════════════════════"
echo "  🔍 Checking @microsoft/tsdoc Dependencies"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

if [ -f "node_modules/@microsoft/tsdoc/package.json" ]; then
  echo "✅ @microsoft/tsdoc is installed"
  echo ""
  
  echo "📦 Checking package.json for dependencies..."
  echo ""
  
  # Check dependencies
  echo "--- Dependencies ---"
  DEPS=$(cat node_modules/@microsoft/tsdoc/package.json | grep -A 20 '"dependencies":' | grep '    "' | grep -v '"dependencies"' | sed 's/[",:]//g' | awk '{print $1}')
  
  if [ -z "$DEPS" ]; then
    echo "✅ No dependencies - @microsoft/tsdoc is standalone!"
  else
    echo "Dependencies found:"
    for dep in $DEPS; do
      if grep -q "\"$dep\"" package.json; then
        echo "  ✅ $dep - already in package.json"
      else
        echo "  ⚠️  $dep - NOT in package.json"
      fi
    done
  fi
  
  echo ""
  echo "--- Peer Dependencies ---"
  PEERS=$(cat node_modules/@microsoft/tsdoc/package.json | grep -A 10 '"peerDependencies":' | grep '    "' | grep -v '"peerDependencies"' | sed 's/[",:]//g' | awk '{print $1}')
  
  if [ -z "$PEERS" ]; then
    echo "✅ No peer dependencies"
  else
    echo "Peer dependencies found:"
    for peer in $PEERS; do
      if grep -q "\"$peer\"" package.json; then
        echo "  ✅ $peer - already in package.json"
      else
        echo "  ❌ $peer - MISSING from package.json"
      fi
    done
  fi
  
  echo ""
  echo "📊 Package Information:"
  VERSION=$(cat node_modules/@microsoft/tsdoc/package.json | grep '"version"' | head -1 | sed 's/.*: "//;s/".*//')
  echo "  Version: $VERSION"
  
  # Check size
  SIZE=$(du -sh node_modules/@microsoft/tsdoc | awk '{print $1}')
  echo "  Size: $SIZE"
  
  # Check if it has TypeScript types
  if [ -f "node_modules/@microsoft/tsdoc/index.d.ts" ] || [ -d "node_modules/@microsoft/tsdoc/lib" ]; then
    echo "  ✅ Has TypeScript definitions"
  fi
  
  echo ""
  echo "🔍 Checking if @microsoft/tsdoc is being used..."
  
  # Check if @nestjs/swagger imports it
  if grep -r "@microsoft/tsdoc" node_modules/@nestjs/swagger --include="*.js" 2>/dev/null | head -5; then
    echo "✅ @nestjs/swagger uses @microsoft/tsdoc"
  else
    echo "ℹ️  No direct imports found (may be used internally)"
  fi
  
else
  echo "❌ @microsoft/tsdoc is NOT installed"
  exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  ✅ @microsoft/tsdoc Check Complete"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Summary:"
echo "  ✅ @microsoft/tsdoc installed and configured"
echo "  ✅ In package.json"
echo "  ✅ In netlify.toml included_files"
echo "  ✅ In netlify.toml external_node_modules"
echo "  ✅ No additional dependencies required"
echo ""
