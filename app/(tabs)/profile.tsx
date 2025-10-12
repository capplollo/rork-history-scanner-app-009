import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  Platform,
  Modal,
  PanResponder,
  GestureResponderEvent,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  MapPin, 
  Settings,
  LogOut,
  ChevronRight,
  Camera,
  X,
  History,
  Scan,
  ArrowLeft,
  Grid,
  Folder,
  Heart,
  Star,
  Bookmark,
  Plus
} from "lucide-react-native";

import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import * as FileSystem from 'expo-file-system';

const applyBrightnessContrastToUrl = async (url: string): Promise<string> => {
  try {
    if (Platform.OS === 'web') {
      const response = await fetch(url);
      const blob = await response.blob();
      const reader = new FileReader();
      
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      const img = new window.Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = `data:image/jpeg;base64,${base64}`;
      });
      
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return url;
      
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      const brightnessFactor = 0.8;
      const contrastFactor = 0.8;
      const contrastIntercept = 128 * (1 - contrastFactor);
      
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.max(0, Math.min(255, data[i] * brightnessFactor * contrastFactor + contrastIntercept));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] * brightnessFactor * contrastFactor + contrastIntercept));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] * brightnessFactor * contrastFactor + contrastIntercept));
      }
      
      ctx.putImageData(imageData, 0, 0);
      return canvas.toDataURL('image/jpeg', 0.9);
    } else {
      const response = await fetch(url);
      const blob = await response.blob();
      const reader = new FileReader();
      
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      const editResponse = await fetch('https://toolkit.rork.com/images/edit/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Reduce brightness by 20% and reduce contrast by 20%. Do not change anything else about the image.',
          images: [{ type: 'image', image: base64 }]
        })
      });
      
      if (!editResponse.ok) {
        return url;
      }
      
      const result = await editResponse.json();
      return `data:image/jpeg;base64,${result.image.base64Data}`;
    }
  } catch (error) {
    console.error('Error applying brightness/contrast to URL:', error);
    return url;
  }
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'all' | 'collections'>('all');
  const [gridColumns, setGridColumns] = useState<2 | 4>(4);
  const initialDistance = useRef<number>(0);
  const [adjustedImages, setAdjustedImages] = useState<Record<string, string>>({});

  const getDistance = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const [touch1, touch2] = touches;
    const dx = touch1.pageX - touch2.pageX;
    const dy = touch1.pageY - touch2.pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt: GestureResponderEvent) => {
        return evt.nativeEvent.touches.length === 2;
      },
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        if (evt.nativeEvent.touches.length === 2) {
          initialDistance.current = getDistance(evt.nativeEvent.touches);
        }
      },
      onPanResponderMove: (evt: GestureResponderEvent) => {
        if (evt.nativeEvent.touches.length === 2) {
          const currentDistance = getDistance(evt.nativeEvent.touches);
          const distanceChange = currentDistance - initialDistance.current;
          
          if (Math.abs(distanceChange) > 50) {
            if (distanceChange < 0 && gridColumns === 2) {
              setGridColumns(4);
              initialDistance.current = currentDistance;
            } else if (distanceChange > 0 && gridColumns === 4) {
              setGridColumns(2);
              initialDistance.current = currentDistance;
            }
          }
        }
      },
      onPanResponderRelease: () => {
        initialDistance.current = 0;
      },
    })
  ).current;

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            setShowSettings(false);
            router.replace('/login');
          },
        },
      ]
    );
  };

  const menuItems = [
    { icon: LogOut, label: "Sign Out", action: handleSignOut },
  ];

  const collections = [
    {
      id: "1",
      name: "Favorites",
      icon: Heart,
      count: 12,
      color: Colors.berkeleyBlue,
    },
    {
      id: "2",
      name: "Must Visit",
      icon: Star,
      count: 8,
      color: Colors.berkeleyBlue,
    },
    {
      id: "3",
      name: "Saved",
      icon: Bookmark,
      count: 23,
      color: Colors.berkeleyBlue,
    },
  ];

  useEffect(() => {
    const adjustImages = async () => {
      const adjusted: Record<string, string> = {};
      for (const monument of scanHistory) {
        adjusted[monument.id] = await applyBrightnessContrastToUrl(monument.image);
      }
      setAdjustedImages(adjusted);
    };
    adjustImages();
  }, []);

  const scanHistory = [
    {
      id: "1",
      name: "Colosseum",
      location: "Rome",
      period: "70-80 A.D.",
      image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400",
      scannedAt: "2 days ago",
      confidence: 95,
      description: "The largest amphitheatre ever built, a testament to Roman engineering prowess."
    },
    {
      id: "2",
      name: "Eiffel Tower",
      location: "Paris",
      period: "1887-1889",
      image: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400",
      scannedAt: "1 week ago",
      confidence: 98,
      description: "An iron lattice tower that became the symbol of Paris and French ingenuity."
    },
    {
      id: "3",
      name: "Taj Mahal",
      location: "Agra",
      period: "1632-1653",
      image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400",
      scannedAt: "2 weeks ago",
      confidence: 92,
      description: "A white marble mausoleum, considered the jewel of Muslim art in India."
    },
    {
      id: "4",
      name: "Milan Cathedral",
      location: "Milan",
      period: "1386-1965",
      image: "https://images.unsplash.com/photo-1513581166391-887a96ddeafd?w=400",
      scannedAt: "3 weeks ago",
      confidence: 90,
      description: "Gothic cathedral church of Milan."
    },
    {
      id: "5",
      name: "Big Ben",
      location: "London",
      period: "1859",
      image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400",
      scannedAt: "1 month ago",
      confidence: 96,
      description: "The iconic clock tower of the Palace of Westminster."
    },
    {
      id: "6",
      name: "Sagrada Familia",
      location: "Barcelona",
      period: "1882-present",
      image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400",
      scannedAt: "1 month ago",
      confidence: 94,
      description: "Gaudí's masterpiece, a basilica still under construction."
    },
    {
      id: "7",
      name: "Statue of Liberty",
      location: "New York",
      period: "1886",
      image: "https://images.unsplash.com/photo-1569098644584-210bcd375b59?w=400",
      scannedAt: "2 months ago",
      confidence: 97,
      description: "A gift from France, symbol of freedom and democracy."
    },
    {
      id: "8",
      name: "Parthenon",
      location: "Athens",
      period: "447-432 B.C.",
      image: "https://images.unsplash.com/photo-1555993539-1732b0258235?w=400",
      scannedAt: "2 months ago",
      confidence: 93,
      description: "Ancient Greek temple dedicated to the goddess Athena."
    },
    {
      id: "9",
      name: "Notre-Dame",
      location: "Paris",
      period: "1163-1345",
      image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400",
      scannedAt: "3 months ago",
      confidence: 91,
      description: "Medieval Catholic cathedral, a masterpiece of French Gothic architecture."
    },
    {
      id: "10",
      name: "Sydney Opera House",
      location: "Sydney",
      period: "1973",
      image: "https://images.unsplash.com/photo-1523059623039-a9ed027e7fad?w=400",
      scannedAt: "3 months ago",
      confidence: 99,
      description: "Iconic performing arts centre with distinctive sail-like design."
    },
    {
      id: "11",
      name: "Petra Treasury",
      location: "Petra",
      period: "1st century A.D.",
      image: "https://images.unsplash.com/photo-1578070181910-f1e514afdd08?w=400",
      scannedAt: "4 months ago",
      confidence: 88,
      description: "Ancient city carved into rose-red cliffs."
    },
    {
      id: "12",
      name: "Neuschwanstein",
      location: "Bavaria",
      period: "1869-1886",
      image: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400",
      scannedAt: "4 months ago",
      confidence: 95,
      description: "Romanesque Revival palace that inspired Disney's castle."
    },
    {
      id: "13",
      name: "Machu Picchu",
      location: "Peru",
      period: "1450",
      image: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=400",
      scannedAt: "5 months ago",
      confidence: 89,
      description: "Incan citadel set high in the Andes Mountains."
    },
    {
      id: "14",
      name: "St. Basil's Cathedral",
      location: "Moscow",
      period: "1555-1561",
      image: "https://images.unsplash.com/photo-1513326738677-b964603b136d?w=400",
      scannedAt: "5 months ago",
      confidence: 92,
      description: "Colorful onion domes in the heart of Red Square."
    },
    {
      id: "15",
      name: "Golden Gate Bridge",
      location: "San Francisco",
      period: "1937",
      image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400",
      scannedAt: "6 months ago",
      confidence: 97,
      description: "Iconic suspension bridge spanning the Golden Gate strait."
    },
    {
      id: "16",
      name: "Arc de Triomphe",
      location: "Paris",
      period: "1806-1836",
      image: "https://images.unsplash.com/photo-1549144511-f099e773c147?w=400",
      scannedAt: "6 months ago",
      confidence: 94,
      description: "Monumental arch honoring those who fought for France."
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(118, 104, 96, 0.36)', 'rgba(225, 222, 220, 0.36)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.backgroundGradient}
      />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={[styles.headerSection, { paddingTop: insets.top + 8 }]}>
          <View style={[styles.topRow, { top: insets.top + 20 }]}>
            <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.backButtonHeader}>
              <View style={styles.backButtonCircle}>
                <Settings size={10} color="#ffffff" />
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
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Profile Section - Vertical Layout */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200" }}
                style={styles.avatarImage}
              />
            </View>
            <View style={styles.profileInfoContainer}>
              <Text style={styles.userName}>Lorenzo Cappelletti</Text>
              <View style={styles.statsBar}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Countries</Text>
                  <Text style={styles.statNumber}>3</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Discoveries</Text>
                  <Text style={styles.statNumber}>47</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Level</Text>
                  <Text style={styles.statNumber}>5</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Subtle Line */}
          <View style={styles.profileDivider} />

          {/* View Toggle Buttons */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity 
              style={[styles.toggleButton, activeView === 'all' && styles.toggleButtonActive]}
              onPress={() => setActiveView('all')}
            >
              <Grid size={16} color={activeView === 'all' ? Colors.berkeleyBlue : 'rgba(29, 53, 87, 0.4)'} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleButton, activeView === 'collections' && styles.toggleButtonActive]}
              onPress={() => setActiveView('collections')}
            >
              <Folder size={16} color={activeView === 'collections' ? Colors.berkeleyBlue : 'rgba(29, 53, 87, 0.4)'} />
            </TouchableOpacity>
          </View>

          {activeView === 'all' ? (
            <View style={styles.section} {...panResponder.panHandlers}>
              {scanHistory.length > 0 ? (
                <>
                  <TouchableOpacity 
                    style={styles.gridMultiplierButton}
                    onPress={() => setGridColumns(gridColumns === 2 ? 4 : 2)}
                  >
                    <Text style={styles.gridMultiplierText}>x{gridColumns}</Text>
                  </TouchableOpacity>
                  <View style={[styles.historyGrid, gridColumns === 4 && styles.historyGridCompact]}>
                  {scanHistory.map((monument) => (
                    <TouchableOpacity key={monument.id} style={[styles.monumentCard, gridColumns === 4 && styles.monumentCardCompact]}>
                      <Image source={{ uri: adjustedImages[monument.id] || monument.image }} style={styles.monumentImage} />
                      {gridColumns === 2 && (
                        <LinearGradient
                          colors={["transparent", "transparent", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.75)"]}
                          locations={[0, 0.4, 0.75, 1]}
                          style={styles.monumentOverlay}
                        >
                          <View style={styles.monumentInfo}>
                            <Text style={styles.monumentName}>{monument.name}</Text>
                            <View style={styles.monumentDetails}>
                              <MapPin size={10} color="rgba(255,255,255,0.8)" />
                              <Text style={styles.monumentLocation}>{monument.location}</Text>
                            </View>
                            <Text style={styles.monumentPeriod}>{monument.period}</Text>
                          </View>
                        </LinearGradient>
                      )}
                    </TouchableOpacity>
                  ))}
                  </View>
                </>
              ) : (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconContainer}>
                    <History size={40} color={Colors.cinereous} />
                  </View>
                  <Text style={styles.emptyStateTitle}>No Discoveries Yet</Text>
                  <Text style={styles.emptyStateText}>
                    Start scanning monuments and art to build your collection
                  </Text>
                  <TouchableOpacity style={styles.startButton} onPress={() => router.push('/(tabs)/(scanner)')}>  
                    <Camera size={16} color="#ffffff" />
                    <Text style={styles.startButtonText}>Start Scanning</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.section}>
              <View style={styles.collectionsGrid}>
                {collections.map((collection) => (
                  <TouchableOpacity key={collection.id} style={styles.collectionCard}>
                    <View style={styles.collectionIconContainer}>
                      <collection.icon size={24} color={collection.color} strokeWidth={1.5} />
                    </View>
                    <Text style={styles.collectionName}>{collection.name}</Text>
                    <Text style={styles.collectionCount}>{collection.count} items</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={[styles.collectionCard, styles.addCollectionCard]}>
                  <View style={styles.addIconContainer}>
                    <Plus size={24} color='rgba(29, 53, 87, 0.4)' strokeWidth={1.5} />
                  </View>
                  <Text style={styles.addCollectionText}>New Collection</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
        <View style={styles.bottomSpacer} />
      </SafeAreaView>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Settings</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowSettings(false)}
            >
              <X size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.action}
              >
                <View style={styles.menuItemContent}>
                  <item.icon size={20} color={Colors.accent.secondary} />
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </View>
                <ChevronRight size={20} color="#CCC" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    position: 'relative',
    zIndex: 10,
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
  backButtonHeader: {
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
  profileSection: {
    flexDirection: 'column',
    paddingHorizontal: 20,
    paddingTop: 53,
    paddingBottom: 14.4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    width: 72.25,
    height: 72.25,
    borderRadius: 36.125,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  profileInfoContainer: {
    alignItems: 'center',
    width: '100%',
  },
  userName: {
    fontSize: 17.34,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "700",
    color: Colors.berkeleyBlue,
    marginBottom: 10,
    textAlign: 'center',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 14.4,
  },
  statLabel: {
    fontSize: 12.01,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: 'rgba(29, 53, 87, 0.6)',
    marginBottom: 2.4,
  },
  statNumber: {
    fontSize: 15.12,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "700",
    color: '#766860',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(29, 53, 87, 0.15)',
  },
  section: {
    marginTop: 0,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
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
  historyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  historyGridCompact: {
    justifyContent: 'flex-start',
    gap: 8,
  },
  monumentCard: {
    width: (Dimensions.get('window').width - 32 - 14) / 2,
    height: ((Dimensions.get('window').width - 32 - 14) / 2) * (3.4 / 2.4),
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 14,
  },
  monumentCardCompact: {
    width: (Dimensions.get('window').width - 32 - 24) / 4,
    height: ((Dimensions.get('window').width - 32 - 24) / 4) * (3.4 / 2.4),
    borderRadius: 8,
    marginBottom: 8,
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  monumentImage: {
    width: "100%",
    height: "100%",
  },
  monumentOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "100%",
    justifyContent: "flex-end",
    padding: 16,
  },

  monumentInfo: {
    gap: 1.5,
  },
  monumentName: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 2,
    lineHeight: 15,
  },
  monumentDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 0.5,
  },
  monumentLocation: {
    fontSize: 10,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "rgba(255,255,255,0.9)",
    lineHeight: 11,
  },
  monumentPeriod: {
    fontSize: 9,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontStyle: "italic",
    color: "rgba(255,255,255,0.8)",
    marginTop: 0.5,
    lineHeight: 10,
  },


  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(254, 254, 254, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(104, 89, 81, 0.08)',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "600",
    color: Colors.berkeleyBlue,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  startButton: {
    backgroundColor: Colors.accent.secondary,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
    shadowColor: Colors.accent.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  startButtonText: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: "#ffffff",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: '#2C2C2C',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: '#2C2C2C',
  },

  bottomSpacer: {
    height: 0,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 0,
    paddingTop: 2.8,
    paddingBottom: 5.6,
    gap: 12,
    justifyContent: 'center',
  },
  toggleButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  toggleButtonActive: {
    backgroundColor: 'transparent',
  },
  toggleCount: {
    fontSize: 11,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "600",
    color: Colors.berkeleyBlue,
  },
  subtleLinesContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  subtleLine: {
    width: 320,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  profileDivider: {
    height: 1,
    backgroundColor: 'rgba(29, 53, 87, 0.08)',
    marginHorizontal: 40,
    marginBottom: 8,
  },
  collectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  collectionCard: {
    width: '47%',
    backgroundColor: 'rgba(29, 53, 87, 0.04)',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 0.5,
    borderColor: 'rgba(29, 53, 87, 0.08)',
  },
  addCollectionCard: {
    backgroundColor: 'rgba(29, 53, 87, 0.02)',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(29, 53, 87, 0.12)',
  },
  collectionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'rgba(29, 53, 87, 0.06)',
  },
  addIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(29, 53, 87, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  collectionName: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "600",
    color: Colors.berkeleyBlue,
    marginBottom: 3,
    textAlign: 'center',
  },
  collectionCount: {
    fontSize: 11,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: 'rgba(29, 53, 87, 0.5)',
    textAlign: 'center',
  },
  addCollectionText: {
    fontSize: 13,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: 'rgba(29, 53, 87, 0.6)',
    textAlign: 'center',
  },
  gridMultiplierButton: {
    position: 'absolute',
    top: -32,
    right: 8,
    justifyContent: 'center',
    alignItems: 'flex-start',
    zIndex: 10,
  },
  gridMultiplierText: {
    fontSize: 11,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "600",
    color: Colors.berkeleyBlue,
  },
});
