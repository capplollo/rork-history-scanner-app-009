# ElevenLabs Setup Guide

## 🎯 **Add Environment Variable**

Based on your environment variables screenshot, you need to add the ElevenLabs API key to your Expo environment variables.

### **Step 1: Add the Environment Variable**

In your Expo environment variables section, add:

**Key:** `EXPO_PUBLIC_ELEVENLABS_API_KEY`
**Value:** `sk_22cbad0171315d01474f3a02c222d9d04f67c9a5d8b3eae9`

### **Step 2: Save the Changes**

Click the "Save" button to apply the changes.

### **Step 3: Restart Your App**

After adding the environment variable, you need to restart your Expo development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart it
npx expo start --clear
```

## 🔧 **Why This is Needed**

The voice service is now configured to:
1. ✅ Check for the environment variable first
2. ✅ Use your API key if found
3. ✅ Fall back to built-in voices if not configured
4. ✅ Show proper status in voice settings

## 🎤 **What You'll See**

After adding the environment variable and restarting:

1. **Voice Settings** will show ElevenLabs voices with ⭐ icons
2. **Premium quality** voices will be available
3. **Test buttons** will work for all voices
4. **Console logs** will show "✅ ElevenLabs API key found"

## 🚨 **Current Issue**

The ElevenLabs voices aren't working because:
- ❌ Environment variable not set
- ❌ App needs restart after adding it
- ❌ Audio playback needs expo-av (optional enhancement)

## 🎉 **After Setup**

Once you add the environment variable and restart:

1. **ElevenLabs voices** will appear in voice settings
2. **Premium quality** will be marked with gold ⭐
3. **Voice testing** will work
4. **Better narration** for your monument descriptions

## 📱 **Test It**

1. Add the environment variable
2. Restart your app
3. Go to any scan result
4. Open voice settings
5. You should see ElevenLabs voices with ⭐ icons
6. Test a voice to hear the difference!

The environment variable is the missing piece to make ElevenLabs work! 🎤✨
