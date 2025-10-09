import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  TextInput,
  Switch,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from "@/constants/colors";



export default function ScanResultScreen() {
  const insets = useSafeAreaInsets();
  const { scannedImage } = useLocalSearchParams();
  const [isLocationRelevant, setIsLocationRelevant] = useState(false);
  const [contextText, setContextText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [locationAddress, setLocationAddress] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  useEffect(() => {
    const initLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === Location.PermissionStatus.GRANTED) {
        await getCurrentLocation();
      }
      setIsLoadingLocation(false);
    };
    initLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      if (Platform.OS === 'web') {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              await getAddressFromCoordinates(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
              console.error('Web geolocation error:', error);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
          );
        }
      } else {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        await getAddressFromCoordinates(location.coords.latitude, location.coords.longitude);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const getAddressFromCoordinates = async (latitude: number, longitude: number) => {
    try {
      if (Platform.OS === 'web') {
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        );
        const data = await response.json();
        
        const district = data.locality || data.principalSubdivision || '';
        const city = data.city || '';
        const country = data.countryName || '';
        
        const parts = [];
        if (district) parts.push(district);
        if (city && city !== district) parts.push(city);
        if (country) parts.push(country);
        
        const addressString = parts.join(', ');
        setLocationAddress(addressString || 'Location detected');
      } else {
        const addresses = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        
        if (addresses && addresses.length > 0) {
          const address = addresses[0];
          const district = address.district || address.subregion || '';
          const city = address.city || address.region || '';
          const country = address.country || '';
          
          const parts = [];
          if (district) parts.push(district);
          if (city && city !== district) parts.push(city);
          if (country) parts.push(country);
          
          const addressString = parts.join(', ');
          setLocationAddress(addressString || 'Location detected');
        } else {
          setLocationAddress('Location detected');
        }
      }
    } catch (error) {
      console.error('Error getting address:', error);
      setLocationAddress('Location detected');
    }
  };

  const handleStartAnalyzing = () => {
    setIsAnalyzing(true);
    console.log('Starting analysis with:', {
      isLocationRelevant,
      contextText,
      locationAddress
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header - Same as main page */}
        <View style={[styles.headerSection, { paddingTop: insets.top + 8 }]}>
          <LinearGradient
            colors={['rgba(118, 104, 96, 0.36)', 'rgba(225, 222, 220, 0.36)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.headerGradient}
          />
          <View style={[styles.topRow, { top: insets.top + 20 }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={20} color="#173248" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationText}>
                {isLoadingLocation ? 'Getting location...' : (locationAddress || 'Location not available')}
              </Text>
            </View>
            <View style={styles.logoContainer}>
              <Image 
                source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/q49mrslt036oct5mux1y0' }}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>
          <View style={styles.headerContent}>
            <View style={styles.textContainer}>
              <Text style={styles.mainTitle}>Snap into Heritage</Text>
              <Text style={styles.headerSubtitle}>
                Discover the living stories of art and monuments
              </Text>
            </View>
          </View>
          <View style={styles.headerDivider} />
        </View>

        {/* Monument Image with Gradient Overlay */}
        {scannedImage && (
          <View style={styles.imageSection}>
            <Image 
              source={{ uri: scannedImage as string }} 
              style={styles.monumentImage} 
            />
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.85)']}
              style={styles.imageGradient}
            >
              {/* Toggle: Is your current location relevant? */}
              <View style={styles.locationToggleContainer}>
                <Text style={styles.locationToggleText}>
                  Is your current location relevant?
                </Text>
                <Switch
                  value={isLocationRelevant}
                  onValueChange={setIsLocationRelevant}
                  trackColor={{ false: '#e2e8f0', true: Colors.accent.secondary }}
                  thumbColor="#ffffff"
                  ios_backgroundColor="#e2e8f0"
                />
              </View>

              {/* Subtle line below toggle */}
              <View style={styles.subtleLine} />

              {/* Text input: Add context (Optional) */}
              <TextInput
                style={styles.contextInput}
                placeholder="Add context (Optional)"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={contextText}
                onChangeText={setContextText}
                multiline
              />
            </LinearGradient>
          </View>
        )}

        {/* Start Analyzing Button */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={styles.analyzeButton}
            onPress={handleStartAnalyzing}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <View style={styles.analyzingContainer}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.analyzeButtonText}>Analyzing...</Text>
              </View>
            ) : (
              <View style={styles.analyzeContainer}>
                <View style={styles.arrowCircle}>
                  <Text style={styles.arrowIcon}>→</Text>
                </View>
                <Text style={styles.analyzeButtonText}>Start Analyzing</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    position: 'relative',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  topRow: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 16,
  },
  backText: {
    fontSize: 14,
    fontFamily: "Lora_400Regular",
    fontWeight: "500",
    color: '#173248',
  },
  locationTextContainer: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: 'center',
  },
  locationText: {
    fontSize: 10,
    fontFamily: "Lora_400Regular",
    fontWeight: "400",
    color: '#173248',
    lineHeight: 12,
    textAlign: 'center',
  },
  logoContainer: {
    flexShrink: 0,
  },
  logoImage: {
    width: 39,
    height: 39,
  },
  headerContent: {
    marginBottom: 8,
    marginTop: 48,
  },
  textContainer: {
    width: '100%',
  },
  mainTitle: {
    fontSize: 20,
    fontFamily: "Lora_400Regular",
    fontWeight: "700",
    color: '#173248',
    marginBottom: 8,
    lineHeight: 22,
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: "Lora_400Regular",
    fontStyle: 'italic',
    fontWeight: "400",
    color: '#173248',
    lineHeight: 14,
    textAlign: 'left',
    marginTop: 2,
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#173248',
    opacity: 0.2,
    width: '100%',
    alignSelf: 'center',
  },
  imageSection: {
    position: 'relative',
    width: '100%',
    aspectRatio: 2 / 3,
    marginTop: 16,
  },
  monumentImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 120,
    paddingBottom: 32,
    justifyContent: 'flex-end',
  },
  locationToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  locationToggleText: {
    fontSize: 18,
    fontFamily: "Lora_400Regular",
    fontWeight: "500",
    color: '#ffffff',
  },
  subtleLine: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 16,
  },
  contextInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: "Lora_400Regular",
    color: '#ffffff',
    minHeight: 50,
  },
  buttonSection: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 40,
  },
  analyzeButton: {
    backgroundColor: '#766860',
    borderRadius: 50,
    paddingVertical: 18,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
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
    gap: 16,
  },
  arrowCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowIcon: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  analyzeButtonText: {
    fontSize: 18,
    fontFamily: "Lora_400Regular",
    fontWeight: "500",
    color: '#ffffff',
  },
});
