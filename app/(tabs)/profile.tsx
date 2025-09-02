import React, { useState } from "react";
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
  Share2
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

export default function ProfileScreen() {
  const [showSettings, setShowSettings] = useState<boolean>(false);

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

  const menuItems = [
    { icon: LogOut, label: "Sign Out", action: handleSignOut },
  ];

  // Mock scan history data - replace with real data
  const scanHistory = [
    {
      id: "1",
      name: "Colosseum",
      location: "Rome, Italy",
      period: "72-80 AD",
      image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400",
      scannedAt: "2 days ago",
      confidence: 95,
      description: "The largest amphitheatre ever built, a testament to Roman engineering prowess."
    },
    {
      id: "2",
      name: "Eiffel Tower",
      location: "Paris, France",
      period: "1887-1889",
      image: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400",
      scannedAt: "1 week ago",
      confidence: 98,
      description: "An iron lattice tower that became the symbol of Paris and French ingenuity."
    },
    {
      id: "3",
      name: "Taj Mahal",
      location: "Agra, India",
      period: "1632-1653",
      image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400",
      scannedAt: "2 weeks ago",
      confidence: 92,
      description: "A white marble mausoleum, considered the jewel of Muslim art in India."
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Minimal Header with Profile Info */}
        <LinearGradient
          colors={["#2C3E50", "#34495E"]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={["#8B4513", "#A0522D"]}
                  style={styles.avatar}
                >
                  <User size={20} color="#ffffff" />
                </LinearGradient>
              </View>
              
              <View style={styles.profileInfo}>
                <Text style={styles.userName}>Demo User</Text>
                <Text style={styles.userEmail}>demo@example.com</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.settingsButton}
                onPress={() => setShowSettings(true)}
              >
                <Settings size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Scan History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Discovery History</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>View all</Text>
            </TouchableOpacity>
          </View>
          
          {scanHistory.length > 0 ? (
            <View style={styles.historyGrid}>
              {scanHistory.map((monument) => (
                <TouchableOpacity key={monument.id} style={styles.monumentCard}>
                  <Image source={{ uri: monument.image }} style={styles.monumentImage} />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.7)"]}
                    style={styles.monumentOverlay}
                  >
                    <View style={styles.monumentContent}>
                      <View style={styles.monumentHeader}>
                        <View style={styles.confidenceBadge}>
                          <Text style={styles.confidenceText}>{monument.confidence}%</Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.shareButton}
                          onPress={() => handleShare(monument)}
                        >
                          <Share2 size={14} color="#ffffff" />
                        </TouchableOpacity>
                      </View>
                      
                      <View style={styles.monumentInfo}>
                        <Text style={styles.monumentName}>{monument.name}</Text>
                        <View style={styles.monumentDetails}>
                          <MapPin size={10} color="rgba(255,255,255,0.8)" />
                          <Text style={styles.monumentLocation}>{monument.location}</Text>
                        </View>
                        <Text style={styles.monumentPeriod}>{monument.period}</Text>
                        <View style={styles.timeContainer}>
                          <Clock size={10} color="rgba(255,255,255,0.6)" />
                          <Text style={styles.scannedTime}>{monument.scannedAt}</Text>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <History size={40} color="rgba(139, 69, 19, 0.3)" />
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
                  <item.icon size={20} color="#8B4513" />
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
    backgroundColor: "#FEFEFE",
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    gap: 0,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsButton: {
    padding: 6,
    marginLeft: 'auto',
  },
  avatarContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: "#ffffff",
  },
  userEmail: {
    fontSize: 12,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "rgba(255,255,255,0.8)",
    fontStyle: "italic",
  },
  section: {
    marginTop: 25,
    paddingHorizontal: 20,
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
    color: "#2C3E50",
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#8B4513",
    fontWeight: "400",
  },
  historyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  monumentCard: {
    width: "47.5%",
    height: 320,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
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
    justifyContent: "space-between",
    padding: 12,
  },
  monumentContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  monumentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  confidenceBadge: {
    backgroundColor: "rgba(139, 69, 19, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 10,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "600",
    color: "#ffffff",
  },
  shareButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 6,
    borderRadius: 12,
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
    marginBottom: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  scannedTime: {
    fontSize: 10,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "rgba(255,255,255,0.6)",
  },

  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8fafc',
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
    color: "#2C3E50",
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 15,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#64748b",
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  startButton: {
    backgroundColor: '#8B4513',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    gap: 8,
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
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
    backgroundColor: '#FEFEFE',
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
});