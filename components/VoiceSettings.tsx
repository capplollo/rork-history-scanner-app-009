import React, { useState, useEffect } from 'react';
import { Modal, ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { Settings, Volume2, Check, ChevronRight, Star } from 'lucide-react-native';
import { voiceService, VoiceOption } from '@/services/voiceService';

interface VoiceSettingsProps {
  isVisible: boolean;
  onClose: () => void;
  onVoiceChange: (voice: VoiceOption) => void;
  currentVoice?: VoiceOption | null;
}

export default function VoiceSettings({ isVisible, onClose, onVoiceChange, currentVoice }: VoiceSettingsProps) {
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption | null>(currentVoice || null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isVisible) {
      loadVoices();
    }
  }, [isVisible]);

  const loadVoices = async () => {
    setIsLoading(true);
    try {
      await voiceService.initialize();
      const voices = voiceService.getAvailableVoices();
      setAvailableVoices(voices);
      
      // Set default voice if none selected
      if (!selectedVoice && voices.length > 0) {
        const bestVoice = voiceService.getBestVoice();
        setSelectedVoice(bestVoice);
      }
    } catch (error) {
      console.error('Failed to load voices:', error);
      Alert.alert('Error', 'Failed to load available voices');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceSelect = (voice: VoiceOption) => {
    setSelectedVoice(voice);
    onVoiceChange(voice);
  };

  const testVoice = async (voice: VoiceOption) => {
    try {
      const testText = "Hello! This is a test of the voice narrator. Welcome to the Rork History Scanner app.";
      
      await voiceService.speak(testText, { voice: voice.identifier }, {
        onStart: () => {
          Alert.alert('Testing Voice', `Playing test audio with ${voice.name}...`);
        },
        onDone: () => {
          console.log('Voice test completed');
        },
        onError: (error) => {
          Alert.alert('Voice Test Error', `Failed to test voice: ${error}`);
        }
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to test voice');
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality.toLowerCase()) {
      case 'premium':
        return '#FFD700'; // Gold
      case 'enhanced':
        return '#87CEEB'; // Sky blue
      case 'basic':
        return '#98FB98'; // Pale green
      default:
        return '#D3D3D3'; // Light gray
    }
  };

  const getQualityLabel = (quality: string) => {
    switch (quality.toLowerCase()) {
      case 'premium':
        return 'Premium';
      case 'enhanced':
        return 'Enhanced';
      case 'basic':
        return 'Basic';
      default:
        return 'Standard';
    }
  };

  const getProviderIcon = (provider: string) => {
    if (provider === 'elevenlabs') {
      return <Star size={16} color="#FFD700" />;
    }
    return <Volume2 size={16} color="#666" />;
  };

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Voice Settings</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading voices...</Text>
            </View>
          ) : (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Available Voices</Text>
                <Text style={styles.sectionSubtitle}>
                  Choose your preferred narrator voice for monument descriptions
                </Text>
              </View>

              {availableVoices.map((voice) => (
                <TouchableOpacity
                  key={voice.identifier}
                  style={[
                    styles.voiceItem,
                    selectedVoice?.identifier === voice.identifier && styles.selectedVoiceItem
                  ]}
                  onPress={() => handleVoiceSelect(voice)}
                >
                  <View style={styles.voiceInfo}>
                    <View style={styles.voiceHeader}>
                      <Text style={styles.voiceName}>{voice.name}</Text>
                      <View style={styles.voiceBadges}>
                        <View style={[styles.qualityBadge, { backgroundColor: getQualityColor(voice.quality) }]}>
                          <Text style={styles.qualityText}>{getQualityLabel(voice.quality)}</Text>
                        </View>
                        {getProviderIcon(voice.provider)}
                      </View>
                    </View>
                    
                    <View style={styles.voiceDetails}>
                      <Text style={styles.voiceDetail}>
                        Language: {voice.language}
                      </Text>
                      {voice.gender && (
                        <Text style={styles.voiceDetail}>
                          Gender: {voice.gender}
                        </Text>
                      )}
                      <Text style={styles.voiceDetail}>
                        Provider: {voice.provider === 'elevenlabs' ? 'ElevenLabs AI' : 'Built-in'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.voiceActions}>
                    {selectedVoice?.identifier === voice.identifier && (
                      <Check size={20} color="#007AFF" />
                    )}
                    <TouchableOpacity
                      style={styles.testButton}
                      onPress={() => testVoice(voice)}
                    >
                      <Volume2 size={16} color="#007AFF" />
                      <Text style={styles.testButtonText}>Test</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}

              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>Voice Quality</Text>
                <View style={styles.qualityInfo}>
                  <View style={styles.qualityItem}>
                    <View style={[styles.qualityDot, { backgroundColor: '#FFD700' }]} />
                    <Text style={styles.qualityItemText}>Premium - AI-powered natural voices (ElevenLabs)</Text>
                  </View>
                  <View style={styles.qualityItem}>
                    <View style={[styles.qualityDot, { backgroundColor: '#87CEEB' }]} />
                    <Text style={styles.qualityItemText}>Enhanced - High-quality device voices</Text>
                  </View>
                  <View style={styles.qualityItem}>
                    <View style={[styles.qualityDot, { backgroundColor: '#98FB98' }]} />
                    <Text style={styles.qualityItemText}>Basic - Standard device voices</Text>
                  </View>
                </View>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>About ElevenLabs</Text>
                <Text style={styles.infoText}>
                  ElevenLabs provides AI-powered voices that sound incredibly natural and human-like. 
                  These voices are free to use within monthly limits and offer superior quality compared to built-in device voices.
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  voiceItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  selectedVoiceItem: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  voiceInfo: {
    flex: 1,
  },
  voiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  voiceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  voiceBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qualityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  qualityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  voiceDetails: {
    gap: 2,
  },
  voiceDetail: {
    fontSize: 12,
    color: '#666',
  },
  voiceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f8ff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  testButtonText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  qualityInfo: {
    gap: 8,
  },
  qualityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qualityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  qualityItemText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
