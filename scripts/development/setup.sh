#!/bin/bash

# Sports Companion Backend - Quick Setup Script
# This script helps new developers set up the project quickly

set -e  # Exit on error

echo "🚀 Sports Companion Backend - Quick Setup"
echo "=========================================="
echo ""

# Check Node.js version
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js >= 18.0.0"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be >= 18.0.0 (current: $(node -v))"
    exit 1
fi
echo "✅ Node.js $(node -v) detected"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi
echo "✅ npm $(npm -v) detected"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "⚙️  Setting up environment variables..."
    
    if [ -f .env.development ]; then
        cp .env.development .env
        echo "✅ Created .env from .env.development"
    else
        echo "⚠️  .env.development not found. Creating basic .env file..."
        cat > .env << EOF
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/sportification
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-change-in-production
REDIS_URL=redis://localhost:6379
SESSION_COOKIE_NAME=sportification.sid
SESSION_TTL=3600
SESSION_REDIS_PREFIX=session:
EOF
        echo "✅ Created basic .env file"
    fi
    
    echo ""
    echo "⚠️  IMPORTANT: Update .env with your actual configuration!"
    echo "   - MongoDB URI"
    echo "   - JWT secrets (generate secure random strings)"
    echo "   - Redis URL (optional)"
else
    echo "✅ .env file already exists"
fi

# Build the project
echo ""
echo "🔨 Building the project..."
npm run build

# Run linter
echo ""
echo "🔍 Running code quality checks..."
npm run lint

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "📚 Next steps:"
echo "   1. Ensure MongoDB is running (default: localhost:27017)"
echo "   2. [Optional] Start Redis for caching (default: localhost:6379)"
echo "   3. Update .env file with your configuration"
echo "   4. Start development server: npm run dev"
echo ""
echo "📖 Documentation:"
echo "   - README.md - Project overview and setup"
echo "   - ONBOARDING.md - Developer onboarding guide"
echo "   - CONTRIBUTING.md - Contribution guidelines"
echo ""
echo "🎉 Happy coding!"
