import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
  TextInput,
  SafeAreaView,
  Modal,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as Location from "expo-location";
import { Camera as CameraIcon, Image as ImageIcon, X, Sparkles, ChevronDown, ChevronUp, Info, Zap, Camera, MapPin } from "lucide-react-native";
import { generateText } from "@rork/toolkit-sdk";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { mockMonuments } from "@/data/mockMonuments";
import Colors from "@/constants/colors";
import CustomCamera from "@/components/CustomCamera";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const { reanalyzeImage, showContext } = useLocalSearchParams();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string>("");
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [showArtLabel, setShowArtLabel] = useState(false);
  const [scanMode, setScanMode] = useState<'city' | 'museum'>('city');
  const [labelImage, setLabelImage] = useState<string | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState({
    context: "",
  });
  const [isGpsEnabled, setIsGpsEnabled] = useState(false);
  const [photoSource, setPhotoSource] = useState<'camera' | 'gallery' | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState<Location.PermissionStatus | null>(null);
  const [locationAddress, setLocationAddress] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [showCustomCamera, setShowCustomCamera] = useState(false);
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();

  // Hide/show tab bar based on selectedImage state
  useEffect(() => {
    const parent = navigation.getParent();
    if (parent) {
      parent.setOptions({
        tabBarStyle: selectedImage ? {
          display: 'none'
        } : {
          backgroundColor: "transparent",
          borderTopWidth: 0,
          borderRadius: 25,
          marginHorizontal: 20,
          marginBottom: Platform.OS === "ios" ? 34 : 20,
          paddingBottom: 0,
          height: Platform.OS === "ios" ? 65 : 50,
          position: "absolute",
          shadowColor: "transparent",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0,
          shadowRadius: 0,
          elevation: 0,
        },
        tabBarBackground: selectedImage ? undefined : () => (
          <View style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#FEFEFE",
            borderRadius: 25,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 12,
          }} />
        )
      });
    }
    
    return () => {
      if (parent) {
        parent.setOptions({
          tabBarStyle: {
            backgroundColor: "transparent",
            borderTopWidth: 0,
            borderRadius: 25,
            marginHorizontal: 20,
            marginBottom: Platform.OS === "ios" ? 34 : 20,
            paddingBottom: 0,
            height: Platform.OS === "ios" ? 65 : 50,
            position: "absolute",
            shadowColor: "transparent",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0,
            shadowRadius: 0,
            elevation: 0,
          },
          tabBarBackground: () => (
            <View style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "#FEFEFE",
              borderRadius: 25,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 12,
            }} />
          )
        });
      }
    };
  }, [selectedImage, navigation]);

  // Handle reanalysis flow
  useEffect(() => {
    if (reanalyzeImage && typeof reanalyzeImage === 'string') {
      setSelectedImage(reanalyzeImage);
      if (showContext === 'true') {
        setShowAdditionalInfo(true);
      }
    }
  }, [reanalyzeImage, showContext]);

  // Request location permission and get location on mount
  useEffect(() => {
    const initLocation = async () => {
      await requestLocationPermission();
      // Automatically get location on mount for header display
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === Location.PermissionStatus.GRANTED) {
        await getCurrentLocation();
      }
      setIsLoadingLocation(false);
    };
    initLocation();
  }, []);

  // Get location when GPS is enabled
  useEffect(() => {
    if (isGpsEnabled && locationPermission === Location.PermissionStatus.GRANTED) {
      getCurrentLocation();
    }
  }, [isGpsEnabled, locationPermission]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);
      
      if (status !== Location.PermissionStatus.GRANTED) {
        console.log('Location permission denied');
        return;
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      if (Platform.OS === 'web') {
        // Use web geolocation API
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const location: Location.LocationObject = {
                coords: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  altitude: position.coords.altitude,
                  accuracy: position.coords.accuracy,
                  altitudeAccuracy: position.coords.altitudeAccuracy,
                  heading: position.coords.heading,
                  speed: position.coords.speed,
                },
                timestamp: position.timestamp,
              };
              setUserLocation(location);
              console.log('Web location obtained:', location.coords.latitude, location.coords.longitude);
              
              // Get address from coordinates
              await getAddressFromCoordinates(location.coords.latitude, location.coords.longitude);
            },
            (error) => {
              console.error('Web geolocation error:', error);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
          );
        } else {
          console.log('Geolocation not supported on this browser');
        }
      } else {
        // Use expo-location for mobile
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation(location);
        console.log('Mobile location obtained:', location.coords.latitude, location.coords.longitude);
        
        // Get address from coordinates
        await getAddressFromCoordinates(location.coords.latitude, location.coords.longitude);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Location Error', 'Unable to get your current location. Please try again.');
    }
  };

  const getAddressFromCoordinates = async (latitude: number, longitude: number) => {
    try {
      if (Platform.OS === 'web') {
        // Use a reverse geocoding service for web
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
        
        // Extract district, city, and country in proper format
        const district = data.locality || data.principalSubdivision || '';
        const city = data.city || '';
        const country = data.countryName || '';
        
        // Format as "district, city, country"
        let addressString = '';
        const parts = [];
        if (district) parts.push(district);
        if (city && city !== district) parts.push(city);
        if (country) parts.push(country);
        
        addressString = parts.join(', ');
        
        setLocationAddress(addressString || 'Location detected');
        console.log('Address obtained (district, city, country):', addressString);
      } else {
        // Use expo-location reverse geocoding for mobile
        const addresses = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        
        if (addresses && addresses.length > 0) {
          const address = addresses[0];
          
          // Extract district, city, and country in proper format
          const district = address.district || address.subregion || '';
          const city = address.city || address.region || '';
          const country = address.country || '';
          
          // Format as "district, city, country"
          let addressString = '';
          const parts = [];
          if (district) parts.push(district);
          if (city && city !== district) parts.push(city);
          if (country) parts.push(country);
          
          addressString = parts.join(', ');
          
          setLocationAddress(addressString || 'Location detected');
          console.log('Address obtained (district, city, country):', addressString);
        } else {
          setLocationAddress('Location detected');
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

  const pickImageFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Please allow access to your photo library to select images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // 1:1 aspect ratio
      quality: 0.6,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setPhotoSource('gallery');
      setIsGpsEnabled(false); // Default off for gallery photos
    }
  };

  const takePhoto = async () => {
    // Always try to use custom camera first, including on web
    setShowCustomCamera(true);
  };

  const handleCustomCameraPhoto = (uri: string) => {
    setShowCustomCamera(false);
    router.push({
      pathname: '/photo-confirmation' as any,
      params: {
        photoUri: uri,
        scanMode: scanMode,
      },
    });
  };
  
  const handleTwoPhotosTaken = (artworkUri: string, labelUri: string) => {
    setShowCustomCamera(false);
    router.push({
      pathname: '/photo-confirmation' as any,
      params: {
        photoUri: artworkUri,
        labelUri: labelUri,
        scanMode: scanMode,
      },
    });
  };

  const handleCustomCameraClose = () => {
    setShowCustomCamera(false);
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setAnalysisStatus("Preparing image...");
    
    // Start the progressive animation - 10 seconds timed animation
    progressAnimation.setValue(0);
    const progressTimer = Animated.timing(progressAnimation, {
      toValue: 1,
      duration: 10000, // 10 seconds timed animation
      useNativeDriver: false,
    });
    progressTimer.start();
    
    try {
      setAnalysisStatus("Compressing image...");
      
      // Compress image to reduce size for API
      const compressedImage = await ImageManipulator.manipulateAsync(
        selectedImage,
        [
          // Resize to max 1024px on longest side to reduce file size
          { resize: { width: 1024 } }
        ],
        {
          compress: 0.7, // 70% quality
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true
        }
      );
      
      if (!compressedImage.base64) {
        throw new Error('Failed to compress image');
      }
      
      const base64 = compressedImage.base64;
      
      setAnalysisStatus("Image compressed successfully...");

      setAnalysisStatus("Analyzing monuments and art with AI...");
      
      // Validate base64 data
      if (!base64 || base64.length === 0) {
        throw new Error('Invalid image data: base64 is empty');
      }
      
      // Check if compressed base64 is still too large (limit to ~1MB for better compatibility)
      if (base64.length > 1000000) {
        console.log('Image still too large after compression, applying additional compression...');
        
        // Apply more aggressive compression
        const furtherCompressed = await ImageManipulator.manipulateAsync(
          selectedImage,
          [
            { resize: { width: 800 } }
          ],
          {
            compress: 0.5, // 50% quality
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true
          }
        );
        
        if (!furtherCompressed.base64) {
          throw new Error('Failed to compress image further');
        }
        
        const finalBase64 = furtherCompressed.base64;
        
        // Final check - if still too large, throw error
        if (finalBase64.length > 1000000) {
          throw new Error('Image is too large even after compression. Please use a smaller image.');
        }
        
        // Use the further compressed image
        console.log('Using further compressed image. Final size:', finalBase64.length, 'characters');
        
        // Update base64 variable for the rest of the function
        const base64Final = finalBase64;
        
        // Continue with the compressed image
        await processImageAnalysis(base64Final);
        return;
      }
      
      // Continue with normally compressed image
      await processImageAnalysis(base64);
      
    } catch (error) {
      console.error('Error detecting monuments and art:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      let errorMessage = 'Failed to analyze the image. Please try again.';
      let detailedError = '';
      
      if (error instanceof Error) {
        detailedError = error.message;
        if (error.message.includes('too large')) {
          errorMessage = 'Image is too large. Please use a smaller image or reduce quality.';
        } else if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('Network error')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('JSON')) {
          errorMessage = 'There was an issue processing the AI response. Please try again.';
        } else if (error.message.includes('Invalid image')) {
          errorMessage = 'Invalid image format. Please select a different image.';
        } else if (error.message.includes('compress')) {
          errorMessage = 'Failed to process the image. Please try with a different image.';
        }
      }
      
      console.log('Showing error alert with message:', errorMessage);
      console.log('Detailed error:', detailedError);
      
      Alert.alert(
        'Analysis Failed', 
        `${errorMessage}\n\nTechnical details: ${detailedError}`,
        [
          { text: 'OK', onPress: () => console.log('User acknowledged error') }
        ]
      );
    } finally {
      setIsAnalyzing(false);
      setAnalysisStatus("");
      // Reset animation after a short delay to show completion
      setTimeout(() => {
        progressAnimation.setValue(0);
      }, 500);
    }
  };
  
  const processImageAnalysis = async (base64: string) => {
      // Build the prompt based on scan mode
      let promptText = '';
      
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
3. For recognition, always provide the ACTUAL origin/culture of the object in the following format: 'Culture/Region, Country' or 'Period, Location'. If not recognized, return the value 'Unknown'.

Output format:
Return ALL information in the following EXACT JSON format (ensure valid JSON, proper escaping, no control characters):

{
  "name": "Name or 'Unknown'",
  "origin": "Culture/Region, Country or Period, Location or 'Unknown'",
  "period": "Year(s) or century (e.g., '1503', '15th century', '1800s', '12th–13th century') or 'Unknown'",
  "isRecognized": true/false,
  "detailedDescription": {
    "keyTakeaways": [
      "First key takeaway — specific and informative or 'Unknown'",
      "Second key takeaway — specific and informative or 'Unknown'",
      "Third key takeaway — specific and informative or 'Unknown'",
      "Fourth key takeaway — specific and informative or 'Unknown'"
    ],
    "inDepthContext": "Task: Provide exactly 3 condensed paragraphs totaling around 400–450 words about the specific museum object (if recognized). Begin in medias res with a vivid anecdote or striking event.\n\nParagraph 1 (origins): Blend a striking story with the historical origins, context of creation, culture/artist or patron, and political/cultural background with specific dates.\n\nParagraph 2 (visuals): Continue narratively as if the reader is examining the object, describing step by step its style, materials, dimensions, and distinctive features. Integrate description into the story naturally.\n\nParagraph 3 (impact): Explain its cultural significance and historical importance through its use, symbolic meanings, notable historical events, and modern relevance. Conclude with a powerful closing anecdote that resolves the story.\n\nEmphasize human stories slightly more than historical facts, but keep both strongly integrated. Avoid detached cataloging or generic comments. If not recognized, return 'Unknown'."
  },
  "curiosities": "One striking anecdote, unusual fact, or rarely known detail about this object. If none verified or not recognized, write 'Unknown'."
}

Critical requirements:
- If not recognized: ALL fields (name, origin, period, keyTakeaways, inDepthContext, curiosities) should return 'Unknown'.
- origin must always be in 'Culture/Region, Country' or 'Period, Location' format or 'Unknown'.
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

Analyze the provided museum object and its label to identify the artifact. You will receive two images: the museum object itself and its accompanying label/information card.

Rules for identification:
1. Be EXTREMELY CONSERVATIVE. Only provide a specific identification if you are at least 95% confident. If confidence is lower, mark as NOT RECOGNIZED and provide only general analysis.
2. Use both the object image and label information to make your identification. The label may contain crucial details about the object's origin, date, culture, or significance.
3. For recognition, always provide the ACTUAL origin/culture of the object in the following format: 'Culture/Region, Country' or 'Period, Location'. If not recognized, return the value 'Unknown'.

Output format:
Return ALL information in the following EXACT JSON format (ensure valid JSON, proper escaping, no control characters):

{
  "name": "Name or 'Unknown'",
  "origin": "Culture/Region, Country or Period, Location or 'Unknown'",
  "period": "Year(s) or century (e.g., '1503', '15th century', '1800s', '12th–13th century') or 'Unknown'",
  "isRecognized": true/false,
  "detailedDescription": {
    "keyTakeaways": [
      "First key takeaway — specific and informative or 'Unknown'",
      "Second key takeaway — specific and informative or 'Unknown'",
      "Third key takeaway — specific and informative or 'Unknown'",
      "Fourth key takeaway — specific and informative or 'Unknown'"
    ],
    "inDepthContext": "Task: Provide exactly 3 condensed paragraphs totaling around 400–450 words about the specific museum object (if recognized). Begin in medias res with a vivid anecdote or striking event.\n\nParagraph 1 (origins): Blend a striking story with the historical origins, context of creation, culture/artist or patron, and political/cultural background with specific dates.\n\nParagraph 2 (visuals): Continue narratively as if the reader is examining the object, describing step by step its style, materials, dimensions, and distinctive features. Integrate description into the story naturally.\n\nParagraph 3 (impact): Explain its cultural significance and historical importance through its use, symbolic meanings, notable historical events, and modern relevance. Conclude with a powerful closing anecdote that resolves the story.\n\nEmphasize human stories slightly more than historical facts, but keep both strongly integrated. Avoid detached cataloging or generic comments. If not recognized, return 'Unknown'."
  },
  "curiosities": "One striking anecdote, unusual fact, or rarely known detail about this object. If none verified or not recognized, write 'Unknown'."
}

Critical requirements:
- If not recognized: ALL fields (name, origin, period, keyTakeaways, inDepthContext, curiosities) should return 'Unknown'.
- origin must always be in 'Culture/Region, Country' or 'Period, Location' format or 'Unknown'.
- isRecognized must be true only if confidence ≥95%.
- keyTakeaways must contain exactly 4 bullet points.
- Output must always be valid JSON.
- Provide actual historical context, not filler text.`;
      }
      
      // Add location context if GPS is enabled and location is available
      if (isGpsEnabled && userLocation) {
        if (scanMode === 'museum') {
          promptText += ` If the user's location is available, only consider artworks in museums/galleries within a 4 km radius. Prioritize matches where label/context, artwork details, and location all align.`;
        } else {
          promptText += ` If the user's location is available, only consider monuments and landmarks within a 4 km radius of that location. Prioritize matches where both the visual details and the location align.`;
        }
        
        // Include formatted location address if available
        let locationContext = `\n\n**GPS LOCATION CONTEXT - User's current location:**\nLatitude: ${userLocation.coords.latitude}\nLongitude: ${userLocation.coords.longitude}\nAccuracy: ${userLocation.coords.accuracy}m`;
        
        if (locationAddress && locationAddress !== 'Location detected') {
          locationContext += `\nFormatted Address: ${locationAddress}`;
        }
        
        promptText += locationContext;
        console.log('🗺️ Location context added to AI prompt:', locationAddress);
      } else {
        console.log('🗺️ Location not included - GPS disabled or location unavailable');
      }
      
      // Add final confidence requirement
      promptText += `\n\nIf confidence is below 95%, mark as not recognized and provide general analysis instead.`;
      
      // Add additional context if provided
      const hasAdditionalInfo = additionalInfo.context.trim().length > 0;
      if (hasAdditionalInfo) {
        promptText += `\n\n**CRITICAL USER CONTEXT - PRIORITIZE THIS INFORMATION HEAVILY:**\n"${additionalInfo.context}"\n\nWith this context provided, you should:\n1. STRONGLY prioritize monuments and art that match any location, name, or details mentioned\n2. If the visual matches reasonably well with the provided context, increase confidence significantly\n3. Use any names, locations, museums, or other details mentioned as key identifying factors\n4. Consider all provided information as important context clues for identification`;
      }
      
      promptText += `\n\nProvide ALL information in ONE response. Only mark isRecognized as true if confidence is 95% or higher. Always provide the ACTUAL location, not user's location unless they match. If not 95% confident, provide general analysis of what you see without claiming specific identification.

Respond in this exact JSON format (ensure all strings are properly escaped and no control characters are included):
{
"artworkName": "Name or 'Unknown Monuments and Art'",
"confidence": 85,
"location": "Actual location",
"period": "Year(s) or century format (e.g., '1503', '15th century', '1800s', '12th-13th century') or 'Unknown'",
"isRecognized": true/false,
"detailedDescription": {
  "keyTakeaways": [
    "First key takeaway bullet point - must be specific and informative",
    "Second key takeaway bullet point - must be specific and informative", 
    "Third key takeaway bullet point - must be specific and informative",
    "Fourth key takeaway bullet point - must be specific and informative"
  ],
  "inDepthContext": "Write exactly 3 condensed paragraphs (together totaling around 400–450 words) about [TOPIC]. Separate paragraphs with double line breaks only. Use bold highlights for key terms. Be specific, vivid, and deeply engaging — avoid generalizations. The narrative must be tailored to the specific monument or artwork, not generic, and should feel like a flowing story. Weave in short anecdotes that both open and close within paragraphs to create a dynamic rhythm. Slightly prioritize human stories (rulers, artists, workers, visitors, conquerors) while still delivering historical and artistic context. You may be creative with how information is ordered and how the story flows depending on the topic, but the following remains a strong suggestion:\nFirst paragraph: Start in medias res with a striking story or anecdote directly tied to the monument/artwork, while covering its historical origins, creation context, artist/architect background, and the broader political or cultural significance of the period, with specific dates.\nSecond paragraph: Smoothly continue the story, blending vivid visual description of this particular monument/artwork into the narrative itself — not as a detached catalog, but as if the reader is walking through it while the story unfolds. Mention materials, techniques, style, dimensions, and unique features naturally within this flow.\nThird paragraph: Carry the story forward into the monument/artwork's cultural impact and significance over time — myths, shifting meanings, and notable events or anecdotes tied to it. Keep prioritizing human experiences and end with a strong, memorable closing that feels like the resolution of a story.",
  "curiosities": "ONE interesting anecdote, lesser-known fact, or unusual story. If none are known, write 'No widely known curiosities are associated with these monuments and art.'"
}
}

CRITICAL: The keyTakeaways array MUST contain exactly 4 bullet points. Each bullet point should be a complete, informative sentence about the monument/artwork. The curiosities field should contain only ONE curiosity, not multiple. Ensure all text is properly escaped for JSON.`;
      
      // Call the AI API with proper error handling
      console.log('Making AI API request...');
      console.log('Prompt length:', promptText.length, 'characters');
      console.log('Base64 length:', base64.length, 'characters');
      
      setAnalysisStatus("Sending to AI for analysis...");
      
      // Validate prompt length (API might have limits)
      if (promptText.length > 16000) {
        console.warn('Prompt is very long, truncating...');
        promptText = promptText.substring(0, 15000) + '\n\nRespond in the exact JSON format specified above.';
      }
      
      // Log the actual prompt being sent for debugging
      console.log('Full prompt being sent:', promptText.substring(0, 500) + '...');
      
      // Prepare content array with main image
      const contentArray: Array<{ type: 'text'; text: string } | { type: 'image'; image: string }> = [
        { type: 'text', text: promptText },
        { type: 'image', image: base64 }
      ];
      
      // Add label image if provided (museum mode)
      if (scanMode === 'museum' && labelImage) {
        try {
          setAnalysisStatus("Processing label image...");
          const compressedLabel = await ImageManipulator.manipulateAsync(
            labelImage,
            [{ resize: { width: 800 } }],
            {
              compress: 0.7,
              format: ImageManipulator.SaveFormat.JPEG,
              base64: true
            }
          );
          
          if (compressedLabel.base64) {
            contentArray.push({ 
              type: 'text', 
              text: '\n\n**LABEL/PLACARD IMAGE - This shows the museum label or information placard for the artwork. Use this to identify the piece name, artist, date, and other details:**' 
            });
            contentArray.push({ type: 'image', image: compressedLabel.base64 });
          }
        } catch (labelError) {
          console.warn('Failed to process label image:', labelError);
        }
      }
      
      const requestBody = {
        messages: [
          {
            role: 'user',
            content: contentArray
          }
        ]
      };
      
      console.log('Request body size:', JSON.stringify(requestBody).length, 'characters');
      console.log('Sending request to AI API...');
      console.log('Request structure:', {
        messagesCount: requestBody.messages.length,
        contentArrayLength: requestBody.messages[0].content.length,
        hasImages: requestBody.messages[0].content.filter(c => c.type === 'image').length
      });
      
      let cleanedResponse;
      try {
        console.log('Calling generateText with messages...');
        
        // Use generateText from @rork/toolkit-sdk
        cleanedResponse = await generateText({
          messages: requestBody.messages as any
        });
        
        console.log('AI response received successfully');
      } catch (networkError) {
        console.error('Network error during AI request:', networkError);
        
        // Check if it's a size-related error
        if (networkError instanceof Error && networkError.message.includes('413')) {
          console.log('Likely image size issue, suggesting compression');
          Alert.alert(
            'Image Too Large', 
            'The image is too large for analysis. Please try with a smaller image or take a new photo with lower quality.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        // Always provide a fallback response for other errors
        console.log('AI service error, using fallback response');
        console.error('Full error details:', networkError);
        
        // Show the actual error to user for debugging
        const errorMessage = `Analysis error: ${networkError instanceof Error ? networkError.message : 'Unknown error'}`;
        console.error('Showing error alert:', errorMessage);
        
        Alert.alert(
          'Analysis Failed', 
          errorMessage,
          [
            { text: 'Show Fallback', onPress: () => {
              console.log('User chose to show fallback response');
            } },
            { text: 'Cancel', style: 'cancel', onPress: () => { 
              console.log('User cancelled analysis');
              setIsAnalyzing(false); 
              setAnalysisStatus(''); 
              return; 
            } }
          ]
        );
        
        setAnalysisStatus("The AI analysis service is temporarily unavailable. Please try again shortly.");
        
        // Create a fallback analysis result
        const fallbackResult = {
          artworkName: "Monument or Artwork",
          confidence: 50,
          location: "Location Unknown",
          period: "Unknown",
          isRecognized: false,
          detailedDescription: {
            keyTakeaways: [
              "The AI analysis service is currently experiencing technical difficulties.",
              "This could be due to high server load or temporary maintenance.",
              "Please try scanning again in a few moments.",
              "Adding context information may help improve results when the service is restored."
            ],
            inDepthContext: "The AI analysis service is temporarily unavailable due to technical issues. This is likely a temporary problem that should resolve shortly.\n\nWhile we work to restore full service, you can try again in a few minutes. For better results when the service is restored, consider adding context information such as the monument's name, location, or museum.\n\nWe apologize for the inconvenience and appreciate your patience.",
            curiosities: "Service temporarily unavailable - please try again shortly."
          }
        };
        
        // Navigate to scan result with fallback data
        router.push({
          pathname: "/scan-result" as any,
          params: {
            artworkName: fallbackResult.artworkName,
            confidence: fallbackResult.confidence.toString(),
            location: fallbackResult.location,
            period: fallbackResult.period,
            isRecognized: fallbackResult.isRecognized.toString(),
            keyTakeaways: JSON.stringify(fallbackResult.detailedDescription.keyTakeaways),
            inDepthContext: fallbackResult.detailedDescription.inDepthContext,
            curiosities: fallbackResult.detailedDescription.curiosities,
            scannedImage: selectedImage,
          },
        });
        return;
      }
      
      setAnalysisStatus("Processing AI response...");
      
      console.log('Raw AI response:', cleanedResponse);
      
      // Remove markdown code blocks and clean up
      cleanedResponse = cleanedResponse
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      
      console.log('Cleaned content that will be parsed:', cleanedResponse);
      
      let analysisResult;
      try {
        // First attempt: try parsing as-is
        analysisResult = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        
        let jsonString = '';
        try {
          // Extract JSON object from the response
          const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error('No JSON object found in response');
          }
          
          jsonString = jsonMatch[0];
          
          // Fix common JSON issues - more comprehensive approach
          jsonString = jsonString
            // Remove any control characters first
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
            // Remove markdown bold formatting first
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            // Remove markdown italic formatting
            .replace(/\*([^*]+)\*/g, '$1')
            // Fix literal newlines, tabs, and carriage returns in string values
            .replace(/([":])\s*([^"]*?)\n/g, (match, prefix, content) => {
              return prefix + content.replace(/\n/g, '\\n');
            })
            .replace(/\t/g, ' ')
            .replace(/\r/g, '')
            .trim();
          
          console.log('Attempting to parse cleaned JSON:', jsonString.substring(0, 200) + '...');
          analysisResult = JSON.parse(jsonString);
        } catch (secondParseError) {
          console.error('Second JSON parse attempt also failed:', secondParseError);
          if (jsonString) {
            console.error('Problematic JSON string:', jsonString.substring(0, 500));
          }
          
          // Create a fallback response if JSON parsing completely fails
          console.log('Creating fallback response due to JSON parsing failure');
          analysisResult = {
            artworkName: "Monument or Artwork",
            confidence: 50,
            location: "Location Unknown",
            period: "Unknown",
            isRecognized: false,
            detailedDescription: {
              keyTakeaways: [
                "AI analysis encountered a technical issue.",
                "The monument or artwork could not be fully identified.",
                "Please try scanning again or add context information.",
                "Consider taking a clearer photo with better lighting."
              ],
              inDepthContext: "The AI analysis service encountered a technical issue while processing this image. This could be due to image quality, lighting conditions, or temporary service issues.\n\nTo improve results, try taking a clearer photo with good lighting and minimal reflections.\n\nYou can also add context information such as the location or name of the monument to help with identification.",
              curiosities: "Technical analysis was not completed due to processing issues."
            }
          };
        }
      }
      
      setAnalysisStatus("Analysis complete! Preparing results...");
      
      // Navigate to scan result with AI analysis data
      router.push({
        pathname: "/scan-result" as any,
        params: {
          artworkName: analysisResult.artworkName,
          confidence: analysisResult.confidence.toString(),
          location: analysisResult.location,
          period: analysisResult.period,
          isRecognized: analysisResult.isRecognized.toString(),
          keyTakeaways: JSON.stringify(analysisResult.detailedDescription.keyTakeaways),
          inDepthContext: analysisResult.detailedDescription.inDepthContext,
          curiosities: analysisResult.detailedDescription.curiosities,
          scannedImage: selectedImage,
        },
      });
  };

  const clearImage = () => {
    setSelectedImage(null);
    setLabelImage(null);
    setAdditionalInfo({
      context: "",
    });
    setIsGpsEnabled(false);
    setPhotoSource(null);
    setLocationAddress(null);
  };

  const pickLabelImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Please allow access to your photo library to select images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // 1:1 aspect ratio for labels too
      quality: 0.6,
    });

    if (!result.canceled && result.assets[0]) {
      setLabelImage(result.assets[0].uri);
    }
  };

  const takeLabelPhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Please allow access to your camera to take photos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1], // 1:1 aspect ratio for labels too
      quality: 0.6,
    });

    if (!result.canceled && result.assets[0]) {
      setLabelImage(result.assets[0].uri);
    }
  };

  const clearLabelImage = () => {
    setLabelImage(null);
  };

  const updateAdditionalInfo = (value: string) => {
    setAdditionalInfo({ context: value });
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        {!selectedImage && (
          <View style={[styles.headerSection, { paddingTop: insets.top + 8 }]}>
            <LinearGradient
              colors={['rgba(118, 104, 96, 0.36)', 'rgba(225, 222, 220, 0.36)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.headerGradient}
            />
            <View style={[styles.topRow, { top: insets.top + 20 }]}>
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
        )}



        {!selectedImage ? (
          <View style={styles.cardsSection}>
            <TouchableOpacity 
              style={styles.modeCard}
              onPress={() => {
                setScanMode('city');
                takePhoto();
              }}
            >
              <Image 
                source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/c5elatphjoswzd5gucgy6' }}
                style={styles.cardImage}
                resizeMode="cover"
              />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modeCard}
              onPress={() => {
                setScanMode('museum');
                takePhoto();
              }}
            >
              <Image 
                source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/ymtvqze8va54lbqo29dny' }}
                style={styles.cardImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.selectedImageContainer}>
              <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
              
              {isAnalyzing && (
                <Animated.View 
                  style={[
                    styles.scanningLine,
                    {
                      left: progressAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-4, screenWidth],
                      }),
                    }
                  ]} 
                />
              )}
              
              <TouchableOpacity style={styles.clearButton} onPress={clearImage}>
                <X size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Custom Camera Modal */}
        <Modal
          visible={showCustomCamera}
          animationType="slide"
          presentationStyle="fullScreen"
          statusBarTranslucent
        >
          <CustomCamera
            onClose={handleCustomCameraClose}
            onPhotoTaken={handleCustomCameraPhoto}
            onTwoPhotosTaken={handleTwoPhotosTaken}
            isMuseumMode={scanMode === 'museum'}
          />
        </Modal>

        {/* GPS Location and Art Label Section - Museum Mode */}
        {selectedImage && scanMode === 'museum' && !isAnalyzing && (
          <View style={styles.cityControlsSection}>
            <View style={[styles.cityControlsContainer]}>
              {/* GPS Location Toggle */}
              <View style={styles.gpsContainer}>
                <View style={styles.gpsLeft}>
                  <MapPin size={20} color={Colors.accent.secondary} />
                  <View style={styles.gpsTextContainer}>
                    <Text style={styles.gpsText}>Use current location</Text>
                    {isGpsEnabled && locationAddress && (
                      <Text style={styles.gpsLocationText}>
                        {locationAddress}
                      </Text>
                    )}
                    {isGpsEnabled && !locationAddress && locationPermission === Location.PermissionStatus.GRANTED && (
                      <Text style={styles.gpsLocationText}>Getting location...</Text>
                    )}
                    {isGpsEnabled && locationPermission !== Location.PermissionStatus.GRANTED && (
                      <Text style={styles.gpsLocationText}>Location permission needed</Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity 
                  style={[styles.gpsToggle, isGpsEnabled && styles.gpsToggleActive]}
                  onPress={() => {
                    if (!isGpsEnabled && locationPermission !== Location.PermissionStatus.GRANTED) {
                      requestLocationPermission().then(() => {
                        setIsGpsEnabled(true);
                      });
                    } else {
                      setIsGpsEnabled(!isGpsEnabled);
                    }
                  }}
                >
                  <View style={[styles.gpsToggleThumb, isGpsEnabled && styles.gpsToggleThumbActive]} />
                </TouchableOpacity>
              </View>

              {/* Subtle separator line */}
              <View style={styles.controlsSeparator} />

              {/* Art Label Section */}
              <View style={styles.artLabelContainer}>
              <TouchableOpacity 
                style={styles.artLabelToggle}
                onPress={() => setShowArtLabel(!showArtLabel)}
              >
                <View style={styles.artLabelToggleLeft}>
                  <Camera size={20} color={Colors.accent.secondary} />
                  <Text style={styles.artLabelToggleText}>Art Label</Text>
                  <View style={[styles.requiredBadge, labelImage && styles.uploadedBadge]}>
                    <Text style={styles.requiredText}>{labelImage ? 'Uploaded' : 'Required'}</Text>
                  </View>
                </View>
                {showArtLabel ? (
                  <ChevronUp size={20} color={Colors.accent.secondary} />
                ) : (
                  <ChevronDown size={20} color={Colors.accent.secondary} />
                )}
              </TouchableOpacity>

              {showArtLabel && (
                <View style={styles.artLabelForm}>
                  {labelImage ? (
                    <View style={styles.labelImageContainer}>
                      <Image source={{ uri: labelImage }} style={styles.labelImage} />
                      <TouchableOpacity style={styles.clearLabelButton} onPress={clearLabelImage}>
                        <X size={16} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.artLabelInputGroup}>
                      <Text style={styles.artLabelPlaceholderText}>Add a photo of the artwork's label or placard</Text>
                      <View style={styles.labelButtons}>
                        <TouchableOpacity style={styles.labelButton} onPress={takeLabelPhoto}>
                          <CameraIcon size={16} color={Colors.accent.secondary} />
                          <Text style={styles.labelButtonText}>Take Photo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.labelButton} onPress={pickLabelImage}>
                          <ImageIcon size={16} color={Colors.accent.secondary} />
                          <Text style={styles.labelButtonText}>From Gallery</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                  
                  {/* Add Context Section - Only when no label available */}
                  {!labelImage && (
                    <View style={styles.contextInLabelSection}>
                      <TouchableOpacity 
                        style={styles.artLabelNotAvailableToggle}
                        onPress={() => setShowAdditionalInfo(!showAdditionalInfo)}
                      >
                        <View style={styles.artLabelNotAvailableToggleLeft}>
                          <Info size={20} color={Colors.accent.secondary} />
                          <Text style={styles.artLabelNotAvailableToggleText}>Art label not available?</Text>
                        </View>
                        {showAdditionalInfo ? (
                          <ChevronUp size={20} color={Colors.accent.secondary} />
                        ) : (
                          <ChevronDown size={20} color={Colors.accent.secondary} />
                        )}
                      </TouchableOpacity>

                      {showAdditionalInfo && (
                        <View style={styles.artLabelContextForm}>
                          <View style={styles.artLabelContextInputGroup}>
                            <TextInput
                              style={styles.artLabelContextTextInput}
                              placeholder="Add details like author, artwork name, museum gallery collection..."
                              placeholderTextColor="#999"
                              value={additionalInfo.context}
                              onChangeText={updateAdditionalInfo}
                              multiline
                              numberOfLines={4}
                            />
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}
              </View>
            </View>
          </View>
        )}

        {/* GPS Location and Context Section - Show for city mode only */}
        {selectedImage && scanMode === 'city' && !isAnalyzing && (
          <View style={styles.cityControlsSection}>
            <View style={styles.cityControlsContainer}>
              {/* GPS Location Toggle */}
              <View style={styles.gpsContainer}>
                <View style={styles.gpsLeft}>
                  <MapPin size={20} color={Colors.accent.secondary} />
                  <View style={styles.gpsTextContainer}>
                    <Text style={styles.gpsText}>Use current location</Text>
                    {isGpsEnabled && locationAddress && (
                      <Text style={styles.gpsLocationText}>
                        {locationAddress}
                      </Text>
                    )}
                    {isGpsEnabled && !locationAddress && locationPermission === Location.PermissionStatus.GRANTED && (
                      <Text style={styles.gpsLocationText}>Getting location...</Text>
                    )}
                    {isGpsEnabled && locationPermission !== Location.PermissionStatus.GRANTED && (
                      <Text style={styles.gpsLocationText}>Location permission needed</Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity 
                  style={[styles.gpsToggle, isGpsEnabled && styles.gpsToggleActive]}
                  onPress={() => {
                    if (!isGpsEnabled && locationPermission !== Location.PermissionStatus.GRANTED) {
                      requestLocationPermission().then(() => {
                        setIsGpsEnabled(true);
                      });
                    } else {
                      setIsGpsEnabled(!isGpsEnabled);
                    }
                  }}
                >
                  <View style={[styles.gpsToggleThumb, isGpsEnabled && styles.gpsToggleThumbActive]} />
                </TouchableOpacity>
              </View>

              {/* Subtle separator line */}
              <View style={styles.controlsSeparator} />

              {/* Add Context Section */}
              <View style={styles.contextContainer}>
                <TouchableOpacity 
                  style={styles.contextToggle}
                  onPress={() => setShowAdditionalInfo(!showAdditionalInfo)}
                >
                  <View style={styles.contextToggleLeft}>
                    <Info size={20} color={Colors.accent.secondary} />
                    <Text style={styles.contextToggleText}>Add Context</Text>
                    <View style={styles.optionalBadge}>
                      <Text style={styles.optionalText}>Optional</Text>
                    </View>
                  </View>
                  {showAdditionalInfo ? (
                    <ChevronUp size={20} color={Colors.accent.secondary} />
                  ) : (
                    <ChevronDown size={20} color={Colors.accent.secondary} />
                  )}
                </TouchableOpacity>

                {showAdditionalInfo && (
                  <View style={styles.contextForm}>
                    <View style={styles.contextInputGroup}>
                      <TextInput
                        style={styles.contextTextInput}
                        placeholder="Add details like location, neighborhood, or landmark information"
                        placeholderTextColor="#999"
                        value={additionalInfo.context}
                        onChangeText={updateAdditionalInfo}
                        multiline
                        numberOfLines={4}
                      />
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {selectedImage && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.analyzeButton, 
                (isAnalyzing || (scanMode === 'museum' && !labelImage && !additionalInfo.context.trim())) && styles.analyzeButtonDisabled
              ]}
              onPress={analyzeImage}
              disabled={isAnalyzing || (scanMode === 'museum' && !labelImage && !additionalInfo.context.trim())}
            >
              {isAnalyzing ? (
                <View style={styles.analyzingContainer}>
                  {/* Progressive brown background */}
                  <Animated.View 
                    style={[
                      styles.progressBackground,
                      {
                        width: progressAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      }
                    ]} 
                  />
                  <View style={styles.buttonContent}>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text style={styles.analyzeButtonText}>{analysisStatus}</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.analyzeContainer}>
                  <Sparkles size={20} color="#ffffff" />
                  <Text style={styles.analyzeButtonText}>
                    {scanMode === 'museum' && !labelImage && !additionalInfo.context.trim()
                      ? 'Add Label Photo or Context to Continue'
                      : 'Discover History'
                    }
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}


        </ScrollView>
        <View style={styles.bottomSpacer} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    backgroundColor: Colors.background,
  },
  headerContainer: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 24,
    minHeight: 160,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 14,
    marginTop: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },


  headerTitle: {
    fontSize: 28,
    fontFamily: "Lora_400Regular",
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
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
  headerStats: {
    flexDirection: "row",
    gap: 24,
    marginTop: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 13,
    fontFamily: "Lora_400Regular",
    color: Colors.text.muted,
  },
  section: {
    marginTop: 12,
    paddingHorizontal: 14,
  },
  cityControlsSection: {
    marginTop: 6,
    paddingHorizontal: 14,
  },
  cityControlsContainer: {
    width: '90%', // 10% less width
    alignSelf: 'center',
  },
  controlsSeparator: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: 4, // Further reduced to bring buttons closer
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "Lora_400Regular",
    fontWeight: "500",
    color: Colors.text.primary,
    marginBottom: 20,
  },
  selectedImageContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 8,
  },
  selectedImage: {
    width: '100%',
    aspectRatio: 1, // 1:1 aspect ratio
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: 16,
  },
  clearButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    padding: 8,
  },
  placeholderContainer: {
    aspectRatio: 1, // 1:1 aspect ratio
    borderRadius: 16,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  placeholderContent: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 18,
    fontFamily: "Lora_400Regular",
    fontWeight: "500",
    color: Colors.text.primary,
  },
  placeholderSubtext: {
    fontSize: 14,
    fontFamily: "Lora_400Regular",
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 10,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: "Lora_400Regular",
    fontWeight: "500",
    color: Colors.accent.secondary,
  },
  contextCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  artLabelContainer: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  artLabelToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10, // Match contextToggle spacing
    paddingHorizontal: 0,
    minHeight: 52, // Match contextToggle height
    backgroundColor: 'transparent',
  },
  artLabelToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  artLabelToggleText: {
    fontSize: 15,
    fontFamily: "Lora_400Regular",
    fontWeight: "400",
    color: Colors.text.primary,
  },
  artLabelForm: {
    paddingHorizontal: 0,
    paddingTop: 16,
    backgroundColor: 'transparent',
  },
  artLabelInputGroup: {
    gap: 16,
    backgroundColor: 'transparent',
    marginBottom: 16,
  },
  artLabelPlaceholderText: {
    fontSize: 14,
    fontFamily: "Lora_400Regular",
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  contextContainer: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  contextToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10, // Further reduced to bring buttons closer
    paddingHorizontal: 0,
    minHeight: 52, // Further reduced
    backgroundColor: 'transparent',
  },
  contextToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contextToggleText: {
    fontSize: 15,
    fontFamily: "Lora_400Regular",
    fontWeight: "400",
    color: Colors.text.primary,
  },
  contextForm: {
    paddingHorizontal: 0,
    paddingTop: 16,
    backgroundColor: 'transparent',
  },
  contextInputGroup: {
    gap: 8,
  },
  contextInputLabel: {
    fontSize: 13,
    fontFamily: "Lora_400Regular",
    fontWeight: "500",
    color: Colors.text.primary,
    letterSpacing: 0.2,
  },
  contextInputHint: {
    fontSize: 11,
    fontFamily: "Lora_400Regular",
    color: Colors.text.muted,
    marginBottom: 6,
    lineHeight: 16,
  },
  contextTextInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    fontFamily: "Lora_400Regular",
    color: '#2C3E50',
    lineHeight: 20,
    height: 100,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  infoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  infoToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoToggleText: {
    fontSize: 15,
    fontFamily: "Lora_400Regular",
    fontWeight: "400",
    color: Colors.text.primary,
  },
  optionalBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  optionalText: {
    fontSize: 9,
    fontFamily: "Lora_400Regular",
    fontWeight: "600",
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  infoForm: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: "Lora_400Regular",
    fontWeight: "500",
    color: Colors.text.primary,
    letterSpacing: 0.2,
  },
  textInput: {
    backgroundColor: Colors.platinum,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    fontFamily: "Lora_400Regular",
    color: '#2C3E50',
    lineHeight: 20,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 11,
    fontFamily: "Lora_400Regular",
    color: Colors.text.muted,
    marginBottom: 6,
    lineHeight: 16,
  },
  analyzeButton: {
    backgroundColor: Colors.accent.secondary,
    borderRadius: 12,
    borderWidth: 0,
    paddingVertical: 14,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 50,
  },
  analyzeButtonDisabled: {
    backgroundColor: 'rgba(104, 89, 81, 0.3)', // Semi-transparent brown when disabled
  },
  analyzeGradient: {
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  analyzingContainer: {
    position: 'relative',
    width: '100%',
    minHeight: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBackground: {
    position: 'absolute',
    top: -14,
    left: -24,
    right: -24,
    bottom: -14,
    backgroundColor: '#685951',
    borderRadius: 12,
    zIndex: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    zIndex: 2,
  },
  analyzeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  analyzeButtonText: {
    fontSize: 16,
    fontFamily: "Lora_400Regular",
    fontWeight: "500",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonActive: {
    backgroundColor: Colors.accent.secondary,
  },
  modeButtonText: {
    fontSize: 16,
    fontFamily: "Lora_400Regular",
    fontWeight: "500",
    color: Colors.text.secondary,
  },
  modeButtonTextActive: {
    color: '#ffffff',
    fontWeight: "600",
  },
  labelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  labelHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  labelHeaderText: {
    fontSize: 16,
    fontFamily: "Lora_400Regular",
    fontWeight: "500",
    color: Colors.text.primary,
  },
  requiredBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  uploadedBadge: {
    backgroundColor: '#22c55e', // Green color for uploaded state
  },
  requiredText: {
    fontSize: 10,
    fontFamily: "Lora_400Regular",
    fontWeight: "500",
    color: '#ffffff',
  },
  labelImageContainer: {
    position: 'relative',
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.platinum,
  },
  labelImage: {
    width: '100%',
    aspectRatio: 1, // 1:1 aspect ratio for label images too
    resizeMode: 'cover',
  },
  clearLabelButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    padding: 6,
  },
  labelPlaceholder: {
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  labelPlaceholderText: {
    fontSize: 14,
    fontFamily: "Lora_400Regular",
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  labelButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 0,
  },
  labelButtonText: {
    fontSize: 14,
    fontFamily: "Lora_400Regular",
    fontWeight: "500",
    color: Colors.accent.secondary,
  },
  contextInLabelSection: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  artLabelNotAvailableToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 0,
    minHeight: 60,
    backgroundColor: 'transparent',
  },
  artLabelNotAvailableToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  artLabelNotAvailableToggleText: {
    fontSize: 15,
    fontFamily: "Lora_400Regular",
    fontWeight: "400",
    color: Colors.text.primary,
  },
  artLabelContextForm: {
    paddingHorizontal: 0,
    paddingTop: 16,
    backgroundColor: 'transparent',
  },
  artLabelContextInputGroup: {
    gap: 8,
  },
  artLabelContextTextInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    fontFamily: "Lora_400Regular",
    color: '#2C3E50',
    lineHeight: 20,
    height: 100,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  gpsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10, // Further reduced to bring buttons closer
    paddingHorizontal: 0,
    minHeight: 52, // Further reduced to match context toggle
    backgroundColor: 'transparent',
  },
  gpsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 16,
  },
  gpsTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  gpsText: {
    fontSize: 15,
    fontFamily: "Lora_400Regular",
    fontWeight: "400",
    color: Colors.text.primary,
  },
  gpsLocationText: {
    fontSize: 12,
    fontFamily: "Lora_400Regular",
    color: Colors.text.muted,
    marginTop: 2,
  },
  gpsToggle: {
    width: 46,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#e2e8f0',
    padding: 2,
    justifyContent: 'center',
  },
  gpsToggleActive: {
    backgroundColor: Colors.accent.secondary,
  },
  gpsToggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1.5,
    elevation: 2,
  },
  gpsToggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  gpsContainerMuseum: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  gpsTextMuseum: {
    fontSize: 14,
    fontFamily: "Lora_400Regular",
    fontWeight: "400",
    color: Colors.text.primary,
    marginLeft: 8,
  },
  gpsLocationTextMuseum: {
    fontSize: 11,
    fontFamily: "Lora_400Regular",
    color: Colors.text.muted,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  gpsToggleSmall: {
    width: 36,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
    padding: 2,
    justifyContent: 'center',
  },
  gpsToggleSmallActive: {
    backgroundColor: Colors.accent.secondary,
  },
  gpsToggleThumbSmall: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1.5,
    elevation: 2,
  },
  gpsToggleThumbSmallActive: {
    transform: [{ translateX: 16 }],
  },
  bottomSpacer: {
    height: 100,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    position: 'relative',
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
  topRow: {
    position: 'absolute',
    left: 20,
    right: 20,
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
    fontFamily: "Lora_400Regular",
    fontWeight: "400",
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
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#173248',
    opacity: 0.2,
    width: '100%',
    alignSelf: 'center',
  },
  cardsSection: {
    paddingHorizontal: 20,
    gap: 16,
    marginTop: 16,
  },
  modeCard: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: undefined,
    aspectRatio: 1.777,
    resizeMode: 'cover',
  },
  cardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  scanFrame: {
    width: '70%',
    height: '50%',
    position: 'relative',
  },
  scanCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 3,
  },
  scanCornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  scanCornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  scanCornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  scanCornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  cardLabel: {
    fontSize: 42,
    fontFamily: "Lora_400Regular",
    fontWeight: "700",
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  illustrationContainer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monumentsIllustration: {
    width: screenWidth * 1.0625,
    height: screenWidth * 0.75,
    maxWidth: 500,
    maxHeight: 350,
  },
  museumIllustration: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  scanningLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 4, // Made slightly wider for better visibility
    backgroundColor: Colors.accent.secondary,
    zIndex: 5,
    shadowColor: Colors.accent.secondary,
    shadowOffset: { width: 2, height: 0 }, // Added horizontal shadow
    shadowOpacity: 1.0, // Increased opacity
    shadowRadius: 6, // Increased shadow radius
    elevation: 10, // Increased elevation for Android
    opacity: 0.9, // Ensure it's visible
  },
});