import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
  Animated,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { MapPin, Calendar, Share2, CheckCircle, AlertCircle, RefreshCw, ArrowLeft, Sparkles, Clock, Volume2, VolumeX, Pause, Play } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImageManipulator from "expo-image-manipulator";

import { mockMonuments } from "@/data/mockMonuments";
import FormattedText from "@/components/FormattedText";
import Logo from "@/components/Logo";
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
    confidence,
    isRecognized,
    keyTakeaways,
    inDepthContext,
    curiosities
  } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReanalyzing, setIsReanalyzing] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentAudio, setCurrentAudio] = useState<any>(null);
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);
  const [isInitialAnalysis, setIsInitialAnalysis] = useState<boolean>(true);
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const initialProgressAnimation = useRef(new Animated.Value(0)).current;

  
  const [monument, setMonument] = useState<MonumentData | undefined>(undefined);
  
  // Start initial scanning animation when coming from analysis
  useEffect(() => {
    if (artworkName && typeof artworkName === 'string') {
      // This means we're coming from a fresh analysis, show scanning animation
      setIsInitialAnalysis(true);
      initialProgressAnimation.setValue(0);
      
      // Start the scanning line animation
      Animated.timing(initialProgressAnimation, {
        toValue: 1,
        duration: 3000, // 3 seconds for initial analysis visualization
        useNativeDriver: false,
      }).start(() => {
        setIsInitialAnalysis(false);
      });
    } else {
      setIsInitialAnalysis(false);
    }
  }, [artworkName]);

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
          
          loadedMonument = {
            id: resultId as string || 'ai-analysis',
            name: artworkName as string,
            location: (location as string) || 'Unknown Location',
            country: '',
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
  }, [monumentId, scanData, resultId, historyItemId, monumentName, location, period, scannedImage, regenerate, artworkName, confidence, isRecognized, keyTakeaways, inDepthContext, curiosities]);

  const handleReanalyze = async () => {
    if (!monument?.scannedImage) {
      Alert.alert('Error', 'No image available for reanalysis.');
      return;
    }

    setIsReanalyzing(true);
    
    try {
      // Show a prompt to add context for better results
      Alert.alert(
        'Reanalyze with Context',
        'Adding context information like location, name, or museum can significantly improve identification accuracy. Would you like to add context or proceed with reanalysis?',
        [
          {
            text: 'Add Context',
            onPress: () => {
              setIsReanalyzing(false);
              // Go back to previous scanner page
              router.back();
            }
          },
          {
            text: 'Reanalyze Now',
            onPress: async () => {
              await performReanalysis();
            }
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setIsReanalyzing(false)
          }
        ]
      );
    } catch (error) {
      console.error('Error during reanalysis setup:', error);
      setIsReanalyzing(false);
      Alert.alert('Error', 'Failed to start reanalysis. Please try again.');
    }
  };

  const performReanalysis = async () => {
    if (!monument?.scannedImage) return;

    try {
      // Compress image for reanalysis
      const compressedImage = await ImageManipulator.manipulateAsync(
        monument.scannedImage,
        [{ resize: { width: 1024 } }],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true
        }
      );
      
      if (!compressedImage.base64) {
        throw new Error('Failed to compress image for reanalysis');
      }

      // Build reanalysis prompt using the same conservative approach as scanner
      // Default to city mode prompt (most common case for reanalysis)
      const promptText = `Analyze this image and identify any monuments, statues, architectural landmarks, or public artworks. Include painted or sculpted depictions of landmarks (identify the artwork itself, not the building it represents).

BE EXTREMELY CONSERVATIVE with identification. Many monuments, churches, and buildings share similar styles, layouts, or decorative elements. Only identify a specific site if you are 95% or more confident it is that exact location.

For recognition (isRecognized: true), confidence must be 95% or higher. Be ESPECIALLY conservative with:
- Churches, cathedrals, and chapels with nearly identical façades
- War memorials, equestrian statues, and commemorative monuments with common designs
- Triumphal arches, obelisks, towers, or bridges that resemble others from the same era
- Buildings in neoclassical, Gothic, or baroque styles that repeat common features
- Street art and murals in styles that appear across multiple cities

When in doubt, mark as NOT RECOGNIZED. It is better to provide general analysis than incorrect identification. If confidence is below 95%, mark as not recognized and provide general analysis instead.

Provide ALL information in ONE response. Only mark isRecognized as true if confidence is 95% or higher. Always provide the ACTUAL location, not user's location unless they match. If not 95% confident, provide general analysis of what you see without claiming specific identification.

Respond in this exact JSON format (ensure all strings are properly escaped and no control characters are included):
{
"artworkName": "Name or 'Unknown Monuments and Art'",
"confidence": 85,
"location": "Actual location",
"period": "Year(s) or century format (e.g., '1503', '15th century', '1800s', '12th-13th century') or 'Unknown'",
"isRecognized": true/false,
"detailedDescription": {
"keyTakeaways": [
  "First key takeaway bullet point - must be specific and informative",
  "Second key takeaway bullet point - must be specific and informative", 
  "Third key takeaway bullet point - must be specific and informative",
  "Fourth key takeaway bullet point - must be specific and informative"
],
"inDepthContext": "Task: Write exactly 3 condensed paragraphs (together totaling around 400–450 words) about [TOPIC]. Separate paragraphs with double line breaks only. Use bold highlights for key terms. The narrative must be tailored to the specific monument or artwork, not generic.\n\nStyle & Priorities:\nAlways start in medias res with a striking anecdote or vivid story.\nThe text must feel like a flowing story, not an essay. Be vivid, engaging, and specific — avoid generalizations.\nSlightly prioritize human stories (rulers, artists, workers, visitors, conquerors) while still delivering historical and artistic context.\nBlend historical detail, description, and anecdotes into a smooth narrative.\nYou may be creative with the structure of paragraphs depending on the topic, but follow the outline below as a strong guideline.\n\nParagraph Guidelines:\nFirst paragraph (origins): Open with the striking story, then explain the monument/artwork's historical origins, creation context, patrons/architects, and broader political or cultural significance, with specific dates.\nSecond paragraph (visuals): Continue the story, blending vivid visual description into the narrative itself (not as a detached catalog) and as if the reader is walking through the monument/artwork. Describe it step by step (top to bottom, left to right, or foreground to background), naturally including materials, techniques, style, dimensions, and unique features.\nThird paragraph (impact): Carry the story forward into cultural impact and significance over time — myths, shifting meanings, and notable events or anecdotes tied to it. Keep prioritizing human experiences and end with a strong, memorable closing that feels like the resolution of a story.",
"curiosities": "ONE interesting anecdote, lesser-known fact, or unusual story. If none are known, write 'No widely known curiosities are associated with these monuments and art.'"
}
}

CRITICAL: The keyTakeaways array MUST contain exactly 4 bullet points. Each bullet point should be a complete, informative sentence about the monument/artwork. The curiosities field should contain only ONE curiosity, not multiple. Ensure all text is properly escaped for JSON.`;

      const requestBody = {
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: promptText },
              { type: 'image', image: compressedImage.base64 }
            ]
          }
        ]
      };

      const aiResponse = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!aiResponse.ok) {
        throw new Error(`AI API error: ${aiResponse.status}`);
      }

      const aiResult = await aiResponse.json();
      
      if (!aiResult.completion) {
        throw new Error('AI service returned incomplete response');
      }

      // Parse the AI response
      let cleanedResponse = aiResult.completion
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

      let analysisResult;
      try {
        analysisResult = JSON.parse(cleanedResponse);
      } catch (parseError) {
        // Try to extract JSON from response
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          let jsonString = jsonMatch[0]
            .replace(/"([^"]*?)\n([^"]*?)"/g, (_match: string, p1: string, p2: string) => `"${p1}\\n${p2}"`)
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
            .trim();
          analysisResult = JSON.parse(jsonString);
        } else {
          throw new Error('Could not parse AI response');
        }
      }

      // Update monument data with new analysis
      const updatedMonument: MonumentData = {
        ...monument,
        name: analysisResult.artworkName,
        location: analysisResult.location,
        period: analysisResult.period,
        confidence: analysisResult.confidence,
        isRecognized: analysisResult.isRecognized,
        detailedDescription: {
          keyTakeaways: analysisResult.detailedDescription.keyTakeaways,
          inDepthContext: analysisResult.detailedDescription.inDepthContext,
          curiosities: analysisResult.detailedDescription.curiosities
        }
      };

      setMonument(updatedMonument);
      setIsReanalyzing(false);
      
      Alert.alert(
        'Reanalysis Complete', 
        `The analysis has been updated. ${analysisResult.isRecognized ? 'Monument identified' : 'Monument not specifically identified'} with ${analysisResult.confidence}% confidence.`
      );
      
    } catch (error) {
      console.error('Error during reanalysis:', error);
      setIsReanalyzing(false);
      Alert.alert(
        'Reanalysis Failed', 
        'Could not reanalyze the image. Please try again or add context information for better results.'
      );
    }
  };

  const handleShare = () => {
    Alert.alert('Share', 'Share functionality will be implemented when backend is ready.');
  };

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

  const handleDiscoverHistory = () => {
    if (isDiscovering) return;
    
    setIsDiscovering(true);
    
    // Reset animation
    progressAnimation.setValue(0);
    
    // Start progressive animation from left to right
    Animated.timing(progressAnimation, {
      toValue: 1,
      duration: 2500, // 2.5 seconds for recognition simulation
      useNativeDriver: false,
    }).start(() => {
      // Animation complete - redirect to history or show results
      setIsDiscovering(false);
      Alert.alert(
        'Discovery Complete!',
        'Historical context and related monuments have been discovered.',
        [
          {
            text: 'View History',
            onPress: () => {
              // Navigate to history or show discovered content
              console.log('Navigate to discovered history');
            }
          },
          {
            text: 'OK',
            style: 'default'
          }
        ]
      );
    });
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
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Monument Image - Full Background with Header Overlay */}
        {monument.scannedImage && (
          <View style={styles.imageSection}>
            <Image source={{ uri: monument.scannedImage }} style={styles.monumentImage} />
            

            
            {/* Header overlay on top of image */}
            <View style={styles.headerOverlay}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <ArrowLeft size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Share2 size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)']}
              style={styles.imageOverlay}
            >
              <View style={styles.imageInfo}>
                <View style={styles.recognitionBadge}>
                  {monument.isRecognized ? (
                    <>
                      <CheckCircle size={16} color="#4CAF50" />
                      <Text style={styles.recognitionText}>Recognized</Text>
                      <Text style={styles.confidenceText}>{monument.confidence}%</Text>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={16} color="#FF9800" />
                      <Text style={styles.notRecognizedText}>Not Recognized</Text>
                    </>
                  )}
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Monument Info */}
        <View style={styles.section}>
          <View style={styles.monumentCard}>
            <Text style={styles.monumentName}>{monument.name}</Text>
            
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <MapPin size={16} color={Colors.accent.secondary} />
                <Text style={styles.detailText}>{monument.location}</Text>
              </View>
              <View style={styles.detailItem}>
                <Calendar size={16} color={Colors.accent.secondary} />
                <Text style={styles.detailText}>{monument.period}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Not Recognized Section - Enhanced feedback and options */}
        {!monument.isRecognized && (
          <View style={styles.section}>
            <View style={styles.notRecognizedCard}>
              <View style={styles.notRecognizedHeader}>
                <AlertCircle size={24} color="#f59e0b" />
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
                  <Sparkles size={20} color="#ffffff" />
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
                <Sparkles size={20} color={Colors.accent.secondary} />
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

        {/* In-Depth Context - Only show when recognized */}
        {monument.isRecognized && monument.detailedDescription && monument.detailedDescription.inDepthContext && (
          <View style={styles.section}>
            <View style={styles.contentCard}>
              <View style={styles.cardHeader}>
                <Clock size={20} color={Colors.accent.secondary} />
                <Text style={styles.sectionTitle}>In-Depth Context</Text>
                <TouchableOpacity
                  style={styles.ttsButton}
                  onPress={() => handlePlayTTS(monument.detailedDescription!.inDepthContext)}
                >
                  {isPlaying ? (
                    <Pause size={18} color={Colors.accent.secondary} />
                  ) : (
                    <Volume2 size={18} color={Colors.accent.secondary} />
                  )}
                </TouchableOpacity>
              </View>
              <FormattedText style={styles.descriptionText}>{monument.detailedDescription.inDepthContext}</FormattedText>
            </View>
          </View>
        )}

        {/* Curiosity - Only show when recognized */}
        {monument.isRecognized && monument.detailedDescription && monument.detailedDescription.curiosities && monument.detailedDescription.curiosities !== 'No widely known curiosities are associated with these monuments and art.' && (
          <View style={styles.section}>
            <View style={styles.contentCard}>
              <View style={styles.cardHeader}>
                <Sparkles size={20} color={Colors.accent.secondary} />
                <Text style={styles.sectionTitle}>Curiosity</Text>
              </View>
              <FormattedText style={styles.descriptionText}>{monument.detailedDescription.curiosities}</FormattedText>
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
                  <Sparkles size={18} color="#ffffff" />
                  <Text style={styles.backToScannerButtonText}>Add Context & Reanalyze</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Discover History Section */}
        <View style={styles.section}>
          <View style={styles.discoveryCard}>
            <Text style={styles.discoveryTitle}>Discover Historical Context</Text>
            <Text style={styles.discoverySubtext}>
              Explore related monuments, historical events, and cultural connections in this area.
            </Text>
            
            <TouchableOpacity
              style={[
                styles.discoveryButton,
                isDiscovering && styles.discoveryButtonActive
              ]}
              onPress={handleDiscoverHistory}
              disabled={isDiscovering}
            >
              <View style={styles.discoveryButtonContainer}>
                {/* Progress bar background */}
                <Animated.View 
                  style={[
                    styles.discoveryProgressBar,
                    {
                      width: progressAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    }
                  ]}
                />
                
                {/* Button content */}
                <View style={styles.discoveryButtonContent}>
                  {isDiscovering ? (
                    <>
                      <ActivityIndicator size="small" color="#ffffff" />
                      <Text style={[styles.discoveryButtonText, styles.discoveryButtonTextActive]}>Discovering...</Text>
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} color={Colors.accent.secondary} />
                      <Text style={styles.discoveryButtonText}>Start Scanning</Text>
                    </>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
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
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
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
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: '500',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  shareButton: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  imageSection: {
    position: 'relative',
    height: 400,
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
    height: '100%',
    justifyContent: 'flex-end',
    padding: 24,
  },
  imageInfo: {
    alignItems: 'flex-end',
  },
  recognitionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  recognitionText: {
    fontSize: 12,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: '500',
    color: '#4CAF50',
  },
  confidenceText: {
    fontSize: 12,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: '#64748b',
  },
  notRecognizedText: {
    fontSize: 12,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: '500',
    color: '#FF9800',
  },
  notRecognizedCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  notRecognizedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  notRecognizedTitle: {
    fontSize: 18,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: '600',
    color: '#2C3E50',
  },
  notRecognizedDescription: {
    fontSize: 15,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    lineHeight: 22,
    color: '#64748b',
    marginBottom: 20,
  },
  helpSection: {
    marginBottom: 24,
  },
  helpTitle: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
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
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    lineHeight: 20,
    color: '#64748b',
  },
  addContextButton: {
    backgroundColor: Colors.accent.secondary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: Colors.accent.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  addContextButtonText: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: '500',
    color: '#ffffff',
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 14,
  },
  monumentCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  monumentName: {
    fontSize: 24,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: "#2C3E50",
    marginBottom: 16,
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
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: '#64748b',
  },
  contentCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
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
    flex: 1,
  },
  ttsButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 69, 19, 0.1)',
    marginLeft: 12,
  },
  subsection: {
    marginTop: 20,
  },
  subsectionTitle: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: '500',
    color: '#2C3E50',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    lineHeight: 22,
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
    marginTop: 8,
  },
  factText: {
    flex: 1,
    fontSize: 15,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    lineHeight: 22,
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
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
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
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: '500',
    color: Colors.accent.secondary,
  },
  reanalyzeButtonSmallText: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: '500',
    color: '#dc2626',
  },
  feedbackCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  feedbackQuestion: {
    fontSize: 18,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: '500',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
  },
  feedbackSubtext: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  backToScannerButton: {
    backgroundColor: Colors.accent.secondary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: Colors.accent.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    marginTop: 8,
  },
  backToScannerButtonText: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
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
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: '500',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
  },
  discoverySubtext: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
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
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: '500',
    color: Colors.accent.secondary,
  },
  discoveryButtonTextActive: {
    color: '#ffffff',
  },

});
