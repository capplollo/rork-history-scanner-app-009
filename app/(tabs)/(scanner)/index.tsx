import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
  TextInput,
  SafeAreaView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera as CameraIcon, Image as ImageIcon, X, Sparkles, ChevronDown, ChevronUp, Info, Zap, Camera } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { mockMonuments } from "@/data/mockMonuments";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function ScannerScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string>("");
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState({
    name: "",
    location: "",
    building: "",
    notes: "",
  });

  const pickImageFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Please allow access to your photo library to select images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Please allow access to your camera to take photos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setAnalysisStatus("Preparing image...");
    
    try {
      setAnalysisStatus("Converting image to base64...");
      
      // Convert image to base64
      const response = await fetch(selectedImage);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          // Remove data:image/jpeg;base64, prefix
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.readAsDataURL(blob);
      });

      setAnalysisStatus("Analyzing monuments and art with AI...");
      
      // Build the prompt
      let prompt = `Analyze this image and identify any monuments and art including sculptures, paintings, or cultural landmarks. Include paintings that depict buildings/landmarks (identify the PAINTING, not the depicted structure).

Consider that many sculptures share similar themes, poses, or subjects but are different works entirely. For sculptures, confidence should be 90% or higher for recognition. For other monuments and art, confidence should be 80% or higher.`;
      
      // Add additional context if provided
      const hasAdditionalInfo = additionalInfo.name || additionalInfo.location || additionalInfo.building || additionalInfo.notes;
      if (hasAdditionalInfo) {
        prompt += `\n\n**CRITICAL USER CONTEXT - PRIORITIZE THIS INFORMATION HEAVILY:**`;
        if (additionalInfo.name) prompt += `\n- Monument/Art Name: "${additionalInfo.name}" (Use this name if it matches what you see in the image)`;
        if (additionalInfo.location) prompt += `\n- Location: "${additionalInfo.location}" (This location context is EXTREMELY IMPORTANT - if the image could plausibly be from this location, strongly favor monuments/art from this area)`;
        if (additionalInfo.building) prompt += `\n- Building/Context: "${additionalInfo.building}" (Consider this building context when identifying)`;
        if (additionalInfo.notes) prompt += `\n- Additional Notes: "${additionalInfo.notes}" (Important context clues)`;
        
        prompt += `\n\nWith this context provided, you should:\n1. STRONGLY prioritize monuments and art that match this location\n2. If the visual matches reasonably well with something from this location, increase confidence significantly\n3. Use the provided name if it matches what you observe in the image\n4. Consider the building/context information as key identifying factors`;
      }
      
      prompt += `\n\nProvide ALL information in ONE response. Only mark isRecognized as true if confidence is 80+. Always provide the ACTUAL location, not user's location unless they match.

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
  "inDepthContext": "Write exactly 3 paragraphs. Separate paragraphs with double line breaks only. Use bold highlights for key terms. Be specific and interesting. Avoid generalizations. First paragraph: Focus on historical origins, creation context, artist/architect background, and period significance with specific dates and historical context. Second paragraph: Detail artistic/architectural elements, materials used, construction techniques, style characteristics, dimensions, and unique technical features. Third paragraph: Discuss cultural impact, significance over the years, notable events or stories associated with the monuments and art and more.",
  "curiosities": "ONE interesting anecdote, lesser-known fact, or unusual story. If none are known, write 'No widely known curiosities are associated with these monuments and art.'"
}
}

CRITICAL: The keyTakeaways array MUST contain exactly 4 bullet points. Each bullet point should be a complete, informative sentence about the monument/artwork. The curiosities field should contain only ONE curiosity, not multiple. Ensure all text is properly escaped for JSON.`;
      
      // Call the AI API
      console.log('Making AI API request to:', 'https://toolkit.rork.com/text/llm/');
      console.log('Request payload structure:', {
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'PROMPT_LENGTH: ' + prompt.length },
            { type: 'image', image: 'BASE64_LENGTH: ' + base64.length }
          ]
        }]
      });
      
      // Validate base64 data
      if (!base64 || base64.length === 0) {
        throw new Error('Invalid image data: base64 is empty');
      }
      
      // Check if base64 is too large (limit to ~10MB)
      if (base64.length > 13000000) {
        throw new Error('Image is too large. Please use a smaller image.');
      }
      
      const requestBody = {
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image', image: base64 }
            ]
          }
        ]
      };
      
      console.log('Request body size:', JSON.stringify(requestBody).length, 'characters');
      
      const aiResponse = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('AI API response status:', aiResponse.status);
      console.log('AI API response headers:', Object.fromEntries(aiResponse.headers.entries()));
      
      if (!aiResponse.ok) {
        let errorText = 'Unknown error';
        try {
          errorText = await aiResponse.text();
        } catch (e) {
          console.error('Failed to read error response:', e);
        }
        
        console.log('AI API temporarily unavailable (status:', aiResponse.status, ')');
        
        // If it's a 500 error or other server error, provide a fallback response
        if (aiResponse.status >= 500) {
          console.log('AI service temporarily unavailable, using fallback response');
          setAnalysisStatus("AI service temporarily unavailable, providing basic analysis...");
          
          // Create a fallback analysis result
          const fallbackResult = {
            artworkName: "Monument or Artwork",
            confidence: 50,
            location: "Location Unknown",
            period: "Unknown",
            isRecognized: false,
            detailedDescription: {
              keyTakeaways: [
                "This appears to be a monument or artwork captured in the image.",
                "The AI analysis service is temporarily unavailable for detailed identification.",
                "Please try scanning again in a few moments when the service is restored.",
                "You can add context information above to help improve future analysis results."
              ],
              inDepthContext: "The AI analysis service is temporarily unavailable, so we cannot provide detailed historical information about this monument or artwork at this time. This is a temporary technical issue and should be resolved shortly.\n\nTo improve your experience when the service is restored, consider adding context information such as the monument's name, location, or the building/museum where it's located using the 'Add Context' section above.\n\nWe apologize for the inconvenience and appreciate your patience as we work to restore full functionality.",
              curiosities: "The AI analysis service is temporarily unavailable. Please try again shortly."
            }
          };
          
          // Navigate to scan result with fallback data
          router.push({
            pathname: "/scan-result" as any,
            params: {
              artworkName: fallbackResult.artworkName,
              confidence: fallbackResult.confidence.toString(),
              location: fallbackResult.location,
              period: fallbackResult.period,
              isRecognized: fallbackResult.isRecognized.toString(),
              keyTakeaways: JSON.stringify(fallbackResult.detailedDescription.keyTakeaways),
              inDepthContext: fallbackResult.detailedDescription.inDepthContext,
              curiosities: fallbackResult.detailedDescription.curiosities,
              scannedImage: selectedImage,
            },
          });
          return;
        }
        
        throw new Error(`AI API error: ${aiResponse.status} - ${errorText}`);
      }
      
      let aiResult;
      try {
        aiResult = await aiResponse.json();
      } catch (jsonError) {
        console.error('Failed to parse AI response as JSON:', jsonError);
        throw new Error('AI service returned invalid response format');
      }
      
      console.log('Raw AI response:', aiResult.completion);
      
      if (!aiResult.completion) {
        console.error('AI response missing completion field:', aiResult);
        throw new Error('AI service returned incomplete response');
      }
      
      setAnalysisStatus("Processing AI response...");
      
      // Clean and parse the AI response
      let cleanedResponse = aiResult.completion;
      
      console.log('Raw AI response:', aiResult.completion);
      
      // Remove markdown code blocks and clean up
      cleanedResponse = cleanedResponse
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      
      console.log('Cleaned content that will be parsed:', cleanedResponse);
      
      let analysisResult;
      try {
        // First attempt: try parsing as-is
        analysisResult = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        
        try {
          // Extract JSON object from the response
          const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error('No JSON object found in response');
          }
          
          let jsonString = jsonMatch[0];
          
          // Fix common JSON issues
          jsonString = jsonString
            // Fix unescaped newlines in strings
            .replace(/"([^"]*?)\n([^"]*?)"/g, (_match: string, p1: string, p2: string) => `"${p1}\\n${p2}"`)
            // Fix unescaped tabs
            .replace(/"([^"]*?)\t([^"]*?)"/g, (_match: string, p1: string, p2: string) => `"${p1}\\t${p2}"`)
            // Fix unescaped carriage returns
            .replace(/"([^"]*?)\r([^"]*?)"/g, (_match: string, p1: string, p2: string) => `"${p1}\\r${p2}"`)
            // Remove any control characters that might break JSON
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
            // Fix any remaining markdown
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .trim();
          
          console.log('Attempting to parse cleaned JSON:', jsonString.substring(0, 200) + '...');
          analysisResult = JSON.parse(jsonString);
        } catch (secondParseError) {
          console.error('Second JSON parse attempt also failed:', secondParseError);
          
          // Create a fallback response if JSON parsing completely fails
          console.log('Creating fallback response due to JSON parsing failure');
          analysisResult = {
            artworkName: "Monument or Artwork",
            confidence: 50,
            location: "Location Unknown",
            period: "Unknown",
            isRecognized: false,
            detailedDescription: {
              keyTakeaways: [
                "AI analysis encountered a technical issue.",
                "The monument or artwork could not be fully identified.",
                "Please try scanning again or add context information.",
                "Consider taking a clearer photo with better lighting."
              ],
              inDepthContext: "The AI analysis service encountered a technical issue while processing this image. This could be due to image quality, lighting conditions, or temporary service issues.\n\nTo improve results, try taking a clearer photo with good lighting and minimal reflections.\n\nYou can also add context information such as the location or name of the monument to help with identification.",
              curiosities: "Technical analysis was not completed due to processing issues."
            }
          };
        }
      }
      
      setAnalysisStatus("Analysis complete! Preparing results...");
      
      // Navigate to scan result with AI analysis data
      router.push({
        pathname: "/scan-result" as any,
        params: {
          artworkName: analysisResult.artworkName,
          confidence: analysisResult.confidence.toString(),
          location: analysisResult.location,
          period: analysisResult.period,
          isRecognized: analysisResult.isRecognized.toString(),
          keyTakeaways: JSON.stringify(analysisResult.detailedDescription.keyTakeaways),
          inDepthContext: analysisResult.detailedDescription.inDepthContext,
          curiosities: analysisResult.detailedDescription.curiosities,
          scannedImage: selectedImage,
        },
      });
      
    } catch (error) {
      console.error('Error detecting monuments and art:', error);
      console.error('Error details:', error);
      
      let errorMessage = 'Failed to analyze the image. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('500')) {
          errorMessage = 'The AI service is temporarily unavailable. Please try again in a few moments.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('JSON')) {
          errorMessage = 'There was an issue processing the AI response. Please try again.';
        }
      }
      
      Alert.alert('Analysis Failed', errorMessage);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStatus("");
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setAdditionalInfo({
      name: "",
      location: "",
      building: "",
      notes: "",
    });
  };

  const updateAdditionalInfo = (field: string, value: string) => {
    setAdditionalInfo(prev => ({ ...prev, [field]: value }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Discover</Text>
          <Text style={styles.headerSubtitle}>
            Scan monuments and art to unlock their stories
          </Text>
        </View>

        <View style={styles.section}>
          {selectedImage ? (
            <View style={styles.selectedImageContainer}>
              <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
              <TouchableOpacity style={styles.clearButton} onPress={clearImage}>
                <X size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <View style={styles.placeholderContent}>
                <CameraIcon size={32} color="#8B4513" />
                <Text style={styles.placeholderText}>Ready to Discover</Text>
                <Text style={styles.placeholderSubtext}>
                  Capture or select an image to begin
                </Text>
              </View>
            </View>
          )}
        </View>

        {!selectedImage && (
          <View style={styles.section}>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
                <CameraIcon size={20} color="#8B4513" />
                <Text style={styles.actionButtonText}>Take Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton} onPress={pickImageFromGallery}>
                <ImageIcon size={20} color="#8B4513" />
                <Text style={styles.actionButtonText}>From Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {selectedImage && (
          <View style={styles.section}>
            <View style={styles.contextCard}>
              <TouchableOpacity 
                style={styles.infoToggle}
                onPress={() => setShowAdditionalInfo(!showAdditionalInfo)}
              >
                <View style={styles.infoToggleLeft}>
                  <Info size={20} color="#8B4513" />
                  <Text style={styles.infoToggleText}>Add Context</Text>
                  <View style={styles.optionalBadge}>
                    <Text style={styles.optionalText}>Optional</Text>
                  </View>
                </View>
                {showAdditionalInfo ? (
                  <ChevronUp size={20} color="#8B4513" />
                ) : (
                  <ChevronDown size={20} color="#8B4513" />
                )}
              </TouchableOpacity>

              {showAdditionalInfo && (
                <View style={styles.infoForm}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Monument/Art Name</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g., Mona Lisa, Eiffel Tower"
                      placeholderTextColor="#999"
                      value={additionalInfo.name}
                      onChangeText={(text) => updateAdditionalInfo('name', text)}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Location</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g., Paris, France"
                      placeholderTextColor="#999"
                      value={additionalInfo.location}
                      onChangeText={(text) => updateAdditionalInfo('location', text)}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Building/Museum</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g., Louvre Museum"
                      placeholderTextColor="#999"
                      value={additionalInfo.building}
                      onChangeText={(text) => updateAdditionalInfo('building', text)}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Additional Notes</Text>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      placeholder="Any other details that might help..."
                      placeholderTextColor="#999"
                      value={additionalInfo.notes}
                      onChangeText={(text) => updateAdditionalInfo('notes', text)}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {selectedImage && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.analyzeButton, isAnalyzing && styles.analyzeButtonDisabled]}
              onPress={analyzeImage}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <View style={styles.analyzingContainer}>
                  <ActivityIndicator size="small" color="#8B4513" />
                  <Text style={styles.analyzeButtonText}>{analysisStatus}</Text>
                </View>
              ) : (
                <View style={styles.analyzeContainer}>
                  <Sparkles size={20} color="#8B4513" />
                  <Text style={styles.analyzeButtonText}>Discover History</Text>
                </View>
              )}
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
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    backgroundColor: "#FEFEFE",
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    gap: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "400",
    color: "#2C3E50",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#64748b",
    lineHeight: 22,
  },
  headerStats: {
    flexDirection: "row",
    gap: 24,
    marginTop: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 13,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "rgba(255,255,255,0.8)",
  },
  section: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: "#2C3E50",
    marginBottom: 20,
  },
  selectedImageContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  selectedImage: {
    width: '100%',
    height: 280,
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: 16,
  },
  clearButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    padding: 8,
  },
  placeholderContainer: {
    height: 280,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContent: {
    alignItems: 'center',
    gap: 12,
  },
  placeholderGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 18,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: "#2C3E50",
  },
  placeholderSubtext: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#64748b",
    textAlign: 'center',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 10,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: "#8B4513",
  },
  contextCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  infoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  infoToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoToggleText: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: "#2C3E50",
  },
  optionalBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  optionalText: {
    fontSize: 10,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: '#ffffff',
  },
  infoForm: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: "#2C3E50",
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: '#2C3E50',
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  analyzeButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#8B4513',
    paddingVertical: 20,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  analyzeButtonDisabled: {
    opacity: 0.7,
  },
  analyzeGradient: {
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  analyzingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  analyzeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  analyzeButtonText: {
    fontSize: 18,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: "#8B4513",
  },

});