import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookOpen, Clock, Globe, Award } from "lucide-react-native";

import Colors from "@/constants/colors";

const learningCategories = [
  {
    id: "1",
    title: "Ancient Civilizations",
    description: "Explore the wonders of ancient Egypt, Greece, and Rome",
    icon: Globe,
    gradient: ["#4f46e5", "#7c3aed"],
    lessons: 12,
    duration: "3 hours",
    image: "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=300",
  },
  {
    id: "2",
    title: "Medieval Architecture",
    description: "Discover castles, cathedrals, and fortresses",
    icon: Award,
    gradient: ["#059669", "#10b981"],
    lessons: 8,
    duration: "2 hours",
    image: "https://images.unsplash.com/photo-1520637836862-4d197d17c90a?w=300",
  },
  {
    id: "3",
    title: "Renaissance Art",
    description: "Learn about the masters and their masterpieces",
    icon: BookOpen,
    gradient: ["#dc2626", "#f87171"],
    lessons: 10,
    duration: "2.5 hours",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300",
  },
  {
    id: "4",
    title: "Modern Monuments",
    description: "Understanding contemporary historical landmarks",
    icon: Clock,
    gradient: ["#f59e0b", "#fbbf24"],
    lessons: 6,
    duration: "1.5 hours",
    image: "https://images.unsplash.com/photo-1549813069-f95e44d7f498?w=300",
  },
];

const featuredArticles = [
  {
    id: "1",
    title: "The Mystery of Stonehenge",
    excerpt: "Unraveling the secrets of Britain's most enigmatic monument",
    image: "https://images.unsplash.com/photo-1599582909646-9e9e1ee7dd0f?w=400",
    readTime: "5 min",
  },
  {
    id: "2",
    title: "Pyramids: Engineering Marvels",
    excerpt: "How ancient Egyptians built structures that defy time",
    image: "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=400",
    readTime: "7 min",
  },
];

export default function LearnScreen() {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1d3557" translucent />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.titleSection, { paddingTop: insets.top + 20 }]}>
          <Text style={styles.headerTitle}>Explore History</Text>
          <Text style={styles.headerSubtitle}>
            Discover the stories behind the world's greatest monuments and art
          </Text>
          
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Text style={styles.searchPlaceholder}>What would you like to learn?</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.categoriesGrid}>
            {learningCategories.map((category) => {
              const Icon = category.icon;
              return (
                <TouchableOpacity key={category.id} style={styles.categoryCard}>
                  <Image source={{ uri: category.image }} style={styles.categoryImage} />
                  <View style={styles.categoryOverlay}>
                    <View style={styles.categoryContent}>
                      <Icon size={24} color="#ffffff" />
                      <Text style={styles.categoryTitle}>{category.title}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Articles</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          
          {featuredArticles.map((article) => (
            <TouchableOpacity key={article.id} style={styles.articleCard}>
              <Image source={{ uri: article.image }} style={styles.articleImage} />
              <View style={styles.articleContent}>
                <Text style={styles.articleTitle}>{article.title}</Text>
                <Text style={styles.articleExcerpt}>{article.excerpt}</Text>
                <View style={styles.articleFooter}>
                  <Clock size={14} color="#64748b" />
                  <Text style={styles.readTime}>{article.readTime} read</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.quizCard}>
            <View style={styles.quizGradient}>
              <View style={styles.quizContent}>
                <Text style={styles.quizTitle}>Daily Challenge</Text>
                <Text style={styles.quizDescription}>
                  Test your knowledge with today's historical quiz
                </Text>
                <View style={styles.quizButton}>
                  <Text style={styles.quizButtonText}>Start Challenge</Text>
                </View>
              </View>
              <View style={styles.quizIcon}>
                <Award size={40} color="rgba(255,255,255,0.3)" />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <View style={styles.bottomSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  titleSection: {
    paddingHorizontal: 14,
    paddingBottom: 20,
    alignItems: 'center',
    gap: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: Colors.text.muted,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 300,
  },
  searchContainer: {
    marginTop: 8,
  },
  searchBar: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  searchPlaceholder: {
    fontSize: 15,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: Colors.text.muted,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
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
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  categoryCard: {
    width: "48%",
    height: 130,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  categoryImage: {
    width: "100%",
    height: "100%",
  },
  categoryOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "100%",
    justifyContent: "flex-end",
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  categoryContent: {
    gap: 8,
  },
  categoryTitle: {
    fontSize: 15,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: "#ffffff",
  },
  articleCard: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    marginBottom: 12,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  articleImage: {
    width: 100,
    height: 100,
  },
  articleContent: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  articleTitle: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: Colors.text.primary,
    marginBottom: 6,
  },
  articleExcerpt: {
    fontSize: 13,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: Colors.text.muted,
    lineHeight: 18,
  },
  articleFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  readTime: {
    fontSize: 12,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: Colors.text.muted,
  },
  quizCard: {
    marginBottom: 30,
  },
  quizGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 14,
    backgroundColor: Colors.accent.secondary,
  },
  quizContent: {
    flex: 1,
  },
  quizTitle: {
    fontSize: 18,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: "#ffffff",
    marginBottom: 8,
  },
  quizDescription: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontStyle: "italic",
    color: "rgba(255,255,255,0.9)",
    marginBottom: 16,
    lineHeight: 20,
  },
  quizButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  quizButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
  },
  quizIcon: {
    marginLeft: 16,
  },
  bottomSpacer: {
    height: 100,
  },
});