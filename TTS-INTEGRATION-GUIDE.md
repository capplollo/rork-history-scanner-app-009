# External TTS Integration Guide

This guide shows you how to integrate external Text-to-Speech services for more natural and human-like voices in your Rork History Scanner App.

## 🎤 Available TTS Services

### 1. **OpenAI TTS** (Recommended for Start)
**Best for:** Getting started with high-quality voices
- ✅ **Easy Setup** - Simple API integration
- ✅ **High Quality** - Very natural voices
- ✅ **Affordable** - $0.015 per 1K characters
- ✅ **6 Voice Options** - Alloy, Echo, Fable, Onyx, Nova, Shimmer

### 2. **ElevenLabs** (Best Free Option)
**Best for:** Free tier with excellent quality
- ✅ **Free Tier** - 10,000 characters/month free
- ✅ **AI Voices** - Very natural, human-like
- ✅ **Voice Cloning** - Create custom voices
- ✅ **Easy API** - Simple REST API

### 3. **Amazon Polly** (Enterprise)
**Best for:** Production apps with high volume
- ✅ **Neural TTS** - Extremely natural voices
- ✅ **60+ Voices** - Multiple languages
- ✅ **Reliable** - AWS infrastructure
- ✅ **SSML Support** - Advanced text formatting

### 4. **Google Cloud TTS** (Alternative Enterprise)
**Best for:** Google ecosystem integration
- ✅ **WaveNet Voices** - High-quality neural voices
- ✅ **380+ Voices** - Extensive selection
- ✅ **Custom Voices** - Train your own voices
- ✅ **SSML Support** - Advanced features

### 5. **Microsoft Azure** (Premium)
**Best for:** Highest quality, budget not a concern
- ✅ **Neural Voices** - Most natural available
- ✅ **400+ Voices** - Largest selection
- ✅ **Custom Training** - Create unique voices
- ✅ **Real-time Streaming** - Live synthesis

## 🚀 Quick Start: OpenAI TTS

### Step 1: Get OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Go to "API Keys" section
4. Create a new API key
5. Copy the key (starts with `sk-`)

### Step 2: Configure in Your App
```typescript
import { externalVoiceService } from '@/services/externalVoiceService';

// Configure OpenAI TTS
externalVoiceService.configureProvider('OpenAI TTS', process.env.EXPO_PUBLIC_OPENAI_API_KEY!);
```

### Step 3: Use in Voice Settings
The voice settings component will automatically show OpenAI voices once configured.

## 🆓 Free Option: ElevenLabs

### Step 1: Get ElevenLabs API Key
1. Go to [ElevenLabs](https://elevenlabs.io/)
2. Sign up for free account
3. Go to "Profile" → "API Key"
4. Copy your API key

### Step 2: Configure in Your App
```typescript
import { externalVoiceService } from '@/services/externalVoiceService';

// Configure ElevenLabs
externalVoiceService.configureProvider('ElevenLabs', 'your-elevenlabs-api-key-here');
```

## 💰 Cost Comparison

| Service | Cost per 1M characters | Free Tier | Quality |
|---------|----------------------|-----------|---------|
| **ElevenLabs** | $0 (free tier) | 10K chars/month | ⭐⭐⭐⭐⭐ |
| **OpenAI TTS** | $15 | None | ⭐⭐⭐⭐ |
| **Amazon Polly** | $4 | None | ⭐⭐⭐⭐⭐ |
| **Google TTS** | $4 | None | ⭐⭐⭐⭐⭐ |
| **Azure Speech** | $16 | None | ⭐⭐⭐⭐⭐ |

## 🔧 Integration Steps

### 1. Install Dependencies
```bash
# For AWS Polly (if using Amazon)
npm install aws-sdk

# For Google Cloud (if using Google)
npm install @google-cloud/text-to-speech

# For Azure (if using Microsoft)
npm install @azure/ai-speech
```

### 2. Update Environment Variables
Add to your `.env` file:
```env
# OpenAI
EXPO_PUBLIC_OPENAI_API_KEY=your-openai-key

# ElevenLabs
ELEVENLABS_API_KEY=your-elevenlabs-key

# Amazon Polly
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret

# Google Cloud
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_PRIVATE_KEY=your-private-key

# Azure
AZURE_SPEECH_KEY=your-azure-key
AZURE_SPEECH_REGION=your-region
```

### 3. Configure Providers
```typescript
// In your app initialization
import { externalVoiceService } from '@/services/externalVoiceService';

// Configure multiple providers
externalVoiceService.configureProvider('OpenAI TTS', process.env.EXPO_PUBLIC_OPENAI_API_KEY!);
externalVoiceService.configureProvider('ElevenLabs', process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY!);
```

## 🎯 Recommended Setup

### For Development/Testing:
1. **Start with ElevenLabs** (free tier)
2. **Add OpenAI TTS** for more options
3. Test both and see which sounds better

### For Production:
1. **ElevenLabs** for free tier users
2. **Amazon Polly** or **Google TTS** for paid users
3. **Azure Speech** for premium features

## 🔒 Security Considerations

### API Key Storage:
- ✅ Store keys in environment variables
- ✅ Never commit keys to git
- ✅ Use secure key management in production
- ✅ Rotate keys regularly

### Rate Limiting:
- ✅ Implement request throttling
- ✅ Monitor API usage
- ✅ Set up alerts for high usage
- ✅ Cache audio files when possible

## 🎉 Next Steps

1. **Choose your preferred service** (recommend ElevenLabs for free tier)
2. **Get API keys** and configure them
3. **Test the integration** with the voice settings
4. **Monitor usage and costs** in production
5. **Consider caching** for better performance

The external TTS services will provide much more natural and human-like voices compared to the built-in speech synthesis!
