import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  Share2, 
  MapPin, 
  Calendar,
  Camera,
  Volume2,
  VolumeX
} from 'lucide-react-native';
import { useHistory } from '@/providers/HistoryProvider';
import { scanResultStore } from '@/services/scanResultStore';
import { detectMonumentsAndArt } from '@/services/monumentDetectionService';
// import { speakText, stopSpeaking } from '@/services/voiceService';
import SocialShareCard from '@/components/SocialShareCard';

const { width: screenWidth } = Dimensions.get('window');

export default function ScanResultScreen() {
  const router = useRouter();
  const { addToHistory } = useHistory();
  const { monumentId, scanData, resultId, historyItemId, monumentName, location, period, scannedImage, regenerate } = useLocalSearchParams();
  
  const [monument, setMonument] = useState<any>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSpeaking, setIsSpeakingState] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [contextInfo, setContextInfo] = useState('');
  const [hasAddedToHistory, setHasAddedToHistory] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const loadMonumentData = async () => {
      setIsLoading(true);
      let loadedMonument: any = undefined;

      try {
        // Check if this is a regeneration request from history
        if (regenerate === 'true' && monumentName && typeof monumentName === 'string') {
          console.log('🔄 Regenerating content for history item:', monumentName);
          setIsRegenerating(true);
          
          try {
            // Create a basic monument object with available data
            const basicMonument = {
              id: (historyItemId as string) || 'history-item',
              name: monumentName as string,
              location: (location as string) || '',
              country: '', // Will be filled by AI
              period: (period as string) || '',
              image: (scannedImage as string) || '',
              scannedAt: new Date().toISOString(),
            };
            
            // Regenerate content via API
            if (basicMonument.image) {
              try {
                console.log('🔄 Starting content regeneration...');
                
                const detectionResult = await detectMonumentsAndArt(basicMonument.image);
                
                console.log('🔍 Regeneration result:', {
                  name: detectionResult.artworkName,
                  confidence: detectionResult.confidence,
                });
                
                // Update the monument with regenerated content
                loadedMonument = {
                  ...basicMonument,
                  name: detectionResult.artworkName || basicMonument.name,
                  location: detectionResult.location || basicMonument.location,
                  country: detectionResult.country || '',
                  period: detectionResult.period || basicMonument.period,
                };
                
                console.log('✅ Content regenerated successfully for:', monumentName);
              } catch (regenerationError) {
                console.error('❌ Failed to regenerate content:', regenerationError);
                loadedMonument = basicMonument;
              }
            } else {
              console.warn('⚠️ No image available for regeneration, using basic data');
              loadedMonument = basicMonument;
            }
          } catch (error) {
            console.error('Error setting up regeneration:', error);
          } finally {
            setIsRegenerating(false);
          }
        } else if (resultId && typeof resultId === 'string') {
          // Load from scan result store
          console.log('📦 Loading from scan result store:', resultId);
          loadedMonument = scanResultStore.retrieve(resultId);
          
          if (!loadedMonument) {
            console.warn('❌ No result found in store, checking scan data...');
            if (scanData && typeof scanData === 'string') {
              try {
                const parsedData = JSON.parse(scanData);
                loadedMonument = parsedData;
              } catch (parseError) {
                console.error('Error parsing scan data:', parseError);
              }
            }
          }
        } else if (monumentId && typeof monumentId === 'string') {
          // Load from monument ID (mock data for now)
          console.log('🏛️ Loading mock monument:', monumentId);
          loadedMonument = {
            id: monumentId,
            name: 'Sample Monument',
            location: 'Sample Location',
            country: 'Sample Country',
            period: 'Sample Period',
            image: 'https://via.placeholder.com/400x300',
            scannedAt: new Date().toISOString(),
          };
        } else {
          // Try to load from local storage as fallback
          console.log('📱 Loading from local storage as fallback...');
          try {
            const stored = await AsyncStorage.getItem('@monument_scanner_history');
            if (stored) {
              const historyItems = JSON.parse(stored);
              if (historyItems && historyItems.length > 0) {
                const mostRecent = historyItems[0];
                loadedMonument = {
                  id: mostRecent.id || 'unknown',
                  name: mostRecent.name || 'Unknown Monument',
                  location: mostRecent.location || 'Unknown Location',
                  country: mostRecent.country || 'Unknown Country',
                  period: mostRecent.period || 'Unknown Period',
                  image: mostRecent.image || '',
                  scannedAt: mostRecent.scannedAt || new Date().toISOString(),
                };
              }
            }
          } catch (storageError) {
            console.error('Error loading from storage:', storageError);
          }
        }

        if (loadedMonument) {
          setMonument(loadedMonument);
          
          // Add to history if not already added
          if (!hasAddedToHistory) {
            await addToHistory(loadedMonument);
            setHasAddedToHistory(true);
          }
        } else {
          Alert.alert('Error', 'Could not load monument data. Please try scanning again.');
          router.back();
        }
      } catch (error) {
        console.error('Error loading monument data:', error);
        Alert.alert('Error', 'Failed to load monument data. Please try again.');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    loadMonumentData();
  }, [resultId, scanData, monumentId, regenerate, monumentName, location, period, scannedImage, historyItemId]);

  const handleAnalyze = async () => {
    if (!monument?.image) {
      Alert.alert('Error', 'No image available for analysis.');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const detectionResult = await detectMonumentsAndArt(monument.image, {
        name: contextInfo.includes('name:') ? contextInfo.split('name:')[1]?.split(',')[0]?.trim() : '',
        location: contextInfo.includes('location:') ? contextInfo.split('location:')[1]?.split(',')[0]?.trim() : '',
        building: contextInfo.includes('building:') ? contextInfo.split('building:')[1]?.split(',')[0]?.trim() : '',
        notes: contextInfo,
      });
      
      // Update monument with new analysis results
      const updatedMonument = {
        ...monument,
        name: detectionResult.artworkName || monument.name,
        location: detectionResult.location || monument.location,
        country: detectionResult.country || monument.country,
        period: detectionResult.period || monument.period,
      };
      
      setMonument(updatedMonument);
      
      if (detectionResult.isRecognized && detectionResult.confidence > 50) {
        Alert.alert('Success!', `Monuments and art identified as ${detectionResult.artworkName} with ${detectionResult.confidence}% confidence.`);
      } else {
        Alert.alert('Analysis Complete', 'The analysis is complete. Check the results below.');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert('Error', 'Failed to analyze the image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleVoiceToggle = async () => {
    // Voice functionality disabled in simplified version
    console.log('Voice toggle - not implemented in simplified version');
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading monument details...</Text>
      </View>
    );
  }

  if (!monument) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No monument data available</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.errorText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'transparent']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleVoiceToggle}>
            {isSpeaking ? <VolumeX size={20} color="#ffffff" /> : <Volume2 size={20} color="#ffffff" />}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
            <Share2 size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image */}
        <View style={styles.heroSection}>
          <Image 
            source={{ uri: monument.scannedImage || monument.image || 'https://via.placeholder.com/400x300?text=No+Image' }} 
            style={styles.monumentImage} 
            onError={(error) => {
              console.log('Image load error:', error.nativeEvent.error);
            }}
          />
          
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.imageOverlay}
          />
          
          <View style={styles.heroContent}>
            <Text style={styles.monumentName}>{monument.name}</Text>
            
            <View style={styles.locationContainer}>
              <MapPin size={16} color="#ffffff" />
              <Text style={styles.locationText}>{monument.location}</Text>
            </View>
            
            <View style={styles.countryContainer}>
              <Text style={styles.countryText}>{monument.country}</Text>
            </View>
            
            <View style={styles.periodContainer}>
              <Calendar size={16} color="#ffffff" />
              <Text style={styles.periodText}>{monument.period}</Text>
            </View>
          </View>
        </View>

        {/* Analysis Section */}
        <View style={styles.analysisSection}>
          <Text style={styles.sectionTitle}>Image Analysis</Text>
          
          <View style={styles.contextForm}>
            <Text style={styles.contextFormDescription}>
              Add context about what you know about this monument or artwork to improve the analysis:
            </Text>
            
            <TextInput
              style={styles.contextInput}
              placeholder="e.g., This is a famous cathedral in Paris, built in the Gothic style..."
              placeholderTextColor="#999999"
              multiline
              numberOfLines={3}
              value={contextInfo}
              onChangeText={setContextInfo}
            />
            
            <TouchableOpacity
              style={[styles.analyzeButton, isAnalyzing && styles.analyzeButtonDisabled]}
              onPress={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Camera size={20} color="#ffffff" />
              )}
              <Text style={styles.analyzeButtonText}>
                {isAnalyzing ? 'Analyzing...' : 'Analyze Image'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Basic Information */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Monument Information</Text>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{monument.name}</Text>
          </View>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>{monument.location}</Text>
          </View>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Country</Text>
            <Text style={styles.infoValue}>{monument.country}</Text>
          </View>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Period</Text>
            <Text style={styles.infoValue}>{monument.period}</Text>
          </View>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Scanned</Text>
            <Text style={styles.infoValue}>
              {new Date(monument.scannedAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Share Modal */}
      <SocialShareCard
        item={monument}
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  errorText: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 20,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    position: 'relative',
    height: 400,
  },
  monumentImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  monumentName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  countryContainer: {
    marginBottom: 8,
  },
  countryText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  periodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  periodText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  analysisSection: {
    padding: 20,
    backgroundColor: '#ffffff',
    margin: 20,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  contextForm: {
    gap: 16,
  },
  contextFormDescription: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
  },
  contextInput: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#f8f9fa',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  analyzeButtonDisabled: {
    backgroundColor: '#999999',
  },
  analyzeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  infoSection: {
    padding: 20,
    backgroundColor: '#ffffff',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  infoValue: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'right',
  },
});
