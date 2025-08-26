#!/bin/bash

# Heritage Scanner App Startup Script
echo "🏛️ Starting Heritage Scanner App..."
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found! Please create one based on the template"
    exit 1
fi

# Load environment variables
source .env

# Check if OpenAI API key is configured
if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "YOUR_OPENAI_API_KEY_HERE" ]; then
    echo "⚠️  Warning: OpenAI API key not configured properly"
    echo "   Please set OPENAI_API_KEY in your .env file"
else
    echo "✅ OpenAI API key configured"
fi

# Check if Supabase is configured
if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ]; then
    echo "⚠️  Warning: Supabase URL not configured"
    echo "   Please set EXPO_PUBLIC_SUPABASE_URL in your .env file"
else
    echo "✅ Supabase configured"
fi

echo ""
echo "🔧 Starting backend server on port 8081..."
# Start backend in background
bun run backend/server.ts &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

echo "📱 Starting Expo development server..."
# Start Expo app
bunx rork start -p fydvtqcj1upvf8jg2d6lf --tunnel

# Cleanup function
cleanup() {
    echo "\n🧹 Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup INT TERM EXIT