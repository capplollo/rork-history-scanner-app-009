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
import { useAuth } from "@/contexts/AuthContext";

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

  
  const [monument, setMonument] = useState<MonumentData | undefined>(undefined);
  
  // Function to regenerate content from history using AI API
  const regenerateContentFromHistory = async (name: string, loc: string, per: string, image: string) => {
    try {
      console.log('🤖 Calling AI API to regenerate content for:', name);
      
      // Build the regeneration prompt
      const promptText = `Write exactly 3 condensed paragraphs (together totaling around 1200 words) about ${name}. Separate paragraphs with double line breaks only. Use bold highlights for key terms. Be specific, vivid, and deeply engaging — avoid generalizations. The text should be very interesting, weaving in short stories or anecdotes that both open and close within paragraphs to create a dynamic, narrative flow. Start in medias res with an anecdote or striking detail so it feels like a story.

First paragraph: Focus on historical origins, creation context, artist/architect background, and period significance with specific dates and historical context.

Second paragraph: Visually guide the reader across the artwork/monument — describe it step by step (from top to bottom, left to right, or foreground to background). Detail artistic/architectural elements, materials used, techniques, style characteristics, dimensions, and unique features as if the reader is standing in front of it.

Third paragraph: Discuss cultural impact, significance over the years, and notable events or stories associated with it. Keep the tone vivid, narrative, and engaging, while remaining concise.

Additional context:
- Monument/Artwork: ${name}
- Location: ${loc}
- Period: ${per}

Provide 4 key takeaways as bullet points and one interesting curiosity about this monument.`;

      const requestBody = {
        messages: [
          {
            role: 'user',
            content: promptText
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

      // Parse the response to extract key takeaways and content
      const content = aiResult.completion;
      
      // Extract key takeaways (look for bullet points or numbered lists)
      const keyTakeawaysMatch = content.match(/(?:Key takeaways?|Key points?|Important facts?):[\s\S]*?(?:\n\n|$)/i);
      let keyTakeaways: string[] = [];
      
      if (keyTakeawaysMatch) {
        const takeawaysText = keyTakeawaysMatch[0];
        keyTakeaways = takeawaysText
          .split('\n')
          .filter((line: string) => line.trim().match(/^[•\-\*]|^\d+\./)) // Match bullet points or numbered lists
          .map((line: string) => line.replace(/^[•\-\*]\s*|^\d+\.\s*/, '').trim())
          .filter((line: string) => line.length > 0)
          .slice(0, 4); // Take first 4
      }
      
      // If no structured takeaways found, create them from the content
      if (keyTakeaways.length === 0) {
        keyTakeaways = [
          `${name} is a significant historical monument located in ${loc}`,
          `Built during ${per}, representing the architectural style of its era`,
          'This monument holds important cultural and historical significance',
          'The site continues to attract visitors and researchers from around the world'
        ];
      }
      
      // Extract curiosity (look for interesting facts or anecdotes)
      const curiosityMatch = content.match(/(?:Curiosity|Interesting fact|Did you know)[:\s]*([^\n]+)/i);
      const curiosity = curiosityMatch ? curiosityMatch[1].trim() : 
        'This monument has fascinating stories and details that continue to be discovered by historians and visitors.';
      
      // Create the regenerated monument data
      const regeneratedMonument: MonumentData = {
        id: (historyItemId as string) || 'regenerated',
        name: name,
        location: loc,
        country: '',
        period: per,
        description: content.substring(0, 200) + '...', // First part as description
        significance: `This monument holds profound historical and cultural significance in ${loc}.`,
        facts: keyTakeaways,
        image: image,
        scannedImage: image,
        scannedAt: new Date().toISOString(),
        confidence: 90,
        isRecognized: true,
        detailedDescription: {
          keyTakeaways: keyTakeaways,
          inDepthContext: content,
          curiosities: curiosity
        }
      };
      
      setMonument(regeneratedMonument);
      setIsLoading(false);
      
      console.log('✅ Content regeneration completed successfully');
      
    } catch (error) {
      console.error('❌ Error regenerating content:', error);
      throw error; // Re-throw to trigger fallback
    }
  };

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
          // Call AI API to regenerate content for this monument
          await regenerateContentFromHistory(monumentName as string, location as string, period as string, scannedImage as string);
          return; // Exit early as regenerateContentFromHistory will set the monument state
        } catch (error) {
          console.error('Error during content regeneration:', error);
          // Fallback to basic monument data
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
  }, [monumentId, scanData, resultId, historyItemId, monumentName, location, period, scannedImage, regenerate, artworkName, confidence, isRecognized, keyTakeaways, inDepthContext, curiosities, regenerateContentFromHistory]);

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
"inDepthContext": "Write exactly 3 condensed paragraphs (together totaling around 1200 words) about [TOPIC]. Separate paragraphs with double line breaks only. Use bold highlights for key terms. Be specific, vivid, and deeply engaging — avoid generalizations. The text should be very interesting, weaving in short stories or anecdotes that both open and close within paragraphs to create a dynamic, narrative flow. Start in medias res with an anecdote or striking detail so it feels like a story.\n First paragraph: Focus on historical origins, creation context, artist/architect background, and period significance with specific dates and historical context.\n Second paragraph: Visually guide the reader across the artwork/monument — describe it step by step (from top to bottom, left to right, or foreground to background). Detail artistic/architectural elements, materials used, techniques, style characteristics, dimensions, and unique features as if the reader is standing in front of it.\n* Third paragraph: Discuss cultural impact, significance over the years, and notable events or stories associated with it. Keep the tone vivid, narrative, and engaging, while remaining concise.",
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
                      <Text style={styles.confidenceText}>{(monument.confidence || 0).toString()}%</Text>
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
});
