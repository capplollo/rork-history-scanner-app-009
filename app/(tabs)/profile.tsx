import React, { useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
} from "react-native";
import { 
  User, 
  Trophy, 
  MapPin, 
  Calendar,
  Settings,
  LogOut,
  ChevronRight,
  Camera
} from "lucide-react-native";
import { useHistory } from "@/providers/HistoryProvider";
import { useAuth } from "@/providers/AuthProvider";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

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

  const stats = [
    { label: "Scanned", value: history.length.toString() },
    { label: "Countries", value: "5" },
    { label: "Points", value: "1,250" },
  ];

  const achievements = [
    { id: "1", name: "First Scan", icon: Trophy, unlocked: history.length > 0 },
    { id: "2", name: "History Buff", icon: Calendar, unlocked: history.length >= 5 },
    { id: "3", name: "Explorer", icon: MapPin, unlocked: history.length >= 10 },
  ];

  const menuItems = [
    { icon: Settings, label: "Settings", action: () => {} },
    { icon: Trophy, label: "Achievements", action: () => {} },
    { icon: LogOut, label: "Sign Out", action: handleSignOut },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={["#334155", "#1e293b"]}
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
            
            <View style={styles.levelProgress}>
              <View style={styles.progressBar}>
                <View style={styles.progressFill} />
              </View>
              <Text style={styles.progressText}>2,450 / 5,000 XP</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement) => {
              const Icon = achievement.icon;
              return (
                <TouchableOpacity
                  key={achievement.id}
                  style={[
                    styles.achievementCard,
                    !achievement.unlocked && styles.achievementLocked,
                  ]}
                >
                  <View style={[
                    styles.achievementIcon,
                    achievement.unlocked ? styles.achievementIconUnlocked : styles.achievementIconLocked,
                  ]}>
                    <Icon 
                      size={24} 
                      color={achievement.unlocked ? "#ffffff" : "#9ca3af"} 
                    />
                  </View>
                  <Text style={[
                    styles.achievementName,
                    !achievement.unlocked && styles.achievementNameLocked,
                  ]}>
                    {achievement.name}
                  </Text>
                  {achievement.unlocked && (
                    <View style={styles.achievementBadge}>
                      <Text style={styles.badgeText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
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

        <TouchableOpacity 
          style={styles.clearButton}
          onPress={clearHistory}
        >
          <Text style={styles.clearButtonText}>Clear Scan History</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
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
    fontSize: 28,
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 20,
  },
  levelProgress: {
    width: "100%",
    alignItems: "center",
    gap: 8,
  },
  progressBar: {
    width: "80%",
    height: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    width: "49%",
    height: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
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
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
    fontWeight: "500",
  },
  section: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 16,
  },
  achievementsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  achievementCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    position: "relative",
  },
  achievementLocked: {
    opacity: 0.6,
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  achievementIconUnlocked: {
    backgroundColor: "#4f46e5",
  },
  achievementIconLocked: {
    backgroundColor: "#f1f5f9",
  },
  achievementName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1e293b",
    textAlign: "center",
  },
  achievementNameLocked: {
    color: "#94a3b8",
  },
  achievementBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#10b981",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    fontSize: 10,
    color: "#ffffff",
    fontWeight: "600",
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
    color: "#1e293b",
    fontWeight: "500",
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
    fontSize: 16,
    fontWeight: "600",
  },
});