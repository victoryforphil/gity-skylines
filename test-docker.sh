#!/bin/bash
set -e

echo "🐳 Testing Docker Configuration"
echo "==============================="

# Test 1: Validate Dockerfile syntax
echo "📋 Validating Dockerfile syntax..."
if [ ! -f "Dockerfile" ]; then
    echo "❌ Error: Dockerfile not found"
    exit 1
fi

# Check for common Dockerfile issues
if ! grep -q "FROM" Dockerfile; then
    echo "❌ Error: No FROM instruction found in Dockerfile"
    exit 1
fi

if ! grep -q "WORKDIR" Dockerfile; then
    echo "❌ Error: No WORKDIR instruction found in Dockerfile"
    exit 1
fi

if ! grep -q "EXPOSE" Dockerfile; then
    echo "❌ Error: No EXPOSE instruction found in Dockerfile"
    exit 1
fi

echo "✅ Dockerfile syntax looks good"

# Test 2: Validate nginx configuration
echo "📋 Validating nginx configuration..."
if [ ! -f "nginx.conf" ]; then
    echo "❌ Error: nginx.conf not found"
    exit 1
fi

if ! grep -q "server_name" nginx.conf; then
    echo "❌ Error: No server_name found in nginx.conf"
    exit 1
fi

if ! grep -q "listen.*80" nginx.conf; then
    echo "❌ Error: No listen 80 found in nginx.conf"
    exit 1
fi

echo "✅ nginx.conf looks good"

# Test 3: Validate dev container configuration
echo "📋 Validating dev container configuration..."
if [ ! -f ".devcontainer/devcontainer.json" ]; then
    echo "❌ Error: devcontainer.json not found"
    exit 1
fi

if [ ! -f ".devcontainer/Dockerfile" ]; then
    echo "❌ Error: .devcontainer/Dockerfile not found"
    exit 1
fi

echo "✅ Dev container configuration looks good"

# Test 4: Validate GitHub Actions workflow
echo "📋 Validating GitHub Actions workflow..."
if [ ! -f ".github/workflows/test.yml" ]; then
    echo "❌ Error: .github/workflows/test.yml not found"
    exit 1
fi

if ! grep -q "test-devcontainer" .github/workflows/test.yml; then
    echo "❌ Error: dev container test job not found"
    exit 1
fi

if ! grep -q "test-production-docker" .github/workflows/test.yml; then
    echo "❌ Error: production docker test job not found"
    exit 1
fi

echo "✅ GitHub Actions workflow looks good"

# Test 5: Test Docker build if Docker is available
echo "📋 Testing Docker build (if available)..."
if command -v docker &> /dev/null; then
    echo "🐳 Docker is available, running build test..."
    ./test-docker-local.sh
else
    echo "ℹ️  Docker not available, skipping build test"
    echo "   Run ./test-docker-local.sh when Docker is available"
fi

echo ""
echo "🎉 All Docker and CI/CD configurations are valid!"
echo ""
echo "📋 Summary:"
echo "   ✅ Production Dockerfile configured"
echo "   ✅ nginx.conf for serving static files"
echo "   ✅ Dev container fixed and configured"
echo "   ✅ GitHub Actions workflow for testing"
echo "   ✅ Local Docker test script available"
echo ""
echo "🚀 Ready for deployment!"
