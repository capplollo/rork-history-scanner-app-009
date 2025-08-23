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
  TextInput,
} from "react-native";
import { 
  User, 
  MapPin, 
  Settings,
  LogOut,
  Camera,
  Globe,
  X,
  Filter,
  Search,
  ChevronDown
} from "lucide-react-native";
import { useHistory } from "@/providers/HistoryProvider";
import { useAuth } from "@/providers/AuthProvider";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";


export default function ProfileScreen() {
  const { history, clearHistory, isLoading: historyLoading } = useHistory();
  const { user, signOut, loading } = useAuth();
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [showCountryPicker, setShowCountryPicker] = useState<boolean>(false);

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
      if (item.country) {
        countries.add(item.country);
      } else if (item.location) {
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

  const allCountries = useMemo(() => {
    const countries = new Set<string>();
    history.forEach(item => {
      if (item.country) {
        countries.add(item.country);
      } else if (item.location) {
        const parts = item.location.split(',');
        const country = parts[parts.length - 1].trim();
        if (country) {
          countries.add(country);
        }
      }
    });
    return Array.from(countries).sort();
  }, [history]);

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const matchesSearch = searchText === "" || 
        item.name.toLowerCase().includes(searchText.toLowerCase());
      
      const matchesCountry = selectedCountry === "" || 
        item.country === selectedCountry || 
        (item.location && item.location.includes(selectedCountry));
      
      return matchesSearch && matchesCountry;
    });
  }, [history, searchText, selectedCountry]);

  const stats = [
    { 
      label: "Discoveries", 
      value: history.length.toString(),
      icon: Camera
    },
    { 
      label: "Countries", 
      value: visitedCountries.toString(),
      icon: Globe
    },
  ];

  const menuItems = [
    { icon: LogOut, label: "Sign Out", action: handleSignOut },
  ];



  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={["#667eea", "#764ba2", "#f093fb"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.profileSection}>
            <View style={styles.profileRow}>
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={["#ffffff", "#f8fafc"]}
                  style={styles.avatar}
                >
                  <User size={28} color="#667eea" />
                </LinearGradient>
                <View style={styles.avatarGlow} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.userName}>{user.user_metadata?.full_name || 'Explorer'}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
              <TouchableOpacity 
                style={styles.settingsButton}
                onPress={() => setShowSettings(true)}
              >
                <Settings size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.statsContainer}>
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <View key={index} style={styles.statBadge}>
                    <View style={styles.statIconContainer}>
                      <Icon size={18} color="#667eea" />
                    </View>
                    <View style={styles.statTextContainer}>
                      <Text style={styles.statBadgeValue}>{stat.value}</Text>
                      <Text style={styles.statBadgeLabel}>{stat.label}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </LinearGradient>

        {/* Filter Section */}
        <View style={styles.filterSection}>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} color="#64748b" />
            <Text style={styles.filterButtonText}>Filter</Text>
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View style={styles.filtersContainer}>
            <View style={styles.searchContainer}>
              <Search size={16} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name..."
                value={searchText}
                onChangeText={setSearchText}
                placeholderTextColor="#94a3b8"
              />
            </View>
            
            <TouchableOpacity 
              style={styles.countryPicker}
              onPress={() => setShowCountryPicker(true)}
            >
              <Text style={styles.countryPickerText}>
                {selectedCountry || "All Countries"}
              </Text>
              <ChevronDown size={16} color="#64748b" />
            </TouchableOpacity>
          </View>
        )}

        {/* All Discoveries Section */}
        <View style={styles.section}>
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
              {filteredHistory.map((item, index) => {
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
          ) : filteredHistory.length === 0 && history.length > 0 ? (
            <View style={styles.emptyHistoryContainer}>
              <Search size={48} color="#cbd5e1" />
              <Text style={styles.emptyHistoryText}>No matches found</Text>
              <Text style={styles.emptyHistorySubtext}>Try adjusting your search or filter criteria</Text>
            </View>
          ) : (
            <View style={styles.emptyHistoryContainer}>
              <Camera size={48} color="#cbd5e1" />
              <Text style={styles.emptyHistoryText}>No discoveries yet</Text>
              <Text style={styles.emptyHistorySubtext}>Start scanning monuments and art to build your collection</Text>
            </View>
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
                    <View style={{ width: 20, height: 20 }} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Country Picker Modal */}
      <Modal
        visible={showCountryPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowCountryPicker(false)}
            >
              <X size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <TouchableOpacity
              style={styles.countryOption}
              onPress={() => {
                setSelectedCountry("");
                setShowCountryPicker(false);
              }}
            >
              <Text style={[styles.countryOptionText, selectedCountry === "" && styles.selectedCountryText]}>All Countries</Text>
            </TouchableOpacity>
            {allCountries.map((country, index) => (
              <TouchableOpacity
                key={index}
                style={styles.countryOption}
                onPress={() => {
                  setSelectedCountry(country);
                  setShowCountryPicker(false);
                }}
              >
                <Text style={[styles.countryOptionText, selectedCountry === country && styles.selectedCountryText]}>{country}</Text>
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
    paddingTop: 24,
    paddingBottom: 48,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  profileSection: {
    flex: 1,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 4,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  avatarGlow: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    top: -4,
    left: -4,
    zIndex: -1,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.5,
  },
  userEmail: {
    fontSize: 15,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "rgba(255,255,255,0.85)",
    fontWeight: "400",
    letterSpacing: 0.3,
  },

  statsContainer: {
    flexDirection: "row",
    marginTop: 32,
    gap: 16,
    justifyContent: "center",
  },
  statBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 120,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
  },
  statTextContainer: {
    alignItems: "center",
    flex: 1,
  },
  statBadgeValue: {
    fontSize: 20,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "800",
    color: "#ffffff",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.5,
  },
  statBadgeLabel: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "rgba(255, 255, 255, 0.95)",
    fontWeight: "600",
    marginTop: 2,
    letterSpacing: 0.3,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
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
  filterSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    alignItems: "center",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  filterButtonText: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#64748b",
    fontWeight: "500",
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginTop: 12,
    gap: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#2C3E50",
  },
  countryPicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  countryPickerText: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#2C3E50",
  },
  countryOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  countryOptionText: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#2C3E50",
  },
  selectedCountryText: {
    color: "#4f46e5",
    fontWeight: "600",
  },
});