import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Scan } from 'lucide-react-native';
import CategoryCard from '@/components/CategoryCard';
import Colors from '@/constants/colors';

const { width: screenWidth } = Dimensions.get('window');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim1 = useRef(new Animated.Value(30)).current;
  const slideAnim2 = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim1, {
        toValue: 0,
        duration: 500,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim2, {
        toValue: 0,
        duration: 500,
        delay: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim1, slideAnim2]);

  const handleOutdoorPress = () => {
    console.log('Outdoor card pressed');
    router.push('/(tabs)/(scanner)' as any);
  };

  const handleMuseumPress = () => {
    console.log('Museum card pressed');
    router.push('/(tabs)/(scanner)' as any);
  };

  const handleHowItWorksPress = () => {
    console.log('How it works pressed');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.beigeLight, Colors.beigeDark]}
        style={styles.gradient}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>Snap into Heritage</Text>
              <Text style={styles.subtitle}>
                Discover the living stories of art and monuments
              </Text>
              <View style={styles.divider} />
            </View>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleHowItWorksPress}
              accessibilityLabel="How it works"
              accessibilityRole="button"
            >
              <Scan size={28} color={Colors.deepNavy} strokeWidth={1.5} />
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.cardsContainer}>
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim1 }],
              }}
            >
              <CategoryCard
                title="Outdoor"
                imageUri="https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&q=80"
                onPress={handleOutdoorPress}
                accessibilityLabel="Outdoor recognition"
                height={screenWidth * 0.85}
              />
            </Animated.View>

            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim2 }],
              }}
            >
              <CategoryCard
                title="Museum"
                imageUri="https://images.unsplash.com/photo-1577083552431-6e5fd01988ec?w=800&q=80"
                onPress={handleMuseumPress}
                accessibilityLabel="Museum recognition"
                height={screenWidth * 0.85}
              />
            </Animated.View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 16,
  },
  title: {
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif',
      default: 'Times New Roman',
    }),
    fontSize: 36,
    fontWeight: '600',
    color: Colors.deepNavy,
    marginBottom: 8,
    lineHeight: 42,
  },
  subtitle: {
    fontFamily: 'Lora_400Regular',
    fontSize: 16,
    color: Colors.navySecondary,
    opacity: 0.8,
    lineHeight: 22,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginTop: 16,
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  cardsContainer: {
    gap: 24,
  },
});
