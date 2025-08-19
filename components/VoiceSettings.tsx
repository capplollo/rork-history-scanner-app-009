import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Settings, Volume2, Check, ChevronRight } from 'lucide-react-native';
import { voiceService, VoiceOption } from '@/services/voiceService';

interface VoiceSettingsProps {
  isVisible: boolean;
  onClose: () => void;
  onVoiceChange?: (voice: VoiceOption) => void;
  currentVoice?: VoiceOption;
}

export default function VoiceSettings({ 
  isVisible, 
  onClose, 
  onVoiceChange,
  currentVoice 
}: VoiceSettingsProps) {
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
      console.error('Error loading voices:', error);
      Alert.alert('Error', 'Failed to load available voices');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceSelect = (voice: VoiceOption) => {
    setSelectedVoice(voice);
    onVoiceChange?.(voice);
  };

  const testVoice = async (voice: VoiceOption) => {
    try {
      const testText = "Hello! This is a test of the voice narration. How does this sound to you?";
      await voiceService.speak(testText, { voice: voice.id });
    } catch (error) {
      console.error('Error testing voice:', error);
      Alert.alert('Error', 'Failed to test voice');
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'enhanced': return '#10b981';
      case 'premium': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getQualityLabel = (quality: string) => {
    switch (quality) {
      case 'enhanced': return 'Enhanced';
      case 'premium': return 'Premium';
      default: return 'Basic';
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Done</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Voice Settings</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Voices</Text>
            <Text style={styles.sectionDescription}>
              Choose your preferred voice for monument narration. Enhanced voices provide more natural speech.
            </Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading voices...</Text>
            </View>
          ) : (
            <View style={styles.voiceList}>
              {availableVoices.map((voice) => (
                <View key={voice.id} style={styles.voiceItem}>
                  <View style={styles.voiceInfo}>
                    <View style={styles.voiceHeader}>
                      <Text style={styles.voiceName}>{voice.name}</Text>
                      <View style={[
                        styles.qualityBadge, 
                        { backgroundColor: getQualityColor(voice.quality) }
                      ]}>
                        <Text style={styles.qualityText}>
                          {getQualityLabel(voice.quality)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.voiceDetails}>
                      {voice.language} • {voice.gender || 'Neutral'}
                    </Text>
                  </View>
                  
                  <View style={styles.voiceActions}>
                    <TouchableOpacity
                      style={styles.testButton}
                      onPress={() => testVoice(voice)}
                    >
                      <Volume2 size={16} color="#6b7280" />
                      <Text style={styles.testButtonText}>Test</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.selectButton,
                        selectedVoice?.id === voice.id && styles.selectButtonActive
                      ]}
                      onPress={() => handleVoiceSelect(voice)}
                    >
                      {selectedVoice?.id === voice.id ? (
                        <Check size={16} color="#ffffff" />
                      ) : (
                        <ChevronRight size={16} color="#6b7280" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Voice Quality</Text>
            <View style={styles.qualityInfo}>
              <View style={styles.qualityItem}>
                <View style={[styles.qualityDot, { backgroundColor: '#6b7280' }]} />
                <Text style={styles.qualityItemText}>Basic - Standard speech synthesis</Text>
              </View>
              <View style={styles.qualityItem}>
                <View style={[styles.qualityDot, { backgroundColor: '#10b981' }]} />
                <Text style={styles.qualityItemText}>Enhanced - More natural, human-like speech</Text>
              </View>
              <View style={styles.qualityItem}>
                <View style={[styles.qualityDot, { backgroundColor: '#8b5cf6' }]} />
                <Text style={styles.qualityItemText}>Premium - Highest quality voices (if available)</Text>
              </View>
            </View>
          </View>

          <View style={styles.platformInfo}>
            <Text style={styles.platformText}>
              Platform: {Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web'}
            </Text>
            <Text style={styles.platformText}>
              Available voices: {availableVoices.length}
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  voiceList: {
    marginBottom: 30,
  },
  voiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 12,
  },
  voiceInfo: {
    flex: 1,
    marginRight: 16,
  },
  voiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  voiceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginRight: 8,
  },
  qualityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  qualityText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '500',
  },
  voiceDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  voiceActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  testButtonText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  selectButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectButtonActive: {
    backgroundColor: '#007AFF',
  },
  infoSection: {
    marginBottom: 30,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  qualityInfo: {
    gap: 8,
  },
  qualityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qualityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  qualityItemText: {
    fontSize: 14,
    color: '#6b7280',
  },
  platformInfo: {
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  platformText: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
});
