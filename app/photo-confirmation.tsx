import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
  Animated,
  PanResponder,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import * as Location from 'expo-location';

const { width: screenWidth } = Dimensions.get('window');

export default function PhotoConfirmationScreen() {
  const { photoUri, scanMode } = useLocalSearchParams();
  const [isLocationRelevant, setIsLocationRelevant] = useState(true);
  const [contextText, setContextText] = useState('');
  const [locationAddress, setLocationAddress] = useState<string | null>(null);
  
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [isSliding, setIsSliding] = useState(false);

  React.useEffect(() => {
    if (isLocationRelevant) {
      getCurrentLocation();
    }
  }, [isLocationRelevant]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === Location.PermissionStatus.GRANTED) {
        if (Platform.OS === 'web') {
          if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                await getAddressFromCoordinates(position.coords.latitude, position.coords.longitude);
              },
              (error) => {
                console.error('Web geolocation error:', error);
              }
            );
          }
        } else {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          await getAddressFromCoordinates(location.coords.latitude, location.coords.longitude);
        }
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
        
        setLocationAddress(parts.join(', ') || 'Location detected');
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
          
          setLocationAddress(parts.join(', ') || 'Location detected');
        }
      }
    } catch (error) {
      console.error('Error getting address:', error);
      setLocationAddress('Location detected');
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsSliding(true);
      },
      onPanResponderMove: (_, gestureState) => {
        const maxSlide = screenWidth - 100;
        const newValue = Math.max(0, Math.min(gestureState.dx, maxSlide));
        slideAnim.setValue(newValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        const maxSlide = screenWidth - 100;
        const threshold = maxSlide * 0.75;

        if (gestureState.dx >= threshold) {
          Animated.timing(slideAnim, {
            toValue: maxSlide,
            duration: 200,
            useNativeDriver: false,
          }).start(() => {
            handleStartAnalyzing();
          });
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: false,
          }).start(() => {
            setIsSliding(false);
          });
        }
      },
    })
  ).current;

  const handleStartAnalyzing = () => {
    router.replace({
      pathname: '/(tabs)/(scanner)' as any,
      params: {
        photoUri: photoUri as string,
        isLocationRelevant: isLocationRelevant.toString(),
        contextText: contextText,
        scanMode: scanMode as string,
        startAnalysis: 'true',
      },
    });
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
      <LinearGradient
        colors={['rgba(118, 104, 96, 0.36)', 'rgba(225, 222, 220, 0.36)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.backgroundGradient}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.topRow}>
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationText}></Text>
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

        {/* Photo with overlay */}
        <View style={styles.photoSection}>
          <View style={styles.photoCard}>
            <Image 
              source={{ uri: photoUri as string }} 
              style={styles.photoImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.8)']}
              style={styles.photoGradient}
            >
              {/* Location toggle */}
              <View style={styles.locationToggleContainer}>
                <Text style={styles.locationToggleText}>
                  Is your current location relevant?
                </Text>
                <TouchableOpacity 
                  style={[styles.toggle, isLocationRelevant && styles.toggleActive]}
                  onPress={() => setIsLocationRelevant(!isLocationRelevant)}
                >
                  <View style={[styles.toggleThumb, isLocationRelevant && styles.toggleThumbActive]} />
                </TouchableOpacity>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Context input */}
              <TextInput
                style={styles.contextInput}
                placeholder="Add context (Optional)"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={contextText}
                onChangeText={setContextText}
                multiline
              />
            </LinearGradient>
          </View>
        </View>

        {/* Start Analyzing Button */}
        <View style={styles.buttonSection}>
          <View style={styles.slideButtonContainer}>
            <View style={styles.slideButtonTrack}>
              <Text style={styles.slideButtonText}>Start Analyzing</Text>
            </View>
            <Animated.View
              style={[
                styles.slideButtonThumb,
                {
                  transform: [{ translateX: slideAnim }],
                },
              ]}
              {...panResponder.panHandlers}
            >
              <ChevronRight size={22} color="#ffffff" />
            </Animated.View>
          </View>
        </View>
      </SafeAreaView>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 0,
  },
  safeArea: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    position: 'relative',
  },
  topRow: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  locationTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  locationText: {
    fontSize: 10,
    fontFamily: 'Lora_400Regular',
    fontWeight: '400',
    color: '#173248',
    lineHeight: 12,
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
    zIndex: 2,
  },
  textContainer: {
    width: '100%',
  },
  mainTitle: {
    fontSize: 20,
    fontFamily: 'Lora_400Regular',
    fontWeight: '700',
    color: '#173248',
    marginBottom: 8,
    lineHeight: 22,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: 'Lora_400Regular',
    fontStyle: 'italic',
    fontWeight: '400',
    color: '#173248',
    lineHeight: 14,
    textAlign: 'left',
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#173248',
    opacity: 0.2,
    width: '100%',
    alignSelf: 'center',
    zIndex: 2,
  },
  photoSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  photoCard: {
    width: '95%',
    aspectRatio: 2/3,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    alignSelf: 'center',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 24,
    justifyContent: 'flex-end',
  },
  locationToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  locationToggleText: {
    fontSize: 12,
    fontFamily: 'Lora_400Regular',
    fontWeight: '500',
    color: '#ffffff',
    flex: 1,
  },
  toggle: {
    width: 26,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 1.5,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#ffffff',
  },
  toggleThumb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#685951',
  },
  toggleThumbActive: {
    transform: [{ translateX: 11 }],
    backgroundColor: '#685951',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 16,
  },
  contextInput: {
    fontSize: 10.5,
    fontFamily: 'Lora_400Regular',
    color: '#ffffff',
    minHeight: 30,
  },
  buttonSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  slideButtonContainer: {
    position: 'relative',
    height: 43,
    borderRadius: 22,
    overflow: 'hidden',
  },
  slideButtonTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#766860',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideButtonText: {
    fontSize: 13.5,
    fontFamily: 'Lora_400Regular',
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  slideButtonThumb: {
    position: 'absolute',
    left: 3,
    top: 3,
    width: 37,
    height: 37,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});
