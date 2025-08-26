# Rork Preview Troubleshooting Guide

## 🚨 Main Issue Fixed: Missing Environment Variable

The main error you were seeing was:
```
No base url found, please set EXPO_PUBLIC_RORK_API_BASE_URL
```

**✅ FIXED**: Added `EXPO_PUBLIC_RORK_API_BASE_URL` to `app.config.js` with the correct Rork URL.

## 🔧 Configuration Changes Made

### 1. Environment Variables
- ✅ Added `EXPO_PUBLIC_RORK_API_BASE_URL` to `app.config.js`
- ✅ Set default value to `https://73qgocn9i14y5zez10kps.rork.live`

### 2. Backend Server
- ✅ Unified backend to use Hono server (`server.ts`)
- ✅ Removed conflicting Express server (`server.js`)
- ✅ Added OpenAI API endpoints to Hono server
- ✅ Updated backend package.json to use Bun

### 3. tRPC Configuration
- ✅ Fixed tRPC client configuration
- ✅ Ensured proper endpoint routing

## 🚀 How to Start the Preview

### Option 1: Use the provided script
```bash
./start-rork-preview.sh
```

### Option 2: Manual start
```bash
bunx rork start -p fydvtqcj1upvf8jg2d6lf --tunnel
```

## 🔑 Required Environment Variables

Set these environment variables for full functionality:

```bash
# Required for basic functionality
export EXPO_PUBLIC_RORK_API_BASE_URL="https://73qgocn9i14y5zez10kps.rork.live"
export EXPO_PUBLIC_SUPABASE_URL="https://qgpjmcpnytkewtmjfkzw.supabase.co"
export EXPO_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFncGptY3BueXRrZXd0bWpma3p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1Mzg2MTQsImV4cCI6MjA3MTExNDYxNH0.RDznTdQFOAO6wFVaM3jWBE7yldRTASpoLut-PIzzJZk"

# Optional for AI features
export EXPO_PUBLIC_OPENAI_API_KEY="your-openai-api-key"
export OPENAI_API_KEY="your-openai-api-key"

# Optional for voice features
export EXPO_PUBLIC_ELEVENLABS_API_KEY="your-elevenlabs-api-key"
```

## 🐛 Common Issues and Solutions

### 1. "No base url found" Error
**Cause**: Missing `EXPO_PUBLIC_RORK_API_BASE_URL`
**Solution**: ✅ Already fixed in `app.config.js`

### 2. Backend Connection Issues
**Cause**: Server not running or wrong port
**Solution**: 
- Backend runs on port 8081
- Uses Hono server with tRPC
- Check `backend/server.ts` is running

### 3. AI Features Not Working
**Cause**: Missing OpenAI API key
**Solution**: Set `EXPO_PUBLIC_OPENAI_API_KEY` or `OPENAI_API_KEY`

### 4. Voice Features Not Working
**Cause**: Missing ElevenLabs API key
**Solution**: Set `EXPO_PUBLIC_ELEVENLABS_API_KEY`

### 5. Supabase Connection Issues
**Cause**: Wrong Supabase credentials
**Solution**: Check Supabase URL and anon key in environment

## 📁 File Structure Overview

```
rork-history-scanner-app-009/
├── app/                    # Expo Router app pages
├── backend/               # Backend server (Hono + tRPC)
│   ├── server.ts         # Main server file
│   ├── hono.ts           # Hono app configuration
│   └── trpc/             # tRPC routes
├── lib/                  # Shared libraries
│   ├── trpc.ts          # tRPC client configuration
│   └── supabase.ts      # Supabase client
├── services/             # API services
├── providers/            # React context providers
├── app.config.js         # Expo configuration
└── package.json          # Dependencies
```

## 🔍 Debugging Steps

1. **Check Environment Variables**:
   ```bash
   echo $EXPO_PUBLIC_RORK_API_BASE_URL
   echo $EXPO_PUBLIC_SUPABASE_URL
   ```

2. **Check Backend Server**:
   ```bash
   curl http://localhost:8081/
   ```

3. **Check Browser Console**:
   - Open browser developer tools
   - Look for JavaScript errors
   - Check network requests

4. **Check Rork Logs**:
   - Look for error messages in terminal
   - Check if tunnel is working

## 🎯 Next Steps

1. **Start the preview**: `./start-rork-preview.sh`
2. **Test basic functionality**: Check if app loads
3. **Test AI features**: Try scanning an image
4. **Test authentication**: Try login/signup
5. **Test voice features**: If ElevenLabs key is set

## 📞 Support

If you still encounter issues:
1. Check the browser console for errors
2. Verify all environment variables are set
3. Ensure Rork CLI is up to date
4. Check if the backend server is running on port 8081
