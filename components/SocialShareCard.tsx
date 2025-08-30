import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { Share2, Download, Heart } from 'lucide-react-native';

// Define a simplified interface for monument data
interface MonumentData {
  id: string;
  name: string;
  location: string;
  period: string;
  description: string;
  image?: string;
}

interface SocialShareCardProps {
  monument: MonumentData;
  onShare?: () => void;
  onDownload?: () => void;
  onFavorite?: () => void;
}

export default function SocialShareCard({ 
  monument, 
  onShare, 
  onDownload, 
  onFavorite 
}: SocialShareCardProps) {
  const handleShare = async () => {
    try {
      const shareContent = {
        title: `Check out this amazing monument: ${monument.name}`,
        message: `I discovered ${monument.name} in ${monument.location}! ${monument.description}`,
        url: 'https://rork.com', // Placeholder URL
      };

      await Share.share(shareContent);
      onShare?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to share content');
    }
  };

  const handleDownload = () => {
    Alert.alert('Download', 'Download functionality will be implemented when backend is ready.');
    onDownload?.();
  };

  const handleFavorite = () => {
    Alert.alert('Favorite', 'Favorite functionality will be implemented when backend is ready.');
    onFavorite?.();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Share Your Discovery</Text>
        <Text style={styles.subtitle}>
          Share {monument.name} with friends and family
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Share2 size={24} color="#007AFF" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleDownload}>
          <Download size={24} color="#34C759" />
          <Text style={styles.actionText}>Download</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleFavorite}>
          <Heart size={24} color="#FF3B30" />
          <Text style={styles.actionText}>Favorite</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.monumentInfo}>
        <Text style={styles.monumentName}>{monument.name}</Text>
        <Text style={styles.monumentLocation}>{monument.location}</Text>
        <Text style={styles.monumentPeriod}>{monument.period}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C2C2C',
    marginBottom: 4,
    fontFamily: 'Times New Roman',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Times New Roman',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  actionButton: {
    alignItems: 'center',
    padding: 12,
  },
  actionText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontFamily: 'Times New Roman',
  },
  monumentInfo: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 16,
  },
  monumentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C2C2C',
    marginBottom: 4,
    fontFamily: 'Times New Roman',
  },
  monumentLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
    fontFamily: 'Times New Roman',
  },
  monumentPeriod: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Times New Roman',
  },
});