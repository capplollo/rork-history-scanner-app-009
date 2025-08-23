import React, { useEffect, useMemo, useState } from "react";
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
  User, 
  MapPin, 
  Calendar,
  Settings,
  LogOut,
  ChevronRight,
  Camera,
  Globe,
  Clock,
  X
} from "lucide-react-native";
import { useHistory } from "@/providers/HistoryProvider";
import { useAuth } from "@/providers/AuthProvider";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";


export default function ProfileScreen() {
  const { history, clearHistory, isLoading: historyLoading } = useHistory();
  const { user, signOut, loading } = useAuth();
  const [showSettings, setShowSettings] = useState<boolean>(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading]);

  const handleSignOut = async () => {
    try {
      console.log('🔐 Settings sign out button pressed');
      setShowSettings(false); // Close modal first
      
      const { error } = await signOut();
      if (error) {
        console.error('🔐 Sign out error:', error);
        Alert.alert('Error', 'Failed to sign out: ' + error.message);
      } else {
        console.log('🔐 Sign out successful from settings');
        // Don't manually navigate - let AuthGuard handle it
        // The AuthGuard will detect the user is null and redirect to login
      }
    } catch (err) {
      console.error('🔐 Unexpected sign out error:', err);
      Alert.alert('Error', 'An unexpected error occurred during sign out');
    }
  };

  if (!user) {
    return null;
  }

  const visitedCountries = useMemo(() => {
    const countries = new Set<string>();
    history.forEach(item => {
      if (item.location) {
        // Extract country from location string (assuming format like "City, Country" or "Country")
        const parts = item.location.split(',');
        const country = parts[parts.length - 1].trim();
        if (country) {
          countries.add(country);
        }
      }
    });
    return countries.size;
  }, [history]);

  const stats = [
    { 
      label: "Discoveries", 
      value: history.length.toString(),
      icon: Camera,
      description: "Monuments and art explored"
    },
    { 
      label: "Destinations", 
      value: visitedCountries.toString(),
      icon: Globe,
      description: "Countries visited"
    },
  ];

  const menuItems = [
    { icon: LogOut, label: "Sign Out", action: handleSignOut },
  ];

  // Test sign out function for debugging
  const testSignOut = async () => {
    try {
      console.log('Test sign out triggered');
      const { error } = await signOut();
      if (error) {
        console.error('Test sign out error:', error);
        Alert.alert('Error', 'Test sign out failed: ' + error.message);
      } else {
        console.log('Test sign out successful');
        Alert.alert('Success', 'Sign out successful!');
      }
    } catch (err) {
      console.error('Test sign out unexpected error:', err);
      Alert.alert('Error', 'Test sign out unexpected error');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={["#2C3E50", "#34495E"]}
          style={styles.headerGradient}
        >
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => setShowSettings(true)}
          >
            <Settings size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <User size={40} color="#4f46e5" />
              </View>
              <TouchableOpacity style={styles.editAvatarButton}>
                <Camera size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{user.user_metadata?.full_name || 'Explorer'}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            
            <Text style={styles.userSubtitle}>Cultural Explorer</Text>
            
            {/* Test Sign Out Button */}
            <TouchableOpacity 
              style={styles.testSignOutButton}
              onPress={testSignOut}
            >
              <Text style={styles.testSignOutText}>TEST SIGN OUT</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.statsContainer}>
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <View key={index} style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Icon size={24} color="#8B4513" />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statDescription}>{stat.description}</Text>
              </View>
            );
          })}
        </View>

        {/* History Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Clock size={20} color="#8B4513" />
              <Text style={styles.sectionTitle}>Your Discoveries</Text>
            </View>
            {historyLoading ? (
              <Text style={styles.sectionSubtitle}>Loading history...</Text>
            ) : (
              <Text style={styles.sectionSubtitle}>
                {history.length} {history.length === 1 ? "monument and art piece" : "monuments and art pieces"} explored
              </Text>
            )}
          </View>
          
          {historyLoading ? (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingGrid}>
                {[1, 2, 3, 4].map((_, index) => (
                  <View key={index} style={styles.loadingCard}>
                    <View style={styles.loadingCardBackground} />
                    <View style={styles.loadingCardContent}>
                      <View style={styles.loadingText} />
                      <View style={styles.loadingTextSmall} />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : history.length > 0 ? (
            <View style={styles.historyGrid}>
              {history.slice(0, 6).map((item, index) => {
                const formatDate = (dateString: string) => {
                  const date = new Date(dateString);
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                };
                
                return (
                  <View key={`${item.id}-${index}`} style={styles.historyCardContainer}>
                    <TouchableOpacity
                      style={styles.historyCard}
                      onPress={() => {
                        // Navigate to scan result with minimal data - content will be regenerated via API
                        router.push({
                          pathname: "/scan-result" as any,
                          params: { 
                            historyItemId: item.id,
                            monumentName: item.name,
                            location: item.location,
                            period: item.period,
                            scannedImage: item.scannedImage,
                            regenerate: 'true' // Flag to indicate content should be regenerated
                          },
                        });
                      }}
                    >
                      <Image source={{ uri: item.scannedImage }} style={styles.historyCardBackground} />
                      <LinearGradient
                        colors={['transparent', 'transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']}
                        style={styles.historyCardOverlay}
                      />
                      <View style={styles.historyCardContent}>
                        <Text style={styles.historyMonumentName} numberOfLines={2}>{item.name}</Text>
                        <Text style={styles.historyPeriod} numberOfLines={1}>{item.period || formatDate(item.scannedAt)}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyHistoryContainer}>
              <Camera size={48} color="#cbd5e1" />
              <Text style={styles.emptyHistoryText}>No discoveries yet</Text>
              <Text style={styles.emptyHistorySubtext}>Start scanning monuments and art to build your collection</Text>
            </View>
          )}
          
          {!historyLoading && history.length > 6 && (
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllButtonText}>View All Discoveries</Text>
              <ChevronRight size={16} color="#8B4513" />
            </TouchableOpacity>
          )}
        </View>



        {!historyLoading && history.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={clearHistory}
          >
            <Text style={styles.clearButtonText}>Clear Discovery History</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      
      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          console.log('🔐 Modal onRequestClose triggered');
          setShowSettings(false);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Settings</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => {
                console.log('🔐 Close button pressed');
                setShowSettings(false);
              }}
            >
              <X size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.menuContainer}>
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.menuItem}
                    onPress={() => {
                      console.log('🔐 Menu item pressed:', item.label);
                      item.action();
                    }}
                  >
                    <View style={styles.menuItemLeft}>
                      <View style={styles.menuIconContainer}>
                        <Icon size={20} color="#64748b" />
                      </View>
                      <Text style={styles.menuItemText}>{item.label}</Text>
                    </View>
                    <ChevronRight size={20} color="#cbd5e1" />
                  </TouchableOpacity>
                );
              })}
              
              {/* Test sign out button directly in modal */}
              <TouchableOpacity
                style={styles.testSignOutButton}
                onPress={() => {
                  console.log('🔐 Test sign out button in modal pressed');
                  testSignOut();
                }}
              >
                <Text style={styles.testSignOutText}>TEST SIGN OUT IN MODAL</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  profileSection: {
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#f59e0b",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  userName: {
    fontSize: 24,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "400",
    color: "#ffffff",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 15,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontStyle: "italic",
    color: "rgba(255,255,255,0.9)",
    marginBottom: 20,
  },
  userSubtitle: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontStyle: "italic",
    color: "rgba(255,255,255,0.8)",
    marginTop: 8,
  },
  testSignOutButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  testSignOutText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: -20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    gap: 8,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f8f4f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 28,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "600",
    color: "#2C3E50",
  },
  statLabel: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#2C3E50",
    fontWeight: "500",
  },
  statDescription: {
    fontSize: 12,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#64748b",
    fontWeight: "400",
    textAlign: "center",
  },
  section: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
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
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#64748b",
    fontStyle: "italic",
  },
  historyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  historyCardContainer: {
    width: "48%",
  },
  historyCard: {
    width: "100%",
    height: 240,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    position: "relative",
  },
  historyCardBackground: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    position: "absolute",
  },
  historyCardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  historyCardContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    justifyContent: "flex-end",
  },

  historyMonumentName: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "600",
    color: "#ffffff",
    lineHeight: 18,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  historyPeriod: {
    fontSize: 12,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "rgba(255,255,255,0.9)",
    fontStyle: "italic",
    marginTop: 2,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  historyInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  historyInfoText: {
    fontSize: 12,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#64748b",
    flex: 1,
  },
  historyScanDate: {
    fontSize: 11,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#94a3b8",
    marginTop: 2,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f4f0",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  viewAllButtonText: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#8B4513",
    fontWeight: "500",
  },

  menuContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  menuItemText: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#2C3E50",
    fontWeight: "400",
  },
  clearButton: {
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 30,
    backgroundColor: "#fef2f2",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  clearButtonText: {
    color: "#dc2626",
    fontSize: 15,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
  },
  loadingContainer: {
    marginBottom: 20,
  },
  loadingGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  loadingCard: {
    width: "48%",
    height: 240,
    borderRadius: 16,
    backgroundColor: "#f8f9fa",
    overflow: "hidden",
    position: "relative",
  },
  loadingCardBackground: {
    width: "100%",
    height: "70%",
    backgroundColor: "#e9ecef",
    opacity: 0.6,
  },
  loadingCardContent: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    gap: 6,
  },
  loadingText: {
    height: 16,
    backgroundColor: "#dee2e6",
    borderRadius: 4,
    opacity: 0.7,
  },
  loadingTextSmall: {
    height: 12,
    width: "60%",
    backgroundColor: "#dee2e6",
    borderRadius: 4,
    opacity: 0.5,
  },
  settingsButton: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FEFEFE",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "600",
    color: "#2C3E50",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: '#ffffff',
  },
  emptyHistoryContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyHistoryText: {
    fontSize: 18,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: "#64748b",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyHistorySubtext: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 20,
  },
});