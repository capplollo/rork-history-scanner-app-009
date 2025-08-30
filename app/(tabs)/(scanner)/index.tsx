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
      setAnalysisStatus("Analyzing monuments and art with AI...");
      
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setAnalysisStatus("Monuments and art recognized! Finalizing...");
      
      // Simulate finalization
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get a random mock monument for demo
      const randomMonument = mockMonuments[Math.floor(Math.random() * mockMonuments.length)];
      
      // Navigate to scan result with mock data
      router.push({
        pathname: "/scan-result" as any,
        params: {
          monumentId: randomMonument.id,
          monumentName: randomMonument.name,
          location: randomMonument.location,
          period: randomMonument.period,
          scannedImage: selectedImage,
        },
      });
      
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert('Analysis Failed', 'Failed to analyze the image. Please try again.');
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