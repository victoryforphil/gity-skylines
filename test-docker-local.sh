#!/bin/bash
set -e

echo "🐳 Testing Docker Build Locally"
echo "==============================="

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not available in this environment"
    echo "ℹ️  This test should be run in an environment with Docker installed"
    exit 0
fi

echo "📋 Building Docker image..."
docker build -t github-city-generator:local-test .

echo "🚀 Starting container..."
docker run -d --name local-test-container -p 8081:80 github-city-generator:local-test

echo "⏳ Waiting for container to start..."
sleep 10

echo "🧪 Testing container..."
# Test that the container is running
if ! docker ps | grep -q local-test-container; then
    echo "❌ Container is not running"
    docker logs local-test-container
    exit 1
fi

# Test HTTP endpoints (if curl is available)
if command -v curl &> /dev/null; then
    echo "🌐 Testing HTTP endpoints..."
    if curl -f http://localhost:8081/ > /dev/null 2>&1; then
        echo "✅ Root endpoint is working"
    else
        echo "❌ Root endpoint failed"
        docker logs local-test-container
        exit 1
    fi
    
    if curl -f http://localhost:8081/index.html > /dev/null 2>&1; then
        echo "✅ index.html is being served"
    else
        echo "❌ index.html failed"
        docker logs local-test-container
        exit 1
    fi
else
    echo "ℹ️  curl not available, skipping HTTP tests"
fi

echo "🧹 Cleaning up..."
docker stop local-test-container
docker rm local-test-container
docker rmi github-city-generator:local-test

echo "✅ All Docker tests passed!"
