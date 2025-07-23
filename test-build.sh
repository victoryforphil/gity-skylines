#!/bin/bash
set -e

echo "🧪 Testing GitHub City Generator Build Process"
echo "=============================================="

# Test 1: Install dependencies
echo "📦 Installing dependencies..."
cd github-city-generator
bun install --frozen-lockfile

# Test 2: Run linting
echo "🔍 Running linting..."
bun run lint

# Test 3: Build the application
echo "🏗️  Building application..."
bun run build

# Test 4: Verify build output
echo "✅ Verifying build output..."
if [ ! -d "dist" ]; then
    echo "❌ Error: dist directory not found"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo "❌ Error: dist/index.html not found"
    exit 1
fi

if [ ! -d "dist/assets" ]; then
    echo "❌ Error: dist/assets directory not found"
    exit 1
fi

echo "✅ All tests passed!"
echo "📊 Build statistics:"
echo "   - HTML files: $(find dist -name "*.html" | wc -l)"
echo "   - JS files: $(find dist -name "*.js" | wc -l)"
echo "   - CSS files: $(find dist -name "*.css" | wc -l)"
echo "   - Total size: $(du -sh dist | cut -f1)"
