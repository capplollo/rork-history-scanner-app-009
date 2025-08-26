#!/bin/bash

# Start both backend and frontend
echo "🚀 Starting History Scanner App..."
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found! Please create one with your environment variables."
    exit 1
fi

# Start backend in background
echo "📡 Starting backend server on port 8081..."
bun run backend/server.ts &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start frontend
echo "📱 Starting Expo frontend..."
bunx rork start -p fydvtqcj1upvf8jg2d6lf --tunnel

# Clean up background process when script exits
trap "kill $BACKEND_PID 2>/dev/null" EXIT