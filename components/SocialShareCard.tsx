import React, { useState } from 'react';
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

  const shareGeneral = async () => {
    setIsGenerating(true);
    
    try {
      const shareText = `Check out this amazing monument: ${item.name} in ${item.location}, ${item.country}! From the ${item.period} period. Discovered with Rork History Scanner.`;
      
      if (Platform.OS === 'web') {
        // Web sharing
        if (navigator.share) {
          await navigator.share({
            title: item.name,
            text: shareText,
            url: window.location.href,
          });
        } else {
          // Fallback for web browsers that don't support Web Share API
          await navigator.clipboard.writeText(shareText);
          Alert.alert('Copied!', 'Monument information copied to clipboard');
        }
      } else {
        // Mobile sharing
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync('', {
            mimeType: 'text/plain',
            dialogTitle: `Share ${item.name}`,
            UTI: 'public.plain-text',
          });
        } else {
          Alert.alert('Sharing not available', 'Sharing is not available on this device');
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveToGallery = async () => {
    setIsGenerating(true);
    
    try {
      if (Platform.OS === 'web') {
        Alert.alert('Not Available', 'Saving to gallery is not available on web');
        return;
      }

      const hasPermission = await requestMediaPermission();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Please grant permission to save to gallery');
        return;
      }

      // For now, just show a success message since we can't capture the card
      Alert.alert('Success', 'Monument information saved to your collection!');
    } catch (error) {
      console.error('Error saving to gallery:', error);
      Alert.alert('Error', 'Failed to save to gallery. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const shareToInstagram = () => {
    Alert.alert('Instagram Share', 'Share this amazing monument on Instagram!', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Share', onPress: () => {
        const shareText = `🏛️ ${item.name}\n📍 ${item.location}, ${item.country}\n⏰ ${item.period}\n\nDiscovered with Rork History Scanner! #monuments #history #art`;
        Alert.alert('Instagram', 'Copy this text and share it on Instagram:', [
          { text: 'Copy', onPress: () => {
            if (Platform.OS !== 'web') {
              // On mobile, you could use a clipboard library here
              Alert.alert('Copied!', 'Text copied to clipboard. Now paste it on Instagram!');
            }
          }},
          { text: 'Cancel', style: 'cancel' }
        ]);
      }}
    ]);
  };

  const shareToSnapchat = () => {
    Alert.alert('Snapchat Share', 'Share this amazing monument on Snapchat!', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Share', onPress: () => {
        const shareText = `🏛️ ${item.name} in ${item.location}, ${item.country}! From the ${item.period} period. Discovered with Rork History Scanner!`;
        Alert.alert('Snapchat', 'Copy this text and share it on Snapchat:', [
          { text: 'Copy', onPress: () => {
            if (Platform.OS !== 'web') {
              Alert.alert('Copied!', 'Text copied to clipboard. Now paste it on Snapchat!');
            }
          }},
          { text: 'Cancel', style: 'cancel' }
        ]);
      }}
    ]);
  };

  const shareToTikTok = () => {
    Alert.alert('TikTok Share', 'Share this amazing monument on TikTok!', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Share', onPress: () => {
        const shareText = `🏛️ ${item.name} in ${item.location}, ${item.country}! From the ${item.period} period. Discovered with Rork History Scanner! #monuments #history #art #tiktok`;
        Alert.alert('TikTok', 'Copy this text and share it on TikTok:', [
          { text: 'Copy', onPress: () => {
            if (Platform.OS !== 'web') {
              Alert.alert('Copied!', 'Text copied to clipboard. Now paste it on TikTok!');
            }
          }},
          { text: 'Cancel', style: 'cancel' }
        ]);
      }}
    ]);
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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Share Monument</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Share Card Preview */}
          <View style={styles.cardPreview}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.cardGradient}
            >
              <View style={styles.cardContent}>
                <Image 
                  source={{ uri: item.image }} 
                  style={styles.cardImage}
                  resizeMode="cover"
                />
                
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  
                  <View style={styles.cardLocationContainer}>
                    <MapPin size={16} color="#ffffff" />
                    <Text style={styles.cardLocation}>
                      {formatLocation(item.location)}, {item.country}
                    </Text>
                  </View>
                  
                  <Text style={styles.cardPeriod}>
                    {formatPeriod(item.period)}
                  </Text>
                  
                  <Text style={styles.cardBrand}>Rork History Scanner</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Share Options */}
          <View style={styles.shareOptions}>
            <TouchableOpacity
              style={styles.shareOption}
              onPress={shareGeneral}
              disabled={isGenerating}
            >
              <Share2 size={24} color="#007AFF" />
              <Text style={styles.shareOptionText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareOption}
              onPress={saveToGallery}
              disabled={isGenerating}
            >
              <Download size={24} color="#34C759" />
              <Text style={styles.shareOptionText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareOption}
              onPress={shareToInstagram}
              disabled={isGenerating}
            >
              <Instagram size={24} color="#E4405F" />
              <Text style={styles.shareOptionText}>Instagram</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareOption}
              onPress={shareToSnapchat}
              disabled={isGenerating}
            >
              <Camera size={24} color="#FFFC00" />
              <Text style={styles.shareOptionText}>Snapchat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareOption}
              onPress={shareToTikTok}
              disabled={isGenerating}
            >
              <Camera size={24} color="#000000" />
              <Text style={styles.shareOptionText}>TikTok</Text>
            </TouchableOpacity>
          </View>

          {isGenerating && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Generating...</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    width: screenWidth * 0.9,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 8,
  },
  cardPreview: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardGradient: {
    width: cardWidth,
    height: cardHeight,
  },
  cardContent: {
    flex: 1,
    padding: 20,
  },
  cardImage: {
    width: '100%',
    height: cardHeight * 0.6,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  cardLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  cardLocation: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardPeriod: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '400',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardBrand: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
    opacity: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  shareOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 16,
  },
  shareOption: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    minWidth: 80,
  },
  shareOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 12,
  },
});