#!/bin/bash

echo "═══════════════════════════════════════════════════════════════════"
echo "  🔍 COMPREHENSIVE DEPENDENCY ANALYSIS - Finding ALL Missing Deps"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Get all packages currently in external_node_modules
echo "📦 Current external packages in netlify.toml:"
CURRENT_EXTERNAL=$(grep -A 300 'external_node_modules = \[' netlify.toml | grep '    "' | sed 's/[",]//g' | awk '{print $1}' | sort)
CURRENT_COUNT=$(echo "$CURRENT_EXTERNAL" | wc -l)
echo "  Current count: $CURRENT_COUNT"
echo ""

# Now check ALL dependencies of ALL these packages
echo "🔍 Checking transitive dependencies of ALL external packages..."
echo ""

MISSING=()
CHECKED=()

check_package_deps() {
  local pkg=$1
  local level=$2
  
  # Avoid infinite loops
  if [[ " ${CHECKED[@]} " =~ " ${pkg} " ]]; then
    return
  fi
  CHECKED+=("$pkg")
  
  if [ ! -f "node_modules/$pkg/package.json" ]; then
    return
  fi
  
  # Get all dependencies (not devDependencies)
  DEPS=$(cat "node_modules/$pkg/package.json" | jq -r '.dependencies | keys[]' 2>/dev/null)
  
  for dep in $DEPS; do
    # Check if this dep is in our external list or package.json
    if ! echo "$CURRENT_EXTERNAL" | grep -q "^$dep$" && ! grep -q "\"$dep\"" package.json; then
      # Check if it's a real package (not a built-in)
      if [ -d "node_modules/$dep" ]; then
        MISSING+=("$dep")
        echo "  ❌ MISSING: $dep (required by $pkg)"
      fi
    fi
  done
}

# Check each external package
for pkg in $CURRENT_EXTERNAL; do
  if [ -d "node_modules/$pkg" ]; then
    check_package_deps "$pkg" 0
  fi
done

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  📊 RESULTS"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

if [ ${#MISSING[@]} -eq 0 ]; then
  echo "✅ No missing dependencies found!"
else
  echo "❌ Found ${#MISSING[@]} missing dependencies:"
  echo ""
  
  # Remove duplicates and sort
  UNIQUE_MISSING=($(printf '%s\n' "${MISSING[@]}" | sort -u))
  
  for dep in "${UNIQUE_MISSING[@]}"; do
    echo "  - $dep"
  done
  
  echo ""
  echo "These packages need to be added to:"
  echo "  1. package.json"
  echo "  2. netlify.toml included_files"
  echo "  3. netlify.toml external_node_modules"
fi

echo ""
echo "Total currently configured: $CURRENT_COUNT"
echo "Total missing: ${#UNIQUE_MISSING[@]}"
echo "Total needed: $((CURRENT_COUNT + ${#UNIQUE_MISSING[@]}))"
