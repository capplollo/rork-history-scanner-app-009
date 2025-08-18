import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { X, MapPin, Calendar, Info, Share2, CheckCircle, AlertCircle, MessageCircle } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { mockMonuments } from "@/data/mockMonuments";
import { HistoryItem } from "@/providers/HistoryProvider";
import { scanResultStore } from "@/services/scanResultStore";

const { width: screenWidth } = Dimensions.get("window");

export default function ScanResultScreen() {
  const { monumentId, scanData, resultId } = useLocalSearchParams();
  
  let monument: HistoryItem | undefined;
  
  // Try to get data from resultId first (new method), then scanData (legacy), then monumentId
  if (resultId && typeof resultId === 'string') {
    const retrievedMonument = scanResultStore.retrieve(resultId);
    if (retrievedMonument) {
      monument = retrievedMonument;
      // Clean up the stored result after retrieval to prevent memory leaks
      scanResultStore.clear(resultId);
    }
  }
  
  // Legacy support for scanData (in case some old navigation still uses it)
  if (!monument && scanData && typeof scanData === 'string') {
    try {
      monument = JSON.parse(scanData) as HistoryItem;
    } catch (error) {
      console.error('Error parsing scan data:', error);
    }
  }
  
  // Fallback to mock data if no scan data
  if (!monument && monumentId) {
    const mockMonument = mockMonuments.find(m => m.id === monumentId);
    if (mockMonument) {
      monument = {
        ...mockMonument,
        scannedImage: mockMonument.image,
        scannedAt: new Date().toISOString(),
      };
    }
  }

  if (!monument) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Monument not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: monument.scannedImage || monument.image }} style={styles.monumentImage} />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            style={styles.imageOverlay}
          >
            <Text style={styles.monumentName}>{monument.name}</Text>
            {monument.confidence !== undefined && (
              <View style={styles.confidenceContainer}>
                {monument.isRecognized ? (
                  <CheckCircle size={16} color="#10b981" />
                ) : (
                  <AlertCircle size={16} color="#f59e0b" />
                )}
                <Text style={styles.confidenceText}>
                  {monument.confidence}% confidence
                </Text>
              </View>
            )}
          </LinearGradient>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.infoCards}>
            <View style={styles.infoCard}>
              <MapPin size={20} color="#1e3a8a" />
              <View>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{monument.location}</Text>
              </View>
            </View>
            <View style={styles.infoCard}>
              <Calendar size={20} color="#1e3a8a" />
              <View>
                <Text style={styles.infoLabel}>Period</Text>
                <Text style={styles.infoValue}>{monument.period}</Text>
              </View>
            </View>
          </View>
          
          {monument.scannedAt && (
            <View style={styles.scanInfo}>
              <Text style={styles.scanInfoText}>
                Scanned on {new Date(monument.scannedAt).toLocaleDateString()}
              </Text>
            </View>
          )}

          {monument.detailedDescription ? (
            <>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Info size={20} color="#1e3a8a" />
                  <Text style={styles.sectionTitle}>Quick Overview</Text>
                </View>
                <Text style={styles.quickOverview}>{monument.detailedDescription.quickOverview}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>In-Depth Context</Text>
                <Text style={styles.inDepthContext}>{monument.detailedDescription.inDepthContext}</Text>
              </View>

              {monument.detailedDescription.curiosities && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Curiosities</Text>
                  <Text style={styles.curiosities}>{monument.detailedDescription.curiosities}</Text>
                </View>
              )}

              <View style={styles.factsSection}>
                <Text style={styles.sectionTitle}>Key Takeaways</Text>
                {monument.detailedDescription.keyTakeaways.map((takeaway: string, index: number) => (
                  <View key={index} style={styles.factItem}>
                    <Text style={styles.factBullet}>•</Text>
                    <Text style={styles.factText}>{takeaway}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Info size={20} color="#1e3a8a" />
                  <Text style={styles.sectionTitle}>About</Text>
                </View>
                <Text style={styles.description}>{monument.description}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Historical Significance</Text>
                <Text style={styles.significance}>{monument.significance}</Text>
              </View>

              <View style={styles.factsSection}>
                <Text style={styles.sectionTitle}>Quick Facts</Text>
                {monument.facts.map((fact: string, index: number) => (
                  <View key={index} style={styles.factItem}>
                    <Text style={styles.factBullet}>•</Text>
                    <Text style={styles.factText}>{fact}</Text>
                  </View>
                ))}
              </View>
            </>
          )}



          <TouchableOpacity 
            style={styles.chatButton}
            onPress={() => {
              // Navigate to chat modal with monument context
              router.push({
                pathname: "/chat-modal" as any,
                params: { 
                  monumentId: monument.id,
                  monumentName: monument.name
                }
              });
            }}
          >
            <LinearGradient
              colors={["#4f46e5", "#6366f1"]}
              style={styles.chatGradient}
            >
              <MessageCircle size={24} color="#ffffff" />
              <Text style={styles.chatButtonText}>Ask AI About This Monument</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareButton}>
            <LinearGradient
              colors={["#1e3a8a", "#3b82f6"]}
              style={styles.shareGradient}
            >
              <Share2 size={20} color="#ffffff" />
              <Text style={styles.shareButtonText}>Share Discovery</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafaf9",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#6b7280",
    marginBottom: 20,
  },
  backButton: {
    fontSize: 16,
    color: "#1e3a8a",
    fontWeight: "600",
  },
  imageContainer: {
    position: "relative",
    height: 400,
  },
  monumentImage: {
    width: screenWidth,
    height: 400,
    resizeMode: "cover",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
    justifyContent: "flex-end",
    padding: 20,
  },
  monumentName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 10,
  },
  closeButton: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    padding: 10,
  },
  content: {
    padding: 20,
  },
  infoCards: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 25,
  },
  infoCard: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 12,
    gap: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 24,
  },
  significance: {
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 24,
    fontStyle: "italic",
  },
  quickOverview: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 26,
    fontWeight: "500",
  },
  inDepthContext: {
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 24,
  },
  curiosities: {
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 24,
    fontStyle: "italic",
    backgroundColor: "#fef3c7",
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  factsSection: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 15,
    marginBottom: 25,
  },
  factItem: {
    flexDirection: "row",
    marginBottom: 10,
  },
  factBullet: {
    fontSize: 16,
    color: "#f59e0b",
    marginRight: 10,
    fontWeight: "bold",
  },
  factText: {
    fontSize: 14,
    color: "#4b5563",
    flex: 1,
    lineHeight: 20,
  },
  chatButton: {
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 16,
  },
  chatGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 12,
  },
  chatButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  shareButton: {
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 20,
  },
  shareGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },
  shareButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  confidenceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  confidenceText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  scanInfo: {
    backgroundColor: "rgba(79, 70, 229, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: "#4f46e5",
  },
  scanInfoText: {
    fontSize: 14,
    color: "#4f46e5",
    fontWeight: "500",
  },
});
