#!/bin/bash
set -e

echo "🏗️  Testing Production Build Process"
echo "===================================="

cd github-city-generator

echo "📦 Installing dependencies..."
bun install --frozen-lockfile

echo "🔍 Running linting..."
bun run lint

echo "��️  Building for production..."
bun run build

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

# Check that the HTML file contains expected content
if ! grep -q "<html" dist/index.html; then
    echo "❌ Error: index.html doesn't contain HTML content"
    exit 1
fi

# Check that assets were generated
js_files=$(find dist/assets -name "*.js" | wc -l)
css_files=$(find dist/assets -name "*.css" | wc -l)

if [ "$js_files" -eq 0 ]; then
    echo "❌ Error: No JavaScript files found in assets"
    exit 1
fi

if [ "$css_files" -eq 0 ]; then
    echo "❌ Error: No CSS files found in assets"
    exit 1
fi

echo "✅ Production build test passed!"
echo ""
echo "📊 Build statistics:"
echo "   - HTML files: $(find dist -name "*.html" | wc -l)"
echo "   - JS files: $js_files"
echo "   - CSS files: $css_files"
echo "   - Total dist size: $(du -sh dist | cut -f1)"
echo "   - Largest JS file: $(find dist/assets -name "*.js" -exec du -h {} \; | sort -hr | head -1)"

cd ..
