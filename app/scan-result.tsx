import React, { useState, useEffect } from "react";
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
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { MapPin, Calendar, Share2, CheckCircle, AlertCircle, RefreshCw, ArrowLeft, Sparkles, Clock } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImageManipulator from "expo-image-manipulator";

import { mockMonuments } from "@/data/mockMonuments";
import FormattedText from "@/components/FormattedText";
import Logo from "@/components/Logo";

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

  
  const [monument, setMonument] = useState<MonumentData | undefined>(undefined);
  
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
              // Navigate back to scanner with the current image and context form open
              router.push({
                pathname: '/(tabs)/(scanner)' as any,
                params: {
                  reanalyzeImage: monument.scannedImage,
                  showContext: 'true'
                }
              });
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

      // Build reanalysis prompt with more conservative approach
      const promptText = `Reanalyze this image with EXTREME CAUTION. The previous analysis may have been incorrect. 

BE EXTREMELY CONSERVATIVE with identification. Only identify a specific monument/artwork if you are 95% or more confident it is that exact piece. Many sculptures, buildings, and artworks share similar themes, poses, or subjects but are completely different works.

For recognition (isRecognized: true), confidence must be 95% or higher. Be ESPECIALLY conservative with:
- Local, regional, or smaller monuments that may look similar to famous ones
- Religious sculptures, statues, or buildings with common iconography
- Sculptures with common poses, themes, or subjects (angels, saints, warriors, etc.)
- Buildings with similar architectural styles from the same period
- Artworks with similar subjects, compositions, or artistic styles
- Churches, chapels, and religious buildings that often share similar designs
- Memorial statues and commemorative monuments

When in doubt, mark as NOT RECOGNIZED. It's better to provide general analysis than incorrect identification. If you see common religious iconography, architectural elements, or artistic themes, do NOT assume it's a specific famous work unless you are absolutely certain.

If not 95% confident, mark as not recognized and provide general analysis instead.

Provide ALL information in ONE response. Always provide the ACTUAL location, not assumptions.

Respond in this exact JSON format:
{
"artworkName": "Name or 'Unknown Monument or Artwork'",
"confidence": 85,
"location": "Actual location or 'Unknown Location'",
"period": "Year(s) or century format or 'Unknown'",
"isRecognized": true/false,
"detailedDescription": {
  "keyTakeaways": [
    "First key takeaway - specific and informative",
    "Second key takeaway - specific and informative", 
    "Third key takeaway - specific and informative",
    "Fourth key takeaway - specific and informative"
  ],
  "inDepthContext": "Write exactly 3 paragraphs separated by double line breaks. Be specific and avoid generalizations.",
  "curiosities": "ONE interesting fact or 'No widely known curiosities are associated with this monument or artwork.'"
}
}`;

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
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={["#2C3E50", "#34495E"]}
          style={styles.headerGradient}
        >
          <Logo size={28} style={styles.logo} />
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={24} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>Discovery Complete</Text>
              <Text style={styles.headerSubtitle}>Your monument has been analyzed</Text>
            </View>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Share2 size={20} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Monument Image */}
        {monument.scannedImage && (
          <View style={styles.imageSection}>
            <View style={styles.imageContainer}>
              <Image source={{ uri: monument.scannedImage }} style={styles.monumentImage} />
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
          </View>
        )}

        {/* Monument Info */}
        <View style={styles.section}>
          <View style={styles.monumentCard}>
            <Text style={styles.monumentName}>{monument.name}</Text>
            
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <MapPin size={16} color="#8B4513" />
                <Text style={styles.detailText}>{monument.location}</Text>
              </View>
              <View style={styles.detailItem}>
                <Calendar size={16} color="#8B4513" />
                <Text style={styles.detailText}>{monument.period}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Context and Reanalyze Buttons - Only show when not recognized */}
        {!monument.isRecognized && (
          <View style={styles.section}>
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={styles.contextButton}
                onPress={() => {
                  router.push({
                    pathname: '/(tabs)/(scanner)' as any,
                    params: {
                      reanalyzeImage: monument.scannedImage,
                      showContext: 'true'
                    }
                  });
                }}
              >
                <View style={styles.buttonContent}>
                  <Sparkles size={18} color="#8B4513" />
                  <Text style={styles.contextButtonText}>Add Context</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.reanalyzeButtonSmall, isReanalyzing && styles.reanalyzeButtonDisabled]}
                onPress={performReanalysis}
                disabled={isReanalyzing}
              >
                <View style={styles.buttonContent}>
                  {isReanalyzing ? (
                    <ActivityIndicator size="small" color="#dc2626" />
                  ) : (
                    <RefreshCw size={18} color="#dc2626" />
                  )}
                  <Text style={styles.reanalyzeButtonSmallText}>
                    {isReanalyzing ? 'Reanalyzing...' : 'Reanalyze'}
                  </Text>
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
                <Sparkles size={20} color="#8B4513" />
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
                <Clock size={20} color="#8B4513" />
                <Text style={styles.sectionTitle}>In-Depth Context</Text>
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
                <Sparkles size={20} color="#8B4513" />
                <Text style={styles.sectionTitle}>Curiosity</Text>
              </View>
              <FormattedText style={styles.descriptionText}>{monument.detailedDescription.curiosities}</FormattedText>
            </View>
          </View>
        )}

        {/* Action Button - Only show when recognized */}
        {monument.isRecognized && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.reanalyzeButton, isReanalyzing && styles.reanalyzeButtonDisabled]}
              onPress={handleReanalyze}
              disabled={isReanalyzing}
            >
              <LinearGradient
                colors={isReanalyzing ? ["#999", "#777"] : ["#dc2626", "#f87171"]}
                style={styles.reanalyzeGradient}
              >
                {isReanalyzing ? (
                  <View style={styles.reanalyzeContent}>
                    <ActivityIndicator size="small" color="#FFF" />
                    <Text style={styles.reanalyzeText}>Reanalyzing...</Text>
                  </View>
                ) : (
                  <View style={styles.reanalyzeContent}>
                    <RefreshCw size={20} color="#FFF" />
                    <Text style={styles.reanalyzeText}>Reanalyze Monument</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
    backgroundColor: '#8B4513',
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
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  logo: {
    marginBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: "#ffffff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontStyle: "italic",
    color: "rgba(255,255,255,0.9)",
  },
  shareButton: {
    padding: 8,
  },
  imageSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  imageContainer: {
    position: 'relative',
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
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
    padding: 16,
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
  section: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  monumentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
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
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
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
    backgroundColor: '#8B4513',
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
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 30,
  },
  reanalyzeButtonDisabled: {
    opacity: 0.7,
  },
  reanalyzeGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  reanalyzeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  reanalyzeText: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: "#ffffff",
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  contextButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#8B4513',
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  reanalyzeButtonSmall: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#dc2626',
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
    color: '#8B4513',
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
});
