import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Platform,
  Dimensions,
  Alert,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, X, Download, Share2, Instagram, Camera } from 'lucide-react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { HistoryItem } from '@/providers/HistoryProvider';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth * 0.85;
const cardHeight = cardWidth * 1.2; // Instagram story ratio

interface SocialShareCardProps {
  item: HistoryItem;
  visible: boolean;
  onClose: () => void;
}

export default function SocialShareCard({ item, visible, onClose }: SocialShareCardProps) {
  const viewShotRef = useRef<ViewShot>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [, setMediaPermission] = useState<MediaLibrary.PermissionResponse | null>(null);

  // Format period to show only years/centuries
  const formatPeriod = (period: string) => {
    if (!period) return '';
    let formatted = period
      .replace(/artistic period/gi, '')
      .replace(/\bperiod\b/gi, '')
      .replace(/^[^,]*,\s*/, '')
      .replace(/^.*?\b(\d{1,2}th century)/i, '$1')
      .replace(/^.*?(\d{4}[\s-]*\d{0,4})/i, '$1')
      .replace(/^.*?(\d{1,4}\s*(?:BC|AD))/i, '$1')
      .trim();
    return formatted || period;
  };

  // Format location to show only city and state/country
  const formatLocation = (location: string) => {
    if (!location) return '';
    const formatted = location
      .replace(/.*Museum.*?,\s*/gi, '')
      .replace(/.*Gallery.*?,\s*/gi, '')
      .replace(/.*Church.*?,\s*/gi, '')
      .replace(/.*Cathedral.*?,\s*/gi, '')
      .replace(/.*Palace.*?,\s*/gi, '')
      .replace(/.*Castle.*?,\s*/gi, '')
      .replace(/.*Basilica.*?,\s*/gi, '')
      .replace(/.*Temple.*?,\s*/gi, '')
      .trim();
    return formatted || location;
  };

  const requestMediaPermission = async () => {
    if (Platform.OS === 'web') return true;
    
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      setMediaPermission(permission);
      return permission.granted;
    } catch (error) {
      console.error('Error requesting media permission:', error);
      return false;
    }
  };

  const captureAndShare = async (action: 'save' | 'share' | 'instagram' | 'snapchat' | 'tiktok') => {
    if (!viewShotRef.current) return;
    
    setIsGenerating(true);
    
    try {
      // Capture the card as image
      const uri = await viewShotRef.current?.capture?.();
      
      if (!uri) {
        throw new Error('Failed to capture image');
      }

      console.log('Card captured:', uri);

      switch (action) {
        case 'save':
          await saveToGallery(uri);
          break;
        case 'share':
          await shareGeneral(uri);
          break;
        case 'instagram':
          await shareToInstagram(uri);
          break;
        case 'snapchat':
          await shareToSnapchat(uri);
          break;
        case 'tiktok':
          await shareToTikTok(uri);
          break;
      }
    } catch (error) {
      console.error('Error capturing card:', error);
      Alert.alert('Error', 'Failed to capture the card. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveToGallery = async (uri: string) => {
    if (Platform.OS === 'web') {
      // For web, trigger download
      const link = document.createElement('a');
      link.href = uri;
      link.download = `${item.name.replace(/[^a-zA-Z0-9]/g, '_')}_discovery.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      Alert.alert('Success', 'Image downloaded successfully!');
      return;
    }

    const hasPermission = await requestMediaPermission();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Please grant permission to save images to your gallery.');
      return;
    }

    try {
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('Monument Discoveries', asset, false);
      Alert.alert('Success', 'Image saved to your gallery!');
    } catch (error) {
      console.error('Error saving to gallery:', error);
      Alert.alert('Error', 'Failed to save image to gallery.');
    }
  };

  const shareGeneral = async (uri: string) => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device.');
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: `Share your discovery: ${item.name}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share the image.');
    }
  };

  const shareToInstagram = async (uri: string) => {
    try {
      if (Platform.OS === 'web') {
        // For web, open Instagram in new tab
        window.open('https://www.instagram.com/', '_blank');
        Alert.alert('Instagram', 'Please upload the saved image to Instagram Stories manually.');
        return;
      }

      // Try to share to Instagram
      const canOpen = await Sharing.isAvailableAsync();
      
      if (canOpen) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share to Instagram Stories',
        });
      } else {
        Alert.alert('Instagram', 'Instagram app is not installed. Please save the image and share manually.');
      }
    } catch (error) {
      console.error('Error sharing to Instagram:', error);
      Alert.alert('Instagram', 'Please save the image and share to Instagram Stories manually.');
    }
  };

  const shareToSnapchat = async (uri: string) => {
    try {
      if (Platform.OS === 'web') {
        window.open('https://www.snapchat.com/', '_blank');
        Alert.alert('Snapchat', 'Please upload the saved image to Snapchat manually.');
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share to Snapchat',
      });
    } catch (error) {
      console.error('Error sharing to Snapchat:', error);
      Alert.alert('Snapchat', 'Please save the image and share to Snapchat manually.');
    }
  };

  const shareToTikTok = async (uri: string) => {
    try {
      if (Platform.OS === 'web') {
        window.open('https://www.tiktok.com/', '_blank');
        Alert.alert('TikTok', 'Please upload the saved image to TikTok manually.');
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share to TikTok',
      });
    } catch (error) {
      console.error('Error sharing to TikTok:', error);
      Alert.alert('TikTok', 'Please save the image and share to TikTok manually.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#ffffff" />
          </TouchableOpacity>

          {/* Shareable Card */}
          <ViewShot
            ref={viewShotRef}
            options={{
              format: 'png',
              quality: 1.0,
            }}
            style={styles.cardContainer}
          >
            <View style={styles.shareCard}>
              <Image 
                source={{ uri: item.image }} 
                style={styles.cardImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.9)']}
                style={styles.cardOverlay}
              />
              
              {/* Content */}
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={3}>
                  {item.name}
                </Text>
                
                <View style={styles.cardLocation}>
                  <MapPin size={16} color="#ffffff" />
                  <Text style={styles.cardLocationText} numberOfLines={2}>
                    {formatLocation(item.location)}
                  </Text>
                </View>
                
                {formatPeriod(item.period) && (
                  <Text style={styles.cardPeriod}>
                    {formatPeriod(item.period)}
                  </Text>
                )}
                
                {/* Branding */}
                <View style={styles.cardBranding}>
                  <Text style={styles.brandingText}>Monument Scanner</Text>
                  <View style={styles.brandingIcon}>
                    <Camera size={14} color="rgba(255,255,255,0.8)" />
                  </View>
                </View>
              </View>
            </View>
          </ViewShot>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => captureAndShare('save')}
              disabled={isGenerating}
            >
              <Download size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => captureAndShare('share')}
              disabled={isGenerating}
            >
              <Share2 size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.instagramButton]}
              onPress={() => captureAndShare('instagram')}
              disabled={isGenerating}
            >
              <Instagram size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>Instagram</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.snapchatButton]}
              onPress={() => captureAndShare('snapchat')}
              disabled={isGenerating}
            >
              <Text style={styles.snapchatIcon}>👻</Text>
              <Text style={styles.actionButtonText}>Snapchat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.tiktokButton]}
              onPress={() => captureAndShare('tiktok')}
              disabled={isGenerating}
            >
              <Text style={styles.tiktokIcon}>🎵</Text>
              <Text style={styles.actionButtonText}>TikTok</Text>
            </TouchableOpacity>
          </View>

          {isGenerating && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.loadingText}>Generating image...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: -50,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  cardContainer: {
    marginBottom: 30,
  },
  shareCard: {
    width: cardWidth,
    height: cardHeight,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000000',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 30,
    paddingBottom: 40,
  },
  cardTitle: {
    fontSize: 28,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif',
      default: 'Times New Roman'
    }),
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
    lineHeight: 34,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  cardLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardLocationText: {
    fontSize: 18,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif',
      default: 'Times New Roman'
    }),
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cardPeriod: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif',
      default: 'Times New Roman'
    }),
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cardBranding: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 'auto',
  },
  brandingText: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif',
      default: 'Times New Roman'
    }),
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  brandingIcon: {
    opacity: 0.7,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    maxWidth: cardWidth,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: 100,
    justifyContent: 'center',
  },
  instagramButton: {
    backgroundColor: 'rgba(225, 48, 108, 0.8)',
    borderColor: 'rgba(225, 48, 108, 0.9)',
  },
  snapchatButton: {
    backgroundColor: 'rgba(255, 252, 0, 0.8)',
    borderColor: 'rgba(255, 252, 0, 0.9)',
  },
  tiktokButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif',
      default: 'Times New Roman'
    }),
    color: '#ffffff',
    fontWeight: '600',
  },
  snapchatIcon: {
    fontSize: 18,
  },
  tiktokIcon: {
    fontSize: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif',
      default: 'Times New Roman'
    }),
    color: '#ffffff',
    marginTop: 12,
    fontWeight: '500',
  },
});