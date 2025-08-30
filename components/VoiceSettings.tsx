import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Volume2, X, Play, Pause, Settings } from 'lucide-react-native';

// Define a simplified voice interface
interface VoiceOption {
  identifier: string;
  name: string;
  language: string;
  quality: 'high' | 'medium' | 'low';
}

interface VoiceSettingsProps {
  visible: boolean;
  onClose: () => void;
  onVoiceChange?: (voice: VoiceOption) => void;
}

export default function VoiceSettings({ 
  visible, 
  onClose, 
  onVoiceChange 
}: VoiceSettingsProps) {
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock voice options
  const availableVoices: VoiceOption[] = [
    {
      identifier: 'en-US-1',
      name: 'Sarah (US)',
      language: 'en-US',
      quality: 'high'
    },
    {
      identifier: 'en-GB-1',
      name: 'James (UK)',
      language: 'en-GB',
      quality: 'high'
    },
    {
      identifier: 'en-AU-1',
      name: 'Emma (Australia)',
      language: 'en-AU',
      quality: 'medium'
    },
    {
      identifier: 'en-CA-1',
      name: 'Michael (Canada)',
      language: 'en-CA',
      quality: 'medium'
    }
  ];

  useEffect(() => {
    // Set default voice
    if (!selectedVoice && availableVoices.length > 0) {
      setSelectedVoice(availableVoices[0]);
    }
  }, []);

  const handleVoiceSelect = (voice: VoiceOption) => {
    setSelectedVoice(voice);
    onVoiceChange?.(voice);
  };

  const handleTestVoice = async () => {
    if (!selectedVoice) return;

    setIsLoading(true);
    setIsPlaying(true);

    try {
      // Simulate voice test
      setTimeout(() => {
        setIsPlaying(false);
        setIsLoading(false);
        Alert.alert('Voice Test', `Testing voice: ${selectedVoice.name}`);
      }, 2000);
    } catch (error) {
      setIsPlaying(false);
      setIsLoading(false);
      Alert.alert('Error', 'Failed to test voice. Please try again.');
    }
  };

  const handleStopTest = () => {
    setIsPlaying(false);
    setIsLoading(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Voice Settings</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Voice</Text>
            <Text style={styles.sectionDescription}>
              Choose a voice for monument narration
            </Text>
          </View>

          <View style={styles.voiceList}>
            {availableVoices.map((voice) => (
              <TouchableOpacity
                key={voice.identifier}
                style={[
                  styles.voiceOption,
                  selectedVoice?.identifier === voice.identifier && styles.selectedVoice
                ]}
                onPress={() => handleVoiceSelect(voice)}
              >
                <View style={styles.voiceInfo}>
                  <Text style={styles.voiceName}>{voice.name}</Text>
                  <Text style={styles.voiceLanguage}>{voice.language}</Text>
                  <View style={styles.qualityContainer}>
                    <Text style={styles.qualityText}>
                      Quality: {voice.quality}
                    </Text>
                  </View>
                </View>
                
                {selectedVoice?.identifier === voice.identifier && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {selectedVoice && (
            <View style={styles.testSection}>
              <Text style={styles.testTitle}>Test Voice</Text>
              <Text style={styles.testDescription}>
                Listen to how {selectedVoice.name} sounds
              </Text>
              
              <TouchableOpacity
                style={styles.testButton}
                onPress={isPlaying ? handleStopTest : handleTestVoice}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Text style={styles.testButtonText}>Loading...</Text>
                ) : isPlaying ? (
                  <>
                    <Pause size={20} color="#FFF" />
                    <Text style={styles.testButtonText}>Stop Test</Text>
                  </>
                ) : (
                  <>
                    <Play size={20} color="#FFF" />
                    <Text style={styles.testButtonText}>Test Voice</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFEFE',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C2C2C',
    fontFamily: 'Times New Roman',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C2C2C',
    marginBottom: 8,
    fontFamily: 'Times New Roman',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Times New Roman',
  },
  voiceList: {
    gap: 12,
    marginBottom: 24,
  },
  voiceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  selectedVoice: {
    backgroundColor: '#FFF8F0',
    borderColor: '#8B4513',
  },
  voiceInfo: {
    flex: 1,
  },
  voiceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 4,
    fontFamily: 'Times New Roman',
  },
  voiceLanguage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'Times New Roman',
  },
  qualityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qualityText: {
    fontSize: 12,
    color: '#8B4513',
    fontFamily: 'Times New Roman',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8B4513',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  testSection: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  testTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C2C2C',
    marginBottom: 8,
    fontFamily: 'Times New Roman',
  },
  testDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontFamily: 'Times New Roman',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B4513',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  testButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Times New Roman',
  },
});
