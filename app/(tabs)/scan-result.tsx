import React, { useState } from "react";
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
import { X, MapPin, Calendar, Info, Share2, CheckCircle, AlertCircle, MessageCircle, Volume2, VolumeX, Pause } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Speech from 'expo-speech';
import { mockMonuments } from "@/data/mockMonuments";
import { HistoryItem } from "@/providers/HistoryProvider";
import { scanResultStore } from "@/services/scanResultStore";

const { width: screenWidth } = Dimensions.get("window");

export default function ScanResultScreen() {
  const { monumentId, scanData, resultId } = useLocalSearchParams();
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  
  let monument: HistoryItem | undefined;
  
  // Try to get data from resultId first (new method), then scanData (legacy), then monumentId
  if (resultId && typeof resultId === 'string') {
    try {
      const retrievedMonument = scanResultStore.retrieve(resultId);
      if (retrievedMonument) {
        monument = retrievedMonument;
        console.log('Retrieved monument from store:', monument.name);
        // Clean up the stored result after retrieval to prevent memory leaks
        scanResultStore.clear(resultId);
      } else {
        console.warn('No monument found for resultId:', resultId);
      }
    } catch (error) {
      console.error('Error retrieving monument from store:', error);
    }
  }
  
  // Legacy support for scanData (in case some old navigation still uses it)
  if (!monument && scanData && typeof scanData === 'string') {
    try {
      monument = JSON.parse(scanData) as HistoryItem;
    } catch (error) {
      console.error('Error parsing scan data:', error);
    }
  }
  
  // Fallback to mock data if no scan data
  if (!monument && monumentId) {
    const mockMonument = mockMonuments.find(m => m.id === monumentId);
    if (mockMonument) {
      monument = {
        ...mockMonument,
        scannedImage: mockMonument.image,
        scannedAt: new Date().toISOString(),
      };
    }
  }

  const getFullText = () => {
    if (!monument) {
      console.log('No monument data available for voice narration');
      return '';
    }
    
    let fullText = `${monument.name}. `;
    
    // Add location and period information
    if (monument.location) {
      fullText += `Located in ${monument.location}. `;
    }
    if (monument.period) {
      fullText += `From the ${monument.period}. `;
    }
    
    if (monument.detailedDescription) {
      if (monument.detailedDescription.quickOverview) {
        fullText += `${monument.detailedDescription.quickOverview} `;
      }
      if (monument.detailedDescription.inDepthContext) {
        fullText += `${monument.detailedDescription.inDepthContext} `;
      }
      if (monument.detailedDescription.curiosities) {
        fullText += `Here are some interesting curiosities: ${monument.detailedDescription.curiosities} `;
      }
      if (monument.detailedDescription.keyTakeaways && monument.detailedDescription.keyTakeaways.length > 0) {
        fullText += `Key takeaways: ${monument.detailedDescription.keyTakeaways.join('. ')}.`;
      }
    } else {
      if (monument.description) {
        fullText += `${monument.description} `;
      }
      if (monument.significance) {
        fullText += `Historical significance: ${monument.significance} `;
      }
      if (monument.facts && monument.facts.length > 0) {
        fullText += `Here are some quick facts: ${monument.facts.join('. ')}.`;
      }
    }
    
    // Clean up the text for better speech synthesis
    fullText = fullText
      .replace(/\n/g, ' ') // Replace newlines with spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/([.!?])\s*([A-Z])/g, '$1 $2') // Ensure proper spacing after punctuation
      .trim();
    
    console.log('Generated text for narration (length:', fullText.length, '):', fullText.substring(0, 100) + '...');
    return fullText;
  };

  const handlePlayPause = async () => {
    try {
      if (isPlaying) {
        if (isPaused) {
          // Resume
          await Speech.resume();
          setIsPaused(false);
        } else {
          // Pause
          await Speech.pause();
          setIsPaused(true);
        }
      } else {
        // Start speaking
        const fullText = getFullText();
        console.log('Attempting to speak text:', fullText ? 'Text available' : 'No text available');
        
        if (!fullText || fullText.trim().length === 0) {
          Alert.alert('No Content', 'No text content available to read aloud.');
          return;
        }
        
        setIsPlaying(true);
        setIsPaused(false);
        
        await Speech.speak(fullText, {
          language: 'en-US',
          pitch: 1.0,
          rate: 0.75, // Slightly slower for better comprehension
          onStart: () => {
            console.log('Speech started successfully');
            setIsPlaying(true);
            setIsPaused(false);
          },
          onDone: () => {
            console.log('Speech finished');
            setIsPlaying(false);
            setIsPaused(false);
          },
          onStopped: () => {
            console.log('Speech stopped');
            setIsPlaying(false);
            setIsPaused(false);
          },
          onError: (error) => {
            console.error('Speech error:', error);
            setIsPlaying(false);
            setIsPaused(false);
            Alert.alert('Speech Error', 'Unable to play audio. Please check your device settings and try again.');
          }
        });
      }
    } catch (error) {
      console.error('Speech control error:', error);
      setIsPlaying(false);
      setIsPaused(false);
      Alert.alert('Error', 'Unable to control audio playback. Please try again.');
    }
  };

  const handleStop = async () => {
    try {
      await Speech.stop();
      setIsPlaying(false);
      setIsPaused(false);
    } catch (error) {
      console.error('Speech stop error:', error);
    }
  };

  if (!monument) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Monument not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>Go Back</Text>
          </TouchableOpacity>
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

          {/* Voice Narrator - Only show when monument is identified */}
          {monument && (
            <View style={styles.narratorSection}>
              <Text style={styles.narratorTitle}>🎧 Voice Narrator</Text>
              <Text style={styles.narratorDescription}>
                Listen to the complete information about this monument
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
                    {isPlaying ? (isPaused ? 'Resume' : 'Pause') : 'Listen to Story'}
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
                    {isPaused ? 'Audio paused' : 'Playing complete story...'}
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
              colors={["#4f46e5", "#6366f1"]}
              style={styles.chatGradient}
            >
              <MessageCircle size={24} color="#ffffff" />
              <Text style={styles.chatButtonText}>Ask AI About This Monument</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareButton}>
            <LinearGradient
              colors={["#1e3a8a", "#3b82f6"]}
              style={styles.shareGradient}
            >
              <Share2 size={20} color="#ffffff" />
              <Text style={styles.shareButtonText}>Share Discovery</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafaf9",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#6b7280",
    marginBottom: 20,
  },
  backButton: {
    fontSize: 16,
    color: "#1e3a8a",
    fontWeight: "600",
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
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 10,
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
    color: "#6b7280",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
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
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
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
    color: "#374151",
    lineHeight: 26,
    fontWeight: "500",
  },
  inDepthContext: {
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 24,
  },
  curiosities: {
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 24,
    fontStyle: "italic",
    backgroundColor: "#fef3c7",
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
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
    paddingVertical: 18,
    gap: 12,
  },
  chatButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
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
    fontSize: 16,
    fontWeight: "600",
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
  narratorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
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
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    borderWidth: 2,
    borderColor: "#4f46e5",
  },
  narratorButtonActive: {
    backgroundColor: "#4f46e5",
  },
  narratorButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4f46e5",
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
    color: "#6b7280",
    marginBottom: 15,
    lineHeight: 20,
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
    backgroundColor: "#4f46e5",
  },
  playingIndicator: {
    fontSize: 14,
    color: "#4f46e5",
    fontStyle: "italic",
  },
});
