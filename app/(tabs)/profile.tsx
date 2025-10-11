import React, { useState, useRef } from "react";
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
  Folder
} from "lucide-react-native";

import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Colors from "@/constants/colors";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'all' | 'collections'>('all');
  const [gridColumns, setGridColumns] = useState<2 | 4>(2);
  const initialDistance = useRef<number>(0);

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

  // Mock scan history data - replace with real data
  const scanHistory = [
    {
      id: "1",
      name: "Pantheon",
      location: "Rome",
      period: "133 A.C.",
      image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400",
      scannedAt: "2 days ago",
      confidence: 95,
      description: "The largest amphitheatre ever built, a testament to Roman engineering prowess."
    },
    {
      id: "2",
      name: "Pantheon",
      location: "Rome",
      period: "133 A.C.",
      image: "https://images.unsplash.com/photo-1555992336-fb0d29498b13?w=400",
      scannedAt: "1 week ago",
      confidence: 98,
      description: "An iron lattice tower that became the symbol of Paris and French ingenuity."
    },
    {
      id: "3",
      name: "Eiffel Tower",
      location: "Paris",
      period: "1887-1889",
      image: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400",
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

          {/* Profile Section - Horizontal Layout */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200" }}
                style={styles.avatarImage}
              />
            </View>
            <View style={styles.profileInfoContainer}>
              <Text style={styles.userName}>Lorenzo Cappe</Text>
              <View style={styles.statsBar}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Countries</Text>
                  <Text style={styles.statNumber}>3</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Discoveries</Text>
                  <Text style={styles.statNumber}>47</Text>
                </View>
              </View>
            </View>
          </View>

          {/* View Toggle Buttons */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity 
              style={[styles.toggleButton, activeView === 'all' && styles.toggleButtonActive]}
              onPress={() => setActiveView('all')}
            >
              <Grid size={14} color={activeView === 'all' ? '#ffffff' : Colors.berkeleyBlue} />
              <Text style={[styles.toggleButtonText, activeView === 'all' && styles.toggleButtonTextActive]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleButton, activeView === 'collections' && styles.toggleButtonActive]}
              onPress={() => setActiveView('collections')}
            >
              <Folder size={14} color={activeView === 'collections' ? '#ffffff' : Colors.berkeleyBlue} />
              <Text style={[styles.toggleButtonText, activeView === 'collections' && styles.toggleButtonTextActive]}>Collections</Text>
            </TouchableOpacity>
          </View>

          {/* Monument Grid */}
          <View style={styles.section} {...panResponder.panHandlers}>
          
          {scanHistory.length > 0 ? (
            <View style={[styles.historyGrid, gridColumns === 4 && styles.historyGridCompact]}>
              {scanHistory.map((monument) => (
                <TouchableOpacity key={monument.id} style={[styles.monumentCard, gridColumns === 4 && styles.monumentCardCompact]}>
                  <Image source={{ uri: monument.image }} style={styles.monumentImage} />
                  {gridColumns === 2 && (
                    <LinearGradient
                      colors={["transparent", "rgba(0,0,0,0.7)"]}
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
    backgroundColor: Colors.background,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 250,
    zIndex: 0,
  },
  safeArea: {
    flex: 1,
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
    flexDirection: 'row',
    paddingHorizontal: 14.4,
    paddingTop: 48,
    paddingBottom: 14.4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2.4 },
    shadowOpacity: 0.15,
    shadowRadius: 4.8,
    elevation: 4.8,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  profileInfoContainer: {
    flex: 1,
    gap: 7.2,
    alignItems: 'center',
  },
  userName: {
    fontSize: 15.18,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "700",
    color: Colors.berkeleyBlue,
    marginBottom: 2.4,
    textAlign: 'center',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(118, 104, 96, 0.33)',
    borderRadius: 14.4,
    paddingVertical: 7.2,
    paddingHorizontal: 16,
    gap: 18,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13.8,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: Colors.berkeleyBlue,
    marginTop: 1.2,
  },
  statNumber: {
    fontSize: 13.8,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "700",
    color: Colors.berkeleyBlue,
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
    gap: 6,
  },
  monumentCard: {
    width: "47%",
    aspectRatio: 2.4 / 3.4,
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
    width: "23%",
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 6,
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
    gap: 3,
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
    marginBottom: 4,
    lineHeight: 18,
  },
  monumentDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 2,
  },
  monumentLocation: {
    fontSize: 10,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "rgba(255,255,255,0.9)",
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
    marginTop: 2,
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
    height: 100,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 20,
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(29, 53, 87, 0.08)',
    gap: 6,
  },
  toggleButtonActive: {
    backgroundColor: Colors.berkeleyBlue,
  },
  toggleButtonText: {
    fontSize: 13,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: Colors.berkeleyBlue,
  },
  toggleButtonTextActive: {
    color: '#ffffff',
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

});