#!/bin/bash

echo "🚀 Starting Rork History Scanner App Preview..."
echo ""

# Check if environment variables are set
echo "📋 Checking environment configuration..."

# Set default values if not already set
export EXPO_PUBLIC_RORK_API_BASE_URL=${EXPO_PUBLIC_RORK_API_BASE_URL:-"https://73qgocn9i14y5zez10kps.rork.live"}
export EXPO_PUBLIC_SUPABASE_URL=${EXPO_PUBLIC_SUPABASE_URL:-"https://qgpjmcpnytkewtmjfkzw.supabase.co"}
export EXPO_PUBLIC_SUPABASE_ANON_KEY=${EXPO_PUBLIC_SUPABASE_ANON_KEY:-"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFncGptY3BueXRrZXd0bWpma3p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1Mzg2MTQsImV4cCI6MjA3MTExNDYxNH0.RDznTdQFOAO6wFVaM3jWBE7yldRTASpoLut-PIzzJZk"}

echo "✅ Rork API Base URL: $EXPO_PUBLIC_RORK_API_BASE_URL"
echo "✅ Supabase URL: $EXPO_PUBLIC_SUPABASE_URL"
echo ""

# Check if OpenAI API key is set
if [ -z "$EXPO_PUBLIC_OPENAI_API_KEY" ] && [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  Warning: OpenAI API key not set. Some AI features may not work."
    echo "   Set EXPO_PUBLIC_OPENAI_API_KEY or OPENAI_API_KEY environment variable."
    echo ""
fi

# Check if ElevenLabs API key is set
if [ -z "$EXPO_PUBLIC_ELEVENLABS_API_KEY" ]; then
    echo "⚠️  Warning: ElevenLabs API key not set. Voice features may not work."
    echo "   Set EXPO_PUBLIC_ELEVENLABS_API_KEY environment variable."
    echo ""
fi

echo "🎯 Starting Rork preview..."
echo "   Project ID: fydvtqcj1upvf8jg2d6lf"
echo "   This will open the app in your browser with tunnel enabled."
echo ""

# Start the Rork preview
bunx rork start -p fydvtqcj1upvf8jg2d6lf --tunnel

echo ""
echo "✅ Rork preview started successfully!"
echo "🌐 Your app should now be available in the browser."
echo ""
echo "📝 Troubleshooting tips:"
echo "   - If you see errors, check that all environment variables are set"
echo "   - Make sure you have the latest version of Rork CLI installed"
echo "   - Check the browser console for any JavaScript errors"
echo "   - The backend server runs on port 8081"
