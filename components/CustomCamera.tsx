import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  Alert,
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
      return 'Position the monument or artwork in the square frame.';
    }
    
    switch (currentStep) {
      case 'artwork':
        return 'First, take a square photo of the artwork itself. Make sure the entire piece is visible and well-lit.';
      case 'label':
        return 'Now, take a square photo of the artwork\'s information label or placard. This helps with identification.';
      default:
        return '';
    }
  };
  


  // Check permissions
  if (!permission) {
    return (
      <View style={styles.container}>
        <View style={styles.headerOverlay}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.title}>Loading Camera</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading camera...</Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.headerOverlay}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.title}>Camera Permission</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.permissionContainer}>
          <Camera size={80} color="rgba(255, 255, 255, 0.7)" />
          <Text style={styles.permissionText}>
            We need your permission to show the camera
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View - Full Screen */}
      <CameraView 
        ref={cameraRef}
        style={styles.cameraView} 
        facing={facing}
      >
        {/* Header Overlay */}
        <View style={styles.headerOverlay}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.title}>{getStepTitle()}</Text>
          <TouchableOpacity 
            style={styles.flipButton} 
            onPress={() => setFacing(current => (current === 'back' ? 'front' : 'back'))}
          >
            <RotateCcw size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
        
        {/* Square overlay for 1:1 ratio guidance */}
        <View style={styles.cameraOverlay}>
          <View style={styles.squareFrame} />
        </View>
        
        {/* Bottom Overlay with Controls */}
        <View style={styles.bottomOverlay}>
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
          
          <Text style={styles.instructionText}>
            {getInstructionText()}
          </Text>
          
          {/* Classic Circle Capture Button */}
          <TouchableOpacity
            style={[styles.circleButton, isCapturing && styles.circleButtonDisabled]}
            onPress={takePicture}
            disabled={isCapturing}
          >
            <View style={styles.circleButtonInner}>
              {isCapturing ? (
                <View style={styles.capturingIndicator} />
              ) : (
                <View style={styles.captureIndicator} />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraView: {
    flex: 1,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 10,
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  flipButton: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  squareFrame: {
    width: screenWidth - 80,
    height: screenWidth - 80,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 50,
    paddingTop: 30,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 10,
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
    color: '#ffffff',
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
    color: '#ffffff',
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

  placeholderText: {
    fontSize: 18,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: '500',
    color: '#ffffff',
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    maxWidth: screenWidth - 40,
  },
  circleButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 4,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  circleButtonDisabled: {
    opacity: 0.6,
  },
  circleButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureIndicator: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.accent.secondary,
  },
  capturingIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ef4444',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
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
    color: 'rgba(255, 255, 255, 0.7)',
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
  placeholder: {
    width: 40,
  },
});