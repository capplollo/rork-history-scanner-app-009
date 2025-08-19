import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';

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

// ElevenLabs configuration - using environment variables
const ELEVENLABS_API_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;
const ELEVENLABS_VOICES = [
  { id: 'zNsotODqUhvbJ5wMG7Ei', name: 'Charles - Mature narrator', language: 'en-US', gender: 'male', quality: 'premium' },
];

export class VoiceService {
  private availableVoices: VoiceOption[] = [];
  private isInitialized: boolean = false;
  private elevenLabsVoices: VoiceOption[] = [];
  private isElevenLabsConfigured: boolean = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if ElevenLabs is properly configured
      this.isElevenLabsConfigured = !!ELEVENLABS_API_KEY && ELEVENLABS_API_KEY !== 'your-api-key-here';
      
      if (this.isElevenLabsConfigured) {
        console.log('✅ ElevenLabs API key found');
        
        // Initialize ElevenLabs voices
        this.elevenLabsVoices = ELEVENLABS_VOICES.map(voice => ({
          identifier: voice.id,
          name: voice.name,
          language: voice.language,
          quality: voice.quality,
          gender: voice.gender,
          provider: 'elevenlabs' as const
        }));
      } else {
        console.log('⚠️ ElevenLabs API key not configured, using built-in voices only');
      }

      // Get built-in voices
      const builtInVoices = await this.getBuiltInVoices();
      
      // Use only ElevenLabs Charles voice if configured, otherwise use built-in voices
      if (this.isElevenLabsConfigured && this.elevenLabsVoices.length > 0) {
        this.availableVoices = [...this.elevenLabsVoices];
        console.log('✅ Using Charles - Mature narrator as the only voice');
      } else {
        this.availableVoices = builtInVoices.filter(voice => voice.provider === 'expo-speech');
        console.log('⚠️ ElevenLabs not configured, using built-in voices');
      }

      this.isInitialized = true;
      console.log(`✅ Voice service initialized with ${this.availableVoices.length} voices`);
      console.log(`📊 ElevenLabs voices: ${this.elevenLabsVoices.length}, Built-in voices: ${builtInVoices.length}`);
    } catch (error) {
      console.error('❌ Failed to initialize voice service:', error);
    }
  }

  private async getBuiltInVoices(): Promise<VoiceOption[]> {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      const uniqueVoices = new Map<string, VoiceOption>();
      
      voices
        .filter(voice => voice.identifier && voice.identifier.trim() !== '')
        .forEach((voice, index) => {
          const identifier = voice.identifier || `builtin-voice-${index}`;
          if (!uniqueVoices.has(identifier)) {
            uniqueVoices.set(identifier, {
              identifier,
              name: `${voice.name || 'Unknown Voice'} (Built-in)`,
              language: voice.language || 'en-US',
              quality: 'basic',
              provider: 'expo-speech' as const
            });
          }
        });
      
      return Array.from(uniqueVoices.values());
    } catch (error) {
      console.error('Failed to get available voices:', error);
      return [];
    }
  }

  getAvailableVoices(): VoiceOption[] {
    return this.availableVoices;
  }

  getBestVoice(): VoiceOption | null {
    // Always use Charles - Mature narrator if ElevenLabs is configured
    if (this.isElevenLabsConfigured && this.elevenLabsVoices.length > 0) {
      return this.elevenLabsVoices[0]; // Charles is the only voice
    }
    
    // Find the best built-in voice as fallback
    const builtInVoices = this.availableVoices.filter(voice => voice.provider === 'expo-speech');
    
    // Look for high-quality English voices
    const preferredVoice = builtInVoices.find(voice => {
      const name = voice.name.toLowerCase();
      const lang = voice.language.toLowerCase();
      return lang.startsWith('en') && (
        name.includes('enhanced') || 
        name.includes('premium') || 
        name.includes('neural') ||
        name.includes('samantha') ||
        name.includes('alex') ||
        name.includes('karen') ||
        name.includes('daniel')
      );
    });
    
    if (preferredVoice) {
      return preferredVoice;
    }
    
    // Fallback to any English voice
    return builtInVoices.find(voice => 
      voice.language.startsWith('en')
    ) || builtInVoices[0] || null;
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
      if (voice.provider === 'elevenlabs' && this.isElevenLabsConfigured) {
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
      console.log('🎤 Using ElevenLabs TTS...');
      
      if (!ELEVENLABS_API_KEY) {
        throw new Error('ElevenLabs API key not configured');
      }

      const apiKey: string = ELEVENLABS_API_KEY;

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice.identifier}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.8,
            style: 0.2,
            use_speaker_boost: true
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('ElevenLabs API error:', error);
        
        // If quota exceeded, fall back to built-in TTS
        if (error.includes('quota_exceeded')) {
          console.log('🔄 ElevenLabs quota exceeded, falling back to built-in TTS...');
          const fallbackVoice = this.getBestVoice();
          if (fallbackVoice && fallbackVoice.provider === 'expo-speech') {
            await this.speakWithExpoSpeech(text, fallbackVoice, options, callbacks);
            return;
          }
        }
        
        throw new Error(`ElevenLabs API error: ${error}`);
      }

      console.log('✅ ElevenLabs audio generated successfully');
      
      // Play the audio using expo-av
      const audioArrayBuffer = await response.arrayBuffer();
      const audioBase64 = this.arrayBufferToBase64(audioArrayBuffer);
      const audioUri = `data:audio/mpeg;base64,${audioBase64}`;
      
      // Configure audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      callbacks?.onStart?.();
      
      // Create and play the sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true, volume: options.volume || 1.0 }
      );
      
      // Set up playback status listener
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.didJustFinish) {
            sound.unloadAsync();
            callbacks?.onDone?.();
          }
        }
      });
      
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      
      // Always fall back to built-in TTS on error
      console.log('🔄 Falling back to built-in TTS due to error...');
      const fallbackVoice = this.getBestVoice();
      if (fallbackVoice && fallbackVoice.provider === 'expo-speech') {
        await this.speakWithExpoSpeech(text, fallbackVoice, options, callbacks);
      } else {
        callbacks?.onError?.(error instanceof Error ? error.message : 'ElevenLabs error');
      }
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
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
      console.log('🎤 Using built-in TTS...');
      
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
        onError: (error: Error) => {
          const errorMessage = error.message || 'Speech error';
          callbacks?.onError?.(errorMessage);
          reject(error);
        },
      };

      Speech.speak(text, speechOptions);
    });
  }

  private getOptimalPitch(): number {
    return Platform.OS === 'ios' ? 1.1 : 1.0;
  }

  private getOptimalRate(): number {
    return Platform.OS === 'ios' ? 0.6 : 0.7;
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
    // expo-speech is always available on supported platforms
    // There's no isAvailableAsync method in expo-speech
    return Platform.OS === 'ios' || Platform.OS === 'android' || Platform.OS === 'web';
  }

  getVoiceProviders(): VoiceProvider[] {
    return [
      {
        name: 'ElevenLabs',
        description: 'AI-powered natural voices',
        quality: 'Premium',
        isConfigured: this.isElevenLabsConfigured
      },
      {
        name: 'Built-in Speech',
        description: 'Device native speech synthesis',
        quality: 'Basic',
        isConfigured: true
      }
    ];
  }

  // Check if ElevenLabs is properly configured
  isElevenLabsAvailable(): boolean {
    return this.isElevenLabsConfigured;
  }
}

// Export singleton instance
export const voiceService = new VoiceService();
