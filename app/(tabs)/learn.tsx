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
import { BookOpen, Clock } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import Colors from "@/constants/colors";

const articles = [
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
  {
    id: "3",
    title: "Gothic Cathedrals of Europe",
    excerpt: "The architectural wonders of medieval Christianity",
    image: "https://images.unsplash.com/photo-1520637836862-4d197d17c90a?w=400",
    readTime: "6 min",
  },
  {
    id: "4",
    title: "Roman Aqueducts",
    excerpt: "Ancient engineering that still inspires modern infrastructure",
    image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400",
    readTime: "4 min",
  },
  {
    id: "5",
    title: "The Colosseum's Hidden History",
    excerpt: "Beyond the gladiators: untold stories of Rome's amphitheater",
    image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400",
    readTime: "8 min",
  },
];

const courses = [
  {
    id: "1",
    title: "Ancient Civilizations",
    description: "Explore the wonders of ancient Egypt, Greece, and Rome",
    lessons: 12,
    duration: "3 hours",
    image: "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=400",
    progress: 0,
  },
  {
    id: "2",
    title: "Medieval Architecture",
    description: "Discover castles, cathedrals, and fortresses",
    lessons: 8,
    duration: "2 hours",
    image: "https://images.unsplash.com/photo-1520637836862-4d197d17c90a?w=400",
    progress: 0,
  },
  {
    id: "3",
    title: "Renaissance Art",
    description: "Learn about the masters and their masterpieces",
    lessons: 10,
    duration: "2.5 hours",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
    progress: 0,
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
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} translucent />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={[styles.headerSection, { paddingTop: insets.top + 8 }]}>
          <LinearGradient
            colors={['rgba(118, 104, 96, 0.36)', 'rgba(225, 222, 220, 0.36)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.headerGradient}
          />
          <View style={[styles.topRow, { top: insets.top + 20 }]}>
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationText}>Explore & Learn</Text>
            </View>
            <View style={styles.logoContainer}>
              <Image 
                source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/q49mrslt036oct5mux1y0' }}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>
          <View style={styles.headerContent}>
            <View style={styles.textContainer}>
              <Text style={styles.mainTitle}>Learn with Hereditas</Text>
              <Text style={styles.headerSubtitle}>
                Discover the living stories of art and monuments
              </Text>
            </View>
          </View>
          <View style={styles.headerDivider} />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Articles</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>View all</Text>
            </TouchableOpacity>
          </View>
          
          {articles.map((article) => (
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Courses</Text>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.coursesContainer}
          >
            {courses.map((course) => (
              <TouchableOpacity key={course.id} style={styles.courseCard}>
                <Image source={{ uri: course.image }} style={styles.courseImage} />
                <View style={styles.courseContent}>
                  <Text style={styles.courseTitle}>{course.title}</Text>
                  <Text style={styles.courseDescription}>{course.description}</Text>
                  <View style={styles.courseFooter}>
                    <View style={styles.courseStats}>
                      <BookOpen size={14} color="#64748b" />
                      <Text style={styles.courseStatsText}>{course.lessons} lessons</Text>
                    </View>
                    <View style={styles.courseStats}>
                      <Clock size={14} color="#64748b" />
                      <Text style={styles.courseStatsText}>{course.duration}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Articles</Text>
          </View>
          
          {featuredArticles.map((article) => (
            <TouchableOpacity key={article.id} style={styles.featuredArticleCard}>
              <Image source={{ uri: article.image }} style={styles.featuredArticleImage} />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.featuredArticleGradient}
              >
                <View style={styles.featuredArticleContent}>
                  <Text style={styles.featuredArticleTitle}>{article.title}</Text>
                  <View style={styles.featuredArticleFooter}>
                    <Clock size={12} color="#ffffff" />
                    <Text style={styles.featuredReadTime}>{article.readTime} read</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
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

  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    position: 'relative',
  },
  headerContent: {
    marginBottom: 8,
    marginTop: 48,
  },
  textContainer: {
    width: '100%',
  },
  mainTitle: {
    fontSize: 20,
    fontFamily: "Lora_400Regular",
    fontWeight: "700",
    color: '#173248',
    marginBottom: 8,
    lineHeight: 22,
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: "Lora_400Regular",
    fontStyle: 'italic',
    fontWeight: "400",
    color: '#173248',
    lineHeight: 14,
    textAlign: 'left',
    marginTop: 2,
  },
  topRow: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  locationTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  locationText: {
    fontSize: 10,
    fontFamily: "Lora_400Regular",
    fontWeight: "400",
    color: '#173248',
    lineHeight: 12,
  },
  logoContainer: {
    flexShrink: 0,
  },
  logoImage: {
    width: 39,
    height: 39,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#173248',
    opacity: 0.2,
    width: '100%',
    alignSelf: 'center',
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
  coursesContainer: {
    paddingRight: 14,
    gap: 12,
  },
  courseCard: {
    width: 280,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  courseImage: {
    width: "100%",
    height: 160,
  },
  courseContent: {
    padding: 16,
  },
  courseTitle: {
    fontSize: 18,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: Colors.text.primary,
    marginBottom: 8,
  },
  courseDescription: {
    fontSize: 13,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: Colors.text.muted,
    lineHeight: 18,
    marginBottom: 12,
  },
  courseFooter: {
    flexDirection: "row",
    gap: 16,
  },
  courseStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  courseStatsText: {
    fontSize: 12,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: Colors.text.muted,
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
    aspectRatio: 3 / 4,
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
  featuredArticleCard: {
    height: 200,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  featuredArticleImage: {
    width: "100%",
    height: "100%",
  },
  featuredArticleGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "100%",
    justifyContent: "flex-end",
  },
  featuredArticleContent: {
    padding: 16,
  },
  featuredArticleTitle: {
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
  featuredArticleFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  featuredReadTime: {
    fontSize: 12,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#ffffff",
  },
  bottomSpacer: {
    height: 100,
  },
});