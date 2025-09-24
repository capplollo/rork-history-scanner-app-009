import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  Alert,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { X, Camera, CheckCircle, RotateCcw } from 'lucide-react-native';
import Colors from '@/constants/colors';

const { width: screenWidth } = Dimensions.get('window');

interface CustomCameraProps {
  onClose: () => void;
  onPhotoTaken: (uri: string) => void;
  onTwoPhotosTaken?: (artworkUri: string, labelUri: string) => void;
  isMuseumMode?: boolean;
}

export default function CustomCamera({ onClose, onPhotoTaken, onTwoPhotosTaken, isMuseumMode = false }: CustomCameraProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'artwork' | 'label'>('artwork');
  const [artworkPhoto, setArtworkPhoto] = useState<string | null>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const takePicture = async () => {
    if (isCapturing || !cameraRef.current) return;

    try {
      setIsCapturing(true);
      
      // Take photo with camera
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (!photo) {
        throw new Error('Failed to capture photo');
      }
      
      console.log('Photo captured successfully:', photo.uri);

      // Crop to 1:1 aspect ratio and resize to 1024x1024 for all photos
      const croppedPhoto = await ImageManipulator.manipulateAsync(
        photo.uri,
        [
          {
            crop: {
              originX: 0,
              originY: (photo.height - photo.width) / 2,
              width: photo.width,
              height: photo.width, // Make it square (1:1)
            },
          },
          {
            resize: {
              width: 1024,
              height: 1024,
            },
          },
        ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      const photoUri = croppedPhoto.uri;
      
      if (!isMuseumMode) {
        // Single photo mode - directly import
        onPhotoTaken(photoUri);
        return;
      }
      
      // Museum mode - two photo process
      if (currentStep === 'artwork') {
        setArtworkPhoto(photoUri);
        setCurrentStep('label');
      } else if (currentStep === 'label') {
        // Directly import both photos without review
        if (artworkPhoto && onTwoPhotosTaken) {
          onTwoPhotosTaken(artworkPhoto, photoUri);
        }
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };
  

  
  const getStepTitle = () => {
    if (!isMuseumMode) return 'Take Photo';
    
    switch (currentStep) {
      case 'artwork':
        return 'Step 1: Artwork Photo';
      case 'label':
        return 'Step 2: Label Photo';
      default:
        return 'Take Photos';
    }
  };
  
  const getInstructionText = () => {
    if (!isMuseumMode) {
      return 'Position the monument or artwork in the square frame. The photo will be cropped to 1:1 ratio and compressed to 1024x1024 pixels.';
    }
    
    switch (currentStep) {
      case 'artwork':
        return 'First, take a square photo of the artwork itself. Make sure the entire piece is visible and well-lit. Photo will be compressed to 1024x1024 pixels.';
      case 'label':
        return 'Now, take a square photo of the artwork\'s information label or placard. This helps with identification. Photo will be compressed to 1024x1024 pixels.';
      default:
        return '';
    }
  };
  
  const getButtonText = () => {
    if (isCapturing) return 'Capturing...';
    if (!isMuseumMode) return 'Capture Photo';
    
    switch (currentStep) {
      case 'artwork':
        return 'Take Artwork Photo';
      case 'label':
        return 'Take Label Photo';
      default:
        return 'Capture Photo';
    }
  };

  // Check permissions
  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={Colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>Loading Camera</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading camera...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={Colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>Camera Permission</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.permissionContainer}>
            <Camera size={80} color={Colors.text.muted} />
            <Text style={styles.permissionText}>
              We need your permission to show the camera
            </Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>{getStepTitle()}</Text>
          <TouchableOpacity 
            style={styles.flipButton} 
            onPress={() => setFacing(current => (current === 'back' ? 'front' : 'back'))}
          >
            <RotateCcw size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.cameraContainer}>
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
                <View style={[styles.stepDot, currentStep === 'label' ? styles.stepDotActive : styles.stepDotInactive]}>
                  <Text style={[styles.stepNumber, currentStep !== 'label' && styles.stepNumberInactive]}>2</Text>
                </View>
              </View>
            )}
            
            <View style={styles.cameraViewContainer}>
              <CameraView 
                ref={cameraRef}
                style={styles.cameraView} 
                facing={facing}
              >
                {/* Square overlay for 1:1 ratio guidance */}
                <View style={styles.cameraOverlay}>
                  <View style={styles.squareFrame} />
                </View>
              </CameraView>
            </View>
            
            <Text style={styles.instructionText}>
              {getInstructionText()}
            </Text>
        </View>
        
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
            onPress={takePicture}
            disabled={isCapturing}
          >
            <Camera size={24} color="#ffffff" />
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
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 20,
  },
  cameraViewContainer: {
    width: screenWidth - 40,
    height: (screenWidth - 40) * 1.25, // 25% taller to show more environment
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  cameraView: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  squareFrame: {
    width: screenWidth - 80,
    height: screenWidth - 80,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: Colors.text.muted,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 20,
  },
  permissionText: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: Colors.text.primary,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: Colors.accent.secondary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: '500',
    color: '#ffffff',
  },
  flipButton: {
    padding: 8,
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
    width: 150,
    height: 150,
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