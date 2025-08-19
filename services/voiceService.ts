import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

export interface VoiceOptions {
  language?: string;
  pitch?: number;
  rate?: number;
  quality?: string;
  voice?: string;
  volume?: number;
}

export interface VoiceProvider {
  name: string;
  description: string;
  isAvailable: boolean;
  voices: VoiceOption[];
}

export interface VoiceOption {
  id: string;
  name: string;
  language: string;
  gender?: 'male' | 'female' | 'neutral';
  quality: 'basic' | 'enhanced' | 'premium';
}

class VoiceService {
  private currentProvider: string = 'expo-speech';
  private availableVoices: VoiceOption[] = [];
  private isInitialized: boolean = false;

  // Initialize voice service and detect available voices
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🎤 Initializing voice service...');
      
      // Get available voices based on platform
      this.availableVoices = await this.getAvailableVoices();
      
      console.log(`✅ Voice service initialized with ${this.availableVoices.length} voices`);
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize voice service:', error);
    }
  }

  // Get available voices for the current platform
  private async getAvailableVoices(): Promise<VoiceOption[]> {
    const voices: VoiceOption[] = [];

    if (Platform.OS === 'ios') {
      // iOS enhanced voices
      voices.push(
        { id: 'com.apple.ttsbundle.Samantha-compact', name: 'Samantha (Enhanced)', language: 'en-US', gender: 'female', quality: 'enhanced' },
        { id: 'com.apple.ttsbundle.Daniel-compact', name: 'Daniel (Enhanced)', language: 'en-US', gender: 'male', quality: 'enhanced' },
        { id: 'com.apple.ttsbundle.Karen-compact', name: 'Karen (Enhanced)', language: 'en-AU', gender: 'female', quality: 'enhanced' },
        { id: 'com.apple.ttsbundle.Tom-compact', name: 'Tom (Enhanced)', language: 'en-GB', gender: 'male', quality: 'enhanced' },
        { id: 'com.apple.ttsbundle.Martha-compact', name: 'Martha (Enhanced)', language: 'en-US', gender: 'female', quality: 'enhanced' },
        { id: 'com.apple.ttsbundle.Alex-compact', name: 'Alex (Enhanced)', language: 'en-US', gender: 'male', quality: 'enhanced' }
      );
    } else if (Platform.OS === 'android') {
      // Android voices
      voices.push(
        { id: 'en-US', name: 'US English', language: 'en-US', gender: 'female', quality: 'basic' },
        { id: 'en-GB', name: 'British English', language: 'en-GB', gender: 'male', quality: 'basic' },
        { id: 'en-AU', name: 'Australian English', language: 'en-AU', gender: 'female', quality: 'basic' }
      );
    } else if (Platform.OS === 'web') {
      // Web voices
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const webVoices = window.speechSynthesis.getVoices();
        webVoices.forEach(voice => {
          if (voice.lang.startsWith('en')) {
            voices.push({
              id: voice.voiceURI,
              name: voice.name,
              language: voice.lang,
              gender: voice.name.toLowerCase().includes('male') ? 'male' : 'female',
              quality: 'basic'
            });
          }
        });
      }
    }

    return voices;
  }

  // Get all available voices
  getAvailableVoices(): VoiceOption[] {
    return this.availableVoices;
  }

  // Get voices by quality
  getVoicesByQuality(quality: 'basic' | 'enhanced' | 'premium'): VoiceOption[] {
    return this.availableVoices.filter(voice => voice.quality === quality);
  }

  // Get voices by gender
  getVoicesByGender(gender: 'male' | 'female'): VoiceOption[] {
    return this.availableVoices.filter(voice => voice.gender === gender);
  }

  // Get the best available voice
  getBestVoice(): VoiceOption | null {
    // Prefer enhanced voices, then fall back to basic
    const enhancedVoices = this.getVoicesByQuality('enhanced');
    if (enhancedVoices.length > 0) {
      return enhancedVoices[0];
    }
    
    const basicVoices = this.getVoicesByQuality('basic');
    if (basicVoices.length > 0) {
      return basicVoices[0];
    }
    
    return null;
  }

  // Enhanced speech synthesis with better voice options
  async speak(
    text: string, 
    options: VoiceOptions = {},
    callbacks?: {
      onStart?: () => void;
      onDone?: () => void;
      onStopped?: () => void;
      onError?: (error: any) => void;
    }
  ): Promise<void> {
    try {
      // Initialize if not already done
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Get the best voice if none specified
      const bestVoice = options.voice ? null : this.getBestVoice();
      
      // Enhanced speech options for more natural sound
      const speechOptions: any = {
        language: options.language || 'en-US',
        pitch: options.pitch ?? this.getOptimalPitch(),
        rate: options.rate ?? this.getOptimalRate(),
        volume: options.volume ?? 1.0,
        onStart: () => {
          console.log('🎤 Speech started');
          callbacks?.onStart?.();
        },
        onDone: () => {
          console.log('✅ Speech completed');
          callbacks?.onDone?.();
        },
        onStopped: () => {
          console.log('⏹️ Speech stopped');
          callbacks?.onStopped?.();
        },
        onError: (error: any) => {
          console.error('❌ Speech error:', error);
          callbacks?.onError?.(error);
        }
      };

      // Platform-specific enhancements
      if (Platform.OS === 'ios') {
        speechOptions.quality = 'enhanced';
        speechOptions.voice = options.voice || bestVoice?.id || 'com.apple.ttsbundle.Samantha-compact';
      } else if (Platform.OS === 'android') {
        // Android-specific optimizations
        speechOptions.rate = Math.max(0.5, Math.min(1.5, speechOptions.rate || 0.7));
        speechOptions.pitch = Math.max(0.5, Math.min(2.0, speechOptions.pitch || 1.0));
      } else if (Platform.OS === 'web') {
        // Web-specific optimizations
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          const voices = window.speechSynthesis.getVoices();
          const preferredVoice = voices.find(v => 
            v.lang === speechOptions.language && 
            v.name.toLowerCase().includes('natural')
          );
          if (preferredVoice) {
            speechOptions.voice = preferredVoice.voiceURI;
          }
        }
      }

      console.log('🎤 Starting speech with options:', speechOptions);
      await Speech.speak(text, speechOptions);
      
    } catch (error) {
      console.error('❌ Speech synthesis error:', error);
      callbacks?.onError?.(error);
    }
  }

  // Get optimal pitch for natural speech
  private getOptimalPitch(): number {
    return Platform.select({
      ios: 0.95,      // Slightly lower for more natural sound
      android: 1.0,   // Standard pitch
      web: 1.0,       // Standard pitch
      default: 1.0
    });
  }

  // Get optimal rate for natural speech
  private getOptimalRate(): number {
    return Platform.select({
      ios: 0.65,      // Slower for more natural pacing
      android: 0.7,   // Moderate pace
      web: 0.8,       // Slightly slower for web
      default: 0.7
    });
  }

  // Stop current speech
  async stop(): Promise<void> {
    try {
      await Speech.stop();
      console.log('⏹️ Speech stopped');
    } catch (error) {
      console.error('❌ Error stopping speech:', error);
    }
  }

  // Pause current speech (iOS only)
  async pause(): Promise<void> {
    if (Platform.OS === 'ios') {
      try {
        await Speech.pause();
        console.log('⏸️ Speech paused');
      } catch (error) {
        console.error('❌ Error pausing speech:', error);
      }
    }
  }

  // Resume paused speech (iOS only)
  async resume(): Promise<void> {
    if (Platform.OS === 'ios') {
      try {
        await Speech.resume();
        console.log('▶️ Speech resumed');
      } catch (error) {
        console.error('❌ Error resuming speech:', error);
      }
    }
  }

  // Check if speech is supported
  isSupported(): boolean {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined' && !!window.speechSynthesis;
    }
    return true; // expo-speech works on iOS and Android
  }

  // Get voice provider information
  getVoiceProviders(): VoiceProvider[] {
    const providers: VoiceProvider[] = [
      {
        name: 'Expo Speech',
        description: 'Built-in speech synthesis with platform-specific enhancements',
        isAvailable: this.isSupported(),
        voices: this.availableVoices
      }
    ];

    return providers;
  }
}

// Export singleton instance
export const voiceService = new VoiceService();
