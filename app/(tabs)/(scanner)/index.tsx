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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera as CameraIcon, Image as ImageIcon, X, Sparkles, MapPin, Clock } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useHistory } from "@/providers/HistoryProvider";
import { mockMonuments } from "@/data/mockMonuments";
import { detectMonument, DetectionResult } from "@/services/monumentDetectionService";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function ScannerScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string>("");
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
      const detectionResult: DetectionResult = await detectMonument(selectedImage);
      
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
      };
      
      await addToHistory(scanResult);
      setIsAnalyzing(false);
      setAnalysisStatus("");
      setSelectedImage(null);
      
      // Navigate to results with the scan result data
      router.push({
        pathname: "/(tabs)/scan-result" as any,
        params: { 
          scanData: JSON.stringify(scanResult)
        },
      });
      
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
      
      router.push({
        pathname: "/(tabs)/scan-result" as any,
        params: { 
          scanData: JSON.stringify(scanResult)
        },
      });
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
  };

  const featuredMonuments = [
    {
      id: "1",
      name: "Colosseum",
      location: "Rome, Italy",
      image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400",
      period: "72-80 AD",
    },
    {
      id: "2", 
      name: "Machu Picchu",
      location: "Peru",
      image: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=400",
      period: "1450 AD",
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {selectedImage ? (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: selectedImage }} style={styles.previewImage} />
          <TouchableOpacity style={styles.clearButton} onPress={clearImage}>
            <X size={20} color="#ffffff" />
          </TouchableOpacity>
          
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
        <>
          <ImageBackground
            source={{ uri: "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=800" }}
            style={styles.heroSection}
          >
            <LinearGradient
              colors={["rgba(51,65,85,0.3)", "rgba(30,41,59,0.8)"]}
              style={styles.heroOverlay}
            >
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>DISCOVER{"\n"}THE WORLD</Text>
                <Text style={styles.heroSubtitle}>
                  Let Monument Scanner guide you through history
                </Text>
                <TouchableOpacity style={styles.heroButton} onPress={takePhoto}>
                  <Text style={styles.heroButtonText}>Start Scanning</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </ImageBackground>

          <View style={styles.quickActionsContainer}>
            <TouchableOpacity style={styles.quickActionCard} onPress={takePhoto}>
              <View style={styles.quickActionIcon}>
                <CameraIcon size={28} color="#4f46e5" />
              </View>
              <Text style={styles.quickActionTitle}>Take Photo</Text>
              <Text style={styles.quickActionDesc}>Capture a monument</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionCard} onPress={pickImageFromGallery}>
              <View style={styles.quickActionIcon}>
                <ImageIcon size={28} color="#059669" />
              </View>
              <Text style={styles.quickActionTitle}>From Gallery</Text>
              <Text style={styles.quickActionDesc}>Choose existing photo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.featuredSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Monuments</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredScroll}
            >
              {featuredMonuments.map((monument) => (
                <TouchableOpacity key={monument.id} style={styles.featuredCard}>
                  <Image source={{ uri: monument.image }} style={styles.featuredImage} />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.8)"]}
                    style={styles.featuredOverlay}
                  >
                    <View style={styles.featuredContent}>
                      <Text style={styles.featuredName}>{monument.name}</Text>
                      <View style={styles.featuredInfo}>
                        <MapPin size={12} color="#ffffff" />
                        <Text style={styles.featuredLocation}>{monument.location}</Text>
                      </View>
                      <View style={styles.featuredInfo}>
                        <Clock size={12} color="#ffffff" />
                        <Text style={styles.featuredPeriod}>{monument.period}</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  contentContainer: {
    paddingBottom: 30,
  },
  heroSection: {
    height: screenHeight * 0.6,
    justifyContent: "flex-end",
  },
  heroOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  heroContent: {
    alignItems: "flex-start",
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: "900",
    color: "#ffffff",
    lineHeight: 48,
    marginBottom: 12,
    letterSpacing: 1,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 32,
    lineHeight: 22,
  },
  heroButton: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
  },
  heroButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  quickActionsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 30,
    gap: 15,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  quickActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  quickActionDesc: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
  },
  featuredSection: {
    marginTop: 40,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1e293b",
  },
  seeAllText: {
    fontSize: 14,
    color: "#4f46e5",
    fontWeight: "500",
  },
  featuredScroll: {
    paddingRight: 20,
  },
  featuredCard: {
    width: 280,
    height: 200,
    marginRight: 16,
    borderRadius: 20,
    overflow: "hidden",
  },
  featuredImage: {
    width: "100%",
    height: "100%",
  },
  featuredOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
    justifyContent: "flex-end",
    padding: 20,
  },
  featuredContent: {
    gap: 4,
  },
  featuredName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 8,
  },
  featuredInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  featuredLocation: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
  },
  featuredPeriod: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
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
});