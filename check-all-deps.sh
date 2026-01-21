#!/bin/bash

echo "=== COMPREHENSIVE DEPENDENCY CHECK ==="
echo ""
echo "Checking all @nestjs packages for peer dependencies..."
echo ""

# List of all @nestjs packages we use
NESTJS_PACKAGES=(
  "@nestjs/axios"
  "@nestjs/bullmq"
  "@nestjs/common"
  "@nestjs/config"
  "@nestjs/core"
  "@nestjs/jwt"
  "@nestjs/passport"
  "@nestjs/platform-express"
  "@nestjs/schedule"
  "@nestjs/swagger"
  "@nestjs/terminus"
  "@nestjs/throttler"
)

# Check each package
for pkg in "${NESTJS_PACKAGES[@]}"; do
  echo "--- $pkg ---"
  if [ -f "node_modules/$pkg/package.json" ]; then
    # Get peerDependencies
    PEERS=$(cat "node_modules/$pkg/package.json" | grep -A 50 '"peerDependencies"' | grep -E '^\s*"' | grep -v '"peerDependencies"' | sed 's/[",:]//g' | awk '{print $1}')
    
    if [ ! -z "$PEERS" ]; then
      echo "Peer dependencies found:"
      echo "$PEERS"
      
      # Check if each peer is in our package.json
      for peer in $PEERS; do
        if grep -q "\"$peer\"" package.json; then
          echo "  ✅ $peer - FOUND in package.json"
        else
          echo "  ❌ $peer - MISSING from package.json"
        fi
      done
    else
      echo "No peer dependencies"
    fi
  else
    echo "Package not found"
  fi
  echo ""
done

echo ""
echo "=== Checking specific known dependencies ==="
echo ""

# Check for packages that are commonly required
REQUIRED_PACKAGES=(
  "js-yaml"
  "path-to-regexp"
  "swagger-ui-express"
  "@nestjs/mapped-types"
)

for pkg in "${REQUIRED_PACKAGES[@]}"; do
  if grep -q "\"$pkg\"" package.json; then
    echo "✅ $pkg - in package.json"
  else
    echo "❌ $pkg - MISSING from package.json"
  fi
done

echo ""
echo "=== Checking @nestjs/swagger specific dependencies ==="
if [ -f "node_modules/@nestjs/swagger/package.json" ]; then
  echo "Dependencies of @nestjs/swagger:"
  cat "node_modules/@nestjs/swagger/package.json" | grep -A 20 '"dependencies"' | grep -E '^\s*"' | grep -v '"dependencies"' | sed 's/[",:]//g' | awk '{print $1}'
fi

