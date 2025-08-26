#!/bin/bash

# RORK History Scanner App - Complete Setup and Restore Script
# This script restores everything to the current RORK version

set -e

echo "🚀 Starting RORK History Scanner App Setup and Restore..."
echo "=================================================="

# Set up Bun environment
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "📦 Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
fi

echo "✅ Bun version: $(bun --version)"

# Navigate to project root
cd "$(dirname "$0")"

echo "📦 Installing main project dependencies..."
bun install

echo "📦 Installing backend dependencies..."
cd backend
bun install
cd ..

echo "🔧 Setting up environment variables..."
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please ensure your .env file is present."
    exit 1
fi

echo "✅ Environment variables configured"

echo "🗄️ Setting up Supabase database..."
echo "Note: Make sure your Supabase project is properly configured with the schema from supabase-setup.sql"

echo "🔍 Checking backend configuration..."
if [ -f backend/server.ts ]; then
    echo "✅ Backend server file found"
else
    echo "❌ Backend server file missing"
    exit 1
fi

echo "🔍 Checking frontend configuration..."
if [ -f app.config.js ]; then
    echo "✅ App config found"
else
    echo "❌ App config missing"
    exit 1
fi

echo "🚀 Starting backend server..."
cd backend
bun run dev &
BACKEND_PID=$!
cd ..

echo "⏳ Waiting for backend to start..."
sleep 3

echo "🌐 Starting RORK development server..."
echo "Project ID: fydvtqcj1upvf8jg2d6lf"
echo "Starting with tunnel and web support..."

# Start RORK with tunnel and web support
bunx rork start -p fydvtqcj1upvf8jg2d6lf --tunnel --web

echo "✅ RORK History Scanner App setup complete!"
echo "=================================================="
echo "📱 App should be running at the URL provided by RORK"
echo "🔧 Backend API running on http://localhost:8081"
echo "🔍 Health check: http://localhost:8081/api"
echo "=================================================="

# Cleanup function
cleanup() {
    echo "🛑 Shutting down servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep script running
wait
