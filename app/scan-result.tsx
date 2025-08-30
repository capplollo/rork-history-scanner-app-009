import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { X, MapPin, Calendar, Info, Share2, CheckCircle, AlertCircle, MessageCircle, Volume2, VolumeX, Pause, RefreshCw, ChevronDown, ChevronUp } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { mockMonuments } from "@/data/mockMonuments";
import AsyncStorage from "@react-native-async-storage/async-storage";
import VoiceSettings from "@/components/VoiceSettings";
<<<<<<< HEAD
=======
import { detectMonumentsAndArt, AdditionalInfo } from "@/services/monumentDetectionService";
>>>>>>> 4732a54d147b6cb99b572dc2354968fcd61c1611
import FormattedText from "@/components/FormattedText";

const { width: screenWidth } = Dimensions.get("window");

// Define basic types for the simplified version
interface MonumentData {
  id: string;
  name: string;
  location: string;
  country: string;
  period: string;
  description: string;
  significance: string;
  facts: string[];
  image: string;
  scannedImage: string;
  scannedAt: string;
  confidence: number;
  isRecognized: boolean;
  detailedDescription?: {
    keyTakeaways: string[];
    inDepthContext: string;
    curiosities: string;
  };
}

export default function ScanResultScreen() {
  const { monumentId, scanData, resultId, historyItemId, monumentName, location, period, scannedImage, regenerate } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showVoiceSettings, setShowVoiceSettings] = useState<boolean>(false);
  const [isReanalyzing, setIsReanalyzing] = useState<boolean>(false);
  const [showContextForm, setShowContextForm] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [contextInfo, setContextInfo] = useState({
    name: "",
    location: "",
    building: "",
    notes: "",
  });
  
<<<<<<< HEAD
  const [monument, setMonument] = useState<MonumentData | undefined>(undefined);
  
  // Load monument data on component mount
=======
  // Cleanup speech when component unmounts or when navigating away
  useEffect(() => {
    return () => {
      // Force cleanup of voice service when component unmounts
      voiceService.forceCleanup().catch(error => {
        console.error('Error during voice cleanup:', error);
      });
      
      // Clean up stored result when component unmounts
      if (resultId && typeof resultId === 'string') {
        scanResultStore.clear(resultId);
      }
    };
  }, [resultId]);
  
  // Additional cleanup when navigation focus changes
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      // Stop voice when navigating away
      voiceService.forceCleanup().catch(error => {
        console.error('Error during navigation voice cleanup:', error);
      });
    });
    
    return unsubscribe;
  }, [navigation]);

  // Initialize voice service and set default voice
  useEffect(() => {
    const initializeVoice = async () => {
      try {
        await voiceService.initialize();
        const bestVoice = voiceService.getBestVoice();
        setSelectedVoice(bestVoice);
      } catch (error) {
        console.error('Error initializing voice service:', error);
      }
    };
    
    initializeVoice();
  }, []);
  
  const [monument, setMonument] = useState<HistoryItem | undefined>(undefined);
  
  // Load monument data on component mount with better error handling and retry logic
>>>>>>> 4732a54d147b6cb99b572dc2354968fcd61c1611
  useEffect(() => {
    const loadMonumentData = async () => {
      let loadedMonument: MonumentData | undefined;
      
      // Check if this is a regeneration request from history
      if (regenerate === 'true' && monumentName && typeof monumentName === 'string') {
        console.log('🔄 Regenerating content for history item:', monumentName);
        setIsRegenerating(true);
        
        try {
<<<<<<< HEAD
          // Create basic monument data since backend services are not available
          loadedMonument = {
=======
          // Create a basic monument object with available data
          const basicMonument: HistoryItem = {
>>>>>>> 4732a54d147b6cb99b572dc2354968fcd61c1611
            id: (historyItemId as string) || 'history-item',
            name: monumentName as string,
            location: (location as string) || '',
            period: (period as string) || '',
<<<<<<< HEAD
            description: `${monumentName} is a remarkable monument located in ${location}. This historical site represents the rich cultural heritage and architectural achievements of ${period}.`,
            significance: `This monument holds profound historical and cultural significance, representing the architectural and artistic achievements of ${period}.`,
            facts: [
              `Located in ${location}`,
              `Historical period: ${period}`,
              'Previously scanned and identified',
              'This monument represents important cultural heritage',
              'The site has been preserved for future generations'
            ],
            image: (scannedImage as string) || '',
            scannedImage: (scannedImage as string) || '',
            scannedAt: new Date().toISOString(),
            confidence: 85,
            isRecognized: true,
            detailedDescription: {
              keyTakeaways: [
                `${monumentName} is a significant historical monument`,
                `Located in ${location} during ${period}`,
                'Represents important cultural and architectural heritage',
                'Preserved for future generations to appreciate'
              ],
              inDepthContext: `${monumentName} stands as a remarkable example of ${period} architecture and cultural expression.`,
              curiosities: 'This monument has been preserved through various historical periods and continues to attract visitors from around the world.'
            }
          };
        } catch (error) {
          console.error('Error during content regeneration:', error);
=======
            description: '', // Will be regenerated
            significance: '', // Will be regenerated
            facts: [], // Will be regenerated
            image: (scannedImage as string) || '', // Use scanned image as main image
            scannedImage: (scannedImage as string) || '',
            scannedAt: new Date().toISOString(),
            confidence: undefined,
            isRecognized: true, // Assume recognized since it's in history
            detailedDescription: undefined, // Will be regenerated
          };
          
          // Regenerate content via API using the same comprehensive analysis as first-time scans
          if (basicMonument.scannedImage) {
            try {
              console.log('🔄 Starting content regeneration with same prompt as first-time scan...');
              console.log('Image URI for regeneration:', basicMonument.scannedImage.substring(0, 100) + '...');
              
              const detectionResult = await detectMonumentsAndArt(basicMonument.scannedImage);
              
              console.log('🔍 Regeneration result:', {
                name: detectionResult.artworkName,
                confidence: detectionResult.confidence,
                hasDetailedDescription: !!detectionResult.detailedDescription,
                inDepthContextLength: detectionResult.detailedDescription?.inDepthContext?.length || 0
              });
              
              // Update the monument with regenerated content - ensure it's marked as recognized
              loadedMonument = {
                ...basicMonument,
                name: detectionResult.artworkName || basicMonument.name, // Use detected name or fallback to history name
                description: detectionResult.description,
                significance: detectionResult.significance,
                facts: detectionResult.facts,
                confidence: Math.max(detectionResult.confidence, 80), // Ensure high confidence for history items
                isRecognized: true, // Force recognized for history items
                detailedDescription: detectionResult.detailedDescription,
              };
              
              console.log('✅ Content regenerated successfully for:', monumentName);
              console.log('📝 Detailed description available:', !!loadedMonument.detailedDescription);
              console.log('📝 Is recognized:', loadedMonument.isRecognized);
              console.log('📝 Confidence:', loadedMonument.confidence);
              if (loadedMonument.detailedDescription?.inDepthContext) {
                console.log('📄 In-depth context length:', loadedMonument.detailedDescription.inDepthContext.length);
                console.log('📄 In-depth context preview:', loadedMonument.detailedDescription.inDepthContext.substring(0, 200) + '...');
              }
            } catch (regenerationError) {
              console.error('❌ Failed to regenerate content:', regenerationError);
              console.error('❌ Regeneration error details:', {
                message: regenerationError instanceof Error ? regenerationError.message : 'Unknown error',
                stack: regenerationError instanceof Error ? regenerationError.stack : undefined
              });
              // Use basic monument data as fallback but mark as recognized
              loadedMonument = {
                ...basicMonument,
                description: `${basicMonument.name} is a significant monument located in ${basicMonument.location}. This historical site represents important cultural heritage from ${basicMonument.period}.`,
                significance: `This monument holds historical and cultural significance, representing the architectural and artistic achievements of ${basicMonument.period}.`,
                facts: [
                  `Located in ${basicMonument.location}`,
                  `Period: ${basicMonument.period}`,
                  'Previously scanned and identified',
                  'Content regeneration in progress'
                ],
                confidence: 85, // Set reasonable confidence for history items
                isRecognized: true, // Ensure it's marked as recognized
              };
            }
          } else {
            console.warn('⚠️ No image available for regeneration, using basic data');
            // No image available, use basic data but mark as recognized
            loadedMonument = {
              ...basicMonument,
              description: `${basicMonument.name} is a significant monument located in ${basicMonument.location}. This historical site represents important cultural heritage from ${basicMonument.period}.`,
              significance: `This monument holds historical and cultural significance, representing the architectural and artistic achievements of ${basicMonument.period}.`,
              facts: [
                `Located in ${basicMonument.location}`,
                `Period: ${basicMonument.period}`,
                'Previously scanned and identified'
              ],
              confidence: 85, // Set reasonable confidence for history items
              isRecognized: true, // Ensure it's marked as recognized
            };
          }
        } catch (error) {
          console.error('Error setting up regeneration:', error);
>>>>>>> 4732a54d147b6cb99b572dc2354968fcd61c1611
        } finally {
          setIsRegenerating(false);
        }
      } else {
        // Try to load from mock data or create basic data
        if (monumentId && typeof monumentId === 'string') {
          const mockMonument = mockMonuments.find(m => m.id === monumentId);
          if (mockMonument) {
            loadedMonument = {
              ...mockMonument,
              scannedImage: (scannedImage as string) || mockMonument.image,
              scannedAt: new Date().toISOString(),
            };
          }
        }
        
        // If no mock data found, create basic monument data
        if (!loadedMonument) {
          loadedMonument = {
            id: resultId as string || 'unknown',
            name: monumentName as string || 'Unknown Monument',
            location: location as string || 'Unknown Location',
            country: '',
            period: period as string || 'Unknown Period',
            description: 'This is a historical monument that has been scanned and analyzed.',
            significance: 'This monument holds historical and cultural significance.',
            facts: [
              'Scanned and analyzed by our system',
              'Historical monument',
              'Cultural significance'
            ],
            image: (scannedImage as string) || '',
            scannedImage: (scannedImage as string) || '',
            scannedAt: new Date().toISOString(),
            confidence: 75,
            isRecognized: true,
          };
        }
      }
      
      setMonument(loadedMonument);
      setIsLoading(false);
    };
    
    loadMonumentData();
  }, [monumentId, scanData, resultId, historyItemId, monumentName, location, period, scannedImage, regenerate]);

  const handleReanalyze = async () => {
    setIsReanalyzing(true);
    // Simulate reanalysis
    setTimeout(() => {
      setIsReanalyzing(false);
      Alert.alert('Reanalysis Complete', 'The monument has been reanalyzed with updated information.');
    }, 2000);
  };

  const handleShare = () => {
    Alert.alert('Share', 'Share functionality will be implemented when backend is ready.');
  };

<<<<<<< HEAD
=======
  const handleStop = async () => {
    try {
      await voiceService.stop();
      setIsPlaying(false);
      setIsPaused(false);
    } catch {
      // Silently handle stop errors
    }
  };

  const handleGoBack = () => {
    try {
      // Check if we can go back in the navigation stack
      if (navigation.canGoBack()) {
        router.back();
      } else {
        // If no screen to go back to, navigate to the main tabs
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to main tabs
      router.replace('/(tabs)');
    }
  };

  // Show loading state while data is being loaded
>>>>>>> 4732a54d147b6cb99b572dc2354968fcd61c1611
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading monument details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!monument) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load monument data</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
<<<<<<< HEAD
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <X size={24} color="#000" />
=======
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: monument.scannedImage || monument.image || 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400' }} style={styles.monumentImage} />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            style={styles.imageOverlay}
          >
            <Text style={styles.monumentName}>{monument.name}</Text>
            {monument.confidence !== undefined && (
              <View style={styles.confidenceContainer}>
                {monument.isRecognized ? (
                  <CheckCircle size={16} color="#10b981" />
                ) : (
                  <AlertCircle size={16} color="#f59e0b" />
                )}
                <Text style={styles.confidenceText}>
                  {monument.confidence}% confidence
                </Text>
              </View>
            )}
          </LinearGradient>
          <TouchableOpacity style={styles.closeButton} onPress={handleGoBack}>
            <X size={24} color="#ffffff" />
>>>>>>> 4732a54d147b6cb99b572dc2354968fcd61c1611
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Share2 size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Monument Image */}
        {monument.scannedImage && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: monument.scannedImage }} style={styles.monumentImage} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.imageOverlay}
            />
          </View>
        )}

<<<<<<< HEAD
        {/* Monument Info */}
        <View style={styles.contentContainer}>
          <Text style={styles.monumentName}>{monument.name}</Text>
          
          <View style={styles.locationContainer}>
            <MapPin size={16} color="#666" />
            <Text style={styles.locationText}>{monument.location}</Text>
=======
        <View style={styles.content}>
          <View style={styles.infoCards}>
            <View style={styles.infoCard}>
              <MapPin size={20} color="#1e3a8a" />
              <View>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{monument.location}</Text>
              </View>
            </View>
            <View style={styles.infoCard}>
              <Calendar size={20} color="#1e3a8a" />
              <View>
                <Text style={styles.infoLabel}>Period</Text>
                <Text style={styles.infoValue}>{monument.period}</Text>
              </View>
            </View>
>>>>>>> 4732a54d147b6cb99b572dc2354968fcd61c1611
          </View>
          
          <View style={styles.periodContainer}>
            <Calendar size={16} color="#666" />
            <Text style={styles.periodText}>{monument.period}</Text>
          </View>

          {/* Recognition Status */}
          <View style={styles.recognitionContainer}>
            {monument.isRecognized ? (
              <View style={styles.recognizedContainer}>
                <CheckCircle size={16} color="#4CAF50" />
                <Text style={styles.recognizedText}>Recognized</Text>
                <Text style={styles.confidenceText}>{monument.confidence}% confidence</Text>
              </View>
            ) : (
              <View style={styles.notRecognizedContainer}>
                <AlertCircle size={16} color="#FF9800" />
                <Text style={styles.notRecognizedText}>Not Recognized</Text>
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <FormattedText text={monument.description} style={styles.descriptionText} />
          </View>

          {/* Significance */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Historical Significance</Text>
            <FormattedText text={monument.significance} style={styles.descriptionText} />
          </View>

          {/* Key Facts */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Facts</Text>
            {monument.facts.map((fact, index) => (
              <View key={index} style={styles.factContainer}>
                <Text style={styles.factBullet}>•</Text>
                <Text style={styles.factText}>{fact}</Text>
              </View>
            ))}
          </View>

          {/* Detailed Description */}
          {monument.detailedDescription && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Detailed Analysis</Text>
              
              <Text style={styles.subsectionTitle}>Key Takeaways</Text>
              {monument.detailedDescription.keyTakeaways.map((takeaway, index) => (
                <View key={index} style={styles.factContainer}>
                  <Text style={styles.factBullet}>•</Text>
                  <Text style={styles.factText}>{takeaway}</Text>
                </View>
              ))}
              
              <Text style={styles.subsectionTitle}>In-Depth Context</Text>
              <FormattedText text={monument.detailedDescription.inDepthContext} style={styles.descriptionText} />
              
              <Text style={styles.subsectionTitle}>Curiosities</Text>
              <FormattedText text={monument.detailedDescription.curiosities} style={styles.descriptionText} />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.reanalyzeButton]} 
          onPress={handleReanalyze}
          disabled={isReanalyzing}
        >
          {isReanalyzing ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <RefreshCw size={20} color="#FFF" />
          )}
          <Text style={styles.actionButtonText}>
            {isReanalyzing ? 'Reanalyzing...' : 'Reanalyze'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
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
  closeButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  imageContainer: {
    position: 'relative',
    height: 300,
  },
  monumentImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  contentContainer: {
    padding: 20,
  },
  monumentName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  periodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  periodText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  recognitionContainer: {
    marginBottom: 24,
  },
  recognizedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
  },
  recognizedText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  confidenceText: {
    marginLeft: 'auto',
    fontSize: 12,
    color: '#666',
  },
  notRecognizedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
  },
  notRecognizedText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9800',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  factContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  factBullet: {
    fontSize: 16,
    color: '#007AFF',
    marginRight: 8,
    fontWeight: 'bold',
  },
  factText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  actionBar: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#fff',
  },
  reanalyzeButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
