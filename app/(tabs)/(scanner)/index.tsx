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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera as CameraIcon, Image as ImageIcon, X, Sparkles, ChevronDown, ChevronUp, Info } from "lucide-react-native";
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

Respond in this exact JSON format:
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
  "inDepthContext": "Write exactly 3 paragraphs (1400-3000 characters total). Separate paragraphs with double line breaks only - NO paragraph titles or labels. Use **bold** highlights for key terms, names, dates, and important details. Be specific and interesting. Avoid generalizations.\n\nFirst paragraph: Focus on historical origins, creation context, artist/architect background, and period significance with specific dates and historical context.\n\nSecond paragraph: Detail artistic/architectural elements, materials used, construction techniques, style characteristics, dimensions, and unique technical features.\n\nThird paragraph: Discuss cultural impact, significance over the years, notable events or stories associated with the monuments and art and more.",
  "curiosities": "Interesting anecdotes, lesser-known facts, or unusual stories. If none are known, write 'No widely known curiosities are associated with these monuments and art.'"
}
}

CRITICAL: The keyTakeaways array MUST contain exactly 4 bullet points. Each bullet point should be a complete, informative sentence about the monument/artwork.`;
      
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
      
      const aiResponse = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image', image: base64 }
              ]
            }
          ]
        })
      });
      
      console.log('AI API response status:', aiResponse.status);
      console.log('AI API response headers:', Object.fromEntries(aiResponse.headers.entries()));
      
      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('AI API error response body:', errorText);
        
        // If it's a 500 error, provide a fallback response
        if (aiResponse.status === 500) {
          console.log('AI service unavailable, using fallback response');
          setAnalysisStatus("AI service unavailable, providing basic analysis...");
          
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
                "The AI analysis service is currently unavailable for detailed identification.",
                "You can try again later when the service is restored.",
                "Consider adding context information to help with future analysis."
              ],
              inDepthContext: "The AI analysis service is temporarily unavailable, so we cannot provide detailed historical information about this monument or artwork at this time.\n\nWe apologize for the inconvenience. The service should be restored shortly.\n\nIn the meantime, you can try adding context information such as the name, location, or building where this monument or artwork is located to help with future analysis attempts.",
              curiosities: "AI analysis service is currently unavailable."
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
        
        throw new Error(`AI API error: ${aiResponse.status}`);
      }
      
      const aiResult = await aiResponse.json();
      console.log('Raw AI response:', aiResult.completion);
      
      setAnalysisStatus("Processing AI response...");
      
      // Clean and parse the AI response
      let cleanedResponse = aiResult.completion;
      
      // Remove markdown code blocks
      cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Remove leading/trailing whitespace
      cleanedResponse = cleanedResponse.trim();
      
      console.log('Raw AI response:', aiResult.completion);
      console.log('Cleaned content that will be parsed:', cleanedResponse);
      
      let analysisResult;
      try {
        // First attempt: try parsing as-is
        analysisResult = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        console.error('Cleaned content that failed to parse:', cleanedResponse);
        
        // Try a more aggressive cleaning approach
        try {
          // Fix common JSON issues that break parsing
          let secondCleanAttempt = cleanedResponse
            // Fix unescaped newlines in string values
            .replace(/(?<!\\)\n/g, '\\n')
            // Fix unescaped quotes
            .replace(/(?<!\\)"/g, '\"')
            // Fix the quotes we just over-escaped at the beginning/end of values
            .replace(/":\ *\\"/g, '": "')
            .replace(/\\",/g, '",') 
            .replace(/\\"\s*}/g, '" }')
            .replace(/\\"\s*]/g, '" ]')
            // Fix escaped single quotes that don't need escaping in JSON
            .replace(/\\'/g, "'")
            // Fix any remaining double-escaped characters
            .replace(/\\\\/g, '\\')
            // Remove any remaining markdown
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();
          
          console.log('Second JSON parse attempt with content:', secondCleanAttempt);
          analysisResult = JSON.parse(secondCleanAttempt);
        } catch (secondParseError) {
          console.error('Second JSON parse attempt also failed:', secondParseError);
          
          // Final attempt: try to extract just the JSON object
          try {
            const jsonMatch = aiResult.completion.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              let finalAttempt = jsonMatch[0]
                // Fix unescaped control characters
                .replace(/[\x00-\x1F\x7F-\x9F]/g, (match: string) => {
                  switch (match) {
                    case '\n': return '\\n';
                    case '\r': return '\\r';
                    case '\t': return '\\t';
                    case '\b': return '\\b';
                    case '\f': return '\\f';
                    default: return '';
                  }
                })
                // Fix quotes that aren't properly escaped
                .replace(/"([^"]*?)\n([^"]*?)"/g, '"$1\\n$2"')
                .trim();
              
              console.log('Final JSON parse attempt with content:', finalAttempt);
              analysisResult = JSON.parse(finalAttempt);
            } else {
              throw new Error('Could not extract JSON object from response');
            }
          } catch (finalParseError) {
            console.error('Final JSON parse attempt also failed:', finalParseError);
            throw new Error('Failed to parse AI response as valid JSON');
          }
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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Monument Scanner</Text>
        <Text style={styles.subtitle}>Discover the history behind monuments and art</Text>
      </View>

      {/* Image Selection Area */}
      <View style={styles.imageSection}>
        {selectedImage ? (
          <View style={styles.selectedImageContainer}>
            <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
            <TouchableOpacity style={styles.clearButton} onPress={clearImage}>
              <X size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Sparkles size={48} color="#8B4513" />
            <Text style={styles.placeholderText}>Select an image to analyze</Text>
            <Text style={styles.placeholderSubtext}>
              Take a photo or choose from your gallery
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      {!selectedImage && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
            <CameraIcon size={24} color="#8B4513" />
            <Text style={styles.actionButtonText}>Take Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={pickImageFromGallery}>
            <ImageIcon size={24} color="#8B4513" />
            <Text style={styles.actionButtonText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Additional Info Section */}
      {selectedImage && (
        <View style={styles.additionalInfoSection}>
          <TouchableOpacity 
            style={styles.infoToggle}
            onPress={() => setShowAdditionalInfo(!showAdditionalInfo)}
          >
            <Info size={20} color="#8B4513" />
            <Text style={styles.infoToggleText}>Add Context (Optional)</Text>
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
                  value={additionalInfo.name}
                  onChangeText={(text) => updateAdditionalInfo('name', text)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Location</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Paris, France"
                  value={additionalInfo.location}
                  onChangeText={(text) => updateAdditionalInfo('location', text)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Building/Museum</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Louvre Museum"
                  value={additionalInfo.building}
                  onChangeText={(text) => updateAdditionalInfo('building', text)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Additional Notes</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Any other details that might help..."
                  value={additionalInfo.notes}
                  onChangeText={(text) => updateAdditionalInfo('notes', text)}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          )}
        </View>
      )}

      {/* Analyze Button */}
      {selectedImage && (
        <TouchableOpacity
          style={[styles.analyzeButton, isAnalyzing && styles.analyzeButtonDisabled]}
          onPress={analyzeImage}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <View style={styles.analyzingContainer}>
              <ActivityIndicator size="small" color="#FFF" />
              <Text style={styles.analyzeButtonText}>{analysisStatus}</Text>
            </View>
          ) : (
            <View style={styles.analyzeContainer}>
              <Sparkles size={24} color="#FFF" />
              <Text style={styles.analyzeButtonText}>Analyze Monument</Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Tips Section */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>Tips for Better Results</Text>
        <View style={styles.tipsList}>
          <Text style={styles.tipItem}>• Ensure good lighting and clear focus</Text>
          <Text style={styles.tipItem}>• Include the entire monument or artwork</Text>
          <Text style={styles.tipItem}>• Avoid extreme angles or reflections</Text>
          <Text style={styles.tipItem}>• Add context information for better accuracy</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFEFE',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C2C2C',
    marginBottom: 8,
    fontFamily: 'Times New Roman',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Times New Roman',
  },
  imageSection: {
    marginBottom: 30,
  },
  selectedImageContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  clearButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
  },
  placeholderContainer: {
    height: 300,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B4513',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Times New Roman',
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    fontFamily: 'Times New Roman',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 30,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8F0',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8B4513',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B4513',
    fontFamily: 'Times New Roman',
  },
  additionalInfoSection: {
    marginBottom: 30,
  },
  infoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    gap: 12,
  },
  infoToggleText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#8B4513',
    fontFamily: 'Times New Roman',
  },
  infoForm: {
    marginTop: 16,
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    fontFamily: 'Times New Roman',
  },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2C2C2C',
    fontFamily: 'Times New Roman',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  analyzeButton: {
    backgroundColor: '#8B4513',
    paddingVertical: 20,
    borderRadius: 12,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  analyzeButtonDisabled: {
    opacity: 0.7,
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
    fontWeight: '600',
    color: '#FFF',
    fontFamily: 'Times New Roman',
  },
  tipsSection: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C2C2C',
    marginBottom: 12,
    fontFamily: 'Times New Roman',
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontFamily: 'Times New Roman',
  },
});