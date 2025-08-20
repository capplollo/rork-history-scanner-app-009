import React, { useState, useEffect, useMemo } from "react";
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
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { X, MapPin, Calendar, Info, Share2, CheckCircle, AlertCircle, MessageCircle, Volume2, VolumeX, Pause, Settings } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Speech from 'expo-speech';
import { mockMonuments } from "@/data/mockMonuments";
import { HistoryItem } from "@/providers/HistoryProvider";
import { scanResultStore } from "@/services/scanResultStore";
import { voiceService, VoiceOption } from "@/services/voiceService";
import VoiceSettings from "@/components/VoiceSettings";

const { width: screenWidth } = Dimensions.get("window");

export default function ScanResultScreen() {
  const { monumentId, scanData, resultId } = useLocalSearchParams();
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showVoiceSettings, setShowVoiceSettings] = useState<boolean>(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption | null>(null);
  
  // Cleanup speech when component unmounts or when navigating away
  useEffect(() => {
    return () => {
      // Stop speech when component unmounts
      voiceService.stop();
      // Clean up stored result when component unmounts
      if (resultId && typeof resultId === 'string') {
        scanResultStore.clear(resultId);
      }
    };
  }, [resultId]);

  // Initialize voice service and set default voice (fast initialization)
  useEffect(() => {
    const initializeVoice = async () => {
      try {
        // Fast initialization - no blocking async calls
        await voiceService.initialize();
        const bestVoice = voiceService.getBestVoice();
        setSelectedVoice(bestVoice);
        console.log('🚀 Voice service ready for immediate use');
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
      
      while (!loadedMonument && retryCount < maxRetries) {
        console.log(`Attempting to load monument data (attempt ${retryCount + 1}/${maxRetries})`);
        
        // Try to get data from resultId first (new method)
        if (resultId && typeof resultId === 'string') {
          try {
            const retrievedMonument = scanResultStore.retrieve(resultId);
            if (retrievedMonument && retrievedMonument.name) {
              loadedMonument = retrievedMonument;
              console.log('✅ Retrieved monument from store:', loadedMonument.name);
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
        // Try to get the most recent scan from history as a last resort
        try {
          // This would require accessing the history provider, but for now we'll show the error
          console.log('Attempting to get most recent scan from history...');
        } catch (error) {
          console.error('Failed to get recent scan from history:', error);
        }
      }
      
      setMonument(loadedMonument);
      setIsLoading(false);
    };
    
    loadMonumentData();
  }, [resultId, scanData, monumentId]);
  


  // Memoize text generation to avoid recalculation
  const fullText = useMemo(() => {
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
      
      // Create a more natural, narrator-style introduction
      let text = `Welcome to the story of ${monument.name}. `;
      
      // Add location and period information with natural transitions
      if (monument.location && monument.period) {
        text += `This magnificent ${monument.period} monument stands proudly in ${monument.location}. `;
      } else if (monument.location) {
        text += `Located in the beautiful ${monument.location}. `;
      } else if (monument.period) {
        text += `This remarkable structure dates back to the ${monument.period}. `;
      }
      
      // Add a brief pause for dramatic effect
      text += `Let me tell you its fascinating story. `;
      
      // Check if we have detailed description or fallback to basic info
      let hasContent = false;
      
      if (monument.detailedDescription) {
        if (monument.detailedDescription.quickOverview) {
          text += `${monument.detailedDescription.quickOverview} `;
          text += `Now, let's dive deeper into its history. `;
          hasContent = true;
        }
        if (monument.detailedDescription.inDepthContext) {
          text += `${monument.detailedDescription.inDepthContext} `;
          hasContent = true;
        }
        if (monument.detailedDescription.curiosities) {
          text += `Here's something truly fascinating about this place: ${monument.detailedDescription.curiosities} `;
          hasContent = true;
        }
        if (monument.detailedDescription.keyTakeaways && monument.detailedDescription.keyTakeaways.length > 0) {
          text += `To wrap up, here are the key things to remember: ${monument.detailedDescription.keyTakeaways.join('. ')}.`;
          hasContent = true;
        }
      } else {
        if (monument.description) {
          text += `${monument.description} `;
          hasContent = true;
        }
        if (monument.significance) {
          text += `What makes this place truly special is its historical significance: ${monument.significance} `;
          hasContent = true;
        }
        if (monument.facts && monument.facts.length > 0) {
          text += `Here are some remarkable facts that will amaze you: ${monument.facts.join('. ')}.`;
          hasContent = true;
        }
      }
      
      // If no content was found, create a basic description
      if (!hasContent) {
        text += `This is ${monument.name}, a remarkable historical site that has stood the test of time. `;
        if (monument.location) {
          text += `It's located in ${monument.location}. `;
        }
        if (monument.period) {
          text += `This structure dates back to the ${monument.period}. `;
        }
        text += `While we don't have detailed information about this specific monument, it represents an important part of our shared cultural heritage. `;
      }
      
      // Add a natural conclusion
      text += ` Thank you for exploring the rich history of ${monument.name} with me. I hope you enjoyed this journey through time.`;
      
      // Optimized text processing for better speech synthesis
      const processedText = text
        .replace(/\n/g, ' ') // Replace newlines with spaces
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/([.!?])\s*([A-Z])/g, '$1 $2') // Ensure proper spacing after punctuation
        .replace(/\b&\b/g, 'and') // Replace & with 'and'
        .replace(/\b@\b/g, 'at') // Replace @ with 'at'
        .trim();
      
      // Final validation
      if (processedText.length < 50) {
        console.warn('Generated text is too short, may not provide good narration');
        return '';
      }
      
      console.log('Generated voice narration text, length:', processedText.length);
      return processedText;
      
    } catch (error) {
      console.error('Error generating voice narration text:', error);
      return '';
    }
  }, [monument]);

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
        
        // Validate monument data first
        if (!monument) {
          Alert.alert('No Data', 'Monument information is not available. Please try scanning again.');
          return;
        }
        
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
        } catch (stopError) {
          console.log('No existing speech to stop');
        }
        
        // Skip permission check for faster startup - voice service handles fallback automatically
        console.log('🚀 Starting voice immediately...');
        
        setIsPlaying(true);
        setIsPaused(false);
        
        // Use the optimized voice service with selected voice
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
            
            // Show user-friendly error message only for critical errors
            if (!error.includes('timeout') && !error.includes('fallback')) {
              let errorMessage = 'Voice narration encountered an issue.';
              if (error.includes('network') || error.includes('fetch')) {
                errorMessage = 'Network issue detected. Please check your connection and try again.';
              } else if (error.includes('not supported')) {
                errorMessage = 'Voice narration is not supported on this device.';
              }
              
              Alert.alert('Voice Narration Notice', errorMessage, [
                { text: 'OK', style: 'default' }
              ]);
            }
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

  const handleStop = async () => {
    try {
      await voiceService.stop();
      setIsPlaying(false);
      setIsPaused(false);
    } catch (error) {
      // Silently handle stop errors
    }
  };

  // Show loading state while data is being loaded
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingTitle}>Loading Monument Information</Text>
          <Text style={styles.loadingText}>Please wait while we prepare your scan results...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state if no monument data is available
  if (!monument) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Monument Information Not Available</Text>
          <Text style={styles.errorText}>
            We couldn't load the monument details. This might be due to:
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
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: monument.scannedImage || monument.image }} style={styles.monumentImage} />
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
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

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
          </View>
          
          {monument.scannedAt && (
            <View style={styles.scanInfo}>
              <Text style={styles.scanInfoText}>
                Scanned on {new Date(monument.scannedAt).toLocaleDateString()}
              </Text>
            </View>
          )}

          {/* Voice Narrator - Only show when monument is identified and has content */}
          {monument && monument.name && (
            <View style={styles.narratorSection}>
              <View style={styles.narratorHeader}>
                <Text style={styles.narratorTitle}>🎧 AI Voice Narrator</Text>
                <TouchableOpacity 
                  style={styles.voiceSettingsButton}
                  onPress={() => setShowVoiceSettings(true)}
                >
                  <Settings size={16} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <Text style={styles.narratorDescription}>
                Experience an immersive audio journey through the history and stories of this monument with our enhanced AI narrator
                {selectedVoice && (
                  <Text style={styles.currentVoiceText}>
                    {'\n'}Current voice: {selectedVoice.name}
                  </Text>
                )}
              </Text>
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
                    {isPlaying ? (isPaused ? 'Resume Audio' : 'Pause Audio') : 'Start Audio Tour'}
                  </Text>
                </TouchableOpacity>
                
                {isPlaying && (
                  <TouchableOpacity 
                    style={styles.stopButton} 
                    onPress={handleStop}
                  >
                    <VolumeX size={18} color="#6b7280" />
                    <Text style={styles.stopButtonText}>Stop</Text>
                  </TouchableOpacity>
                )}
              </View>
              {isPlaying && (
                <View style={styles.playingIndicatorContainer}>
                  <View style={styles.playingDot} />
                  <Text style={styles.playingIndicator}>
                    {isPaused ? 'Audio tour paused - tap Resume to continue' : 'Playing immersive audio tour...'}
                  </Text>
                </View>
              )}
            </View>
          )}

          {monument.detailedDescription ? (
            <>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Info size={20} color="#1e3a8a" />
                  <Text style={styles.sectionTitle}>Quick Overview</Text>
                </View>
                <Text style={styles.quickOverview}>{monument.detailedDescription.quickOverview}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>In-Depth Context</Text>
                <Text style={styles.inDepthContext}>{monument.detailedDescription.inDepthContext}</Text>
              </View>

              {monument.detailedDescription.curiosities && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Curiosities</Text>
                  <Text style={styles.curiosities}>{monument.detailedDescription.curiosities}</Text>
                </View>
              )}

              <View style={styles.factsSection}>
                <Text style={styles.sectionTitle}>Key Takeaways</Text>
                {monument.detailedDescription.keyTakeaways.map((takeaway: string, index: number) => (
                  <View key={index} style={styles.factItem}>
                    <Text style={styles.factBullet}>•</Text>
                    <Text style={styles.factText}>{takeaway}</Text>
                  </View>
                ))}
              </View>
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
                {monument.facts.map((fact: string, index: number) => (
                  <View key={index} style={styles.factItem}>
                    <Text style={styles.factBullet}>•</Text>
                    <Text style={styles.factText}>{fact}</Text>
                  </View>
                ))}
              </View>
            </>
          )}



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
              <Text style={styles.chatButtonText}>Ask AI About This Monument</Text>
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
  infoCards: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 25,
  },
  infoCard: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 12,
    gap: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#6b7280",
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
    color: "#2C3E50",
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
});
