import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Animated,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, useNavigation } from "expo-router";
import { MapPin, Calendar, CheckCircle, AlertCircle, ArrowLeft, Sparkles, Clock, Volume2, Pause } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImageManipulator from "expo-image-manipulator";

import { mockMonuments } from "@/data/mockMonuments";
import FormattedText from "@/components/FormattedText";
import Colors from "@/constants/colors";

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
  const { 
    monumentId, 
    scanData, 
    resultId, 
    historyItemId, 
    monumentName, 
    location, 
    period, 
    scannedImage, 
    regenerate,
    artworkName,
    city,
    country,
    confidence,
    isRecognized,
    keyTakeaways,
    inDepthContext,
    curiosities
  } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentAudio, setCurrentAudio] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'takeaways'>('takeaways');
  const [isHistoryExpanded, setIsHistoryExpanded] = useState<boolean>(false);
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();

  
  const [monument, setMonument] = useState<MonumentData | undefined>(undefined);
  
  // Hide tab bar on scan result page
  useEffect(() => {
    const parent = navigation.getParent();
    if (parent) {
      parent.setOptions({
        tabBarStyle: {
          display: 'none'
        }
      });
    }
    
    return () => {
      if (parent) {
        parent.setOptions({
          tabBarStyle: {
            backgroundColor: "#FEFEFE",
            borderTopWidth: 0,
            borderRadius: 25,
            marginHorizontal: 20,
            marginBottom: Platform.OS === "ios" ? 34 : 20,
            paddingBottom: 0,
            height: Platform.OS === "ios" ? 65 : 50,
            position: "absolute",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 12,
          }
        });
      }
    };
  }, [navigation]);



  // Load monument data on component mount
  useEffect(() => {
    const loadMonumentData = async () => {
      let loadedMonument: MonumentData | undefined;
      
      // Check if we have AI analysis data from the scanner
      if (artworkName && typeof artworkName === 'string') {
        console.log('📊 Loading AI analysis data:', artworkName);
        
        try {
          // Parse keyTakeaways if it's a JSON string
          let parsedKeyTakeaways: string[] = [];
          if (keyTakeaways && typeof keyTakeaways === 'string') {
            try {
              parsedKeyTakeaways = JSON.parse(keyTakeaways);
            } catch (e) {
              console.error('Failed to parse keyTakeaways:', e);
              parsedKeyTakeaways = [keyTakeaways];
            }
          }
          
          const confidenceNum = confidence ? parseInt(confidence as string, 10) : 75;
          const isRecognizedBool = isRecognized === 'true';
          
          const cityStr = (city as string) || 'Unknown';
          const countryStr = (country as string) || 'Unknown';
          const locationStr = cityStr !== 'Unknown' && countryStr !== 'Unknown' 
            ? `${cityStr}, ${countryStr}` 
            : cityStr !== 'Unknown' 
              ? cityStr 
              : countryStr !== 'Unknown' 
                ? countryStr 
                : 'Unknown Location';
          
          loadedMonument = {
            id: resultId as string || 'ai-analysis',
            name: artworkName as string,
            location: locationStr,
            country: countryStr,
            period: (period as string) || 'Unknown Period',
            description: parsedKeyTakeaways.length > 0 ? parsedKeyTakeaways.join(' ') : 'AI analysis completed.',
            significance: (inDepthContext as string) || 'This monument holds historical and cultural significance.',
            facts: parsedKeyTakeaways.length > 0 ? parsedKeyTakeaways : [
              'Analyzed using AI technology',
              'Monument identification completed',
              'Historical significance confirmed'
            ],
            image: (scannedImage as string) || '',
            scannedImage: (scannedImage as string) || '',
            scannedAt: new Date().toISOString(),
            confidence: confidenceNum,
            isRecognized: isRecognizedBool,
            detailedDescription: {
              keyTakeaways: parsedKeyTakeaways,
              inDepthContext: (inDepthContext as string) || 'Detailed analysis completed.',
              curiosities: (curiosities as string) || 'No specific curiosities identified.'
            }
          };
        } catch (error) {
          console.error('Error processing AI analysis data:', error);
        }
      }
      // Check if this is a regeneration request from history
      else if (regenerate === 'true' && monumentName && typeof monumentName === 'string') {
        console.log('🔄 Regenerating content for history item:', monumentName);
        
        try {
          // Create basic monument data since backend services are not available
          loadedMonument = {
            id: (historyItemId as string) || 'history-item',
            name: monumentName as string,
            location: (location as string) || '',
            country: '',
            period: (period as string) || '',
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
              country: '',
              confidence: 75,
              isRecognized: true,
            };
          }
        }
        
        // If no mock data found, create basic monument data
        if (!loadedMonument) {
          loadedMonument = {
            id: resultId as string || 'unknown',
            name: monumentName as string || artworkName as string || 'Unknown Monument',
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
  }, [monumentId, scanData, resultId, historyItemId, monumentName, location, period, scannedImage, regenerate, artworkName, city, country, confidence, isRecognized, keyTakeaways, inDepthContext, curiosities]);



  const handlePlayTTS = async (text: string) => {
    if (isPlaying) {
      // Stop current playback
      if (currentAudio) {
        try {
          if (Platform.OS === 'web') {
            currentAudio.pause();
            currentAudio.currentTime = 0;
          } else {
            await currentAudio.stopAsync();
            await currentAudio.unloadAsync();
          }
        } catch (error) {
          console.error('Error stopping audio:', error);
        }
      }
      setIsPlaying(false);
      setCurrentAudio(null);
      return;
    }

    try {
      setIsPlaying(true);
      
      // Clean text for TTS (remove markdown formatting)
      const cleanText = text
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
        .replace(/\*(.*?)\*/g, '$1')     // Remove italic formatting
        .replace(/\n\n/g, '. ')          // Replace double line breaks with periods
        .replace(/\n/g, ' ')            // Replace single line breaks with spaces
        .trim();

      // Charles voice ID from ElevenLabs
      const charlesVoiceId = 'IKne3meq5aSn9XLyUdCD';
      
      // Try ElevenLabs API first (with proper error handling)
      try {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${charlesVoiceId}`, {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': 'sk_22cbad0171315d01474f3a02c222d9d04f67c9a5d8b3eae9'
          },
          body: JSON.stringify({
            text: cleanText,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.0,
              use_speaker_boost: true
            }
          })
        });

        if (response.ok) {
          const audioBlob = await response.blob();
          
          if (Platform.OS === 'web') {
            // For web, create audio element
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            
            audio.onended = () => {
              setIsPlaying(false);
              setCurrentAudio(null);
              URL.revokeObjectURL(audioUrl);
            };
            
            audio.onerror = () => {
              setIsPlaying(false);
              setCurrentAudio(null);
              URL.revokeObjectURL(audioUrl);
              console.error('Audio playback error');
            };
            
            await audio.play();
            setCurrentAudio(audio);
            return;
          } else {
            // For mobile, convert blob to base64 and use expo-av
            const { Audio } = await import('expo-av');
            
            // Set audio mode for playback
            await Audio.setAudioModeAsync({
              allowsRecordingIOS: false,
              staysActiveInBackground: false,
              playsInSilentModeIOS: true,
              shouldDuckAndroid: true,
              playThroughEarpieceAndroid: false,
            });
            
            // Convert blob to base64
            const reader = new FileReader();
            reader.onload = async () => {
              try {
                const base64Audio = reader.result as string;
                const { sound } = await Audio.Sound.createAsync(
                  { uri: base64Audio },
                  { shouldPlay: true }
                );
                
                sound.setOnPlaybackStatusUpdate((status: any) => {
                  if (status.didJustFinish) {
                    setIsPlaying(false);
                    setCurrentAudio(null);
                  }
                });
                
                setCurrentAudio(sound);
              } catch (audioError) {
                console.error('Audio creation error:', audioError);
                throw audioError;
              }
            };
            reader.readAsDataURL(audioBlob);
            return;
          }
        } else {
          throw new Error(`ElevenLabs API error: ${response.status}`);
        }
      } catch (elevenLabsError) {
        console.log('ElevenLabs failed, falling back to expo-speech:', elevenLabsError);
        throw elevenLabsError;
      }
      
    } catch (error) {
      console.error('TTS Error:', error);
      setIsPlaying(false);
      setCurrentAudio(null);
      
      // Fallback to expo-speech
      try {
        if (Platform.OS !== 'web') {
          const Speech = await import('expo-speech');
          const cleanTextForSpeech = text
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/\n\n/g, '. ')
            .replace(/\n/g, ' ')
            .trim();
          
          Speech.speak(cleanTextForSpeech, {
            language: 'en-US',
            pitch: 1.0,
            rate: 0.85,
            onDone: () => {
              setIsPlaying(false);
            },
            onError: () => {
              setIsPlaying(false);
            }
          });
          setIsPlaying(true);
        } else {
          // Web fallback using SpeechSynthesis API
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text
              .replace(/\*\*(.*?)\*\*/g, '$1')
              .replace(/\*(.*?)\*/g, '$1')
              .replace(/\n\n/g, '. ')
              .replace(/\n/g, ' ')
              .trim());
            
            utterance.rate = 0.85;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            
            utterance.onend = () => {
              setIsPlaying(false);
            };
            
            utterance.onerror = () => {
              setIsPlaying(false);
            };
            
            speechSynthesis.speak(utterance);
            setCurrentAudio({ cancel: () => speechSynthesis.cancel() });
          } else {
            console.error('Speech synthesis not supported');
          }
        }
      } catch (fallbackError) {
        console.error('Fallback TTS failed:', fallbackError);
        setIsPlaying(false);
      }
    }
  };



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
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(118, 104, 96, 0.36)', 'rgba(225, 222, 220, 0.36)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.backgroundGradient}
      />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButtonHeader}>
              <View style={styles.backButtonCircle}>
                <ArrowLeft size={10} color="#ffffff" />
              </View>
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Image 
                source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/q49mrslt036oct5mux1y0' }}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
        {/* Monument Image Card with Overlay Info */}
        {monument.scannedImage && (
          <View style={styles.photoSection}>
            <View style={styles.photoCard}>
              <Image source={{ uri: monument.scannedImage }} style={styles.photoImage} />
              <LinearGradient
                colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.85)']}
                locations={[0, 0.5, 1]}
                style={styles.photoGradient}
              >
                <View style={styles.recognitionBadgeInCard}>
                  {monument.isRecognized ? (
                    <>
                      <CheckCircle size={12} color="#4CAF50" />
                      <Text style={styles.recognitionTextInCard}>Recognized</Text>
                      <Text style={styles.confidenceTextInCard}>{monument.confidence}%</Text>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={12} color="#FF9800" />
                      <Text style={styles.notRecognizedTextInCard}>Not Recognized</Text>
                    </>
                  )}
                </View>
                <Text style={styles.monumentName}>{monument.name}</Text>
                
                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <MapPin size={12} color="#ffffff" />
                    <Text style={styles.detailText}>{monument.location}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Calendar size={12} color="#ffffff" />
                    <Text style={styles.detailText}>{monument.period}</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </View>
        )}

        {/* Not Recognized Section - Enhanced feedback and options */}
        {!monument.isRecognized && (
          <View style={styles.section}>
            <View style={styles.notRecognizedCard}>
              <View style={styles.notRecognizedHeader}>
                <AlertCircle size={18} color="#f59e0b" />
                <Text style={styles.notRecognizedTitle}>Monument Not Recognized</Text>
              </View>
              
              <Text style={styles.notRecognizedDescription}>
                We couldn&apos;t identify this specific monument or artwork. This could be due to lighting conditions, angle, or it might be a lesser-known piece.
              </Text>
              
              <View style={styles.helpSection}>
                <Text style={styles.helpTitle}>How to improve recognition:</Text>
                <View style={styles.helpList}>
                  <View style={styles.helpItem}>
                    <View style={styles.helpDot} />
                    <Text style={styles.helpText}>Add context information (location, name, museum)</Text>
                  </View>
                  <View style={styles.helpItem}>
                    <View style={styles.helpDot} />
                    <Text style={styles.helpText}>Take a clearer photo with better lighting</Text>
                  </View>
                  <View style={styles.helpItem}>
                    <View style={styles.helpDot} />
                    <Text style={styles.helpText}>Include any visible plaques or labels</Text>
                  </View>
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.addContextButton}
                onPress={() => {
                  // Go back to previous scanner page
                  router.back();
                }}
              >
                <View style={styles.buttonContent}>
                  <Sparkles size={15} color="#ffffff" />
                  <Text style={styles.addContextButtonText}>Add Context & Try Again</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}



        {/* Key Takeaways - Only show when recognized */}
        {monument.isRecognized && monument.detailedDescription && monument.detailedDescription.keyTakeaways && (
          <View style={styles.section}>
            <View style={styles.contentCard}>
              <View style={styles.cardHeader}>
                <Sparkles size={15} color={Colors.accent.secondary} />
                <Text style={styles.sectionTitle}>Key Takeaways</Text>
              </View>
              
              <View style={styles.factsContainer}>
                {monument.detailedDescription.keyTakeaways.map((takeaway, index) => (
                  <View key={index} style={styles.factItem}>
                    <View style={styles.factDot} />
                    <Text style={styles.factText}>{takeaway}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Immersive History - Only show when recognized */}
        {monument.isRecognized && monument.detailedDescription && monument.detailedDescription.inDepthContext && (
          <View style={styles.section}>
            <View style={styles.contentCard}>
              <View style={styles.cardHeader}>
                <Clock size={15} color={Colors.accent.secondary} />
                <Text style={styles.sectionTitle}>Immersive History</Text>
                <TouchableOpacity
                  style={styles.ttsButton}
                  onPress={() => handlePlayTTS(monument.detailedDescription!.inDepthContext)}
                >
                  {isPlaying ? (
                    <Pause size={13.5} color={Colors.accent.secondary} />
                  ) : (
                    <Volume2 size={13.5} color={Colors.accent.secondary} />
                  )}
                </TouchableOpacity>
              </View>
              <FormattedText style={styles.descriptionText}>
                {isHistoryExpanded 
                  ? monument.detailedDescription.inDepthContext 
                  : monument.detailedDescription.inDepthContext.split(' ').slice(0, 100).join(' ') + (monument.detailedDescription.inDepthContext.split(' ').length > 100 ? '...' : '')}
              </FormattedText>
              {monument.detailedDescription.inDepthContext.split(' ').length > 100 && (
                <TouchableOpacity 
                  style={styles.moreButton}
                  onPress={() => setIsHistoryExpanded(!isHistoryExpanded)}
                >
                  <Text style={styles.moreButtonText}>
                    {isHistoryExpanded ? 'Show Less' : 'More'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}





        {/* Recognition Feedback Section - Only show when recognized */}
        {monument.isRecognized && (
          <View style={styles.section}>
            <View style={styles.feedbackCard}>
              <Text style={styles.feedbackQuestion}>Recognition is not correct?</Text>
              <Text style={styles.feedbackSubtext}>
                Adding context information like location, name, or museum can significantly improve identification accuracy.
              </Text>
              
              <TouchableOpacity
                style={styles.backToScannerButton}
                onPress={() => {
                  // Go back to previous scanner page
                  router.back();
                }}
              >
                <View style={styles.buttonContent}>
                  <Sparkles size={13.5} color="#ffffff" />
                  <Text style={styles.backToScannerButtonText}>Add Context & Reanalyze</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}


      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 250,
    zIndex: 0,
  },
  safeArea: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    position: 'relative',
    zIndex: 10,
  },
  topRow: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  backButtonHeader: {
    flexShrink: 0,
  },
  backButtonCircle: {
    width: 19.5,
    height: 19.5,
    borderRadius: 10,
    backgroundColor: '#766860',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    flexShrink: 0,
  },
  logoImage: {
    width: 39,
    height: 39,
  },

  photoSection: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  photoCard: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 28,
    justifyContent: 'flex-end',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: "Lora_400Regular",
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontFamily: "Lora_400Regular",
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.accent.secondary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: "Lora_400Regular",
    fontWeight: '500',
  },

  recognitionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    alignSelf: 'flex-start',
  },
  recognitionText: {
    fontSize: 12,
    fontFamily: "Lora_400Regular",
    fontWeight: '500',
    color: '#4CAF50',
  },
  confidenceText: {
    fontSize: 12,
    fontFamily: "Lora_400Regular",
    color: '#64748b',
  },
  notRecognizedText: {
    fontSize: 12,
    fontFamily: "Lora_400Regular",
    fontWeight: '500',
    color: '#FF9800',
  },
  notRecognizedCard: {
    backgroundColor: 'rgba(254, 254, 254, 0.85)',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.15)',
  },
  notRecognizedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  notRecognizedTitle: {
    fontSize: 13.5,
    fontFamily: "Lora_400Regular",
    fontWeight: '600',
    color: '#2C3E50',
  },
  notRecognizedDescription: {
    fontSize: 11.25,
    fontFamily: "Lora_400Regular",
    lineHeight: 16.5,
    color: '#64748b',
    marginBottom: 20,
  },
  helpSection: {
    marginBottom: 24,
  },
  helpTitle: {
    fontSize: 12,
    fontFamily: "Lora_400Regular",
    fontWeight: '500',
    color: '#2C3E50',
    marginBottom: 12,
  },
  helpList: {
    gap: 8,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  helpDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f59e0b',
    marginTop: 8,
  },
  helpText: {
    flex: 1,
    fontSize: 10.5,
    fontFamily: "Lora_400Regular",
    lineHeight: 15,
    color: '#64748b',
  },
  addContextButton: {
    backgroundColor: Colors.accent.secondary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: Colors.accent.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  addContextButtonText: {
    fontSize: 12,
    fontFamily: "Lora_400Regular",
    fontWeight: '500',
    color: '#ffffff',
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  monumentName: {
    fontSize: 20,
    fontFamily: "Lora_400Regular",
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  detailsRow: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 10.5,
    fontFamily: "Lora_400Regular",
    color: '#ffffff',
  },
  contentCard: {
    backgroundColor: 'rgba(254, 254, 254, 0.85)',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(104, 89, 81, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontFamily: "Lora_400Regular",
    fontWeight: "500",
    color: Colors.berkeleyBlue,
    flex: 1,
  },
  ttsButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(104, 89, 81, 0.12)',
    marginLeft: 12,
  },
  subsection: {
    marginTop: 20,
  },
  subsectionTitle: {
    fontSize: 16,
    fontFamily: "Lora_400Regular",
    fontWeight: '500',
    color: '#2C3E50',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 11.25,
    fontFamily: "Lora_400Regular",
    lineHeight: 16.5,
    color: '#64748b',
  },
  factsContainer: {
    gap: 12,
  },
  factItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  factDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent.secondary,
    marginTop: 7,
  },
  factText: {
    flex: 1,
    fontSize: 11.25,
    fontFamily: "Lora_400Regular",
    lineHeight: 16.5,
    color: '#64748b',
  },
  reanalyzeButton: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#dc2626',
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  reanalyzeButtonDisabled: {
    opacity: 0.7,
  },
  reanalyzeGradient: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  reanalyzeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  reanalyzeText: {
    fontSize: 14,
    fontFamily: "Lora_400Regular",
    fontWeight: "500",
    color: "#dc2626",
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  contextButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.accent.secondary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: Colors.accent.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  reanalyzeButtonSmall: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#dc2626',
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  contextButtonText: {
    fontSize: 14,
    fontFamily: "Lora_400Regular",
    fontWeight: '500',
    color: Colors.accent.secondary,
  },
  reanalyzeButtonSmallText: {
    fontSize: 14,
    fontFamily: "Lora_400Regular",
    fontWeight: '500',
    color: '#dc2626',
  },
  feedbackCard: {
    backgroundColor: 'rgba(254, 254, 254, 0.85)',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(104, 89, 81, 0.08)',
  },
  feedbackQuestion: {
    fontSize: 13.5,
    fontFamily: "Lora_400Regular",
    fontWeight: '500',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
  },
  feedbackSubtext: {
    fontSize: 10.5,
    fontFamily: "Lora_400Regular",
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 15,
    marginBottom: 20,
  },
  backToScannerButton: {
    backgroundColor: Colors.accent.secondary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: Colors.accent.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    marginTop: 8,
  },
  backToScannerButtonText: {
    fontSize: 12,
    fontFamily: "Lora_400Regular",
    fontWeight: '500',
    color: '#ffffff',
  },
  discoveryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  discoveryTitle: {
    fontSize: 18,
    fontFamily: "Lora_400Regular",
    fontWeight: '500',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
  },
  discoverySubtext: {
    fontSize: 14,
    fontFamily: "Lora_400Regular",
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  discoveryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.accent.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  discoveryButtonActive: {
    shadowColor: Colors.umber,
    shadowOpacity: 0.25,
  },
  discoveryButtonContainer: {
    position: 'relative',
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.accent.secondary,
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 56, // Ensure consistent height
  },
  discoveryProgressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
    backgroundColor: Colors.accent.secondary, // Use the same brown as the button border
    borderRadius: 14,
    zIndex: 1,
    opacity: 1, // Ensure progress bar is never transparent
  },
  discoveryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    position: 'relative',
    zIndex: 2, // Higher z-index to ensure text stays on top
  },
  discoveryButtonText: {
    fontSize: 16,
    fontFamily: "Lora_400Regular",
    fontWeight: '500',
    color: Colors.accent.secondary,
  },
  discoveryButtonTextActive: {
    color: '#ffffff',
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: Colors.accent.secondary,
  },
  tabText: {
    fontSize: 14,
    fontFamily: "Lora_400Regular",
    fontWeight: '500',
    color: '#64748b',
  },
  activeTabText: {
    color: '#ffffff',
  },
  summaryContainer: {
    paddingTop: 4,
  },
  summaryText: {
    fontSize: 15,
    fontFamily: "Lora_400Regular",
    lineHeight: 22,
    color: '#64748b',
  },
  moreButton: {
    marginTop: 14,
    alignSelf: 'flex-start',
    paddingVertical: 9,
    paddingHorizontal: 18,
    backgroundColor: Colors.accent.secondary,
    borderRadius: 10,
    shadowColor: Colors.accent.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  moreButtonText: {
    fontSize: 10.5,
    fontFamily: "Lora_400Regular",
    fontWeight: '500',
    color: '#ffffff',
  },
  recognitionBadgeInCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 5,
    alignSelf: 'flex-start',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  recognitionTextInCard: {
    fontSize: 9,
    fontFamily: "Lora_400Regular",
    fontWeight: '500',
    color: '#4CAF50',
  },
  confidenceTextInCard: {
    fontSize: 9,
    fontFamily: "Lora_400Regular",
    color: '#ffffff',
  },
  notRecognizedTextInCard: {
    fontSize: 9,
    fontFamily: "Lora_400Regular",
    fontWeight: '500',
    color: '#FF9800',
  },

});
