@echo off
echo 🚀 Starting History Scanner App...
echo.

REM Check if .env file exists
if not exist ".env" (
    echo ❌ .env file not found! Please create one with your environment variables.
    pause
    exit /b 1
)

REM Start backend in background
echo 📡 Starting backend server on port 8081...
start /B bun run backend/server.ts

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
echo 📱 Starting Expo frontend...
bunx rork start -p fydvtqcj1upvf8jg2d6lf --tunnel