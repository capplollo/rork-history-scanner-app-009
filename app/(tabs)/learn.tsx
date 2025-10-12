import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookOpen, Clock } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";

import Colors from "@/constants/colors";

const articles = [
  {
    id: "1",
    title: "The Mystery of Stonehenge",
    excerpt: "Unraveling the secrets of Britain's most enigmatic monument",
    image: "https://images.unsplash.com/photo-1599833975787-5d9f0e5d5c8e?w=400&h=300&fit=crop&q=80",
    readTime: "5 min",
  },
  {
    id: "2",
    title: "Pyramids: Engineering Marvels",
    excerpt: "How ancient Egyptians built structures that defy time",
    image: "https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=400&h=300&fit=crop&q=80",
    readTime: "7 min",
  },
  {
    id: "3",
    title: "Gothic Cathedrals of Europe",
    excerpt: "The architectural wonders of medieval Christianity",
    image: "https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=400&h=300&fit=crop&q=80",
    readTime: "6 min",
  },
];

const courses = [
  {
    id: "1",
    title: "Ancient Civilizations",
    description: "Explore the wonders of ancient Egypt, Greece, and Rome",
    lessons: 12,
    duration: "3 hours",
    image: "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=400&h=300&fit=crop&q=80",
    progress: 0,
  },
  {
    id: "2",
    title: "Medieval Architecture",
    description: "Discover castles, cathedrals, and fortresses",
    lessons: 8,
    duration: "2 hours",
    image: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=300&fit=crop&q=80",
    progress: 0,
  },
  {
    id: "3",
    title: "Renaissance Art",
    description: "Learn about the masters and their masterpieces",
    lessons: 10,
    duration: "2.5 hours",
    image: "https://images.unsplash.com/photo-1549887534-1541e9326642?w=400&h=300&fit=crop&q=80",
    progress: 0,
  },
];

const featuredArticles = [
  {
    id: "1",
    title: "The Mystery of Stonehenge",
    excerpt: "Unraveling the secrets of Britain's most enigmatic monument",
    image: "https://images.unsplash.com/photo-1599833975787-5d9f0e5d5c8e?w=800&h=600&fit=crop&q=80",
    readTime: "5 min",
  },
  {
    id: "2",
    title: "Pyramids: Engineering Marvels",
    excerpt: "How ancient Egyptians built structures that defy time",
    image: "https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=800&h=600&fit=crop&q=80",
    readTime: "7 min",
  },
  {
    id: "3",
    title: "Roman Aqueducts",
    excerpt: "Ancient engineering that still inspires modern infrastructure",
    image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&h=600&fit=crop&q=80",
    readTime: "4 min",
  },
];

export default function LearnScreen() {
  const insets = useSafeAreaInsets();
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
        
        let addressString = '';
        const parts = [];
        if (district) parts.push(district);
        if (city && city !== district) parts.push(city);
        if (country) parts.push(country);
        
        addressString = parts.join(', ');
        
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
          
          let addressString = '';
          const parts = [];
          if (district) parts.push(district);
          if (city && city !== district) parts.push(city);
          if (country) parts.push(country);
          
          addressString = parts.join(', ');
          
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
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} translucent />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section */}
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
              <Text style={styles.mainTitle}>Learn with Hereditas</Text>
            </View>
          </View>
          <View style={styles.headerDivider} />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Articles</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>View all</Text>
            </TouchableOpacity>
          </View>
          
          {articles.map((article) => (
            <TouchableOpacity key={article.id} style={styles.articleCard}>
              <Image source={{ uri: article.image }} style={styles.articleImage} />
              <View style={styles.articleContent}>
                <Text style={styles.articleTitle}>{article.title}</Text>
                <Text style={styles.articleExcerpt} numberOfLines={1} ellipsizeMode="tail">{article.excerpt}</Text>
                <View style={styles.articleFooter}>
                  <Clock size={12} color="#64748b" />
                  <Text style={styles.readTime}>{article.readTime} read</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Courses</Text>
          </View>
          
          {courses.map((course) => (
            <TouchableOpacity key={course.id} style={styles.courseCard}>
              <Image source={{ uri: course.image }} style={styles.courseImage} />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.courseGradient}
              >
                <View style={styles.courseContent}>
                  <Text style={styles.courseTitle}>{course.title}</Text>
                  <Text style={styles.courseDescription}>{course.description}</Text>
                  <View style={styles.courseFooter}>
                    <View style={styles.courseStats}>
                      <BookOpen size={14} color="#ffffff" />
                      <Text style={styles.courseStatsText}>{course.lessons} lessons</Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Articles</Text>
          </View>
          
          {featuredArticles.map((article) => (
            <TouchableOpacity key={article.id} style={styles.articleCard}>
              <Image source={{ uri: article.image }} style={styles.articleImage} />
              <View style={styles.articleContent}>
                <Text style={styles.articleTitle}>{article.title}</Text>
                <Text style={styles.articleExcerpt} numberOfLines={1} ellipsizeMode="tail">{article.excerpt}</Text>
                <View style={styles.articleFooter}>
                  <Clock size={12} color="#64748b" />
                  <Text style={styles.readTime}>{article.readTime} read</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <View style={styles.bottomSpacer} />
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
  section: {
    marginTop: 24,
    paddingHorizontal: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: Colors.text.primary,
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: Colors.accent.secondary,
    fontWeight: "400",
  },
  courseCard: {
    height: 150,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  courseImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  courseGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "100%",
    justifyContent: "flex-end",
  },
  courseContent: {
    padding: 16,
  },
  courseTitle: {
    fontSize: 18,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: "#ffffff",
    marginBottom: 8,
  },
  courseDescription: {
    fontSize: 13,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#ffffff",
    lineHeight: 18,
    marginBottom: 12,
  },
  courseFooter: {
    flexDirection: "row",
    gap: 16,
  },
  courseStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  courseStatsText: {
    fontSize: 12,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#ffffff",
  },
  articleCard: {
    flexDirection: "row",
    marginBottom: 12,
    height: 55,
  },
  articleImage: {
    width: 70,
    height: 55,
    borderRadius: 8,
  },
  articleContent: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: "center",
  },
  articleTitle: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: Colors.text.primary,
    marginBottom: 4,
  },
  articleExcerpt: {
    fontSize: 10,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: Colors.text.muted,
    lineHeight: 13,
    marginBottom: 4,
    numberOfLines: 1,
  },
  articleFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  readTime: {
    fontSize: 10,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: Colors.text.muted,
  },

  bottomSpacer: {
    height: 0,
  },
});