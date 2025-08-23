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
  AppState,
} from "react-native";
import { useLocalSearchParams, router, useNavigation } from "expo-router";
import { X, MapPin, Calendar, Info, Share2, CheckCircle, AlertCircle, MessageCircle, Volume2, VolumeX, Pause, RefreshCw, ChevronDown, ChevronUp } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { mockMonuments } from "@/data/mockMonuments";
import { HistoryItem, useHistory } from "@/providers/HistoryProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { scanResultStore } from "@/services/scanResultStore";
import { voiceService, VoiceOption } from "@/services/voiceService";
import VoiceSettings from "@/components/VoiceSettings";
import { detectMonumentsAndArt, AdditionalInfo } from "@/services/monumentDetectionService";
import { SupabaseHistoryService } from "@/services/supabaseHistoryService";
import FormattedText from "@/components/FormattedText";

const { width: screenWidth } = Dimensions.get("window");

export default function ScanResultScreen() {
  const { monumentId, scanData, resultId, historyItemId, monumentName, location, period, scannedImage, regenerate } = useLocalSearchParams();
  const { addToHistory } = useHistory();
  const navigation = useNavigation();
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showVoiceSettings, setShowVoiceSettings] = useState<boolean>(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption | null>(null);
  const [isReanalyzing, setIsReanalyzing] = useState<boolean>(false);
  const [showContextForm, setShowContextForm] = useState<boolean>(false);
  const [, setIsRegenerating] = useState<boolean>(false);
  const [contextInfo, setContextInfo] = useState<AdditionalInfo>({
    context: "",
  });
  
  // Cleanup speech when component unmounts or when navigating away
  useEffect(() => {
    return () => {
      console.log('🧹 Component unmounting - cleaning up voice service');
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
      console.log('🧹 Navigation beforeRemove - stopping voice service');
      // Stop voice when navigating away
      voiceService.forceCleanup().catch(error => {
        console.error('Error during navigation voice cleanup:', error);
      });
    });
    
    return unsubscribe;
  }, [navigation]);
  
  // Additional cleanup when app goes to background
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        console.log('🧹 App going to background - stopping voice service');
        voiceService.forceCleanup().catch(error => {
          console.error('Error during app state change voice cleanup:', error);
        });
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, []);
  
  // Additional cleanup when component loses focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      console.log('🧹 Component losing focus - stopping voice service');
      voiceService.forceCleanup().catch(error => {
        console.error('Error during blur voice cleanup:', error);
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
  useEffect(() => {
    const loadMonumentData = async () => {
      let loadedMonument: HistoryItem | undefined;
      let retryCount = 0;
      const maxRetries = 3;
      
      // Check if this is a regeneration request from history
      if (regenerate === 'true' && monumentName && typeof monumentName === 'string') {
        console.log('🔄 Regenerating content for history item:', monumentName);
        setIsRegenerating(true);
        
        try {
          // Use the new Supabase service to regenerate full details
          const { scanDetails, error } = await SupabaseHistoryService.getFullScanDetails(
            (historyItemId as string) || 'history-item',
            monumentName as string,
            (location as string) || '',
            '', // country - not available in params
            (period as string) || '',
            (scannedImage as string) || ''
          );
          
          console.log('🔄 Regeneration attempt - Image URL:', scannedImage);
          console.log('🔄 Regeneration attempt - Monument name:', monumentName);
          
          if (scanDetails && !error) {
            console.log('✅ Content regenerated successfully via Supabase service:', scanDetails.name);
            console.log('📝 Detailed description available:', !!scanDetails.detailedDescription);
            console.log('📝 Is recognized:', scanDetails.isRecognized);
            console.log('📝 Confidence:', scanDetails.confidence);
            
            loadedMonument = scanDetails;
          } else {
            console.error('❌ Failed to regenerate content via Supabase service:', error);
            
            // Fallback to basic monument data with more detailed content
            loadedMonument = {
              id: (historyItemId as string) || 'history-item',
              name: monumentName as string,
              location: (location as string) || '',
              country: '',
              period: (period as string) || '',
              description: `${monumentName} is a remarkable monument located in ${location}. This historical site represents the rich cultural heritage and architectural achievements of ${period}. The monument stands as a testament to the artistic and engineering skills of its creators, offering visitors a glimpse into the past and the cultural significance of this period.`,
              significance: `This monument holds profound historical and cultural significance, representing the architectural and artistic achievements of ${period}. It serves as a cultural landmark that connects present generations with the past, preserving important aspects of our shared heritage. The monument's design and construction reflect the technological capabilities and artistic vision of its time, making it an invaluable piece of cultural history.`,
              facts: [
                `Located in ${location}`,
                `Historical period: ${period}`,
                'Previously scanned and identified by our AI system',
                'This monument represents important cultural heritage',
                'The site has been preserved for future generations',
                'Content regeneration failed - please try scanning again for fresh analysis'
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
                inDepthContext: `${monumentName} stands as a remarkable example of ${period} architecture and cultural expression. Located in ${location}, this monument has witnessed centuries of history and continues to serve as a bridge between past and present. The monument's design reflects the artistic and engineering achievements of its time, showcasing the skills and vision of its creators. Its preservation ensures that future generations can appreciate and learn from this important piece of cultural heritage.`,
                curiosities: 'This monument has been preserved through various historical periods and continues to attract visitors from around the world who come to appreciate its historical and cultural significance.'
              }
            };
          }
        } catch (error) {
          console.error('Error during content regeneration:', error);
          
          // Fallback to basic monument data
          loadedMonument = {
            id: (historyItemId as string) || 'history-item',
            name: monumentName as string,
            location: (location as string) || '',
            country: '',
            period: (period as string) || '',
            description: `${monumentName} is a significant monument located in ${location}. This historical site represents important cultural heritage from ${period}.`,
            significance: `This monument holds historical and cultural significance, representing the architectural and artistic achievements of ${period}.`,
            facts: [
              `Located in ${location}`,
              `Period: ${period}`,
              'Previously scanned and identified',
              'Content regeneration failed - please try again'
            ],
            image: (scannedImage as string) || '',
            scannedImage: (scannedImage as string) || '',
            scannedAt: new Date().toISOString(),
            confidence: 85,
            isRecognized: true,
          };
        } finally {
          setIsRegenerating(false);
        }
      } else {
        // Original loading logic for new scans
        while (!loadedMonument && retryCount < maxRetries) {
          console.log(`Attempting to load monument data (attempt ${retryCount + 1}/${maxRetries})`);
          
          // Try to get data from resultId first (new method)
          if (resultId && typeof resultId === 'string') {
            try {
              const retrievedMonument = scanResultStore.retrieve(resultId);
              if (retrievedMonument && retrievedMonument.name) {
                loadedMonument = retrievedMonument;
                console.log('✅ Retrieved monument from store:', loadedMonument.name);
                console.log('🖼️ Image URLs from store:', {
                  image: loadedMonument.image ? loadedMonument.image.substring(0, 100) + '...' : 'empty',
                  scannedImage: loadedMonument.scannedImage ? loadedMonument.scannedImage.substring(0, 100) + '...' : 'empty'
                });
                break;
              } else {
                console.warn(`No valid monument found for resultId: ${resultId} (attempt ${retryCount + 1})`);
              }
            } catch (error) {
              console.error('Error retrieving monument from store:', error);
            }
          }
          
          // Legacy support for scanData (in case some old navigation still uses it)
          if (!loadedMonument && scanData && typeof scanData === 'string') {
            try {
              const parsedData = JSON.parse(scanData) as HistoryItem;
              if (parsedData && parsedData.name) {
                loadedMonument = parsedData;
                console.log('✅ Retrieved monument from scanData:', loadedMonument.name);
                break;
              }
            } catch (error) {
              console.error('Error parsing scan data:', error);
            }
          }
          
          // Fallback to mock data if no scan data
          if (!loadedMonument && monumentId) {
            const mockMonument = mockMonuments.find(m => m.id === monumentId);
            if (mockMonument) {
              loadedMonument = {
                ...mockMonument,
                scannedImage: mockMonument.image,
                scannedAt: new Date().toISOString(),
              };
              console.log('✅ Retrieved monument from mock data:', loadedMonument.name);
              break;
            }
          }
          
          // If no data found, wait a bit and retry (helps with race conditions)
          if (!loadedMonument && retryCount < maxRetries - 1) {
            console.log(`No monument data found, retrying in 500ms...`);
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          retryCount++;
        }
        
        if (!loadedMonument) {
          console.error('❌ Failed to load monument data after all retries');
          console.log('Attempting to get most recent scan from history...');
          
          // Try to get the most recent scan from history as a last resort
          try {
            const stored = await AsyncStorage.getItem('@monument_scanner_history');
            if (stored) {
              const historyItems = JSON.parse(stored);
              if (historyItems && historyItems.length > 0) {
                const mostRecent = historyItems[0];
                if (mostRecent && mostRecent.name) {
                  console.log('✅ Found recent scan in history:', mostRecent.name);
                  loadedMonument = {
                    id: mostRecent.id || 'history-fallback',
                    name: mostRecent.name,
                    location: mostRecent.location || 'Unknown Location',
                    period: mostRecent.period || 'Unknown Period',
                    description: 'This artwork was previously scanned. Content will be regenerated when you view details.',
                    significance: 'Historical significance will be loaded when viewing details.',
                    facts: ['Previously scanned artwork', 'Content available on demand'],
                    image: mostRecent.image || '',
                    scannedImage: mostRecent.scannedImage || mostRecent.image || '',
                    scannedAt: mostRecent.scannedAt || new Date().toISOString(),
                    confidence: mostRecent.confidence,
                    isRecognized: mostRecent.isRecognized !== false,
                  };
                }
              }
            }
          } catch (historyError) {
            console.error('Failed to get recent scan from history:', historyError);
          }
        }
      }
      
      setMonument(loadedMonument);
      setIsLoading(false);
    };
    
    loadMonumentData();
  }, [resultId, scanData, monumentId, regenerate, monumentName, location, period, scannedImage, historyItemId]);
  


  const getFullText = () => {
    if (!monument) {
      console.warn('No monument data available for voice narration');
      return '';
    }
    
    try {
      // Validate monument data before creating text
      if (!monument.name || monument.name.trim().length === 0) {
        console.warn('Monument name is missing or empty');
        return '';
      }
      
      let textToRead = '';
      
      // Use in-depth context directly if available
      if (monument.detailedDescription?.inDepthContext) {
        textToRead = monument.detailedDescription.inDepthContext;
      } else if (monument.description) {
        // Fallback to basic description if no detailed description
        textToRead = monument.description;
      } else {
        console.warn('No content available for voice narration');
        return '';
      }
      
      // Clean up text for better speech synthesis
      textToRead = textToRead
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown formatting for speech
        .replace(/\n/g, ' ') // Replace newlines with spaces
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/([.!?])\s*([A-Z])/g, '$1 $2') // Ensure proper spacing after punctuation
        .replace(/\b(\d{4})\b/g, '$1') // Keep years as numbers for better pronunciation
        .replace(/\b(BC|AD)\b/g, ' $1 ') // Add spaces around BC/AD for better pronunciation
        .replace(/\b(St\.|Saint)\s/g, 'Saint ') // Expand abbreviations
        .replace(/\b(Dr\.|Doctor)\s/g, 'Doctor ') // Expand doctor abbreviation
        .replace(/\b(Mr\.|Mister)\s/g, 'Mister ') // Expand mister abbreviation
        .replace(/\b(Mrs\.|Missus)\s/g, 'Missus ') // Expand missus abbreviation
        .replace(/\b&\b/g, 'and') // Replace & with 'and'
        .replace(/\b@\b/g, 'at') // Replace @ with 'at'
        .replace(/([.!?])([A-Z])/g, '$1 $2') // Add space after punctuation if missing
        .trim();
      
      // Final validation
      if (textToRead.length < 50) {
        console.warn('Generated text is too short, may not provide good narration');
        return '';
      }
      
      console.log('Voice will read in-depth context directly, length:', textToRead.length);
      return textToRead;
      
    } catch (error) {
      console.error('Error preparing text for voice narration:', error);
      return '';
    }
  };

  const handlePlayPause = async () => {
    try {
      console.log('Voice control triggered, current state:', { isPlaying, isPaused });
      
      if (isPlaying) {
        if (isPaused) {
          // Resume
          console.log('Resuming speech...');
          await voiceService.resume();
          setIsPaused(false);
        } else {
          // Pause
          console.log('Pausing speech...');
          await voiceService.pause();
          setIsPaused(true);
        }
      } else {
        // Start speaking
        console.log('Starting voice narration...');
        
        // Validate artwork data first
        if (!monument) {
          Alert.alert('No Data', 'Monuments and art information is not available. Please try scanning again.');
          return;
        }
        
        const fullText = getFullText();
        
        if (!fullText || fullText.trim().length === 0) {
          Alert.alert('No Content', 'No text content available to read aloud. Please try scanning again or check your internet connection.');
          return;
        }
        
        // Check if speech is available
        if (!voiceService.isSupported()) {
          Alert.alert('Speech Not Available', 'Speech synthesis is not supported on this device. Please try using a different device.');
          return;
        }
        
        // Stop any existing speech first
        try {
          await voiceService.stop();
        } catch {
          console.log('No existing speech to stop');
        }
        
        // Check and request permissions if needed for ElevenLabs
        if (selectedVoice?.provider === 'elevenlabs') {
          const hasPermissions = await voiceService.requestPermissionsWithUserPrompt();
          if (!hasPermissions) {
            console.log('🔄 Audio permissions denied, will fallback to built-in voice');
          }
        }
        
        setIsPlaying(true);
        setIsPaused(false);
        
        // Use the new voice service with selected voice
        await voiceService.speak(fullText, {
          voice: selectedVoice?.identifier,
          language: 'en-US',
        }, {
          onStart: () => {
            console.log('✅ Speech started successfully');
            setIsPlaying(true);
            setIsPaused(false);
          },
          onDone: () => {
            console.log('✅ Speech completed successfully');
            setIsPlaying(false);
            setIsPaused(false);
          },
          onError: (error: string) => {
            console.error('❌ Speech error:', error);
            setIsPlaying(false);
            setIsPaused(false);
            
            // Show user-friendly error message
            let errorMessage = 'Voice narration encountered an issue.';
            if (error.includes('network') || error.includes('fetch')) {
              errorMessage = 'Network issue detected. Please check your connection and try again.';
            } else if (error.includes('permission') || error.includes('not allowed')) {
              errorMessage = 'Audio permission required. The app will use built-in voice instead.';
            } else if (error.includes('not supported')) {
              errorMessage = 'Voice narration is not supported on this device.';
            } else if (error.includes('ElevenLabs')) {
              errorMessage = 'ElevenLabs voice service is temporarily unavailable. Using built-in voice instead.';
            }
            
            Alert.alert('Voice Narration Notice', errorMessage, [
              { text: 'OK', style: 'default' }
            ]);
          }
        });
      }
    } catch (error) {
      console.error('❌ Speech control error:', error);
      setIsPlaying(false);
      setIsPaused(false);
      
      // Show user-friendly error message
      Alert.alert(
        'Voice Narration Error', 
        'Unable to start voice narration. Please try again or check your device settings.'
      );
    }
  };

  const handleReanalyze = async () => {
    if (!monument?.scannedImage) {
      Alert.alert('Error', 'No image available for re-analysis.');
      return;
    }

    setIsReanalyzing(true);
    
    try {
      const detectionResult = await detectMonumentsAndArt(monument.scannedImage, contextInfo);
      
      // Create updated scan result
      const updatedResult = {
        id: monument.id,
        name: detectionResult.artworkName,
        location: detectionResult.location,
        period: detectionResult.period,
        description: detectionResult.description,
        significance: detectionResult.significance,
        facts: detectionResult.facts,
        image: monument.scannedImage,
        scannedImage: monument.scannedImage,
        scannedAt: monument.scannedAt,
        confidence: detectionResult.confidence,
        isRecognized: detectionResult.isRecognized,
        detailedDescription: detectionResult.detailedDescription,
      };
      
      // Update the monument state
      setMonument(updatedResult);
      
      // Store the updated result
      if (resultId && typeof resultId === 'string') {
        scanResultStore.update(resultId, updatedResult);
      }
      
      // If now recognized, add to history
      if (detectionResult.isRecognized && detectionResult.confidence > 50) {
        Alert.alert('Success!', `Monuments and art identified as ${detectionResult.artworkName} with ${detectionResult.confidence}% confidence.`);
        
        // Add to history when artwork becomes recognized
        try {
          await addToHistory(updatedResult);
          console.log('✅ Added newly recognized monuments and art to history');
        } catch (historyError) {
          console.error('Error adding to history:', historyError);
        }
      } else {
        Alert.alert('Analysis Complete', 'The monuments and art are still unrecognized. You can try adding more context or take a clearer photo.');
      }
      
    } catch (error) {
      console.error('Re-analysis error:', error);
      Alert.alert('Error', 'Failed to re-analyze the image. Please try again.');
    } finally {
      setIsReanalyzing(false);
    }
  };

  const updateContextInfo = (value: string) => {
    setContextInfo({ context: value });
  };

  const handleStop = async () => {
    try {
      console.log('🛑 User manually stopped voice narration');
      await voiceService.stop();
      setIsPlaying(false);
      setIsPaused(false);
    } catch (error) {
      console.error('Error stopping voice:', error);
      // Force cleanup even if stop fails
      try {
        await voiceService.forceCleanup();
      } catch (cleanupError) {
        console.error('Error during force cleanup:', cleanupError);
      }
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  const handleGoBack = async () => {
    try {
      // Stop voice before navigating away
      console.log('🧹 Going back - stopping voice service');
      await voiceService.forceCleanup();
      
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
  if (isLoading) {
    const isRegeneratingContent = regenerate === 'true';
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingTitle}>
            {isRegeneratingContent ? 'Regenerating Content' : 'Loading Monuments and Art Information'}
          </Text>
          <Text style={styles.loadingText}>
            {isRegeneratingContent 
              ? 'Please wait while we regenerate the latest information about these monuments and art...' 
              : 'Please wait while we prepare your scan results...'
            }
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state if no monument data is available
  if (!monument) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Monuments and Art Information Not Available</Text>
          <Text style={styles.errorText}>
            We couldn&apos;t load the monuments and art details. This might be due to:
          </Text>
          <View style={styles.errorList}>
            <Text style={styles.errorListItem}>• The scan data is still processing</Text>
            <Text style={styles.errorListItem}>• Network connectivity issues</Text>
            <Text style={styles.errorListItem}>• The scan session has expired</Text>
          </View>
          <View style={styles.errorActions}>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => {
                // Force reload the component
                setIsLoading(true);
                setMonument(undefined);
                setTimeout(() => {
                  const loadMonumentData = async () => {
                    let loadedMonument: HistoryItem | undefined;
                    
                    if (resultId && typeof resultId === 'string') {
                      try {
                        const retrievedMonument = scanResultStore.retrieve(resultId);
                        if (retrievedMonument && retrievedMonument.name) {
                          loadedMonument = retrievedMonument;
                          console.log('✅ Retrieved monument on retry:', loadedMonument.name);
                        }
                      } catch (error) {
                        console.error('Error retrieving monument on retry:', error);
                      }
                    }
                    
                    setMonument(loadedMonument);
                    setIsLoading(false);
                  };
                  loadMonumentData();
                }, 100);
              }}
            >
              <Text style={styles.retryButtonText}>Retry Loading</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.backButtonContainer}
              onPress={handleGoBack}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Check if this is an unknown artwork
  const isUnknownArtwork = !monument.isRecognized || monument.name === 'Unknown Monuments and Art' || monument.name === 'Unknown Monument' || (monument.confidence !== undefined && monument.confidence < 50);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: monument.scannedImage || monument.image || 'https://via.placeholder.com/400x300?text=No+Image' }} 
            style={styles.monumentImage} 
            onError={(error) => {
              console.log('Image load error:', error.nativeEvent.error);
            }}
          />
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
          </TouchableOpacity>
        </View>

        {/* Unknown Artwork Context Section */}
        {isUnknownArtwork && (
          <View style={styles.unknownMonumentSection}>
            <View style={styles.unknownHeader}>
              <AlertCircle size={20} color="#f59e0b" />
              <Text style={styles.unknownTitle}>Monuments and Art Not Recognized</Text>
            </View>
            <Text style={styles.unknownDescription}>
              We couldn&apos;t identify these monuments and art with confidence. Add more context below to help improve the identification, then try analyzing again.
            </Text>
            
<TouchableOpacity 
              style={styles.contextToggle} 
              onPress={() => setShowContextForm(!showContextForm)}
            >
              <Text style={styles.contextToggleText}>
                Add Context for Better Identification
              </Text>
              {showContextForm ? (
                <ChevronUp size={20} color="#64748b" />
              ) : (
                <ChevronDown size={20} color="#64748b" />
              )}
            </TouchableOpacity>
            
            {showContextForm && (
              <View style={styles.contextForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Context Information</Text>
                  <Text style={styles.contextDescription}>
                    Add any details that might help identify this monument or artwork - name, location, museum, period, or any other relevant information.
                  </Text>
                  <TextInput
                    style={[styles.textInput, styles.textInputMultiline]}
                    placeholder="e.g., Mona Lisa at the Louvre Museum in Paris, or David sculpture by Michelangelo in Florence, or any other details..."
                    value={contextInfo.context}
                    onChangeText={updateContextInfo}
                    placeholderTextColor="#94a3b8"
                    multiline
                    numberOfLines={4}
                  />
                </View>
              </View>
            )}
            
<TouchableOpacity
              style={[styles.reanalyzeButton, isReanalyzing && styles.reanalyzeButtonDisabled]}
              onPress={handleReanalyze}
              disabled={isReanalyzing}
            >
              {isReanalyzing ? (
                <>
                  <ActivityIndicator color="#ffffff" size="small" />
                  <Text style={styles.reanalyzeButtonText}>Analyzing with Context...</Text>
                </>
              ) : (
                <>
                  <RefreshCw size={20} color="#ffffff" />
                  <Text style={styles.reanalyzeButtonText}>Analyze Again with Context</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Blue Info Section */}
        <LinearGradient
          colors={["#2C3E50", "#34495E"]}
          style={styles.blueInfoSection}
        >
          <View style={styles.infoCards}>
            <View style={styles.infoCard}>
              <MapPin size={20} color="#ffffff" />
              <View>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{monument.location}, {monument.country}</Text>
              </View>
            </View>
            <View style={styles.infoCard}>
              <Calendar size={20} color="#ffffff" />
              <View>
                <Text style={styles.infoLabel}>Period</Text>
                <Text style={styles.infoValue}>{monument.period}</Text>
              </View>
            </View>
          </View>
          
          {/* Context Reanalysis Section */}
          <View style={styles.contextReanalysisSection}>
            <TouchableOpacity 
              style={styles.contextToggleBlue} 
              onPress={() => setShowContextForm(!showContextForm)}
            >
              <Text style={styles.contextToggleTextBlue}>
                Is this recognition incorrect?
              </Text>
              {showContextForm ? (
                <ChevronUp size={16} color="rgba(255, 255, 255, 0.8)" />
              ) : (
                <ChevronDown size={16} color="rgba(255, 255, 255, 0.8)" />
              )}
            </TouchableOpacity>
            
            {showContextForm && (
              <View style={styles.contextFormBlue}>
                <View style={styles.inputGroup}>
                  <Text style={styles.contextDescriptionBlue}>
                    Add any details that might help identify this monument or artwork - name, location, museum, period, or any other relevant information.
                  </Text>
                  <TextInput
                    style={[styles.textInputBlue, styles.textInputMultiline]}
                    placeholder="e.g., Mona Lisa at the Louvre Museum in Paris, or David sculpture by Michelangelo in Florence, or any other details..."
                    value={contextInfo.context}
                    onChangeText={updateContextInfo}
                    placeholderTextColor="rgba(255, 255, 255, 0.6)"
                    multiline
                    numberOfLines={4}
                  />
                </View>
                
                <TouchableOpacity
                  style={[styles.reanalyzeButtonBlue, isReanalyzing && styles.reanalyzeButtonDisabled]}
                  onPress={handleReanalyze}
                  disabled={isReanalyzing}
                >
                  {isReanalyzing ? (
                    <>
                      <ActivityIndicator color="#2C3E50" size="small" />
                      <Text style={styles.reanalyzeButtonTextBlue}>Analyzing with Context...</Text>
                    </>
                  ) : (
                    <>
                      <RefreshCw size={18} color="#2C3E50" />
                      <Text style={styles.reanalyzeButtonTextBlue}>Analyze Again with Context</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </LinearGradient>

        <View style={styles.content}>
          




          {/* Only show content sections for recognized monuments and art */}
          {!isUnknownArtwork && (
            <>
              {/* Voice Narrator - Only show when monuments and art are identified and have content */}
              {monument && monument.name && (
                <View style={styles.narratorSection}>
                  <Text style={styles.narratorTitle}>Voice narration</Text>
                  <View style={styles.narratorControls}>
                    <TouchableOpacity 
                      style={[styles.narratorButton, isPlaying && styles.narratorButtonActive]} 
                      onPress={handlePlayPause}
                    >
                      {isPlaying ? (
                        isPaused ? (
                          <Volume2 size={20} color={isPlaying ? "#ffffff" : "#4f46e5"} />
                        ) : (
                          <Pause size={20} color={isPlaying ? "#ffffff" : "#4f46e5"} />
                        )
                      ) : (
                        <Volume2 size={20} color={isPlaying ? "#ffffff" : "#4f46e5"} />
                      )}
                      <Text style={[styles.narratorButtonText, isPlaying && styles.narratorButtonTextActive]}>
                        {isPlaying ? (isPaused ? 'Resume' : 'Pause') : 'Play'}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.stopButton} 
                      onPress={handleStop}
                    >
                      <VolumeX size={18} color="#6b7280" />
                      <Text style={styles.stopButtonText}>Stop</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {monument.detailedDescription ? (
                <>
                  <View style={styles.factsSection}>
                    <View style={styles.sectionHeader}>
                      <Info size={20} color="#1e3a8a" />
                      <Text style={styles.sectionTitle}>Key Takeaways</Text>
                    </View>
                    {Array.isArray(monument.detailedDescription.keyTakeaways) ? (
                      monument.detailedDescription.keyTakeaways.map((takeaway: string, index: number) => (
                        <View key={index} style={styles.factItem}>
                          <Text style={styles.factBullet}>•</Text>
                          <Text style={styles.factText}>{takeaway}</Text>
                        </View>
                      ))
                    ) : (
                      <View style={styles.factItem}>
                        <Text style={styles.factBullet}>•</Text>
                        <Text style={styles.factText}>{monument.detailedDescription.keyTakeaways}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>In-Depth Context</Text>
                    <FormattedText style={styles.inDepthContext}>{monument.detailedDescription.inDepthContext}</FormattedText>
                  </View>

                  {monument.detailedDescription.curiosities && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Curiosities</Text>
                      <FormattedText style={styles.curiosities}>{monument.detailedDescription.curiosities}</FormattedText>
                    </View>
                  )}
                </>
              ) : (
                <>
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Info size={20} color="#1e3a8a" />
                      <Text style={styles.sectionTitle}>About</Text>
                    </View>
                    <Text style={styles.description}>{monument.description}</Text>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Historical Significance</Text>
                    <Text style={styles.significance}>{monument.significance}</Text>
                  </View>

                  <View style={styles.factsSection}>
                    <Text style={styles.sectionTitle}>Quick Facts</Text>
                    {(monument.facts || []).map((fact: string, index: number) => (
                      <View key={index} style={styles.factItem}>
                        <Text style={styles.factBullet}>•</Text>
                        <Text style={styles.factText}>{fact}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </>
          )}



          {/* Only show chat and share buttons for recognized monuments and art */}
          {!isUnknownArtwork && (
            <>
              <TouchableOpacity 
                style={styles.chatButton}
                onPress={() => {
                  try {
                    // Navigate to chat modal with monument context
                    // Use minimal params to avoid URL size limits
                    router.push({
                      pathname: "/chat-modal" as any,
                      params: { 
                        monumentId: monument.id,
                        monumentName: monument.name.substring(0, 50) // Further limit name length
                      }
                    });
                  } catch (error) {
                    console.error('Chat navigation error:', error);
                    // Fallback navigation without params
                    try {
                      router.push("/chat-modal" as any);
                    } catch (fallbackError) {
                      console.error('Fallback navigation also failed:', fallbackError);
                      Alert.alert('Navigation Error', 'Unable to open chat. Please try again.');
                    }
                  }
                }}
              >
                <LinearGradient
                  colors={["#8B4513", "#A0522D"]}
                  style={styles.chatGradient}
                >
                  <MessageCircle size={24} color="#ffffff" />
                  <Text style={styles.chatButtonText}>Ask AI About These Monuments and Art</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareButton}>
                <LinearGradient
                  colors={["#2C3E50", "#34495E"]}
                  style={styles.shareGradient}
                >
                  <Share2 size={20} color="#ffffff" />
                  <Text style={styles.shareButtonText}>Share Discovery</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
      
      {/* Voice Settings Modal */}
      <VoiceSettings
        isVisible={showVoiceSettings}
        onClose={() => setShowVoiceSettings(false)}
        onVoiceChange={(voice) => {
          setSelectedVoice(voice);
          console.log('Voice changed to:', voice.name);
        }}
        currentVoice={selectedVoice}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FEFEFE",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingTitle: {
    fontSize: 22,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: "#2C3E50",
    marginBottom: 15,
    textAlign: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: "#2C3E50",
    marginBottom: 15,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  errorList: {
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  errorListItem: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
    lineHeight: 20,
  },
  errorActions: {
    flexDirection: "row",
    gap: 15,
  },
  retryButton: {
    backgroundColor: "#8B4513",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  backButtonContainer: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  backButtonText: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
  imageContainer: {
    position: "relative",
    height: 400,
  },
  monumentImage: {
    width: screenWidth,
    height: 400,
    resizeMode: "cover",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
    justifyContent: "flex-end",
    padding: 20,
  },
  monumentName: {
    fontSize: 28,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "400",
    color: "#ffffff",
    marginBottom: 10,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  closeButton: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    padding: 10,
  },
  content: {
    padding: 20,
  },
  blueInfoSection: {
    paddingHorizontal: 20,
    paddingVertical: 25,
  },
  infoCards: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 20,
  },
  infoCard: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    padding: 15,
    borderRadius: 12,
    gap: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: "#ffffff",
  },
  contextReanalysisSection: {
    marginTop: 5,
  },
  contextToggleBlue: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  contextToggleTextBlue: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.9)",
  },
  contextFormBlue: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    padding: 16,
    borderRadius: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  contextDescriptionBlue: {
    fontSize: 13,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 18,
    marginBottom: 8,
  },
  textInputBlue: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#ffffff",
  },
  reanalyzeButtonBlue: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  reanalyzeButtonTextBlue: {
    color: "#2C3E50",
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: "#2C3E50",
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#4b5563",
    lineHeight: 24,
  },
  significance: {
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 24,
    fontStyle: "italic",
  },
  quickOverview: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#374151",
    lineHeight: 26,
    fontWeight: "400",
  },
  inDepthContext: {
    fontSize: 15,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#4b5563",
    lineHeight: 24,
  },
  curiosities: {
    fontSize: 15,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#4b5563",
    lineHeight: 24,
    fontStyle: "italic",
    backgroundColor: "#FFF8E7",
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#D4A574",
  },
  factsSection: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 15,
    marginBottom: 25,
  },
  factItem: {
    flexDirection: "row",
    marginBottom: 10,
  },
  factBullet: {
    fontSize: 16,
    color: "#f59e0b",
    marginRight: 10,
    fontWeight: "bold",
  },
  factText: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#4b5563",
    flex: 1,
    lineHeight: 20,
  },
  chatButton: {
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 16,
  },
  chatGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },
  chatButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
  },
  shareButton: {
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 20,
  },
  shareGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },
  shareButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
  },
  confidenceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  confidenceText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  scanInfo: {
    backgroundColor: "rgba(79, 70, 229, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: "#4f46e5",
  },
  scanInfoText: {
    fontSize: 14,
    color: "#4f46e5",
    fontWeight: "500",
  },
  narratorSection: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 15,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  narratorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  voiceSettingsButton: {
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  narratorTitle: {
    fontSize: 17,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: "#2C3E50",
    marginBottom: 15,
  },
  narratorControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  narratorButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F6F0",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#8B4513",
  },
  narratorButtonActive: {
    backgroundColor: "#8B4513",
  },
  narratorButtonText: {
    fontSize: 15,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: "#8B4513",
  },
  narratorButtonTextActive: {
    color: "#ffffff",
  },
  stopButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  stopButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  narratorDescription: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#6b7280",
    marginBottom: 15,
    lineHeight: 20,
  },
  currentVoiceText: {
    fontSize: 12,
    color: "#8B4513",
    fontStyle: "italic",
    fontWeight: "500",
  },
  playingIndicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  playingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#8B4513",
  },
  playingIndicator: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#8B4513",
    fontStyle: "italic",
  },
  unknownMonumentSection: {
    backgroundColor: "#fef3c7",
    margin: 20,
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#f59e0b",
  },
  unknownHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  unknownTitle: {
    fontSize: 18,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: "#92400e",
  },
  unknownDescription: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#92400e",
    lineHeight: 20,
    marginBottom: 16,
  },
  contextToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  contextToggleText: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: "#374151",
  },
  contextForm: {
    backgroundColor: "#f9fafb",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 12,
  },
  contextDescription: {
    fontSize: 13,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#6b7280",
    lineHeight: 18,
    marginBottom: 8,
  },
  contextFormDescription: {
    fontSize: 13,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#6b7280",
    lineHeight: 18,
    marginBottom: 12,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: "#374151",
  },
  textInput: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#1f2937",
  },
  textInputMultiline: {
    height: 70,
    textAlignVertical: "top",
  },
  reanalyzeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f59e0b",
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  reanalyzeButtonDisabled: {
    opacity: 0.7,
  },
  reanalyzeButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
  },
  addContextSection: {
    backgroundColor: "#ffffff",
    marginBottom: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  addContextHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  addContextTitle: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: "#8B4513",
  },
  addContextDescription: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 16,
  },
  addContextToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addContextToggleText: {
    fontSize: 12,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "400",
    color: "#9ca3af",
  },
  submitContextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8B4513",
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  submitContextButtonDisabled: {
    opacity: 0.7,
  },
  submitContextButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
  },
});
