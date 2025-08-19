import React, { useState, useRef } from "react";
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
  ImageBackground,
  TextInput,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera as CameraIcon, Image as ImageIcon, X, Sparkles, MapPin, Clock, ChevronDown, ChevronUp, Info } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useHistory } from "@/providers/HistoryProvider";
import { mockMonuments } from "@/data/mockMonuments";
import { detectMonument, DetectionResult } from "@/services/monumentDetectionService";
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
      setAnalysisStatus("Analyzing with AI...");
      const detectionResult: DetectionResult = await detectMonument(selectedImage, additionalInfo);
      
      console.log('Detection result:', detectionResult);
      
      setAnalysisStatus("Processing results...");
      
      // Create a scan result from the AI detection
      const scanResult = {
        id: Date.now().toString(),
        name: detectionResult.monumentName,
        location: detectionResult.location,
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
      
      await addToHistory(scanResult);
      setIsAnalyzing(false);
      setAnalysisStatus("");
      setSelectedImage(null);
      
      // Store the result and navigate with just the ID
      try {
        const resultId = scanResultStore.store(scanResult);
        console.log('Stored scan result with ID:', resultId);
        
        // Use replace instead of push to avoid history stack issues
        router.replace({
          pathname: "/(tabs)/scan-result" as any,
          params: { 
            resultId: resultId
          },
        });
      } catch (navError) {
        console.error('Navigation error:', navError);
        // Fallback: try to navigate without params
        router.replace("/(tabs)/scan-result" as any);
      }
      
    } catch (error) {
      console.error('Error analyzing image:', error);
      setAnalysisStatus("Analysis failed, using fallback...");
      
      // Fallback to mock data if AI fails
      const randomMonument = mockMonuments[Math.floor(Math.random() * mockMonuments.length)];
      const scanResult = {
        ...randomMonument,
        scannedImage: selectedImage,
        scannedAt: new Date().toISOString(),
        confidence: 60,
        isRecognized: false,
      };
      
      await addToHistory(scanResult);
      setIsAnalyzing(false);
      setAnalysisStatus("");
      setSelectedImage(null);
      
      // Store the result and navigate with just the ID
      try {
        const resultId = scanResultStore.store(scanResult);
        console.log('Stored scan result with ID:', resultId);
        
        // Use replace instead of push to avoid history stack issues
        router.replace({
          pathname: "/(tabs)/scan-result" as any,
          params: { 
            resultId: resultId
          },
        });
      } catch (navError) {
        console.error('Navigation error:', navError);
        // Fallback: try to navigate without params
        router.replace("/(tabs)/scan-result" as any);
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

  const collageImages = [
    "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=300&h=300&fit=crop", // Colosseum
    "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=300&h=300&fit=crop", // Machu Picchu
    "https://images.unsplash.com/photo-1549144511-f099e773c147?w=300&h=300&fit=crop", // Eiffel Tower
    "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=300&h=300&fit=crop", // Statue of Liberty
    "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=300&h=300&fit=crop", // Big Ben
    "https://images.unsplash.com/photo-1471919743851-c4df8b6ee133?w=300&h=300&fit=crop", // Taj Mahal
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop", // Parthenon
    "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=300&h=300&fit=crop", // Christ the Redeemer
  ];

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
                  <Text style={styles.inputLabel}>Monument/Art Name</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g., Statue of Liberty, Eiffel Tower"
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
                  <Text style={styles.inputLabel}>Building/Museum</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g., Louvre Museum, St. Peter's Basilica"
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
                <Text style={styles.analyzeButtonText}>Analyze Monument</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.mainContainer}>
          {/* Collage Background */}
          <View style={styles.collageContainer}>
            <View style={styles.collageGrid}>
              {collageImages.map((imageUri, index) => (
                <View key={index} style={[
                  styles.collageItem,
                  index % 2 === 0 ? styles.collageItemEven : styles.collageItemOdd
                ]}>
                  <Image 
                    source={{ uri: imageUri }} 
                    style={styles.collageImage}
                  />
                  <View style={[
                    styles.collageOverlay,
                    index % 2 === 0 ? styles.overlayBlue : styles.overlayWhite
                  ]} />
                </View>
              ))}
            </View>
            
            {/* Main overlay with gradient */}
            <LinearGradient
              colors={[
                "rgba(51, 65, 85, 0.4)",
                "rgba(51, 65, 85, 0.7)",
                "rgba(51, 65, 85, 0.9)"
              ]}
              style={styles.mainOverlay}
            />
          </View>
          
          {/* Content over collage */}
          <View style={styles.contentOverlay}>
            <View style={styles.titleSection}>
              <Text style={styles.mainTitle}>Snap into history</Text>
              <Text style={styles.mainSubtitle}>
                step into the living stories of art and monuments
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
                <Text style={styles.buttonText}>Scan from Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.scanButton, styles.galleryButton]} 
                onPress={pickImageFromGallery}
              >
                <View style={styles.buttonIconContainer}>
                  <ImageIcon size={28} color="#334155" />
                </View>
                <Text style={[styles.buttonText, styles.galleryButtonText]}>Scan from Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#334155",
  },
  contentContainer: {
    paddingBottom: 30,
  },
  mainContainer: {
    flex: 1,
    position: "relative",
  },
  collageContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  collageGrid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  collageItem: {
    width: "25%",
    height: screenHeight / 6,
    position: "relative",
  },
  collageItemEven: {
    backgroundColor: "#334155",
  },
  collageItemOdd: {
    backgroundColor: "#ffffff",
  },
  collageImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  collageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayBlue: {
    backgroundColor: "rgba(51, 65, 85, 0.6)",
  },
  overlayWhite: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
  },
  mainOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  contentOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    zIndex: 10,
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 60,
  },
  mainTitle: {
    fontSize: 48,
    fontWeight: "900",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  mainSubtitle: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 26,
    maxWidth: 300,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  buttonContainer: {
    width: "100%",
    gap: 20,
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
    minHeight: 56,
  },
  photoButton: {
    backgroundColor: "rgba(79, 70, 229, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  galleryButton: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(51, 65, 85, 0.1)",
  },
  buttonIconContainer: {
    marginRight: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  galleryButtonText: {
    color: "#334155",
    fontWeight: "600",
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
    backgroundColor: "#4f46e5",
    paddingVertical: 18,
    gap: 10,
  },
  analyzeButtonDisabled: {
    opacity: 0.7,
  },
  analyzeButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
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
    fontWeight: "500",
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
    fontWeight: "500",
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
    color: "#1f2937",
  },
  textInputMultiline: {
    height: 70,
    textAlignVertical: "top",
  },
});