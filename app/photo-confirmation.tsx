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
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import * as Location from 'expo-location';

const { width: screenWidth } = Dimensions.get('window');

export default function PhotoConfirmationScreen() {
  const { photoUri, scanMode, photoSource } = useLocalSearchParams();
  const [isLocationRelevant, setIsLocationRelevant] = useState(photoSource !== 'gallery');
  const [contextText, setContextText] = useState('');
  const [locationAddress, setLocationAddress] = useState<string | null>(null);
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
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
    setLocationCoords({ latitude, longitude });
    try {
      if (Platform.OS === 'web') {
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
          { 
            method: 'GET',
            signal: AbortSignal.timeout(10000)
          }
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
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
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
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
        const threshold = maxSlide * 0.6;

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

  const handleStartAnalyzing = async () => {
    setIsAnalyzing(true);
    
    try {
      const compressedImage = await ImageManipulator.manipulateAsync(
        photoUri as string,
        [{ resize: { width: 1024 } }],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true
        }
      );
      
      if (!compressedImage.base64) {
        throw new Error('Failed to compress image');
      }
      
      const base64 = compressedImage.base64;
      
      let promptText = '';
      
      if (isLocationRelevant && locationAddress) {
        promptText += `\n\nUser's location: ${locationAddress}`;
      }
      
      if (contextText.trim()) {
        promptText += `\n\nUser context: ${contextText}`;
      }
      
      if (scanMode === 'museum') {
        promptText = `Analyze the label photo or other context information first, then analyze the artwork image. Identify any artworks or cultural artifacts, including paintings, sculptures, or historical objects. Include paintings that depict buildings/landmarks (identify the painting, not the depicted structure).

From the label/context, extract title, artist/culture, date, medium, museum/collection, gallery/room, or inventory number. Use this as the starting point for recognition. Only confirm recognition if the label/context details and the artwork image visually align (composition, materials, aspect ratio, inscriptions, distinctive features). Minor OCR errors are acceptable, but if label/context and visuals conflict, mark as not recognized.

BE EXTREMELY CONSERVATIVE with identification. Many artworks have close copies, replicas, workshop variants, or period copies. Only identify a specific artwork if you are 95% or more confident it is that exact piece.

For recognition (isRecognized: true), confidence must be 95% or higher. Be ESPECIALLY conservative with:
- Workshop copies, replicas, or casts that look nearly identical
- Religious icons, altarpieces, and portraits with repeated styles or subjects
- Busts and sculptures of emperors, philosophers, or deities with recurring typologies
- Decorative arts in series or sets; "school of" / "circle of" attributions

When in doubt, mark as NOT RECOGNIZED. It is better to provide general analysis than incorrect identification.

Analyze the provided museum object and its label to identify the artifact. You will receive two images: the museum object itself and its accompanying label/information card.

Rules for identification:
1. Be EXTREMELY CONSERVATIVE. Only provide a specific identification if you are at least 95% confident. If confidence is lower, mark as NOT RECOGNIZED and provide only general analysis.
2. Use both the object image and label information to make your identification. The label may contain crucial details about the object's origin, date, culture, or significance.
3. For recognition, always provide the ACTUAL city and country of the object separately.

Output format:
Return ALL information in the following EXACT JSON format (ensure valid JSON, proper escaping, no control characters):

{
  "name": "Name or 'Unknown'",
  "city": "City or 'Unknown'",
  "country": "Country or 'Unknown'",
  "period": "Year(s) or century (e.g., '1503', '15th century', '1800s', '12th–13th century') or 'Unknown'",
  "isRecognized": true/false,
  "detailedDescription": {
    "keyTakeaways": [
      "First key takeaway — specific and informative or 'Unknown'",
      "Second key takeaway — specific and informative or 'Unknown'",
      "Third key takeaway — specific and informative or 'Unknown'",
      "Fourth key takeaway — specific and informative or 'Unknown'"
    ],
    "inDepthContext": "Task: Provide exactly 3 condensed paragraphs totaling around 400–450 words about the specific museum object (if recognized). Begin in medias res with a vivid anecdote or striking event.Paragraph 1 (origins): Blend a striking story with the historical origins, context of creation, culture/artist or patron, and political/cultural background with specific dates.Paragraph 2 (visuals): Continue narratively as if the reader is examining the object, describing step by step its style, materials, dimensions, and distinctive features. Integrate description into the story naturally.Paragraph 3 (impact): Explain its cultural significance and historical importance through its use, symbolic meanings, notable historical events, and modern relevance. Conclude with a powerful closing anecdote that resolves the story.Emphasize human stories slightly more than historical facts, but keep both strongly integrated. Avoid detached cataloging or generic comments. If not recognized, return 'Unknown'."
  },
  "curiosities": "One striking anecdote, unusual fact, or rarely known detail about this object. If none verified or not recognized, write 'Unknown'."
}

Critical requirements:
- If not recognized: ALL fields (name, city, country, period, keyTakeaways, inDepthContext, curiosities) should return 'Unknown'.
- city and country must be separate fields or 'Unknown'.
- isRecognized must be true only if confidence ≥95%.
- keyTakeaways must contain exactly 4 bullet points.
- Output must always be valid JSON.
- Provide actual historical context, not filler text.`;
      } else {
        promptText = `Analyze this image and identify any monuments, statues, architectural landmarks, or public artworks. Include painted or sculpted depictions of landmarks.

BE EXTREMELY CONSERVATIVE with identification. Many monuments, churches, and buildings share similar styles, layouts, or decorative programs. Only identify a specific site if you are 95% or more confident it is that exact location.

For recognition (isRecognized: true), confidence must be 95% or higher. Be ESPECIALLY conservative with:
- Churches, cathedrals, and chapels with near-identical façades
- War memorials, equestrian statues, and commemorative monuments with common designs
- Triumphal arches, obelisks, towers, or bridges that resemble others from the same era
- Buildings in neoclassical, Gothic, or baroque styles that repeat common features
- Street art and murals in styles that appear across multiple cities

When in doubt, mark as NOT RECOGNIZED. It is better to provide general analysis than incorrect identification.

Analyze the provided monument or landmark to identify it. 

Rules for identification:
1. Be EXTREMELY CONSERVATIVE. Only provide a specific identification if you are at least 95% confident. If confidence is lower, mark as NOT RECOGNIZED and provide only general analysis.
2. For recognition, always provide the ACTUAL city and country of the monument separately.

Output format:
Return ALL information in the following EXACT JSON format (ensure valid JSON, proper escaping, no control characters):

{
  "name": "Name or 'Unknown'",
  "city": "City or 'Unknown'",
  "country": "Country or 'Unknown'",
  "period": "Year(s) or century (e.g., '1503', '15th century', '1800s', '12th–13th century') or 'Unknown'",
  "isRecognized": true/false,
  "detailedDescription": {
    "keyTakeaways": [
      "First key takeaway — specific and informative or 'Unknown'",
      "Second key takeaway — specific and informative or 'Unknown'",
      "Third key takeaway — specific and informative or 'Unknown'",
      "Fourth key takeaway — specific and informative or 'Unknown'"
    ],
    "inDepthContext": "Task: Provide exactly 3 condensed paragraphs totaling around 400–450 words about the specific monument (if recognized). Begin in medias res with a vivid anecdote or striking event.Paragraph 1 (origins): Blend a striking story with the historical origins, context of creation, architect/patron, and political/cultural background with specific dates.Paragraph 2 (visuals): Continue narratively as if the reader is examining the monument, describing step by step its style, materials, dimensions, and distinctive features. Integrate description into the story naturally.Paragraph 3 (impact): Explain its cultural significance and historical importance through its use, symbolic meanings, notable historical events, and modern relevance. Conclude with a powerful closing anecdote that resolves the story.Emphasize human stories slightly more than historical facts, but keep both strongly integrated. Avoid detached cataloging or generic comments. If not recognized, return 'Unknown'."
  },
  "curiosities": "One striking anecdote, unusual fact, or rarely known detail about this monument. If none verified or not recognized, write 'Unknown'."
}

Critical requirements:
- If not recognized: ALL fields (name, city, country, period, keyTakeaways, inDepthContext, curiosities) should return 'Unknown'.
- city and country must be separate fields or 'Unknown'.
- isRecognized must be true only if confidence ≥95%.
- keyTakeaways must contain exactly 4 bullet points.
- Output must always be valid JSON.
- Provide actual historical context, not filler text.`;
      }
      
      const requestBody = {
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: promptText },
              { type: 'image', image: base64 }
            ]
          }
        ]
      };
      
      // Use generateText from @rork/toolkit-sdk instead of direct fetch
      const { generateText } = await import('@rork/toolkit-sdk');
      
      const cleanedResponse = await generateText({
        messages: requestBody.messages as any
      });
      
      let analysisResult;
      try {
        // First attempt: parse as-is
        analysisResult = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error('First parse failed, attempting cleanup:', parseError);
        
        // Second attempt: extract and clean JSON
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          let jsonString = jsonMatch[0]
            // Remove markdown formatting
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/\*([^*]+)\*/g, '$1')
            // Fix newlines within string values
            .replace(/"([^"]*?)\n([^"]*?)"/g, (_match: string, p1: string, p2: string) => `"${p1}\\n${p2}"`)
            // Remove control characters
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
            // Replace tabs with spaces
            .replace(/\t/g, ' ')
            // Remove carriage returns
            .replace(/\r/g, '')
            .trim();
          
          try {
            analysisResult = JSON.parse(jsonString);
          } catch (secondError) {
            console.error('Second parse failed:', secondError);
            console.error('Problematic JSON:', jsonString.substring(0, 500));
            throw new Error('Could not parse AI response after cleanup');
          }
        } else {
          throw new Error('No JSON object found in AI response');
        }
      }
      
      router.replace({
        pathname: "/scan-result" as any,
        params: {
          artworkName: analysisResult.name,
          city: analysisResult.city,
          country: analysisResult.country,
          period: analysisResult.period,
          isRecognized: analysisResult.isRecognized.toString(),
          keyTakeaways: JSON.stringify(analysisResult.detailedDescription.keyTakeaways),
          inDepthContext: analysisResult.detailedDescription.inDepthContext,
          curiosities: analysisResult.curiosities,
          scannedImage: photoUri as string,
          userLocation: isLocationRelevant && locationAddress ? locationAddress : undefined,
          userLocationCoords: isLocationRelevant && locationCoords ? JSON.stringify(locationCoords) : undefined,
        },
      });
    } catch (error) {
      console.error('Analysis error:', error);
      setIsAnalyzing(false);
      
      let errorMessage = 'Could not analyze the image. Please try again.';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timeout. Please check your internet connection and try again.';
        } else if (error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your internet connection.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Analysis Failed', errorMessage);
    }
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
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <View style={styles.backButtonCircle}>
                <ArrowLeft size={10} color="#ffffff" />
              </View>
            </TouchableOpacity>
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
              colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.85)']}
              locations={[0, 0.5, 1]}
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
              {isLocationRelevant && locationAddress && (
                <Text style={styles.locationAddressText}>
                  {locationAddress}
                </Text>
              )}

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
          {isAnalyzing ? (
            <View style={styles.analyzingContainer}>
              <ActivityIndicator size={32} color="#766860" />
              <Text style={styles.analyzingText}>Analyzing...</Text>
            </View>
          ) : (
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
          )}
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
  backButton: {
    flexShrink: 0,
  },
  backButtonCircle: {
    width: 19.5,
    height: 19.5,
    borderRadius: 10,
    backgroundColor: '#766860',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: 'Lora_400Regular',
    fontStyle: 'italic',
    fontWeight: '400',
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
    zIndex: 2,
  },
  photoSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  photoCard: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  photoImage: {
    width: '100%',
    height: '100%',
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
  locationAddressText: {
    fontSize: 11,
    fontFamily: 'Lora_400Regular',
    fontWeight: '400',
    fontStyle: 'italic' as const,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 8,
    marginBottom: 8,
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
  analyzingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    gap: 12,
  },
  analyzingText: {
    fontSize: 12.8,
    fontFamily: 'Lora_400Regular',
    fontWeight: '600',
    color: '#766860',
    letterSpacing: 0.5,
  },
});
