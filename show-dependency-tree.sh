#!/bin/bash

echo "═══════════════════════════════════════════════════════════════════"
echo "  📊 COMPLETE DEPENDENCY ANALYSIS"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

echo "Current Configuration:"
echo "  - Total in package.json: $(grep -c '".*":' package.json)"
echo "  - Total external in netlify.toml: $(grep -A 300 'external_node_modules = \[' netlify.toml | grep -c '    "')"
echo "  - Total installed in node_modules: $(find node_modules -maxdepth 1 -type d | wc -l)"
echo ""

echo "═══════════════════════════════════════════════════════════════════"
echo "  🔍 Analyzing Key Package Dependencies"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

analyze_deps() {
  local pkg=$1
  echo "--- $pkg ---"
  if [ -f "node_modules/$pkg/package.json" ]; then
    echo "Dependencies:"
    cat "node_modules/$pkg/package.json" | grep -A 50 '"dependencies"' | grep '    "' | grep -v '"dependencies"' | sed 's/[",:]//g' | awk '{print "  "$1}' | head -20
  else
    echo "  Package not found"
  fi
  echo ""
}

# Analyze our key external packages
analyze_deps "@nestjs/swagger"
analyze_deps "class-validator"
analyze_deps "@nestjs/common"
analyze_deps "winston"
analyze_deps "nest-winston"

echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "To see full dependency tree, run: npm list --all | head -200"
echo ""
