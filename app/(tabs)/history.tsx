import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from "react-native";
import { useHistory } from "@/providers/HistoryProvider";
import { Clock, MapPin, Calendar, Search, Filter } from "lucide-react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { scanResultStore } from "@/services/scanResultStore";

export default function HistoryScreen() {
  const { history } = useHistory();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#2C3E50", "#34495E"]}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Your Journey</Text>
          <Text style={styles.headerSubtitle}>
            {history.length} {history.length === 1 ? "monument" : "monuments"} discovered
          </Text>
          
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Search size={20} color="#64748b" />
              <Text style={styles.searchPlaceholder}>Search your discoveries...</Text>
            </View>
            <TouchableOpacity style={styles.filterButton}>
              <Filter size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Clock size={60} color="#8B4513" />
          </View>
          <Text style={styles.emptyTitle}>Start Your Journey</Text>
          <Text style={styles.emptyText}>
            Scan your first monument to begin building your personal history collection
          </Text>
          <TouchableOpacity style={styles.startButton}>
            <Text style={styles.startButtonText}>Start Scanning</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{history.length}</Text>
              <Text style={styles.statLabel}>Scanned</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>5</Text>
              <Text style={styles.statLabel}>Countries</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>This Month</Text>
            </View>
          </View>
          
          <Text style={styles.sectionTitle}>Recent Discoveries</Text>
          
          {history.map((item, index) => (
            <TouchableOpacity
              key={`${item.id}-${index}`}
              style={styles.historyCard}
              onPress={() => {
                // Store the item and navigate with just the ID to avoid URL size limits
                const resultId = scanResultStore.store(item);
                router.push({
                  pathname: "/scan-result" as any,
                  params: { resultId: resultId },
                });
              }}
            >
              <Image source={{ uri: item.scannedImage }} style={styles.thumbnail} />
              <View style={styles.cardContent}>
                <Text style={styles.monumentName}>{item.name}</Text>
                <View style={styles.infoRow}>
                  <MapPin size={14} color="#64748b" />
                  <Text style={styles.infoText}>{item.location}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Calendar size={14} color="#64748b" />
                  <Text style={styles.infoText}>{item.period}</Text>
                </View>
                <View style={styles.scanInfo}>
                  <Text style={styles.scanDate}>
                    {formatDate(item.scannedAt)}
                  </Text>
                  <Text style={styles.scanTime}>{formatTime(item.scannedAt)}</Text>
                </View>
              </View>
              <View style={styles.cardBadge}>
                <Text style={styles.badgeText}>#{index + 1}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
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
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    gap: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "400",
    color: "#ffffff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontStyle: "italic",
    color: "rgba(255,255,255,0.9)",
  },
  searchContainer: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchPlaceholder: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#64748b",
  },
  filterButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    padding: 12,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 22,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: "#2C3E50",
  },
  statLabel: {
    fontSize: 12,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#64748b",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: "#2C3E50",
    marginBottom: 16,
  },
  historyCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    position: "relative",
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  monumentName: {
    fontSize: 17,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: "#2C3E50",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#64748b",
  },
  scanInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  scanDate: {
    fontSize: 12,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#94a3b8",
    fontWeight: "400",
  },
  scanTime: {
    fontSize: 11,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#cbd5e1",
    marginTop: 2,
  },
  cardBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#8B4513",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#ffffff",
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: "#2C3E50",
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  startButton: {
    backgroundColor: "#8B4513",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 20,
  },
  startButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
  },
});