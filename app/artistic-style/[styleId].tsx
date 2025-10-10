import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  Image,
  Platform,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Palette, Users, Award } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { artisticStyles } from "@/data/artisticStyles";

export default function ArtisticStyleDetailScreen() {
  const { styleId } = useLocalSearchParams<{ styleId: string }>();
  const style = artisticStyles.find((s) => s.id === styleId);

  if (!style) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Style not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: style.image }} style={styles.heroImage} />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={styles.imageOverlay}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color="#ffffff" />
            </TouchableOpacity>
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>{style.title}</Text>
              <Text style={styles.heroPeriod}>{style.period}</Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.content}>
          <LinearGradient
            colors={style.gradient}
            style={styles.descriptionCard}
          >
            <Text style={styles.descriptionText}>{style.description}</Text>
          </LinearGradient>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Palette size={24} color="#2C3E50" />
              <Text style={styles.sectionTitle}>Key Characteristics</Text>
            </View>
            <View style={styles.characteristicsList}>
              {style.keyCharacteristics.map((characteristic, index) => (
                <View key={index} style={styles.characteristicItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.characteristicText}>{characteristic}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Users size={24} color="#2C3E50" />
              <Text style={styles.sectionTitle}>Famous Artists</Text>
            </View>
            <View style={styles.artistsList}>
              {style.famousArtists.map((artist, index) => (
                <View key={index} style={styles.artistCard}>
                  <Text style={styles.artistName}>{artist}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Award size={24} color="#2C3E50" />
              <Text style={styles.sectionTitle}>Famous Works</Text>
            </View>
            <View style={styles.worksList}>
              {style.famousWorks.map((work, index) => (
                <View key={index} style={styles.workItem}>
                  <View style={styles.workBullet} />
                  <Text style={styles.workText}>{work}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FEFEFE",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#64748b",
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 3 / 4,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-between",
    padding: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  heroContent: {
    alignSelf: "flex-start",
  },
  heroTitle: {
    fontSize: 32,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 8,
  },
  heroPeriod: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontStyle: "italic",
    color: "rgba(255,255,255,0.9)",
  },
  content: {
    padding: 20,
  },
  descriptionCard: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 30,
  },
  descriptionText: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    lineHeight: 24,
    color: "#ffffff",
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "600",
    color: "#2C3E50",
  },
  characteristicsList: {
    gap: 12,
  },
  characteristicItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#8B4513",
    marginTop: 8,
  },
  characteristicText: {
    flex: 1,
    fontSize: 15,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    lineHeight: 22,
    color: "#374151",
  },
  artistsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  artistCard: {
    backgroundColor: "#f8fafc",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  artistName: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: "#2C3E50",
  },
  worksList: {
    gap: 12,
  },
  workItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  workBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#8B4513",
    marginTop: 8,
  },
  workText: {
    flex: 1,
    fontSize: 15,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    lineHeight: 22,
    color: "#374151",
    fontStyle: "italic",
  },
});