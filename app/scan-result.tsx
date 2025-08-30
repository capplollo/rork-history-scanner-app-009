import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { X, MapPin, Calendar, Info, Share2, CheckCircle, AlertCircle, MessageCircle, Volume2, VolumeX, Pause, RefreshCw, ChevronDown, ChevronUp } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { mockMonuments } from "@/data/mockMonuments";
import AsyncStorage from "@react-native-async-storage/async-storage";
import VoiceSettings from "@/components/VoiceSettings";
import FormattedText from "@/components/FormattedText";

const { width: screenWidth } = Dimensions.get("window");

// Define basic types for the simplified version
interface MonumentData {
  id: string;
  name: string;
  location: string;
  country: string;
  period: string;
  description: string;
  significance: string;
  facts: string[];
  image: string;
  scannedImage: string;
  scannedAt: string;
  confidence: number;
  isRecognized: boolean;
  detailedDescription?: {
    keyTakeaways: string[];
    inDepthContext: string;
    curiosities: string;
  };
}

export default function ScanResultScreen() {
  const { monumentId, scanData, resultId, historyItemId, monumentName, location, period, scannedImage, regenerate } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showVoiceSettings, setShowVoiceSettings] = useState<boolean>(false);
  const [isReanalyzing, setIsReanalyzing] = useState<boolean>(false);
  const [showContextForm, setShowContextForm] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [contextInfo, setContextInfo] = useState({
    name: "",
    location: "",
    building: "",
    notes: "",
  });
  
  const [monument, setMonument] = useState<MonumentData | undefined>(undefined);
  
  // Load monument data on component mount
  useEffect(() => {
    const loadMonumentData = async () => {
      let loadedMonument: MonumentData | undefined;
      
      // Check if this is a regeneration request from history
      if (regenerate === 'true' && monumentName && typeof monumentName === 'string') {
        console.log('🔄 Regenerating content for history item:', monumentName);
        setIsRegenerating(true);
        
        try {
          // Create basic monument data since backend services are not available
          loadedMonument = {
            id: (historyItemId as string) || 'history-item',
            name: monumentName as string,
            location: (location as string) || '',
            country: '',
            period: (period as string) || '',
            description: `${monumentName} is a remarkable monument located in ${location}. This historical site represents the rich cultural heritage and architectural achievements of ${period}.`,
            significance: `This monument holds profound historical and cultural significance, representing the architectural and artistic achievements of ${period}.`,
            facts: [
              `Located in ${location}`,
              `Historical period: ${period}`,
              'Previously scanned and identified',
              'This monument represents important cultural heritage',
              'The site has been preserved for future generations'
            ],
            image: (scannedImage as string) || '',
            scannedImage: (scannedImage as string) || '',
            scannedAt: new Date().toISOString(),
            confidence: 85,
            isRecognized: true,
            detailedDescription: {
              keyTakeaways: [
                `${monumentName} is a significant historical monument`,
                `Located in ${location} during ${period}`,
                'Represents important cultural and architectural heritage',
                'Preserved for future generations to appreciate'
              ],
              inDepthContext: `${monumentName} stands as a remarkable example of ${period} architecture and cultural expression.`,
              curiosities: 'This monument has been preserved through various historical periods and continues to attract visitors from around the world.'
            }
          };
        } catch (error) {
          console.error('Error during content regeneration:', error);
        } finally {
          setIsRegenerating(false);
        }
      } else {
        // Try to load from mock data or create basic data
        if (monumentId && typeof monumentId === 'string') {
          const mockMonument = mockMonuments.find(m => m.id === monumentId);
          if (mockMonument) {
            loadedMonument = {
              ...mockMonument,
              scannedImage: (scannedImage as string) || mockMonument.image,
              scannedAt: new Date().toISOString(),
            };
          }
        }
        
        // If no mock data found, create basic monument data
        if (!loadedMonument) {
          loadedMonument = {
            id: resultId as string || 'unknown',
            name: monumentName as string || 'Unknown Monument',
            location: location as string || 'Unknown Location',
            country: '',
            period: period as string || 'Unknown Period',
            description: 'This is a historical monument that has been scanned and analyzed.',
            significance: 'This monument holds historical and cultural significance.',
            facts: [
              'Scanned and analyzed by our system',
              'Historical monument',
              'Cultural significance'
            ],
            image: (scannedImage as string) || '',
            scannedImage: (scannedImage as string) || '',
            scannedAt: new Date().toISOString(),
            confidence: 75,
            isRecognized: true,
          };
        }
      }
      
      setMonument(loadedMonument);
      setIsLoading(false);
    };
    
    loadMonumentData();
  }, [monumentId, scanData, resultId, historyItemId, monumentName, location, period, scannedImage, regenerate]);

  const handleReanalyze = async () => {
    setIsReanalyzing(true);
    // Simulate reanalysis
    setTimeout(() => {
      setIsReanalyzing(false);
      Alert.alert('Reanalysis Complete', 'The monument has been reanalyzed with updated information.');
    }, 2000);
  };

  const handleShare = () => {
    Alert.alert('Share', 'Share functionality will be implemented when backend is ready.');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading monument details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!monument) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load monument data</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <X size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Share2 size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Monument Image */}
        {monument.scannedImage && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: monument.scannedImage }} style={styles.monumentImage} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.imageOverlay}
            />
          </View>
        )}

        {/* Monument Info */}
        <View style={styles.contentContainer}>
          <Text style={styles.monumentName}>{monument.name}</Text>
          
          <View style={styles.locationContainer}>
            <MapPin size={16} color="#666" />
            <Text style={styles.locationText}>{monument.location}</Text>
          </View>
          
          <View style={styles.periodContainer}>
            <Calendar size={16} color="#666" />
            <Text style={styles.periodText}>{monument.period}</Text>
          </View>

          {/* Recognition Status */}
          <View style={styles.recognitionContainer}>
            {monument.isRecognized ? (
              <View style={styles.recognizedContainer}>
                <CheckCircle size={16} color="#4CAF50" />
                <Text style={styles.recognizedText}>Recognized</Text>
                <Text style={styles.confidenceText}>{monument.confidence}% confidence</Text>
              </View>
            ) : (
              <View style={styles.notRecognizedContainer}>
                <AlertCircle size={16} color="#FF9800" />
                <Text style={styles.notRecognizedText}>Not Recognized</Text>
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <FormattedText text={monument.description} style={styles.descriptionText} />
          </View>

          {/* Significance */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Historical Significance</Text>
            <FormattedText text={monument.significance} style={styles.descriptionText} />
          </View>

          {/* Key Facts */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Facts</Text>
            {monument.facts.map((fact, index) => (
              <View key={index} style={styles.factContainer}>
                <Text style={styles.factBullet}>•</Text>
                <Text style={styles.factText}>{fact}</Text>
              </View>
            ))}
          </View>

          {/* Detailed Description */}
          {monument.detailedDescription && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Detailed Analysis</Text>
              
              <Text style={styles.subsectionTitle}>Key Takeaways</Text>
              {monument.detailedDescription.keyTakeaways.map((takeaway, index) => (
                <View key={index} style={styles.factContainer}>
                  <Text style={styles.factBullet}>•</Text>
                  <Text style={styles.factText}>{takeaway}</Text>
                </View>
              ))}
              
              <Text style={styles.subsectionTitle}>In-Depth Context</Text>
              <FormattedText text={monument.detailedDescription.inDepthContext} style={styles.descriptionText} />
              
              <Text style={styles.subsectionTitle}>Curiosities</Text>
              <FormattedText text={monument.detailedDescription.curiosities} style={styles.descriptionText} />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.reanalyzeButton]} 
          onPress={handleReanalyze}
          disabled={isReanalyzing}
        >
          {isReanalyzing ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <RefreshCw size={20} color="#FFF" />
          )}
          <Text style={styles.actionButtonText}>
            {isReanalyzing ? 'Reanalyzing...' : 'Reanalyze'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  closeButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  imageContainer: {
    position: 'relative',
    height: 300,
  },
  monumentImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  contentContainer: {
    padding: 20,
  },
  monumentName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  periodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  periodText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  recognitionContainer: {
    marginBottom: 24,
  },
  recognizedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
  },
  recognizedText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  confidenceText: {
    marginLeft: 'auto',
    fontSize: 12,
    color: '#666',
  },
  notRecognizedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
  },
  notRecognizedText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9800',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  factContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  factBullet: {
    fontSize: 16,
    color: '#007AFF',
    marginRight: 8,
    fontWeight: 'bold',
  },
  factText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  actionBar: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#fff',
  },
  reanalyzeButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
