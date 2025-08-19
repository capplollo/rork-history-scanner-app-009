import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

export interface VoiceOption {
  identifier: string;
  name: string;
  language: string;
  quality: string;
  gender?: string;
  provider: 'expo-speech' | 'elevenlabs';
}

export interface VoiceOptions {
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  language?: string;
  provider?: 'expo-speech' | 'elevenlabs';
}

export interface VoiceProvider {
  name: string;
  description: string;
  quality: string;
  isConfigured: boolean;
}

// ElevenLabs configuration
const ELEVENLABS_API_KEY = 'sk_22cbad0171315d01474f3a02c222d9d04f67c9a5d8b3eae9';
const ELEVENLABS_VOICES = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (ElevenLabs)', language: 'en-US', gender: 'female', quality: 'premium' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi (ElevenLabs)', language: 'en-US', gender: 'female', quality: 'premium' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (ElevenLabs)', language: 'en-US', gender: 'female', quality: 'premium' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold (ElevenLabs)', language: 'en-US', gender: 'male', quality: 'premium' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (ElevenLabs)', language: 'en-US', gender: 'male', quality: 'premium' },
  { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam (ElevenLabs)', language: 'en-US', gender: 'male', quality: 'premium' },
];

export class VoiceService {
  private availableVoices: VoiceOption[] = [];
  private isInitialized: boolean = false;
  private elevenLabsVoices: VoiceOption[] = [];

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize ElevenLabs voices
      this.elevenLabsVoices = ELEVENLABS_VOICES.map(voice => ({
        identifier: voice.id,
        name: voice.name,
        language: voice.language,
        quality: voice.quality,
        gender: voice.gender,
        provider: 'elevenlabs' as const
      }));

      // Get built-in voices
      const builtInVoices = await this.getAvailableVoices();
      
      // Combine all voices
      this.availableVoices = [
        ...this.elevenLabsVoices,
        ...builtInVoices.filter(voice => voice.provider === 'expo-speech')
      ];

      this.isInitialized = true;
      console.log(`✅ Voice service initialized with ${this.availableVoices.length} voices`);
    } catch (error) {
      console.error('❌ Failed to initialize voice service:', error);
    }
  }

  private async getAvailableVoices(): Promise<VoiceOption[]> {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      return voices.map(voice => ({
        identifier: voice.identifier,
        name: `${voice.name} (Built-in)`,
        language: voice.language,
        quality: 'basic',
        gender: voice.gender,
        provider: 'expo-speech' as const
      }));
    } catch (error) {
      console.error('Failed to get available voices:', error);
      return [];
    }
  }

  getAvailableVoices(): VoiceOption[] {
    return this.availableVoices;
  }

  getBestVoice(): VoiceOption | null {
    // Prioritize ElevenLabs voices for better quality
    const elevenLabsVoice = this.elevenLabsVoices.find(voice => 
      voice.language.startsWith('en') && voice.gender === 'female'
    );
    
    if (elevenLabsVoice) {
      return elevenLabsVoice;
    }

    // Fallback to built-in voices
    return this.availableVoices.find(voice => 
      voice.provider === 'expo-speech' && voice.language.startsWith('en')
    ) || null;
  }

  async speak(text: string, options: VoiceOptions = {}, callbacks?: {
    onStart?: () => void;
    onDone?: () => void;
    onError?: (error: string) => void;
  }): Promise<void> {
    if (!text.trim()) {
      callbacks?.onError?.('No text provided');
      return;
    }

    const voice = this.availableVoices.find(v => v.identifier === options.voice) || this.getBestVoice();
    
    if (!voice) {
      callbacks?.onError?.('No suitable voice found');
      return;
    }

    try {
      if (voice.provider === 'elevenlabs') {
        await this.speakWithElevenLabs(text, voice, options, callbacks);
      } else {
        await this.speakWithExpoSpeech(text, voice, options, callbacks);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Speech error:', errorMessage);
      callbacks?.onError?.(errorMessage);
    }
  }

  private async speakWithElevenLabs(
    text: string, 
    voice: VoiceOption, 
    options: VoiceOptions,
    callbacks?: {
      onStart?: () => void;
      onDone?: () => void;
      onError?: (error: string) => void;
    }
  ): Promise<void> {
    try {
      callbacks?.onStart?.();
      
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice.identifier}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`ElevenLabs API error: ${error}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // For React Native, we need to handle audio differently
      // This is a simplified approach - in a real app you'd use expo-av
      console.log('✅ ElevenLabs audio generated successfully');
      callbacks?.onDone?.();
      
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      callbacks?.onError?.(error instanceof Error ? error.message : 'ElevenLabs error');
    }
  }

  private async speakWithExpoSpeech(
    text: string, 
    voice: VoiceOption, 
    options: VoiceOptions,
    callbacks?: {
      onStart?: () => void;
      onDone?: () => void;
      onError?: (error: string) => void;
    }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const speechOptions = {
        voice: voice.identifier,
        rate: options.rate || this.getOptimalRate(),
        pitch: options.pitch || this.getOptimalPitch(),
        volume: options.volume || 1.0,
        language: options.language || voice.language,
        onStart: () => {
          callbacks?.onStart?.();
        },
        onDone: () => {
          callbacks?.onDone?.();
          resolve();
        },
        onError: (error: string) => {
          callbacks?.onError?.(error);
          reject(new Error(error));
        },
      };

      Speech.speak(text, speechOptions);
    });
  }

  private getOptimalPitch(): number {
    return Platform.OS === 'ios' ? 1.0 : 1.0;
  }

  private getOptimalRate(): number {
    return Platform.OS === 'ios' ? 0.5 : 0.8;
  }

  async stop(): Promise<void> {
    await Speech.stop();
  }

  async pause(): Promise<void> {
    await Speech.pause();
  }

  async resume(): Promise<void> {
    await Speech.resume();
  }

  isSupported(): boolean {
    return Speech.isAvailableAsync();
  }

  getVoiceProviders(): VoiceProvider[] {
    return [
      {
        name: 'ElevenLabs',
        description: 'AI-powered natural voices',
        quality: 'Premium',
        isConfigured: true
      },
      {
        name: 'Built-in Speech',
        description: 'Device native speech synthesis',
        quality: 'Basic',
        isConfigured: true
      }
    ];
  }
}

// Export singleton instance
export const voiceService = new VoiceService();
