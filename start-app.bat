@echo off
echo 🏛️ Starting Heritage Scanner App...
echo.

REM Check if .env file exists
if not exist ".env" (
    echo ❌ .env file not found! Please create one based on the template
    pause
    exit /b 1
)

echo ✅ Environment file found
echo.

REM Start backend in background
echo 🔧 Starting backend server on port 8081...
start /B bun run backend/server.ts

REM Wait a moment for backend to start
echo Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

REM Start frontend
echo 📱 Starting Expo development server...
bunx rork start -p fydvtqcj1upvf8jg2d6lf --tunnel