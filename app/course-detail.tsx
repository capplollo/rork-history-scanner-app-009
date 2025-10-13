import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from "expo-router";
import { ArrowLeft, BookOpen, Clock, CheckCircle } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import Colors from "@/constants/colors";

interface Lesson {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
}

interface Course {
  id: string;
  title: string;
  subtitle: string;
  intro: string;
  lessons: Lesson[];
  totalDuration: string;
  completedLessons: number;
}

const mockCourse: Course = {
  id: "1",
  title: "Ancient Civilizations",
  subtitle: "Journey through the wonders of ancient Egypt, Greece, and Rome",
  intro: "Embark on an extraordinary journey through time as we explore the magnificent civilizations that shaped our world. From the towering pyramids of Egypt to the philosophical academies of Athens and the engineering marvels of Rome, discover how these ancient societies developed art, architecture, governance, and culture that continue to influence us today. Through engaging lessons, you'll uncover the daily lives, beliefs, and achievements of peoples who lived thousands of years ago, understanding their lasting impact on modern civilization.",
  lessons: [
    { id: "1", title: "Introduction to Ancient Egypt", duration: "15 min", completed: true },
    { id: "2", title: "The Pyramids: Engineering Marvels", duration: "20 min", completed: true },
    { id: "3", title: "Egyptian Gods and Religion", duration: "18 min", completed: false },
    { id: "4", title: "Daily Life in Ancient Egypt", duration: "16 min", completed: false },
    { id: "5", title: "The Rise of Ancient Greece", duration: "22 min", completed: false },
    { id: "6", title: "Greek Philosophy and Democracy", duration: "19 min", completed: false },
    { id: "7", title: "The Parthenon and Greek Architecture", duration: "17 min", completed: false },
    { id: "8", title: "Roman Republic and Empire", duration: "25 min", completed: false },
    { id: "9", title: "Roman Engineering: Roads and Aqueducts", duration: "21 min", completed: false },
    { id: "10", title: "The Colosseum and Roman Entertainment", duration: "18 min", completed: false },
    { id: "11", title: "Roman Law and Governance", duration: "16 min", completed: false },
    { id: "12", title: "The Fall of Rome and Legacy", duration: "20 min", completed: false },
  ],
  totalDuration: "3h 47min",
  completedLessons: 2,
};

export default function CourseDetailScreen() {
  const params = useLocalSearchParams();
  const [course] = useState<Course>(mockCourse);

  const progressPercentage = (course.completedLessons / course.lessons.length) * 100;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(118, 104, 96, 0.36)', 'rgba(225, 222, 220, 0.36)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.backgroundGradient}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerSection}>
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <View style={styles.backButtonCircle}>
                <ArrowLeft size={10} color="#ffffff" />
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerContent}>
            <Text style={styles.courseTitle}>{course.title}</Text>
            <Text style={styles.courseSubtitle}>{course.subtitle}</Text>
          </View>
          
          <View style={styles.headerDivider} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <View style={styles.progressStats}>
                  <View style={styles.statItem}>
                    <BookOpen size={14} color={Colors.accent.secondary} />
                    <Text style={styles.statText}>{course.completedLessons}/{course.lessons.length} lessons</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Clock size={14} color={Colors.accent.secondary} />
                    <Text style={styles.statText}>{course.totalDuration}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
                </View>
                <Text style={styles.progressText}>{Math.round(progressPercentage)}% Complete</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.introCard}>
              <Text style={styles.introTitle}>About this course</Text>
              <Text style={styles.introText}>{course.intro}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.lessonsHeader}>Course Lessons</Text>
            <View style={styles.lessonsContainer}>
              {course.lessons.map((lesson, index) => (
                <TouchableOpacity 
                  key={lesson.id} 
                  style={styles.lessonCard}
                  onPress={() => {
                    console.log('Lesson pressed:', lesson.title);
                  }}
                >
                  <View style={styles.lessonNumber}>
                    {lesson.completed ? (
                      <CheckCircle size={20} color="#4CAF50" />
                    ) : (
                      <Text style={styles.lessonNumberText}>{index + 1}</Text>
                    )}
                  </View>
                  
                  <View style={styles.lessonContent}>
                    <Text style={[styles.lessonTitle, lesson.completed && styles.lessonTitleCompleted]}>
                      {lesson.title}
                    </Text>
                    <View style={styles.lessonMeta}>
                      <Clock size={12} color={Colors.text.muted} />
                      <Text style={styles.lessonDuration}>{lesson.duration}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 250,
    zIndex: 0,
  },
  safeArea: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    position: 'relative',
    zIndex: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    flexShrink: 0,
  },
  backButtonCircle: {
    width: 19.5,
    height: 19.5,
    borderRadius: 10,
    backgroundColor: '#766860',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    marginBottom: 12,
  },
  courseTitle: {
    fontSize: 20,
    fontFamily: "Lora_400Regular",
    fontWeight: "700",
    color: '#173248',
    marginBottom: 6,
    lineHeight: 24,
  },
  courseSubtitle: {
    fontSize: 11,
    fontFamily: "Lora_400Regular",
    fontStyle: 'italic',
    fontWeight: "400",
    color: '#173248',
    lineHeight: 14,
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#173248',
    opacity: 0.2,
    width: '100%',
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  progressCard: {
    backgroundColor: 'rgba(118, 104, 96, 0.08)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(104, 89, 81, 0.08)',
  },
  progressHeader: {
    marginBottom: 16,
  },
  progressStats: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: Colors.text.primary,
    fontWeight: "400",
  },
  progressBarContainer: {
    gap: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: 'rgba(104, 89, 81, 0.15)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.accent.secondary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 11,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: Colors.text.muted,
    textAlign: 'right',
  },
  introCard: {
    backgroundColor: 'rgba(118, 104, 96, 0.08)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(104, 89, 81, 0.08)',
  },
  introTitle: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: Colors.text.primary,
    marginBottom: 12,
  },
  introText: {
    fontSize: 12,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: Colors.text.muted,
    lineHeight: 18,
  },
  lessonsHeader: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: Colors.text.primary,
    marginBottom: 12,
  },
  lessonsContainer: {
    backgroundColor: 'rgba(118, 104, 96, 0.08)',
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  lessonNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(118, 104, 96, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lessonNumberText: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: Colors.accent.secondary,
  },
  lessonContent: {
    flex: 1,
    gap: 4,
  },
  lessonTitle: {
    fontSize: 13,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "500",
    color: Colors.text.primary,
    lineHeight: 18,
  },
  lessonTitleCompleted: {
    color: Colors.text.muted,
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lessonDuration: {
    fontSize: 11,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: Colors.text.muted,
  },
  bottomSpacer: {
    height: 40,
  },
});
