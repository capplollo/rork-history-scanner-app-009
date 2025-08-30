<<<<<<< HEAD
import React, { useState } from "react";
=======
import React, { useEffect, useMemo } from "react";
>>>>>>> 4732a54d147b6cb99b572dc2354968fcd61c1611
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
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

export default function ProfileScreen() {
<<<<<<< HEAD
  const [showSettings, setShowSettings] = useState<boolean>(false);
=======
  const { history, clearHistory, isLoading: historyLoading } = useHistory();
  const { user, signOut, loading } = useAuth();
>>>>>>> 4732a54d147b6cb99b572dc2354968fcd61c1611

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
<<<<<<< HEAD
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
=======
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
>>>>>>> 4732a54d147b6cb99b572dc2354968fcd61c1611
          },
        },
      ]
    );
  };

  const stats = [
    { 
      label: "Discoveries", 
      value: "0",
      icon: Camera,
      description: "Monuments and art explored"
    },
    { 
      label: "Destinations", 
      value: "0",
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
<<<<<<< HEAD
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => setShowSettings(true)}
          >
            <Settings size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
=======
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
>>>>>>> 4732a54d147b6cb99b572dc2354968fcd61c1611

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={40} color="#8B4513" />
            </View>
          </View>
          
          <Text style={styles.userName}>Demo User</Text>
          <Text style={styles.userEmail}>demo@example.com</Text>
          
          <View style={styles.userInfo}>
            <View style={styles.infoItem}>
              <MapPin size={16} color="#666" />
              <Text style={styles.infoText}>Location not set</Text>
            </View>
            <View style={styles.infoItem}>
              <Calendar size={16} color="#666" />
              <Text style={styles.infoText}>Member since 2024</Text>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Journey</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <View style={styles.statIcon}>
                  <stat.icon size={24} color="#8B4513" />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statDescription}>{stat.description}</Text>
              </View>
            ))}
          </View>
<<<<<<< HEAD
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.emptyState}>
            <Clock size={48} color="#CCC" />
            <Text style={styles.emptyStateTitle}>No Recent Activity</Text>
            <Text style={styles.emptyStateText}>
              Start scanning monuments and art to see your activity here
            </Text>
          </View>
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
=======
          
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
                      <Image source={{ uri: item.scannedImage || item.image || 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400' }} style={styles.historyCardBackground} />
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

        {!historyLoading && history.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={clearHistory}
          >
            <Text style={styles.clearButtonText}>Clear Discovery History</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
>>>>>>> 4732a54d147b6cb99b572dc2354968fcd61c1611
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFEFE',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C2C2C',
    fontFamily: 'Times New Roman',
  },
  settingsButton: {
    padding: 8,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF8F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#8B4513',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C2C2C',
    marginBottom: 4,
    fontFamily: 'Times New Roman',
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    fontFamily: 'Times New Roman',
  },
<<<<<<< HEAD
  userInfo: {
=======
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
>>>>>>> 4732a54d147b6cb99b572dc2354968fcd61c1611
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Times New Roman',
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C2C2C',
    marginBottom: 16,
    fontFamily: 'Times New Roman',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF8F0',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 4,
    fontFamily: 'Times New Roman',
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 4,
    fontFamily: 'Times New Roman',
  },
  statDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Times New Roman',
  },
  activitySection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Times New Roman',
  },
<<<<<<< HEAD
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
    fontFamily: 'Times New Roman',
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
    fontWeight: 'bold',
    color: '#2C2C2C',
    fontFamily: 'Times New Roman',
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
=======
  loadingTextSmall: {
    height: 12,
    width: "60%",
    backgroundColor: "#dee2e6",
    borderRadius: 4,
    opacity: 0.5,
  },
  emptyHistoryContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
>>>>>>> 4732a54d147b6cb99b572dc2354968fcd61c1611
  },
  menuItemText: {
    fontSize: 16,
    color: '#2C2C2C',
    fontFamily: 'Times New Roman',
  },
});