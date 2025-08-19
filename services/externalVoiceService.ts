import { Platform } from 'react-native';

export interface ExternalVoiceProvider {
  name: string;
  description: string;
  quality: 'basic' | 'enhanced' | 'premium' | 'neural';
  cost: string;
  apiKey?: string;
  isConfigured: boolean;
  voices: ExternalVoice[];
}

export interface ExternalVoice {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  quality: 'basic' | 'enhanced' | 'premium' | 'neural';
  provider: string;
  sampleUrl?: string;
}

export interface TTSRequest {
  text: string;
  voice: string;
  language?: string;
  speed?: number;
  pitch?: number;
  volume?: number;
  format?: 'mp3' | 'wav' | 'ogg';
}

export interface TTSResponse {
  success: boolean;
  audioUrl?: string;
  audioData?: ArrayBuffer;
  error?: string;
  duration?: number;
}

class ExternalVoiceService {
  private providers: ExternalVoiceProvider[] = [];
  private currentProvider: string = 'expo-speech';
  private apiKeys: { [key: string]: string } = {};

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    this.providers = [
      {
        name: 'Amazon Polly',
        description: 'High-quality neural TTS with 60+ voices',
        quality: 'neural',
        cost: '$4 per 1M characters',
        isConfigured: false,
        voices: [
          { id: 'Joanna', name: 'Joanna (Neural)', language: 'en-US', gender: 'female', quality: 'neural', provider: 'amazon' },
          { id: 'Matthew', name: 'Matthew (Neural)', language: 'en-US', gender: 'male', quality: 'neural', provider: 'amazon' },
          { id: 'Emma', name: 'Emma (Neural)', language: 'en-GB', gender: 'female', quality: 'neural', provider: 'amazon' },
          { id: 'Brian', name: 'Brian (Neural)', language: 'en-GB', gender: 'male', quality: 'neural', provider: 'amazon' },
        ]
      },
      {
        name: 'Google Cloud TTS',
        description: 'WaveNet voices with 380+ options',
        quality: 'neural',
        cost: '$4 per 1M characters',
        isConfigured: false,
        voices: [
          { id: 'en-US-Wavenet-A', name: 'Wavenet A (US)', language: 'en-US', gender: 'female', quality: 'neural', provider: 'google' },
          { id: 'en-US-Wavenet-D', name: 'Wavenet D (US)', language: 'en-US', gender: 'male', quality: 'neural', provider: 'google' },
          { id: 'en-GB-Wavenet-A', name: 'Wavenet A (UK)', language: 'en-GB', gender: 'female', quality: 'neural', provider: 'google' },
          { id: 'en-GB-Wavenet-D', name: 'Wavenet D (UK)', language: 'en-GB', gender: 'male', quality: 'neural', provider: 'google' },
        ]
      },
      {
        name: 'Microsoft Azure',
        description: 'Neural voices with 400+ options',
        quality: 'neural',
        cost: '$16 per 1M characters',
        isConfigured: false,
        voices: [
          { id: 'en-US-JennyNeural', name: 'Jenny (Neural)', language: 'en-US', gender: 'female', quality: 'neural', provider: 'azure' },
          { id: 'en-US-GuyNeural', name: 'Guy (Neural)', language: 'en-US', gender: 'male', quality: 'neural', provider: 'azure' },
          { id: 'en-GB-SoniaNeural', name: 'Sonia (Neural)', language: 'en-GB', gender: 'female', quality: 'neural', provider: 'azure' },
          { id: 'en-GB-RyanNeural', name: 'Ryan (Neural)', language: 'en-GB', gender: 'male', quality: 'neural', provider: 'azure' },
        ]
      },
      {
        name: 'ElevenLabs',
        description: 'AI-generated voices with voice cloning',
        quality: 'premium',
        cost: 'Free tier + paid plans',
        isConfigured: false,
        voices: [
          { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (AI)', language: 'en-US', gender: 'female', quality: 'premium', provider: 'elevenlabs' },
          { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi (AI)', language: 'en-US', gender: 'female', quality: 'premium', provider: 'elevenlabs' },
          { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (AI)', language: 'en-US', gender: 'female', quality: 'premium', provider: 'elevenlabs' },
          { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold (AI)', language: 'en-US', gender: 'male', quality: 'premium', provider: 'elevenlabs' },
        ]
      },
      {
        name: 'OpenAI TTS',
        description: 'High-quality voices from OpenAI',
        quality: 'enhanced',
        cost: '$0.015 per 1K characters',
        isConfigured: false,
        voices: [
          { id: 'alloy', name: 'Alloy', language: 'en-US', gender: 'neutral', quality: 'enhanced', provider: 'openai' },
          { id: 'echo', name: 'Echo', language: 'en-US', gender: 'male', quality: 'enhanced', provider: 'openai' },
          { id: 'fable', name: 'Fable', language: 'en-US', gender: 'neutral', quality: 'enhanced', provider: 'openai' },
          { id: 'onyx', name: 'Onyx', language: 'en-US', gender: 'male', quality: 'enhanced', provider: 'openai' },
          { id: 'nova', name: 'Nova', language: 'en-US', gender: 'female', quality: 'enhanced', provider: 'openai' },
          { id: 'shimmer', name: 'Shimmer', language: 'en-US', gender: 'female', quality: 'enhanced', provider: 'openai' },
        ]
      }
    ];
  }

  // Configure API keys for external providers
  configureProvider(providerName: string, apiKey: string): void {
    this.apiKeys[providerName] = apiKey;
    
    const provider = this.providers.find(p => p.name === providerName);
    if (provider) {
      provider.isConfigured = true;
      console.log(`✅ Configured ${providerName} with API key`);
    }
  }

  // Test ElevenLabs API key
  async testElevenLabsKey(apiKey: string): Promise<{ success: boolean; error?: string; voices?: any[] }> {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'xi-api-key': apiKey,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `ElevenLabs API error: ${error}` };
      }

      const data = await response.json();
      return { success: true, voices: data.voices };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  // Auto-configure ElevenLabs with provided key
  async configureElevenLabs(apiKey: string): Promise<{ success: boolean; error?: string; voices?: any[] }> {
    console.log('🔍 Testing ElevenLabs API key...');
    
    const testResult = await this.testElevenLabsKey(apiKey);
    
    if (testResult.success) {
      this.configureProvider('ElevenLabs', apiKey);
      console.log('✅ ElevenLabs configured successfully!');
      
      // Update available voices with real data
      if (testResult.voices) {
        const elevenLabsProvider = this.providers.find(p => p.name === 'ElevenLabs');
        if (elevenLabsProvider) {
          elevenLabsProvider.voices = testResult.voices.map((voice: any) => ({
            id: voice.voice_id,
            name: `${voice.name} (ElevenLabs)`,
            language: voice.labels?.language || 'en-US',
            gender: voice.labels?.gender || 'neutral',
            quality: 'premium',
            provider: 'elevenlabs',
            sampleUrl: voice.preview_url
          }));
        }
      }
      
      return { success: true, voices: testResult.voices };
    } else {
      console.error('❌ ElevenLabs configuration failed:', testResult.error);
      return { success: false, error: testResult.error };
    }
  }

  // Get all available providers
  getProviders(): ExternalVoiceProvider[] {
    return this.providers;
  }

  // Get configured providers only
  getConfiguredProviders(): ExternalVoiceProvider[] {
    return this.providers.filter(p => p.isConfigured);
  }

  // Get all available voices from configured providers
  getAvailableVoices(): ExternalVoice[] {
    const voices: ExternalVoice[] = [];
    this.providers.forEach(provider => {
      if (provider.isConfigured) {
        voices.push(...provider.voices);
      }
    });
    return voices;
  }

  // Get voices by quality
  getVoicesByQuality(quality: 'basic' | 'enhanced' | 'premium' | 'neural'): ExternalVoice[] {
    return this.getAvailableVoices().filter(voice => voice.quality === quality);
  }

  // Get voices by provider
  getVoicesByProvider(provider: string): ExternalVoice[] {
    return this.getAvailableVoices().filter(voice => voice.provider === provider);
  }

  // Synthesize speech using external provider
  async synthesizeSpeech(request: TTSRequest): Promise<TTSResponse> {
    const voice = this.getAvailableVoices().find(v => v.id === request.voice);
    if (!voice) {
      return { success: false, error: 'Voice not found' };
    }

    const apiKey = this.apiKeys[voice.provider];
    if (!apiKey) {
      return { success: false, error: 'Provider not configured' };
    }

    try {
      switch (voice.provider) {
        case 'openai':
          return await this.synthesizeWithOpenAI(request, apiKey);
        case 'elevenlabs':
          return await this.synthesizeWithElevenLabs(request, apiKey);
        case 'amazon':
          return await this.synthesizeWithAmazonPolly(request, apiKey);
        case 'google':
          return await this.synthesizeWithGoogleTTS(request, apiKey);
        case 'azure':
          return await this.synthesizeWithAzure(request, apiKey);
        default:
          return { success: false, error: 'Provider not supported' };
      }
    } catch (error) {
      console.error('TTS synthesis error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // OpenAI TTS implementation
  private async synthesizeWithOpenAI(request: TTSRequest, apiKey: string): Promise<TTSResponse> {
    try {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: request.text,
          voice: request.voice,
          response_format: 'mp3',
          speed: request.speed || 1.0,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `OpenAI API error: ${error}` };
      }

      const audioData = await response.arrayBuffer();
      return { success: true, audioData };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'OpenAI API error' };
    }
  }

  // ElevenLabs TTS implementation
  private async synthesizeWithElevenLabs(request: TTSRequest, apiKey: string): Promise<TTSResponse> {
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${request.voice}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: request.text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `ElevenLabs API error: ${error}` };
      }

      const audioData = await response.arrayBuffer();
      return { success: true, audioData };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'ElevenLabs API error' };
    }
  }

  // Amazon Polly implementation (simplified)
  private async synthesizeWithAmazonPolly(request: TTSRequest, apiKey: string): Promise<TTSResponse> {
    // This would require AWS SDK integration
    return { success: false, error: 'Amazon Polly integration requires AWS SDK' };
  }

  // Google TTS implementation (simplified)
  private async synthesizeWithGoogleTTS(request: TTSRequest, apiKey: string): Promise<TTSResponse> {
    // This would require Google Cloud SDK integration
    return { success: false, error: 'Google TTS integration requires Google Cloud SDK' };
  }

  // Azure Speech implementation (simplified)
  private async synthesizeWithAzure(request: TTSRequest, apiKey: string): Promise<TTSResponse> {
    // This would require Azure SDK integration
    return { success: false, error: 'Azure Speech integration requires Azure SDK' };
  }

  // Get provider configuration status
  getProviderStatus(providerName: string): boolean {
    return this.providers.find(p => p.name === providerName)?.isConfigured || false;
  }

  // Remove provider configuration
  removeProvider(providerName: string): void {
    delete this.apiKeys[providerName];
    const provider = this.providers.find(p => p.name === providerName);
    if (provider) {
      provider.isConfigured = false;
    }
  }

  // Get cost estimate for text
  getCostEstimate(providerName: string, textLength: number): string {
    const provider = this.providers.find(p => p.name === providerName);
    if (!provider) return 'Unknown';

    // Rough cost estimates (you'd want to implement proper calculation)
    const characters = textLength;
    const costPerMillion = {
      'OpenAI TTS': 15,
      'Amazon Polly': 4,
      'Google Cloud TTS': 4,
      'Microsoft Azure': 16,
      'ElevenLabs': 0, // Free tier
    };

    const cost = (characters / 1000000) * (costPerMillion[provider.name as keyof typeof costPerMillion] || 0);
    return cost > 0 ? `$${cost.toFixed(4)}` : 'Free (within limits)';
  }
}

// Export singleton instance
export const externalVoiceService = new ExternalVoiceService();
