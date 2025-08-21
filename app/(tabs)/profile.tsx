import React, { useEffect, useMemo } from "react";
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
  Clock
} from "lucide-react-native";
import { useHistory } from "@/providers/HistoryProvider";
import { useAuth } from "@/providers/AuthProvider";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { scanResultStore } from "@/services/scanResultStore";

export default function ProfileScreen() {
  const { history, clearHistory } = useHistory();
  const { user, signOut, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading]);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const { error } = await signOut();
            if (error) {
              Alert.alert('Error', 'Failed to sign out');
            } else {
              router.replace('/login');
            }
          },
        },
      ]
    );
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
      description: "Monuments explored"
    },
    { 
      label: "Destinations", 
      value: visitedCountries.toString(),
      icon: Globe,
      description: "Countries visited"
    },
  ];

  const menuItems = [
    { icon: Settings, label: "Settings", action: () => {} },
    { icon: LogOut, label: "Sign Out", action: handleSignOut },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={["#2C3E50", "#34495E"]}
          style={styles.headerGradient}
        >
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
        {history.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Clock size={20} color="#8B4513" />
                <Text style={styles.sectionTitle}>Your Discoveries</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                {history.length} {history.length === 1 ? "monument" : "monuments"} explored
              </Text>
            </View>
            
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
                  <TouchableOpacity
                    key={`${item.id}-${index}`}
                    style={styles.historyCard}
                    onPress={() => {
                      const resultId = scanResultStore.store(item);
                      router.push({
                        pathname: "/scan-result" as any,
                        params: { resultId: resultId },
                      });
                    }}
                  >
                    <Image source={{ uri: item.scannedImage }} style={styles.historyThumbnail} />
                    <View style={styles.historyCardContent}>
                      <Text style={styles.historyMonumentName} numberOfLines={2}>{item.name}</Text>
                      <View style={styles.historyInfoRow}>
                        <MapPin size={12} color="#64748b" />
                        <Text style={styles.historyInfoText} numberOfLines={1}>{item.location}</Text>
                      </View>
                      <Text style={styles.historyScanDate}>{formatDate(item.scannedAt)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            
            {history.length > 6 && (
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllButtonText}>View All Discoveries</Text>
                <ChevronRight size={16} color="#8B4513" />
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={item.action}
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
          </View>
        </View>

        {history.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={clearHistory}
          >
            <Text style={styles.clearButtonText}>Clear Discovery History</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
  historyCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  historyThumbnail: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  historyCardContent: {
    padding: 12,
    gap: 6,
  },
  historyMonumentName: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: "#2C3E50",
    lineHeight: 18,
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
});