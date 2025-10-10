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
} from "react-native";
import { 
  MapPin, 
  Settings,
  LogOut,
  ChevronRight,
  Camera,
  X,
  History,
  Scan
} from "lucide-react-native";

import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Colors from "@/constants/colors";

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
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with icons */}
        <View style={styles.headerIcons}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => setShowSettings(true)}
          >
            <Settings size={24} color={Colors.accent.secondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => router.push('/(tabs)/(scanner)')}
          >
            <Scan size={24} color={Colors.accent.secondary} />
          </TouchableOpacity>
        </View>

        {/* Profile Picture and Name */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200" }}
              style={styles.avatarImage}
            />
          </View>
          <Text style={styles.userName}>Lorenzo Cappelletti</Text>
        </View>

        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Countries</Text>
            <Text style={styles.statNumber}>3</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Discoveries</Text>
            <Text style={styles.statNumber}>47</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Countries</Text>
            <Text style={styles.statNumber}>3</Text>
          </View>
        </View>

        {/* Monument Grid */}
        <View style={styles.section}>
          
          {scanHistory.length > 0 ? (
            <View style={styles.historyGrid}>
              {scanHistory.map((monument) => (
                <TouchableOpacity key={monument.id} style={styles.monumentCard}>
                  <Image source={{ uri: monument.image }} style={styles.monumentImage} />
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
  headerIcons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  iconButton: {
    padding: 8,
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 24,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  userName: {
    fontSize: 24,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "600",
    color: Colors.berkeleyBlue,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.berkeleyBlue,
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: '#ffffff',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 32,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "700",
    color: '#ffffff',
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
    gap: 12,
  },
  monumentCard: {
    width: "48%",
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
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