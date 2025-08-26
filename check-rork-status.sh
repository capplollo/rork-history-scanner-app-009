#!/bin/bash

# RORK History Scanner App - Status Check Script
# This script checks the status of all components

set -e

echo "🔍 RORK History Scanner App - Status Check"
echo "=========================================="

# Set up Bun environment
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# Check Bun installation
echo "📦 Checking Bun installation..."
if command -v bun &> /dev/null; then
    echo "✅ Bun is installed: $(bun --version)"
else
    echo "❌ Bun is not installed"
    exit 1
fi

# Check project structure
echo ""
echo "📁 Checking project structure..."
if [ -f "package.json" ]; then
    echo "✅ package.json found"
else
    echo "❌ package.json missing"
    exit 1
fi

if [ -f "app.config.js" ]; then
    echo "✅ app.config.js found"
else
    echo "❌ app.config.js missing"
    exit 1
fi

if [ -f ".env" ]; then
    echo "✅ .env file found"
else
    echo "❌ .env file missing"
    exit 1
fi

if [ -d "backend" ]; then
    echo "✅ backend directory found"
else
    echo "❌ backend directory missing"
    exit 1
fi

if [ -f "backend/server.ts" ]; then
    echo "✅ backend server.ts found"
else
    echo "❌ backend server.ts missing"
    exit 1
fi

# Check dependencies
echo ""
echo "📦 Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "✅ Main dependencies installed"
else
    echo "❌ Main dependencies not installed"
fi

if [ -d "backend/node_modules" ]; then
    echo "✅ Backend dependencies installed"
else
    echo "❌ Backend dependencies not installed"
fi

# Check environment variables
echo ""
echo "🔧 Checking environment variables..."
if grep -q "EXPO_PUBLIC_SUPABASE_URL" .env; then
    echo "✅ Supabase URL configured"
else
    echo "❌ Supabase URL not configured"
fi

if grep -q "EXPO_PUBLIC_SUPABASE_ANON_KEY" .env; then
    echo "✅ Supabase Anon Key configured"
else
    echo "❌ Supabase Anon Key not configured"
fi

if grep -q "OPENAI_API_KEY" .env; then
    echo "✅ OpenAI API Key configured"
else
    echo "❌ OpenAI API Key not configured"
fi

# Check RORK configuration
echo ""
echo "🌐 Checking RORK configuration..."
if grep -q "fydvtqcj1upvf8jg2d6lf" package.json; then
    echo "✅ RORK project ID configured"
else
    echo "❌ RORK project ID not configured"
fi

# Check if backend is running
echo ""
echo "🔧 Checking backend status..."
if curl -s http://localhost:8081/api > /dev/null 2>&1; then
    echo "✅ Backend server is running on port 8081"
else
    echo "❌ Backend server is not running on port 8081"
fi

# Check Supabase connection
echo ""
echo "🗄️ Checking Supabase connection..."
SUPABASE_URL=$(grep "EXPO_PUBLIC_SUPABASE_URL" .env | cut -d '=' -f2)
if [ ! -z "$SUPABASE_URL" ]; then
    if curl -s "$SUPABASE_URL/rest/v1/" > /dev/null 2>&1; then
        echo "✅ Supabase connection successful"
    else
        echo "❌ Supabase connection failed"
    fi
else
    echo "❌ Supabase URL not found in .env"
fi

echo ""
echo "=========================================="
echo "🎯 Status check complete!"
echo ""
echo "To start the application:"
echo "  ./restore-rork-setup.sh"
echo ""
echo "Or manually:"
echo "  1. Start backend: cd backend && bun run dev"
echo "  2. Start frontend: bunx rork start -p fydvtqcj1upvf8jg2d6lf --tunnel --web"
echo "=========================================="
