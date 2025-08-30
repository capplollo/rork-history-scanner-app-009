import 'dotenv/config';

export default {
  expo: {
    name: "History Scanner",
    slug: "history-scanner",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "historyscanner",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.rork.historyscanner",
      infoPlist: {
        NSPhotoLibraryUsageDescription: "Allow History Scanner to access your photos for monument analysis",
        NSCameraUsageDescription: "Allow History Scanner to access your camera for monument scanning",
        NSMicrophoneUsageDescription: "Allow History Scanner to access your microphone for voice features",
        UIBackgroundModes: ["audio"],
        NSPhotoLibraryAddUsageDescription: "Allow History Scanner to save analyzed images."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.rork.historyscanner",
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "RECORD_AUDIO",
        "INTERNET",
        "READ_MEDIA_IMAGES",
        "READ_MEDIA_VIDEO",
        "READ_MEDIA_AUDIO",
        "READ_MEDIA_VISUAL_USER_SELECTED",
        "ACCESS_MEDIA_LOCATION"
      ]
    },
    web: {
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      [
        "expo-router",
        {
          "origin": "https://rork.com/"
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "History Scanner accesses your photos to analyze historical monuments."
        }
      ],
      [
        "expo-av",
        {
          "microphonePermission": "Allow History Scanner to access your microphone"
        }
      ],
      [
        "expo-media-library",
        {
          "photosPermission": "Allow History Scanner to access your photos.",
          "savePhotosPermission": "Allow History Scanner to save analyzed images.",
          "isAccessMediaLocationEnabled": true
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      EXPO_PUBLIC_ELEVENLABS_API_KEY: process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY,
      EXPO_PUBLIC_APP_SCHEME: process.env.EXPO_PUBLIC_APP_SCHEME || "historyscanner",
      EXPO_PUBLIC_SITE_URL: process.env.EXPO_PUBLIC_SITE_URL || "https://rork.com",
      EXPO_PUBLIC_REDIRECT_URL: process.env.EXPO_PUBLIC_REDIRECT_URL || "historyscanner://email-confirmation",
      EXPO_PUBLIC_MAX_IMAGE_SIZE: process.env.EXPO_PUBLIC_MAX_IMAGE_SIZE || "5242880",
      EXPO_PUBLIC_VOICE_ENABLED: process.env.EXPO_PUBLIC_VOICE_ENABLED || "true",
      EXPO_PUBLIC_DEBUG_MODE: process.env.EXPO_PUBLIC_DEBUG_MODE || "true",
      EXPO_PUBLIC_SESSION_TIMEOUT: process.env.EXPO_PUBLIC_SESSION_TIMEOUT || "60"
    }
  }
};
