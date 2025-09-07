import React, { useState, useEffect } from "react";
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
import * as ImageManipulator from "expo-image-manipulator";
import { Camera as CameraIcon, Image as ImageIcon, X, Sparkles, ChevronDown, ChevronUp, Info, Zap, Camera } from "lucide-react-native";
import Logo from "@/components/Logo";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { mockMonuments } from "@/data/mockMonuments";
import Colors from "@/constants/colors";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function ScannerScreen() {
  const { reanalyzeImage, showContext } = useLocalSearchParams();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string>("");
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [scanMode, setScanMode] = useState<'city' | 'museum'>('city');
  const [labelImage, setLabelImage] = useState<string | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState({
    context: "",
  });

  // Handle reanalysis flow
  useEffect(() => {
    if (reanalyzeImage && typeof reanalyzeImage === 'string') {
      setSelectedImage(reanalyzeImage);
      if (showContext === 'true') {
        setShowAdditionalInfo(true);
      }
    }
  }, [reanalyzeImage, showContext]);

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
      quality: 0.6,
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
      quality: 0.6,
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
      setAnalysisStatus("Compressing image...");
      
      // Compress image to reduce size for API
      const compressedImage = await ImageManipulator.manipulateAsync(
        selectedImage,
        [
          // Resize to max 1024px on longest side to reduce file size
          { resize: { width: 1024 } }
        ],
        {
          compress: 0.7, // 70% quality
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true
        }
      );
      
      if (!compressedImage.base64) {
        throw new Error('Failed to compress image');
      }
      
      const base64 = compressedImage.base64;
      
      setAnalysisStatus("Image compressed successfully...");

      setAnalysisStatus("Analyzing monuments and art with AI...");
      
      // Validate base64 data
      if (!base64 || base64.length === 0) {
        throw new Error('Invalid image data: base64 is empty');
      }
      
      // Check if compressed base64 is still too large (limit to ~1MB for better compatibility)
      if (base64.length > 1000000) {
        console.log('Image still too large after compression, applying additional compression...');
        
        // Apply more aggressive compression
        const furtherCompressed = await ImageManipulator.manipulateAsync(
          selectedImage,
          [
            { resize: { width: 800 } }
          ],
          {
            compress: 0.5, // 50% quality
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true
          }
        );
        
        if (!furtherCompressed.base64) {
          throw new Error('Failed to compress image further');
        }
        
        const finalBase64 = furtherCompressed.base64;
        
        // Final check - if still too large, throw error
        if (finalBase64.length > 1000000) {
          throw new Error('Image is too large even after compression. Please use a smaller image.');
        }
        
        // Use the further compressed image
        console.log('Using further compressed image. Final size:', finalBase64.length, 'characters');
        
        // Update base64 variable for the rest of the function
        const base64Final = finalBase64;
        
        // Continue with the compressed image
        await processImageAnalysis(base64Final);
        return;
      }
      
      // Continue with normally compressed image
      await processImageAnalysis(base64);
      
    } catch (error) {
      console.error('Error detecting monuments and art:', error);
      
      let errorMessage = 'Failed to analyze the image. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('too large')) {
          errorMessage = 'Image is too large. Please use a smaller image or reduce quality.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('JSON')) {
          errorMessage = 'There was an issue processing the AI response. Please try again.';
        } else if (error.message.includes('Invalid image')) {
          errorMessage = 'Invalid image format. Please select a different image.';
        } else if (error.message.includes('compress')) {
          errorMessage = 'Failed to process the image. Please try with a different image.';
        }
      }
      
      Alert.alert('Analysis Failed', errorMessage);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStatus("");
    }
  };
  
  const processImageAnalysis = async (base64: string) => {
      // Build the prompt
      let promptText = `Analyze this image and identify any monuments and art including sculptures, paintings, or cultural landmarks. Include paintings that depict buildings/landmarks (identify the PAINTING, not the depicted structure).

BE EXTREMELY CONSERVATIVE with identification. Many sculptures, buildings, and artworks share similar themes, poses, or subjects but are completely different works. Only identify a specific monument/artwork if you are 95% or more confident it is that exact piece.

For recognition (isRecognized: true), confidence must be 95% or higher. Be ESPECIALLY conservative with:
- Local, regional, or smaller monuments that may look similar to famous ones
- Religious sculptures, statues, or buildings with common iconography
- Sculptures with common poses, themes, or subjects (angels, saints, warriors, etc.)
- Buildings with similar architectural styles from the same period
- Artworks with similar subjects, compositions, or artistic styles
- Churches, chapels, and religious buildings that often share similar designs
- Memorial statues and commemorative monuments

When in doubt, mark as NOT RECOGNIZED. It's better to provide general analysis than incorrect identification. If you see common religious iconography, architectural elements, or artistic themes, do NOT assume it's a specific famous work unless you are absolutely certain.

If confidence is below 95%, mark as not recognized and provide general analysis instead.`;
      
      // Add scan mode context
      if (scanMode === 'museum') {
        promptText += `\n\n**MUSEUM CONTEXT - This image was taken inside a museum or gallery. This significantly increases the likelihood that this is a notable artwork or cultural artifact. Pay special attention to:**\n- Famous paintings, sculptures, and artworks\n- Museum pieces and gallery collections\n- Historical artifacts and cultural objects\n- Well-documented artworks with known provenance`;
      } else {
        promptText += `\n\n**CITY CONTEXT - This image was taken in an urban/outdoor setting. Focus on:**\n- Public monuments and statues\n- Architectural landmarks\n- Street art and public installations\n- Historical buildings and structures`;
      }
      
      // Add additional context if provided
      const hasAdditionalInfo = additionalInfo.context.trim().length > 0;
      if (hasAdditionalInfo) {
        promptText += `\n\n**CRITICAL USER CONTEXT - PRIORITIZE THIS INFORMATION HEAVILY:**\n"${additionalInfo.context}"\n\nWith this context provided, you should:\n1. STRONGLY prioritize monuments and art that match any location, name, or details mentioned\n2. If the visual matches reasonably well with the provided context, increase confidence significantly\n3. Use any names, locations, museums, or other details mentioned as key identifying factors\n4. Consider all provided information as important context clues for identification`;
      }
      
      promptText += `\n\nProvide ALL information in ONE response. Only mark isRecognized as true if confidence is 95% or higher. Always provide the ACTUAL location, not user's location unless they match. If not 95% confident, provide general analysis of what you see without claiming specific identification.

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
  "inDepthContext": "Write exactly 3 condensed paragraphs (around 1000 characters total) about [TOPIC]. Separate paragraphs with double line breaks only. Use bold highlights for key terms. Be specific and interesting, avoid generalizations. Start in medias res with an anecdote or striking detail so it feels like a story.\n* First paragraph: Focus on historical origins, creation context, artist/architect background, and period significance with specific dates and historical context.\n* Second paragraph: Visually guide the reader across the artwork/monument — describe it step by step (from top to bottom, left to right, or foreground to background). Detail artistic/architectural elements, materials used, techniques, style characteristics, dimensions, and unique features as if the reader is standing in front of it.\n* Third paragraph: Discuss cultural impact, significance over the years, and notable events or stories associated with it. Keep the tone vivid, narrative, and engaging, while remaining concise.",
  "curiosities": "ONE interesting anecdote, lesser-known fact, or unusual story. If none are known, write 'No widely known curiosities are associated with these monuments and art.'"
}
}

CRITICAL: The keyTakeaways array MUST contain exactly 4 bullet points. Each bullet point should be a complete, informative sentence about the monument/artwork. The curiosities field should contain only ONE curiosity, not multiple. Ensure all text is properly escaped for JSON.`;
      
      // Call the AI API with proper error handling
      console.log('Making AI API request...');
      console.log('Prompt length:', promptText.length, 'characters');
      console.log('Base64 length:', base64.length, 'characters');
      
      setAnalysisStatus("Sending to AI for analysis...");
      
      // Validate prompt length (API might have limits)
      if (promptText.length > 16000) {
        console.warn('Prompt is very long, truncating...');
        promptText = promptText.substring(0, 15000) + '\n\nRespond in the exact JSON format specified above.';
      }
      
      // Prepare content array with main image
      const contentArray: Array<{ type: 'text'; text: string } | { type: 'image'; image: string }> = [
        { type: 'text', text: promptText },
        { type: 'image', image: base64 }
      ];
      
      // Add label image if provided (museum mode)
      if (scanMode === 'museum' && labelImage) {
        try {
          setAnalysisStatus("Processing label image...");
          const compressedLabel = await ImageManipulator.manipulateAsync(
            labelImage,
            [{ resize: { width: 800 } }],
            {
              compress: 0.7,
              format: ImageManipulator.SaveFormat.JPEG,
              base64: true
            }
          );
          
          if (compressedLabel.base64) {
            contentArray.push({ 
              type: 'text', 
              text: '\n\n**LABEL/PLACARD IMAGE - This shows the museum label or information placard for the artwork. Use this to identify the piece name, artist, date, and other details:**' 
            });
            contentArray.push({ type: 'image', image: compressedLabel.base64 });
          }
        } catch (labelError) {
          console.warn('Failed to process label image:', labelError);
        }
      }
      
      const requestBody = {
        messages: [
          {
            role: 'user',
            content: contentArray
          }
        ]
      };
      
      console.log('Request body size:', JSON.stringify(requestBody).length, 'characters');
      console.log('Sending request to AI API...');
      
      const aiResponse = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('AI API response status:', aiResponse.status);
      
      if (!aiResponse.ok) {
        let errorText = 'Unknown error';
        let errorDetails = '';
        
        try {
          const responseText = await aiResponse.text();
          errorText = responseText || `HTTP ${aiResponse.status}`;
          errorDetails = responseText;
          console.log('AI API error response body:', responseText);
        } catch (e) {
          console.error('Failed to read error response:', e);
          errorText = `HTTP ${aiResponse.status} ${aiResponse.statusText}`;
        }
        
        console.error('AI API error status:', aiResponse.status);
        console.error('AI API error status text:', aiResponse.statusText);
        console.error('AI API error response body:', errorDetails);
        console.error('Request details - Prompt length:', promptText.length, 'Base64 length:', base64.length);
        
        // Check if it's a size-related error
        if (aiResponse.status === 413 || aiResponse.status === 500) {
          console.log('Likely image size issue, suggesting compression');
          Alert.alert(
            'Image Too Large', 
            'The image is too large for analysis. Please try with a smaller image or take a new photo with lower quality.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        // Always provide a fallback response for other errors
        console.log('AI service error, using fallback response');
        setAnalysisStatus("The AI analysis service is temporarily unavailable. Please try again shortly.");
        
        // Create a fallback analysis result
        const fallbackResult = {
          artworkName: "Monument or Artwork",
          confidence: 50,
          location: "Location Unknown",
          period: "Unknown",
          isRecognized: false,
          detailedDescription: {
            keyTakeaways: [
              "The AI analysis service is currently experiencing technical difficulties.",
              "This could be due to high server load or temporary maintenance.",
              "Please try scanning again in a few moments.",
              "Adding context information may help improve results when the service is restored."
            ],
            inDepthContext: "The AI analysis service is temporarily unavailable due to technical issues. This is likely a temporary problem that should resolve shortly.\n\nWhile we work to restore full service, you can try again in a few minutes. For better results when the service is restored, consider adding context information such as the monument's name, location, or museum.\n\nWe apologize for the inconvenience and appreciate your patience.",
            curiosities: "Service temporarily unavailable - please try again shortly."
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
  };

  const clearImage = () => {
    setSelectedImage(null);
    setLabelImage(null);
    setAdditionalInfo({
      context: "",
    });
  };

  const pickLabelImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Please allow access to your photo library to select images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 4], // Wide aspect ratio for labels
      quality: 0.6,
    });

    if (!result.canceled && result.assets[0]) {
      setLabelImage(result.assets[0].uri);
    }
  };

  const takeLabelPhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Please allow access to your camera to take photos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 4], // Wide aspect ratio for labels
      quality: 0.6,
    });

    if (!result.canceled && result.assets[0]) {
      setLabelImage(result.assets[0].uri);
    }
  };

  const clearLabelImage = () => {
    setLabelImage(null);
  };

  const updateAdditionalInfo = (value: string) => {
    setAdditionalInfo({ context: value });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <Logo size={100} />
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Snap into heritage</Text>
            <Text style={styles.headerSubtitle}>
              Discover the living stories of art and monuments
            </Text>
          </View>
        </View>

        {/* Scan Mode Toggle */}
        <View style={styles.section}>
          <View style={styles.modeToggleContainer}>
            <TouchableOpacity 
              style={[styles.modeButton, scanMode === 'city' && styles.modeButtonActive]}
              onPress={() => setScanMode('city')}
            >
              <Text style={[styles.modeButtonText, scanMode === 'city' && styles.modeButtonTextActive]}>City</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modeButton, scanMode === 'museum' && styles.modeButtonActive]}
              onPress={() => setScanMode('museum')}
            >
              <Text style={[styles.modeButtonText, scanMode === 'museum' && styles.modeButtonTextActive]}>Museum</Text>
            </TouchableOpacity>
          </View>
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
                <CameraIcon size={32} color={Colors.accent.secondary} />
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
                <CameraIcon size={20} color={Colors.accent.secondary} />
                <Text style={styles.actionButtonText}>Take Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton} onPress={pickImageFromGallery}>
                <ImageIcon size={20} color={Colors.accent.secondary} />
                <Text style={styles.actionButtonText}>From Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Museum Label Image Section */}
        {selectedImage && scanMode === 'museum' && (
          <View style={styles.section}>
            <View style={styles.contextCard}>
              <View style={styles.labelHeader}>
                <View style={styles.labelHeaderLeft}>
                  <Camera size={20} color={Colors.accent.secondary} />
                  <Text style={styles.labelHeaderText}>Art Label</Text>
                  <View style={styles.requiredBadge}>
                    <Text style={styles.requiredText}>Required</Text>
                  </View>
                </View>
              </View>
              
              {labelImage ? (
                <View style={styles.labelImageContainer}>
                  <Image source={{ uri: labelImage }} style={styles.labelImage} />
                  <TouchableOpacity style={styles.clearLabelButton} onPress={clearLabelImage}>
                    <X size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.labelPlaceholder}>
                  <Text style={styles.labelPlaceholderText}>Add a photo of the artwork's label or placard</Text>
                  <View style={styles.labelButtons}>
                    <TouchableOpacity style={styles.labelButton} onPress={takeLabelPhoto}>
                      <CameraIcon size={16} color={Colors.accent.secondary} />
                      <Text style={styles.labelButtonText}>Take Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.labelButton} onPress={pickLabelImage}>
                      <ImageIcon size={16} color={Colors.accent.secondary} />
                      <Text style={styles.labelButtonText}>From Gallery</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Add Context Section - Only show in City mode OR Museum mode without label */}
        {selectedImage && (scanMode === 'city' || (scanMode === 'museum' && !labelImage)) && (
          <View style={styles.section}>
            <View style={styles.contextCard}>
              <TouchableOpacity 
                style={styles.infoToggle}
                onPress={() => setShowAdditionalInfo(!showAdditionalInfo)}
              >
                <View style={styles.infoToggleLeft}>
                  <Info size={20} color={Colors.accent.secondary} />
                  <Text style={styles.infoToggleText}>Add Context</Text>
                  <View style={styles.optionalBadge}>
                    <Text style={styles.optionalText}>Optional</Text>
                  </View>
                </View>
                {showAdditionalInfo ? (
                  <ChevronUp size={20} color={Colors.accent.secondary} />
                ) : (
                  <ChevronDown size={20} color={Colors.accent.secondary} />
                )}
              </TouchableOpacity>

              {showAdditionalInfo && (
                <View style={styles.infoForm}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Context Information</Text>
                    <Text style={styles.inputHint}>
                      {scanMode === 'museum' 
                        ? 'Add details like museum name, gallery section, or artist information'
                        : 'Add details like location, neighborhood, or landmark information'
                      }
                    </Text>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      placeholder={
                        scanMode === 'museum'
                          ? 'e.g., Metropolitan Museum of Art, European Paintings gallery, Van Gogh section...'
                          : 'e.g., Central Park NYC, Times Square, near City Hall...'
                      }
                      placeholderTextColor="#999"
                      value={additionalInfo.context}
                      onChangeText={updateAdditionalInfo}
                      multiline
                      numberOfLines={4}
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
              style={[
                styles.analyzeButton, 
                (isAnalyzing || (scanMode === 'museum' && !labelImage)) && styles.analyzeButtonDisabled
              ]}
              onPress={analyzeImage}
              disabled={isAnalyzing || (scanMode === 'museum' && !labelImage)}
            >
              {isAnalyzing ? (
                <View style={styles.analyzingContainer}>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={styles.analyzeButtonText}>{analysisStatus}</Text>
                </View>
              ) : (
                <View style={styles.analyzeContainer}>
                  <Sparkles size={20} color="#ffffff" />
                  <Text style={styles.analyzeButtonText}>
                    {scanMode === 'museum' && !labelImage 
                      ? 'Add Label Photo to Continue'
                      : 'Discover History'
                    }
                  </Text>
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
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    backgroundColor: Colors.background,
  },
  headerContainer: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 24,
    minHeight: 160,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 14,
    marginTop: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  headerContent: {
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: Colors.text.muted,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 280,
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
    color: Colors.text.muted,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: Colors.text.primary,
    marginBottom: 20,
  },
  selectedImageContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 8,
  },
  selectedImage: {
    width: '100%',
    height: 240,
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
    height: 240,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
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
    color: Colors.text.primary,
  },
  placeholderSubtext: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
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
    color: Colors.accent.secondary,
  },
  contextCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  infoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 24,
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
    color: Colors.text.primary,
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
    paddingHorizontal: 24,
    paddingBottom: 24,
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
    color: Colors.text.primary,
  },
  textInput: {
    backgroundColor: Colors.platinum,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 15,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: '#2C3E50',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: Colors.text.muted,
    marginBottom: 4,
  },
  analyzeButton: {
    backgroundColor: Colors.accent.secondary,
    borderRadius: 16,
    borderWidth: 0,
    paddingVertical: 18,
    paddingHorizontal: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
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
    fontWeight: "600",
    color: "#ffffff",
  },
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonActive: {
    backgroundColor: Colors.accent.secondary,
  },
  modeButtonText: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: Colors.text.secondary,
  },
  modeButtonTextActive: {
    color: '#ffffff',
    fontWeight: "600",
  },
  labelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  labelHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  labelHeaderText: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: Colors.text.primary,
  },
  requiredBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  requiredText: {
    fontSize: 10,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: '#ffffff',
  },
  labelImageContainer: {
    position: 'relative',
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.platinum,
  },
  labelImage: {
    width: '100%',
    height: 80,
    resizeMode: 'cover',
  },
  clearLabelButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    padding: 6,
  },
  labelPlaceholder: {
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  labelPlaceholderText: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  labelButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  labelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.platinum,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  labelButtonText: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: Colors.accent.secondary,
  },

});