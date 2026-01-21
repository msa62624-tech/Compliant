#!/bin/bash

echo "═══════════════════════════════════════════════════════════════════"
echo "  🔍 NETLIFY PERSPECTIVE - What Does Netlify Actually See?"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

echo "1️⃣  Checking what's ACTUALLY installed in node_modules..."
echo ""

# Get ALL packages in node_modules (excluding .bin, .pnpm, etc.)
INSTALLED=$(find node_modules -maxdepth 2 -type d -name "[^.]*" | grep -v "node_modules/$" | sed 's|node_modules/||' | grep -v "^$" | sort -u)
INSTALLED_COUNT=$(echo "$INSTALLED" | wc -l)

echo "  Total packages installed: $INSTALLED_COUNT"
echo ""

echo "2️⃣  Checking what's in our external_node_modules list..."
echo ""

EXTERNAL=$(grep -A 300 'external_node_modules = \[' netlify.toml | grep '    "' | sed 's/[",]//g' | awk '{print $1}' | sort -u)
EXTERNAL_COUNT=$(echo "$EXTERNAL" | wc -l)

echo "  Total in external_node_modules: $EXTERNAL_COUNT"
echo ""

echo "3️⃣  Finding packages that are installed but NOT in external list..."
echo ""

MISSING_FROM_EXTERNAL=()
for pkg in $INSTALLED; do
  if ! echo "$EXTERNAL" | grep -q "^$pkg$"; then
    # Skip certain packages that should be bundled
    if [[ "$pkg" != "aws-sdk" ]] && [[ "$pkg" != "openai" ]] && [[ "$pkg" != "@anthropic-ai"* ]] && \
       [[ "$pkg" != "@sendgrid"* ]] && [[ "$pkg" != "nodemailer" ]] && [[ "$pkg" != "cookie-parser" ]] && \
       [[ "$pkg" != "handlebars" ]] && [[ "$pkg" != "isomorphic-dompurify" ]] && [[ "$pkg" != "multer" ]] && \
       [[ "$pkg" != "passport-jwt" ]] && [[ "$pkg" != "pdf-parse" ]] && [[ "$pkg" != "pdfkit" ]] && \
       [[ "$pkg" != "@playwright"* ]] && [[ "$pkg" != "playwright"* ]] && [[ "$pkg" != "@types"* ]] && \
       [[ "$pkg" != "prettier" ]] && [[ "$pkg" != "ts-node" ]] && [[ "$pkg" != "turbo" ]] && \
       [[ "$pkg" != "typescript" ]] && [[ "$pkg" != "@swc"* ]] && [[ "$pkg" != "next" ]] && \
       [[ "$pkg" != "react"* ]] && [[ "$pkg" != "@next"* ]] && [[ "$pkg" != "eslint"* ]] && \
       [[ "$pkg" != "@eslint"* ]] && [[ "$pkg" != "postcss"* ]] && [[ "$pkg" != "tailwindcss" ]] && \
       [[ "$pkg" != "@tailwindcss"* ]] && [[ "$pkg" != "autoprefixer" ]] && [[ "$pkg" != "sharp" ]] && \
       [[ "$pkg" != "zod" ]] && [[ "$pkg" != "clsx" ]] && [[ "$pkg" != "lucide-react" ]] && \
       [[ "$pkg" != "@radix-ui"* ]] && [[ "$pkg" != "class-variance-authority" ]] && \
       [[ "$pkg" != "tailwind-merge" ]] && [[ "$pkg" != "sonner" ]]; then
      MISSING_FROM_EXTERNAL+=("$pkg")
    fi
  fi
done

if [ ${#MISSING_FROM_EXTERNAL[@]} -eq 0 ]; then
  echo "  ✅ All necessary packages are in external_node_modules"
else
  echo "  ⚠️  Found ${#MISSING_FROM_EXTERNAL[@]} packages that might need to be external:"
  echo ""
  
  for pkg in "${MISSING_FROM_EXTERNAL[@]}"; do
    # Check if it's actually used by our backend/external packages
    USED_BY=""
    
    # Check which external packages depend on this
    for ext_pkg in $EXTERNAL; do
      if [ -f "node_modules/$ext_pkg/package.json" ]; then
        if grep -q "\"$pkg\"" "node_modules/$ext_pkg/package.json" 2>/dev/null; then
          USED_BY="$ext_pkg"
          break
        fi
      fi
    done
    
    if [ ! -z "$USED_BY" ]; then
      echo "  ❌ $pkg (used by $USED_BY)"
    fi
  done
fi

echo ""
echo "4️⃣  Summary:"
echo "  - Installed packages: $INSTALLED_COUNT"
echo "  - In external list: $EXTERNAL_COUNT"
echo "  - Potentially missing: ${#MISSING_FROM_EXTERNAL[@]}"
echo ""

