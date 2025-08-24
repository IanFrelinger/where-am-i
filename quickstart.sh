#!/bin/bash

# Quick Start Script for Where Am I App
set -e

echo "🚀 Welcome to Where Am I! Let's get you started..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js 20+ required. Current version: $(node --version)"
    echo "📥 Download from: https://nodejs.org/"
    exit 1
fi

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

echo "✅ Prerequisites check passed!"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build packages
echo "🔨 Building packages..."
pnpm build

echo ""
echo "🎉 Setup complete! You can now:"
echo ""
echo "1. 🏠 Start development servers:"
echo "   pnpm dev"
echo ""
echo "2. 🌐 Open in browser:"
echo "   http://localhost:5173"
echo ""
echo "3. 🔧 Test API:"
echo "   curl http://localhost:8787/api/health"
echo ""
echo "4. ☁️  Deploy to AWS:"
echo "   ./deploy-local.sh"
echo ""
echo "📚 For more details, see SETUP.md"
echo "🚀 Happy coding!"
