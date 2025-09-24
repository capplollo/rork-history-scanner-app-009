import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  Alert,
  SafeAreaView,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { X, Camera, CheckCircle, ArrowRight } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface CustomCameraProps {
  onClose: () => void;
  onPhotoTaken: (uri: string) => void;
  onTwoPhotosTaken?: (artworkUri: string, labelUri: string) => void;
  isMuseumMode?: boolean;
}

export default function CustomCamera({ onClose, onPhotoTaken, onTwoPhotosTaken, isMuseumMode = false }: CustomCameraProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'artwork' | 'label' | 'complete'>('artwork');
  const [artworkPhoto, setArtworkPhoto] = useState<string | null>(null);
  const [labelPhoto, setLabelPhoto] = useState<string | null>(null);

  const takePicture = async () => {
    if (isCapturing) return;

    try {
      setIsCapturing(true);
      
      // Request camera permissions
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Please allow access to your camera to take photos.");
        return;
      }

      // Launch camera with appropriate aspect ratio
      const aspectRatio: [number, number] = currentStep === 'label' ? [16, 4] : [4, 3];
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: aspectRatio,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const photoUri = result.assets[0].uri;
        
        if (!isMuseumMode) {
          // Single photo mode
          onPhotoTaken(photoUri);
          return;
        }
        
        // Museum mode - two photo process
        if (currentStep === 'artwork') {
          setArtworkPhoto(photoUri);
          setCurrentStep('label');
        } else if (currentStep === 'label') {
          setLabelPhoto(photoUri);
          setCurrentStep('complete');
        }
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };
  
  const handleComplete = () => {
    if (artworkPhoto && labelPhoto && onTwoPhotosTaken) {
      onTwoPhotosTaken(artworkPhoto, labelPhoto);
    }
  };
  
  const handleRetakePhoto = (photoType: 'artwork' | 'label') => {
    if (photoType === 'artwork') {
      setArtworkPhoto(null);
      setCurrentStep('artwork');
    } else {
      setLabelPhoto(null);
      setCurrentStep('label');
    }
  };
  
  const getStepTitle = () => {
    if (!isMuseumMode) return 'Take Photo';
    
    switch (currentStep) {
      case 'artwork':
        return 'Step 1: Artwork Photo';
      case 'label':
        return 'Step 2: Label Photo';
      case 'complete':
        return 'Photos Complete';
      default:
        return 'Take Photos';
    }
  };
  
  const getInstructionText = () => {
    if (!isMuseumMode) {
      return 'Position the monument or artwork in the frame for best results';
    }
    
    switch (currentStep) {
      case 'artwork':
        return 'First, take a clear photo of the artwork itself. Make sure the entire piece is visible and well-lit.';
      case 'label':
        return 'Now, take a photo of the artwork\'s information label or placard. This helps with identification.';
      case 'complete':
        return 'Great! You\'ve captured both photos. Review them below and tap "Use Photos" to continue.';
      default:
        return '';
    }
  };
  
  const getButtonText = () => {
    if (isCapturing) return 'Opening Camera...';
    if (!isMuseumMode) return 'Open Camera';
    
    switch (currentStep) {
      case 'artwork':
        return 'Take Artwork Photo';
      case 'label':
        return 'Take Label Photo';
      case 'complete':
        return 'Use Photos';
      default:
        return 'Take Photo';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>{getStepTitle()}</Text>
          <View style={styles.placeholder} />
        </View>
        
        {isMuseumMode && currentStep === 'complete' ? (
          <View style={styles.reviewSection}>
            <View style={styles.photoReviewContainer}>
              <View style={styles.photoReviewItem}>
                <Text style={styles.photoReviewTitle}>Artwork Photo</Text>
                {artworkPhoto && (
                  <View style={styles.photoContainer}>
                    <Image source={{ uri: artworkPhoto }} style={styles.reviewPhoto} />
                    <TouchableOpacity 
                      style={styles.retakeButton}
                      onPress={() => handleRetakePhoto('artwork')}
                    >
                      <Text style={styles.retakeButtonText}>Retake</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              
              <View style={styles.photoReviewItem}>
                <Text style={styles.photoReviewTitle}>Label Photo</Text>
                {labelPhoto && (
                  <View style={styles.photoContainer}>
                    <Image source={{ uri: labelPhoto }} style={styles.reviewPhotoLabel} />
                    <TouchableOpacity 
                      style={styles.retakeButton}
                      onPress={() => handleRetakePhoto('label')}
                    >
                      <Text style={styles.retakeButtonText}>Retake</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
            
            <Text style={styles.instructionText}>
              {getInstructionText()}
            </Text>
          </View>
        ) : (
          <View style={styles.cameraPlaceholder}>
            {isMuseumMode && (
              <View style={styles.stepIndicator}>
                <View style={[styles.stepDot, currentStep === 'artwork' ? styles.stepDotActive : styles.stepDotComplete]}>
                  {currentStep === 'artwork' ? (
                    <Text style={styles.stepNumber}>1</Text>
                  ) : (
                    <CheckCircle size={16} color="#ffffff" />
                  )}
                </View>
                <View style={styles.stepLine} />
                <View style={[styles.stepDot, currentStep === 'label' ? styles.stepDotActive : (currentStep === 'complete' ? styles.stepDotComplete : styles.stepDotInactive)]}>
                  {currentStep === 'complete' ? (
                    <CheckCircle size={16} color="#ffffff" />
                  ) : (
                    <Text style={[styles.stepNumber, currentStep !== 'label' && styles.stepNumberInactive]}>2</Text>
                  )}
                </View>
              </View>
            )}
            
            <Camera size={80} color={Colors.text.muted} />
            <Text style={styles.placeholderText}>
              Tap the button below to open your camera
            </Text>
            <Text style={styles.instructionText}>
              {getInstructionText()}
            </Text>
          </View>
        )}
        
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
            onPress={currentStep === 'complete' ? handleComplete : takePicture}
            disabled={isCapturing}
          >
            {currentStep === 'complete' ? (
              <ArrowRight size={24} color="#ffffff" />
            ) : (
              <Camera size={24} color="#ffffff" />
            )}
            <Text style={styles.captureButtonText}>
              {getButtonText()}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: '600',
    color: Colors.text.primary,
  },
  placeholder: {
    width: 32,
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 20,
  },
  placeholderText: {
    fontSize: 18,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: '500',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  instructionText: {
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
  bottomSection: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  captureButton: {
    backgroundColor: Colors.accent.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    minWidth: 200,
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureButtonText: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: '500',
    color: '#ffffff',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: Colors.accent.secondary,
  },
  stepDotComplete: {
    backgroundColor: '#10b981',
  },
  stepDotInactive: {
    backgroundColor: Colors.border,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  stepNumber: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: '600',
    color: '#ffffff',
  },
  stepNumberInactive: {
    color: Colors.text.muted,
  },
  reviewSection: {
    flex: 1,
    paddingVertical: 20,
  },
  photoReviewContainer: {
    gap: 20,
    marginBottom: 30,
  },
  photoReviewItem: {
    alignItems: 'center',
  },
  photoReviewTitle: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  photoContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  reviewPhoto: {
    width: 200,
    height: 150,
    resizeMode: 'cover',
  },
  reviewPhotoLabel: {
    width: 200,
    height: 50,
    resizeMode: 'cover',
  },
  retakeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  retakeButtonText: {
    fontSize: 12,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: '500',
    color: '#ffffff',
  },
});