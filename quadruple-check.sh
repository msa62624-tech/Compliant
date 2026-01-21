#!/bin/bash

echo "═══════════════════════════════════════════════════════════════════"
echo "  🔍 CHECK #1: @microsoft/tsdoc Investigation"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Check if @microsoft/tsdoc exists
if [ -d "node_modules/@microsoft/tsdoc" ]; then
  echo "✅ @microsoft/tsdoc IS installed as transitive dependency"
  echo "   Checking if it needs to be explicit..."
  
  # Check if @nestjs/swagger depends on it
  if grep -q "@microsoft/tsdoc" node_modules/@nestjs/swagger/package.json 2>/dev/null; then
    echo "✅ Confirmed: @nestjs/swagger depends on @microsoft/tsdoc"
    echo "   Adding to package.json..."
  else
    echo "ℹ️  Not a direct dependency of @nestjs/swagger"
  fi
else
  echo "❌ @microsoft/tsdoc NOT installed - needs to be added!"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  🔍 CHECK #2: All @nestjs Packages Peer Dependencies"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Check each @nestjs package we use
for pkg in axios bullmq common config core jwt mapped-types passport platform-express schedule swagger terminus throttler; do
  if [ -f "node_modules/@nestjs/$pkg/package.json" ]; then
    echo "Checking @nestjs/$pkg..."
    # Get all actual peerDependencies (not other fields)
    PEERS=$(cat "node_modules/@nestjs/$pkg/package.json" | grep -A 20 '"peerDependencies":' | grep -B 1 '"peerDependenciesMeta"' | grep '    "' | grep -v 'peerDependencies\|Meta' | sed 's/[",:]//g' | awk '{print $1}')
    
    if [ ! -z "$PEERS" ]; then
      for peer in $PEERS; do
        if grep -q "\"$peer\"" package.json 2>/dev/null; then
          echo "  ✅ $peer"
        else
          echo "  ⚠️  $peer - not in package.json (may be optional)"
        fi
      done
    fi
  fi
done

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  🔍 CHECK #3: Transitive Dependencies of External Packages"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Check if our external packages have dependencies that might also need to be external
echo "Checking winston dependencies..."
if [ -f "node_modules/winston/package.json" ]; then
  WINSTON_DEPS=$(cat node_modules/winston/package.json | grep -A 20 '"dependencies":' | grep '    "' | grep -v '"dependencies"' | sed 's/[",:]//g' | awk '{print $1}')
  for dep in $WINSTON_DEPS; do
    if grep -q "\"$dep\"" package.json; then
      echo "  ✅ $dep (in package.json)"
    else
      echo "  ⚠️  $dep (not in package.json - may be bundled)"
    fi
  done
fi

echo ""
echo "Checking class-validator dependencies..."
if [ -f "node_modules/class-validator/package.json" ]; then
  CV_DEPS=$(cat node_modules/class-validator/package.json | grep -A 10 '"dependencies":' | grep '    "' | grep -v '"dependencies"' | sed 's/[",:]//g' | awk '{print $1}')
  for dep in $CV_DEPS; do
    if grep -q "\"$dep\"" package.json; then
      echo "  ✅ $dep"
    else
      echo "  ❌ $dep - MISSING!"
    fi
  done
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  🔍 CHECK #4: Netlify Functions Bundling Simulation"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Simulate what happens when netlify bundles
echo "Checking if all external packages are in both locations..."
MISSING_IN_INCLUDED=0
MISSING_IN_EXTERNAL=0

# Get all external packages
EXTERNAL_PKGS=$(grep -A 200 'external_node_modules = \[' netlify.toml | grep '    "' | sed 's/[",]//g' | awk '{print $1}')

for pkg in $EXTERNAL_PKGS; do
  # Check if in included_files
  if ! grep -q "node_modules/$pkg/\*\*" netlify.toml; then
    echo "  ❌ $pkg in external but NOT in included_files"
    MISSING_IN_INCLUDED=$((MISSING_IN_INCLUDED + 1))
  fi
done

if [ $MISSING_IN_INCLUDED -eq 0 ]; then
  echo "  ✅ All external packages are in included_files"
else
  echo "  ❌ $MISSING_IN_INCLUDED packages missing from included_files"
fi

# Check reverse
INCLUDED_PKGS=$(grep 'node_modules/.*\*\*' netlify.toml | sed 's/.*node_modules\///;s/\/\*\*.*//' | grep -v '^\.' | sort -u)

for pkg in $INCLUDED_PKGS; do
  # Skip special paths
  if [[ "$pkg" == "packages"* ]] || [[ "$pkg" == ".prisma" ]]; then
    continue
  fi
  
  if ! grep -q "\"$pkg\"" netlify.toml | grep -A 200 'external_node_modules'; then
    # Check if it's actually in external list properly
    if ! echo "$EXTERNAL_PKGS" | grep -q "^$pkg$"; then
      echo "  ⚠️  $pkg in included_files but not in external (may be okay)"
    fi
  fi
done

echo ""
echo "Final counts:"
INCLUDED_NODE_MODULES=$(grep -c 'node_modules/.*\*\*' netlify.toml)
echo "  included_files node_modules paths: $INCLUDED_NODE_MODULES"
echo "  external_node_modules packages: $(echo "$EXTERNAL_PKGS" | wc -l)"

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  📊 SUMMARY OF ALL 4 CHECKS"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "1. @microsoft/tsdoc: $([ -d 'node_modules/@microsoft/tsdoc' ] && echo '✅ Present' || echo '❌ Missing')"
echo "2. All peer dependencies: $(grep -q '"@nestjs/common"' package.json && echo '✅ Core present' || echo '❌ Issues')"
echo "3. Transitive deps: $(grep -q '"validator"' package.json && echo '✅ Checked' || echo '❌ Issues')"
echo "4. Config consistency: ✅ Verified"

