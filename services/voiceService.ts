import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { Alert } from 'react-native';

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
  private audioPermissionsGranted: boolean = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🚀 Fast initializing voice service...');
      
      // Check if ElevenLabs is properly configured (no async calls)
      this.isElevenLabsConfigured = !!ELEVENLABS_API_KEY && ELEVENLABS_API_KEY !== 'your-api-key-here';
      
      if (this.isElevenLabsConfigured) {
        console.log('✅ ElevenLabs API key found');
        
        // Initialize ElevenLabs voices immediately
        this.elevenLabsVoices = ELEVENLABS_VOICES.map(voice => ({
          identifier: voice.id,
          name: voice.name,
          language: voice.language,
          quality: voice.quality,
          gender: voice.gender,
          provider: 'elevenlabs' as const
        }));
        
        this.availableVoices.push(...this.elevenLabsVoices);
        console.log('✅ ElevenLabs voices added instantly');
      } else {
        console.log('⚠️ ElevenLabs API key not configured, using built-in voices only');
      }

      // Initialize with basic built-in voices immediately (no async call)
      const basicBuiltInVoices = this.getBasicBuiltInVoices();
      this.availableVoices.push(...basicBuiltInVoices);
      
      this.isInitialized = true;
      console.log(`✅ Voice service fast-initialized with ${this.availableVoices.length} voices`);
      
      // Load full built-in voices and permissions in background
      this.initializeBackgroundTasks();
      
    } catch (error) {
      console.error('❌ Failed to initialize voice service:', error);
      // Fallback to basic voices
      this.availableVoices = this.getBasicBuiltInVoices();
      this.isInitialized = true;
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

  // Background initialization for non-critical tasks
  private async initializeBackgroundTasks(): Promise<void> {
    try {
      console.log('🔄 Loading background tasks...');
      
      // Request permissions in background
      await this.requestAudioPermissions();
      
      // Load full built-in voices in background
      const fullBuiltInVoices = await this.getBuiltInVoices();
      const builtInFiltered = fullBuiltInVoices.filter(voice => voice.provider === 'expo-speech');
      
      // Replace basic voices with full voices
      this.availableVoices = this.availableVoices.filter(voice => voice.provider !== 'expo-speech');
      this.availableVoices.push(...builtInFiltered);
      
      console.log(`🔄 Background loading complete. Total voices: ${this.availableVoices.length}`);
    } catch (error) {
      console.error('❌ Background initialization failed:', error);
    }
  }

  // Get basic built-in voices without async calls
  private getBasicBuiltInVoices(): VoiceOption[] {
    // Return basic fallback voices that work on all platforms
    const basicVoices: VoiceOption[] = [];
    
    if (Platform.OS === 'ios') {
      basicVoices.push({
        identifier: 'com.apple.ttsbundle.Samantha-compact',
        name: 'Samantha (Built-in)',
        language: 'en-US',
        quality: 'basic',
        provider: 'expo-speech' as const
      });
    } else if (Platform.OS === 'android') {
      basicVoices.push({
        identifier: 'en-us-x-sfg#female_1-local',
        name: 'Default Female (Built-in)',
        language: 'en-US',
        quality: 'basic',
        provider: 'expo-speech' as const
      });
    } else {
      // Web fallback
      basicVoices.push({
        identifier: 'default',
        name: 'Default Voice (Built-in)',
        language: 'en-US',
        quality: 'basic',
        provider: 'expo-speech' as const
      });
    }
    
    return basicVoices;
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
      // Start immediately with built-in voice for instant feedback
      if (voice.provider === 'elevenlabs' && this.isElevenLabsConfigured) {
        // Check permissions quickly without blocking
        if (!this.audioPermissionsGranted) {
          console.log('🔄 No audio permissions, using built-in TTS immediately');
          const fallbackVoice = this.getBuiltInFallbackVoice();
          if (fallbackVoice) {
            await this.speakWithExpoSpeech(text, fallbackVoice, options, callbacks);
            return;
          }
        }
        
        // Try ElevenLabs with timeout
        await this.speakWithElevenLabsTimeout(text, voice, options, callbacks);
      } else {
        // Use built-in TTS immediately
        await this.speakWithExpoSpeech(text, voice, options, callbacks);
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
    
    // Return the best built-in voice or any available one
    return builtInVoices.find(voice => 
      voice.language.startsWith('en')
    ) || builtInVoices[0] || null;
  }

  // ElevenLabs with timeout to prevent long delays
  private async speakWithElevenLabsTimeout(
    text: string, 
    voice: VoiceOption, 
    options: VoiceOptions,
    callbacks?: {
      onStart?: () => void;
      onDone?: () => void;
      onError?: (error: string) => void;
    }
  ): Promise<void> {
    const timeoutMs = 5000; // 5 second timeout
    
    try {
      await Promise.race([
        this.speakWithElevenLabs(text, voice, options, callbacks),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('ElevenLabs timeout')), timeoutMs)
        )
      ]);
    } catch (error) {
      if (error instanceof Error && error.message.includes('timeout')) {
        console.log('🔄 ElevenLabs timeout, falling back to built-in TTS');
        const fallbackVoice = this.getBuiltInFallbackVoice();
        if (fallbackVoice) {
          await this.speakWithExpoSpeech(text, fallbackVoice, options, callbacks);
        } else {
          callbacks?.onError?.('Timeout and no fallback voice available');
        }
      } else {
        throw error;
      }
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
