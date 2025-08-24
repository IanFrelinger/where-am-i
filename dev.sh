#!/bin/bash

# Development script for Where Am I application
set -e

echo "🚀 Starting development environment..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Start development servers
echo "🔥 Starting development servers..."
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:8787"
echo ""
echo "Press Ctrl+C to stop all servers"

# Start both frontend and backend concurrently
pnpm dev
