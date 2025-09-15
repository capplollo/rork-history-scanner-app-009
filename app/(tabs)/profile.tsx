import React, { useState, useMemo } from "react";
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
  Share,
} from "react-native";
import { 
  User, 
  MapPin, 
  Settings,
  LogOut,
  ChevronRight,
  Camera,
  Clock,
  X,
  History,
  Share2,
  Calendar,
  Globe,
  Heart,
  RefreshCw
} from "lucide-react-native";

import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { useAuth, type ScanHistoryItem } from "@/contexts/AuthContext";

export default function ProfileScreen() {
  const { user, signOut, scanHistory, userStats, addScanToHistory } = useAuth();
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [sortMode, setSortMode] = useState<'date' | 'country' | 'favourites'>('date');

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
          onPress: async () => {
            setShowSettings(false);
            const { error } = await signOut();
            if (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleShare = async (monument: any) => {
    try {
      await Share.share({
        message: `Check out this amazing discovery: ${monument.name} in ${monument.location}! 🏛️`,
        url: monument.image,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const handleHistoryCardPress = (monument: ScanHistoryItem) => {
    console.log('History card pressed:', monument.name);
    
    // Navigate to scan-result page with regeneration parameters
    router.push({
      pathname: '/scan-result',
      params: {
        regenerate: 'true',
        historyItemId: monument.id,
        monumentName: monument.name,
        location: monument.location,
        period: monument.period,
        scannedImage: monument.image,
        confidence: (monument.confidence || 0).toString(),
        isRecognized: 'true'
      }
    });
  };

  // Add demo data for testing
  const addDemoData = async () => {
    const demoScans = [
      {
        name: "Colosseum",
        location: "Rome, Italy",
        period: "72-80 AD",
        image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400",
        confidence: 95,
        description: "The largest amphitheatre ever built, a testament to Roman engineering prowess."
      },
      {
        name: "Eiffel Tower",
        location: "Paris, France",
        period: "1887-1889",
        image: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400",
        confidence: 98,
        description: "An iron lattice tower that became the symbol of Paris and French ingenuity."
      },
      {
        name: "Taj Mahal",
        location: "Agra, India",
        period: "1632-1653",
        image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400",
        confidence: 92,
        description: "A white marble mausoleum, considered the jewel of Muslim art in India."
      }
    ];

    for (const scan of demoScans) {
      await addScanToHistory(scan);
      // Add small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  const menuItems = [
    { icon: LogOut, label: "Sign Out", action: handleSignOut },
  ];

  // Add demo data option for testing (only show if no history)
  if (scanHistory.length === 0) {
    menuItems.unshift({
      icon: Camera,
      label: "Add Demo Data",
      action: async () => {
        setShowSettings(false);
        await addDemoData();
      }
    });
  }

  // Format scan date for display
  const formatScanDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Sort scan history based on selected mode
  const sortedHistory = useMemo(() => {
    const history = [...scanHistory];
    switch (sortMode) {
      case 'date':
        return history.sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());
      case 'country':
        return history.sort((a, b) => {
          const countryA = a.location.split(',').pop()?.trim() || '';
          const countryB = b.location.split(',').pop()?.trim() || '';
          return countryA.localeCompare(countryB);
        });
      case 'favourites':
        // For now, sort by confidence as a proxy for favorites
        return history.sort((a, b) => b.confidence - a.confidence);
      default:
        return history;
    }
  }, [scanHistory, sortMode]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Info directly on background */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={32} color={Colors.accent.secondary} />
            </View>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.user_metadata?.full_name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'No email'}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => setShowSettings(true)}
          >
            <Settings size={20} color={Colors.accent.secondary} />
          </TouchableOpacity>
        </View>

        {/* Stats Counters */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userStats.totalScans}</Text>
            <Text style={styles.statLabel}>Monuments</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userStats.uniqueCountries}</Text>
            <Text style={styles.statLabel}>Countries</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userStats.level}</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
        </View>



        {/* Sort Menu */}
        <View style={styles.sortSection}>
          <View style={styles.sortToggleContainer}>
            <TouchableOpacity 
              style={[styles.sortButton, sortMode === 'date' && styles.sortButtonActive]}
              onPress={() => setSortMode('date')}
            >
              <Calendar size={16} color={sortMode === 'date' ? '#ffffff' : Colors.text.secondary} />
              <Text style={[styles.sortButtonText, sortMode === 'date' && styles.sortButtonTextActive]}>Date</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.sortButton, sortMode === 'country' && styles.sortButtonActive]}
              onPress={() => setSortMode('country')}
            >
              <Globe size={16} color={sortMode === 'country' ? '#ffffff' : Colors.text.secondary} />
              <Text style={[styles.sortButtonText, sortMode === 'country' && styles.sortButtonTextActive]}>Country</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.sortButton, sortMode === 'favourites' && styles.sortButtonActive]}
              onPress={() => setSortMode('favourites')}
            >
              <Heart size={16} color={sortMode === 'favourites' ? '#ffffff' : Colors.text.secondary} />
              <Text style={[styles.sortButtonText, sortMode === 'favourites' && styles.sortButtonTextActive]}>Favourites</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* History Cards directly on background */}
        <View style={styles.section}>
          
          {sortedHistory.length > 0 ? (
            <View style={styles.historyGrid}>
              {sortedHistory.map((monument: ScanHistoryItem) => (
                <TouchableOpacity 
                  key={monument.id} 
                  style={styles.monumentCard}
                  onPress={() => handleHistoryCardPress(monument)}
                >
                  <Image source={{ uri: monument.image }} style={styles.monumentImage} />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.7)"]}
                    style={styles.monumentOverlay}
                  >
                    <View style={styles.monumentInfo}>
                      <Text style={styles.monumentName}>
                        {monument.name.length > 20 ? `${monument.name.substring(0, 20)}...` : monument.name}
                      </Text>
                      <View style={styles.monumentDetails}>
                        <MapPin size={10} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.monumentLocation}>{monument.location}</Text>
                      </View>
                      <Text style={styles.monumentPeriod}>{monument.period}</Text>
                    </View>
                  </LinearGradient>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  statsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: Colors.text.muted,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginHorizontal: 8,
  },
  settingsButton: {
    position: 'absolute',
    top: 24,
    right: 24,
    padding: 8,
  },
  avatarContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.platinum,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 18,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "600",
    color: Colors.text.primary,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: Colors.text.muted,
  },
  section: {
    marginTop: 0,
    paddingHorizontal: 24,
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
  monumentCard: {
    width: "48.5%",
    height: 230,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
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
    padding: 12,
  },

  monumentInfo: {
    gap: 3,
  },
  monumentName: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 2,
    lineHeight: 20,
  },
  monumentDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 2,
  },
  monumentLocation: {
    fontSize: 12,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "rgba(255,255,255,0.9)",
  },
  monumentPeriod: {
    fontSize: 11,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontStyle: "italic",
    color: "rgba(255,255,255,0.8)",
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
    backgroundColor: Colors.platinum,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 15,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  startButton: {
    backgroundColor: Colors.accent.secondary,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "600",
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
  subtleLinesContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  subtleLine: {
    width: 320,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  sortSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  sortToggleContainer: {
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
  sortButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  sortButtonActive: {
    backgroundColor: Colors.accent.secondary,
  },
  sortButtonText: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: Colors.text.secondary,
  },
  sortButtonTextActive: {
    color: '#ffffff',
    fontWeight: "600",
  },
});