import * as Speech from 'expo-speech';
import { Platform, Alert } from 'react-native';
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

import Constants from 'expo-constants';

// ElevenLabs configuration - using environment variables
const ELEVENLABS_API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_ELEVENLABS_API_KEY || process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;
const ELEVENLABS_VOICES = [
  { id: 'zNsotODqUhvbJ5wMG7Ei', name: 'Charles - Mature narrator', language: 'en-US', gender: 'male', quality: 'premium' },
];

export class VoiceService {
  private availableVoices: VoiceOption[] = [];
  private isInitialized: boolean = false;
  private elevenLabsVoices: VoiceOption[] = [];
  private isElevenLabsConfigured: boolean = false;
  private audioPermissionsGranted: boolean = false;
  private currentSound: Audio.Sound | null = null;
  private isCurrentlyPlaying: boolean = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Request audio permissions first
      await this.requestAudioPermissions();
      
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
      
      // Always include both ElevenLabs and built-in voices for fallback
      this.availableVoices = [];
      
      if (this.isElevenLabsConfigured && this.elevenLabsVoices.length > 0) {
        this.availableVoices.push(...this.elevenLabsVoices);
        console.log('✅ ElevenLabs voices added');
      }
      
      // Always add built-in voices as fallback
      const builtInFiltered = builtInVoices.filter(voice => voice.provider === 'expo-speech');
      this.availableVoices.push(...builtInFiltered);
      
      console.log(`✅ Total voices available: ${this.availableVoices.length} (ElevenLabs: ${this.elevenLabsVoices.length}, Built-in: ${builtInFiltered.length})`);

      this.isInitialized = true;
      console.log(`✅ Voice service initialized with ${this.availableVoices.length} voices`);
      console.log(`📊 ElevenLabs voices: ${this.elevenLabsVoices.length}, Built-in voices: ${builtInVoices.length}`);
    } catch (error) {
      console.error('❌ Failed to initialize voice service:', error);
    }
  }

  private async requestAudioPermissions(): Promise<void> {
    try {
      // Request audio permissions for expo-av
      const { status } = await Audio.requestPermissionsAsync();
      this.audioPermissionsGranted = status === 'granted';
      
      if (this.audioPermissionsGranted) {
        console.log('✅ Audio permissions granted');
        
        // Set up audio mode for playback
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } else {
        console.log('⚠️ Audio permissions denied, ElevenLabs playback will fallback to built-in TTS');
      }
    } catch (error) {
      console.error('❌ Failed to request audio permissions:', error);
      this.audioPermissionsGranted = false;
    }
  }

  // Public method to request permissions with user feedback
  async requestPermissionsWithUserPrompt(): Promise<boolean> {
    if (this.audioPermissionsGranted) {
      return true;
    }

    try {
      const { status } = await Audio.requestPermissionsAsync();
      
      if (status === 'granted') {
        this.audioPermissionsGranted = true;
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        return true;
      } else {
        Alert.alert(
          'Audio Permission Required',
          'To use high-quality ElevenLabs voices, please allow audio permissions in your device settings. The app will use built-in voices instead.',
          [{ text: 'OK' }]
        );
        return false;
      }
    } catch (error) {
      console.error('Failed to request permissions:', error);
      Alert.alert(
        'Permission Error', 
        'Unable to request audio permissions. Using built-in voices instead.',
        [{ text: 'OK' }]
      );
      return false;
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
      
      const voiceArray = Array.from(uniqueVoices.values());
      
      // If no voices were found, create a default fallback
      if (voiceArray.length === 0) {
        console.warn('No built-in voices found, creating default fallback');
        voiceArray.push({
          identifier: 'default',
          name: 'Default Voice (Built-in)',
          language: 'en-US',
          quality: 'basic',
          provider: 'expo-speech' as const
        });
      }
      
      return voiceArray;
    } catch (error) {
      console.error('Failed to get available voices:', error);
      // Return a default voice as fallback
      return [{
        identifier: 'default',
        name: 'Default Voice (Built-in)',
        language: 'en-US',
        quality: 'basic',
        provider: 'expo-speech' as const
      }];
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
    
    // If no built-in voices are available, try to get them directly
    if (builtInVoices.length === 0) {
      console.warn('No built-in voices found in availableVoices, creating fallback voice');
      // Create a fallback voice that should work on most platforms
      return {
        identifier: 'default',
        name: 'Default Voice (Built-in)',
        language: 'en-US',
        quality: 'basic',
        provider: 'expo-speech' as const
      };
    }
    
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
    const englishVoice = builtInVoices.find(voice => 
      voice.language.startsWith('en')
    );
    
    if (englishVoice) {
      return englishVoice;
    }
    
    // Last resort: return the first available voice
    return builtInVoices[0] || null;
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
      // Check if we should use ElevenLabs
      if (voice.provider === 'elevenlabs' && this.isElevenLabsConfigured && this.audioPermissionsGranted) {
        await this.speakWithElevenLabs(text, voice, options, callbacks);
      } else {
        // Fall back to built-in TTS if ElevenLabs is not available or permissions denied
        if (voice.provider === 'elevenlabs' && (!this.audioPermissionsGranted || !this.isElevenLabsConfigured)) {
          console.log('🔄 Falling back to built-in TTS (permissions or config issue)');
          const fallbackVoice = this.getBuiltInFallbackVoice();
          if (fallbackVoice) {
            await this.speakWithExpoSpeech(text, fallbackVoice, options, callbacks);
          } else {
            callbacks?.onError?.('No fallback voice available');
          }
        } else {
          await this.speakWithExpoSpeech(text, voice, options, callbacks);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Speech error:', errorMessage);
      
      // Try fallback to built-in TTS if we haven't already
      if (voice.provider === 'elevenlabs') {
        console.log('🔄 Error with ElevenLabs, trying built-in TTS fallback...');
        try {
          const fallbackVoice = this.getBuiltInFallbackVoice();
          if (fallbackVoice) {
            await this.speakWithExpoSpeech(text, fallbackVoice, options, callbacks);
            return;
          }
        } catch (fallbackError) {
          console.error('❌ Fallback TTS also failed:', fallbackError);
        }
      }
      
      callbacks?.onError?.(errorMessage);
    }
  }

  private getBuiltInFallbackVoice(): VoiceOption | null {
    // Get all built-in voices (not just the ones in availableVoices)
    const builtInVoices = this.availableVoices.filter(voice => voice.provider === 'expo-speech');
    
    // If no built-in voices available, create a default fallback
    if (builtInVoices.length === 0) {
      console.log('Creating default fallback voice');
      return {
        identifier: 'default',
        name: 'Default Voice (Built-in)',
        language: 'en-US',
        quality: 'basic',
        provider: 'expo-speech' as const
      };
    }
    
    // Return the best built-in voice or any available one
    return builtInVoices.find(voice => 
      voice.language.startsWith('en')
    ) || builtInVoices[0];
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
      
      // Check permissions before attempting playback
      if (!this.audioPermissionsGranted) {
        throw new Error('Audio permissions not granted for ElevenLabs playback');
      }
      
      // Play the audio using expo-av
      const audioArrayBuffer = await response.arrayBuffer();
      const audioBase64 = this.arrayBufferToBase64(audioArrayBuffer);
      const audioUri = `data:audio/mpeg;base64,${audioBase64}`;
      
      callbacks?.onStart?.();
      
      // Create and play the sound with error handling
      try {
        // Stop any existing sound first
        if (this.currentSound) {
          await this.currentSound.unloadAsync();
          this.currentSound = null;
        }
        
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true, volume: options.volume || 1.0 }
        );
        
        // Store reference to current sound
        this.currentSound = sound;
        this.isCurrentlyPlaying = true;
        
        // Set up playback status listener
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            if (status.didJustFinish) {
              this.currentSound = null;
              this.isCurrentlyPlaying = false;
              sound.unloadAsync();
              callbacks?.onDone?.();
            }
          }
        });
        
      } catch (audioError) {
        console.error('❌ Audio playback error:', audioError);
        throw new Error(`Audio playback failed: ${audioError instanceof Error ? audioError.message : 'Unknown audio error'}`);
      }
      
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
      
      const speechOptions: any = {
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
      
      // Only set voice if it's not the default fallback
      if (voice.identifier !== 'default') {
        speechOptions.voice = voice.identifier;
      }

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
    try {
      // Stop expo-speech
      await Speech.stop();
      
      // Stop and cleanup ElevenLabs audio if playing
      if (this.currentSound) {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
        this.currentSound = null;
      }
      
      this.isCurrentlyPlaying = false;
      console.log('✅ Voice service stopped successfully');
    } catch (error) {
      console.error('Error stopping voice service:', error);
      // Reset state even if there's an error
      this.currentSound = null;
      this.isCurrentlyPlaying = false;
    }
  }

  async pause(): Promise<void> {
    try {
      // Pause expo-speech
      await Speech.pause();
      
      // Pause ElevenLabs audio if playing
      if (this.currentSound) {
        await this.currentSound.pauseAsync();
      }
    } catch (error) {
      console.error('Error pausing voice service:', error);
    }
  }

  async resume(): Promise<void> {
    try {
      // Resume expo-speech
      await Speech.resume();
      
      // Resume ElevenLabs audio if paused
      if (this.currentSound) {
        await this.currentSound.playAsync();
      }
    } catch (error) {
      console.error('Error resuming voice service:', error);
    }
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
  
  // Check if voice is currently playing
  isPlaying(): boolean {
    return this.isCurrentlyPlaying;
  }
  
  // Force cleanup - useful for navigation cleanup
  async forceCleanup(): Promise<void> {
    try {
      console.log('🧹 Force cleaning up voice service...');
      
      // Stop all speech
      await Speech.stop();
      
      // Clean up ElevenLabs audio
      if (this.currentSound) {
        try {
          await this.currentSound.stopAsync();
          await this.currentSound.unloadAsync();
        } catch (error) {
          console.warn('Error cleaning up sound:', error);
        }
        this.currentSound = null;
      }
      
      this.isCurrentlyPlaying = false;
      console.log('✅ Voice service force cleanup completed');
    } catch (error) {
      console.error('Error during force cleanup:', error);
      // Reset state regardless of errors
      this.currentSound = null;
      this.isCurrentlyPlaying = false;
    }
  }
}

// Export singleton instance
export const voiceService = new VoiceService();
