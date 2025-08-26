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
import { useHistory } from "@/providers/HistoryProvider";
import { mockMonuments } from "@/data/mockMonuments";
import { detectMonumentsAndArt, DetectionResult } from "@/services/monumentDetectionService";
import { scanResultStore } from "@/services/scanResultStore";

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
  const { addToHistory } = useHistory();

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
      setAnalysisStatus("Analyzing monuments and art with AI...");
      const detectionResult: DetectionResult = await detectMonumentsAndArt(selectedImage, additionalInfo);
      
      console.log('Detection result:', detectionResult);
      
      // Provide feedback based on the result
      if (detectionResult.isRecognized && detectionResult.confidence > 50) {
        setAnalysisStatus("Monuments and art recognized! Finalizing...");
      } else if (detectionResult.confidence > 30) {
        setAnalysisStatus("Partial recognition, finalizing...");
      } else {
        setAnalysisStatus("Processing results...");
      }
      
      // Create a scan result from the AI detection
      const scanResult = {
        id: Date.now().toString(),
        name: detectionResult.artworkName,
        location: detectionResult.location,
        country: detectionResult.country,
        period: detectionResult.period,
        description: detectionResult.description,
        significance: detectionResult.significance,
        facts: detectionResult.facts,
        image: selectedImage, // Use the scanned image as the main image
        scannedImage: selectedImage,
        scannedAt: new Date().toISOString(),
        confidence: detectionResult.confidence,
        isRecognized: detectionResult.isRecognized,
        detailedDescription: detectionResult.detailedDescription,
      };
      
      // Only add to history if monument is recognized
      if (scanResult.isRecognized && scanResult.confidence && scanResult.confidence > 50) {
        await addToHistory(scanResult);
      }
      setIsAnalyzing(false);
      setAnalysisStatus("");
      setSelectedImage(null);
      
      // Store the result and navigate with just the ID
      try {
        const resultId = scanResultStore.store(scanResult);
        console.log('Stored scan result with ID:', resultId);
        
        // Use replace instead of push to avoid history stack issues
        router.replace({
          pathname: "/scan-result" as any,
          params: { 
            resultId: resultId
          },
        });
      } catch (navError) {
        console.error('Navigation error:', navError);
        // Fallback: try to navigate without params
        router.replace("/scan-result" as any);
      }
      
    } catch (error) {
      console.error('Error analyzing image:', error);
      setAnalysisStatus("Analysis failed, creating basic result...");
      
      // Create a basic result instead of random mock data
      const scanResult = {
        id: Date.now().toString(),
        name: "Unknown Monuments and Art",
        location: "Unknown",
        country: "Unknown",
        period: "Unknown",
        description: "Unable to analyze these monuments and art. The AI service may be temporarily unavailable or the image may not contain recognizable pieces.",
        significance: "Analysis failed due to technical issues or unrecognized monuments and art.",
        facts: [
          "Please try again with a clearer photo",
          "Ensure the monuments and art are clearly visible in the image",
          "Check your internet connection",
          "Try adding more context in the additional info section"
        ],
        image: selectedImage,
        scannedImage: selectedImage,
        scannedAt: new Date().toISOString(),
        confidence: 0,
        isRecognized: false,
      };
      
      // Only add to history if monument is recognized
      if (scanResult.isRecognized && scanResult.confidence && scanResult.confidence > 50) {
        await addToHistory(scanResult);
      }
      setIsAnalyzing(false);
      setAnalysisStatus("");
      setSelectedImage(null);
      
      // Store the result and navigate with just the ID
      try {
        const resultId = scanResultStore.store(scanResult);
        console.log('Stored scan result with ID:', resultId);
        
        // Use replace instead of push to avoid history stack issues
        router.replace({
          pathname: "/scan-result" as any,
          params: { 
            resultId: resultId
          },
        });
      } catch (navError) {
        console.error('Navigation error:', navError);
        // Fallback: try to navigate without params
        router.replace("/scan-result" as any);
      }
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setShowAdditionalInfo(false);
    setAdditionalInfo({
      name: "",
      location: "",
      building: "",
      notes: "",
    });
  };

  const toggleAdditionalInfo = () => {
    setShowAdditionalInfo(!showAdditionalInfo);
  };

  const updateAdditionalInfo = (field: keyof typeof additionalInfo, value: string) => {
    setAdditionalInfo(prev => ({ ...prev, [field]: value }));
  };



  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {selectedImage ? (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: selectedImage }} style={styles.previewImage} />
          <TouchableOpacity style={styles.clearButton} onPress={clearImage}>
            <X size={20} color="#ffffff" />
          </TouchableOpacity>
          
          {/* Additional Info Section */}
          <View style={styles.additionalInfoSection}>
            <TouchableOpacity 
              style={styles.additionalInfoToggle} 
              onPress={toggleAdditionalInfo}
            >
              <View style={styles.additionalInfoHeader}>
                <Info size={16} color="#4f46e5" />
                <Text style={styles.additionalInfoTitle}>
                  Add context for better accuracy
                </Text>
              </View>
              {showAdditionalInfo ? (
                <ChevronUp size={20} color="#64748b" />
              ) : (
                <ChevronDown size={20} color="#64748b" />
              )}
            </TouchableOpacity>
            
            {showAdditionalInfo && (
              <View style={styles.additionalInfoForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Monuments and Art Name</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g., Mona Lisa, David, Eiffel Tower"
                    value={additionalInfo.name}
                    onChangeText={(text) => updateAdditionalInfo('name', text)}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Location</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g., Paris, France or Central Park, NYC"
                    value={additionalInfo.location}
                    onChangeText={(text) => updateAdditionalInfo('location', text)}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Building/Museum/Gallery</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g., Louvre Museum, Uffizi Gallery, St. Peter's Basilica"
                    value={additionalInfo.building}
                    onChangeText={(text) => updateAdditionalInfo('building', text)}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Additional Notes</Text>
                  <TextInput
                    style={[styles.textInput, styles.textInputMultiline]}
                    placeholder="Any other details that might help..."
                    value={additionalInfo.notes}
                    onChangeText={(text) => updateAdditionalInfo('notes', text)}
                    placeholderTextColor="#94a3b8"
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>
            )}
          </View>
          
          <TouchableOpacity
            style={[styles.analyzeButton, isAnalyzing && styles.analyzeButtonDisabled]}
            onPress={analyzeImage}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <ActivityIndicator color="#ffffff" size="small" />
                <Text style={styles.analyzeButtonText}>
                  {analysisStatus || "Analyzing..."}
                </Text>
              </>
            ) : (
              <>
                <Sparkles size={20} color="#ffffff" />
                <Text style={styles.analyzeButtonText}>Analyze Monuments and Art (~15s)</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.mainContainer}>
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>Snap into heritage</Text>
            <Text style={styles.mainSubtitle}>
              Discover the living stories of art and monuments
            </Text>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.scanButton, styles.photoButton]} 
              onPress={takePhoto}
            >
              <View style={styles.buttonIconContainer}>
                <CameraIcon size={28} color="#ffffff" />
              </View>
              <Text style={styles.buttonText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.scanButton, styles.galleryButton]} 
              onPress={pickImageFromGallery}
            >
              <View style={styles.buttonIconContainer}>
                <ImageIcon size={28} color="#334155" />
              </View>
              <Text style={[styles.buttonText, styles.galleryButtonText]}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2C3E50",
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  mainContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 80,
  },
  mainTitle: {
    fontSize: 42,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "400",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  mainSubtitle: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontStyle: "italic",
    color: "rgba(255, 255, 255, 0.95)",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 320,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  buttonContainer: {
    width: "100%",
    gap: 20,
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 52,
  },
  photoButton: {
    backgroundColor: "rgba(139, 69, 19, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  galleryButton: {
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderWidth: 1,
    borderColor: "rgba(139, 69, 19, 0.1)",
  },
  buttonIconContainer: {
    marginRight: 12,
  },
  buttonText: {
    fontSize: 15,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  galleryButtonText: {
    color: "#334155",
    fontWeight: "500",
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
  },
  imagePreviewContainer: {
    margin: 20,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  previewImage: {
    width: screenWidth - 40,
    height: (screenWidth - 40) * 0.75,
    resizeMode: "cover",
  },
  clearButton: {
    position: "absolute",
    top: 15,
    right: 15,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 20,
    padding: 8,
  },
  analyzeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8B4513",
    paddingVertical: 18,
    gap: 10,
  },
  analyzeButtonDisabled: {
    opacity: 0.7,
  },
  analyzeButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
  },
  additionalInfoSection: {
    backgroundColor: "#f8fafc",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  additionalInfoToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  additionalInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  additionalInfoTitle: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "400",
    color: "#475569",
  },
  additionalInfoForm: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
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
    fontWeight: "400",
    color: "#374151",
  },
  textInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
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
});