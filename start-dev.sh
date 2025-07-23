#!/bin/bash

echo "🚀 Starting GitHub City Generator development environment..."
echo ""

# Navigate to the project directory
cd github-city-generator

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    bun install
    echo ""
fi

echo "🌟 Starting Vite development server..."
echo "🌐 Your app will be available at: http://localhost:5173"
echo "🔧 To stop the server, press Ctrl+C"
echo ""

# Start the development server
bun run dev
