import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  TextInput,
  Platform,
  Dimensions,
} from "react-native";
import { 
  ArrowLeft,
  Search,
  MapPin,
  Grid3X3,
  List,
  Share2,
  ChevronDown
} from "lucide-react-native";
import { useHistory } from "@/providers/HistoryProvider";
import { router } from "expo-router";
import { scanResultStore } from "@/services/scanResultStore";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2; // 2 columns with padding

export default function HistoryScreen() {
  const { history } = useHistory();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'location'>('date');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  // Extract unique countries from history
  const availableCountries = useMemo(() => {
    const countries = new Set<string>();
    history.forEach(item => {
      if (item.location) {
        // Extract country from location (assuming format like "City, Country" or "Location, Country")
        const parts = item.location.split(',').map(part => part.trim());
        if (parts.length > 1) {
          countries.add(parts[parts.length - 1]); // Last part is usually the country
        } else {
          countries.add(item.location); // If no comma, treat whole location as country
        }
      }
    });
    return Array.from(countries).sort();
  }, [history]);

  const filteredAndSortedHistory = useMemo(() => {
    let filtered = history.filter(item => {
      // Name and location search filter
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Country filter
      let matchesCountry = true;
      if (selectedCountry !== 'all' && item.location) {
        const parts = item.location.split(',').map(part => part.trim());
        const itemCountry = parts.length > 1 ? parts[parts.length - 1] : item.location;
        matchesCountry = itemCountry === selectedCountry;
      }
      
      return matchesSearch && matchesCountry;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'location':
          return a.location.localeCompare(b.location);
        case 'date':
        default:
          return new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime();
      }
    });
  }, [history, searchQuery, sortBy, selectedCountry]);



  const handleItemPress = (item: any) => {
    const resultId = scanResultStore.store(item);
    router.push({
      pathname: "/scan-result" as any,
      params: { resultId: resultId },
    });
  };

  const renderGridItem = (item: any, index: number) => {
    // Extract century/dates from period, removing "artistic period" text
    const formatPeriod = (period: string) => {
      if (!period) return '';
      // Remove "artistic period" and similar phrases, keep only dates/centuries
      return period.replace(/artistic period/gi, '').replace(/\bperiod\b/gi, '').trim();
    };

    return (
      <TouchableOpacity
        key={`${item.id}-${index}`}
        style={styles.instagramCard}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.95}
      >
        <View style={styles.instagramImageContainer}>
          <Image 
            source={{ uri: item.scannedImage || item.image }} 
            style={styles.instagramImage} 
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.instagramOverlay}
          />
          <View style={styles.instagramContent}>
            <Text style={styles.instagramTitle} numberOfLines={2}>{item.name}</Text>
            <View style={styles.instagramLocation}>
              <MapPin size={14} color="#ffffff" />
              <Text style={styles.instagramLocationText} numberOfLines={1}>{item.location}</Text>
            </View>
            {formatPeriod(item.period) && (
              <Text style={styles.instagramPeriod}>{formatPeriod(item.period)}</Text>
            )}
          </View>
          <TouchableOpacity 
            style={styles.instagramShareButton}
            onPress={(e) => {
              e.stopPropagation();
              // TODO: Implement share functionality
            }}
          >
            <Share2 size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderListItem = (item: any, index: number) => {
    // Extract century/dates from period, removing "artistic period" text
    const formatPeriod = (period: string) => {
      if (!period) return '';
      // Remove "artistic period" and similar phrases, keep only dates/centuries
      return period.replace(/artistic period/gi, '').replace(/\bperiod\b/gi, '').trim();
    };

    return (
      <TouchableOpacity
        key={`${item.id}-${index}`}
        style={styles.listCard}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.9}
      >
        <View style={styles.listImageContainer}>
          <Image 
            source={{ uri: item.scannedImage || item.image }} 
            style={styles.listImage} 
          />
        </View>
        <View style={styles.listCardContent}>
          <Text style={styles.listCardTitle} numberOfLines={2}>{item.name}</Text>
          <View style={styles.listCardInfo}>
            <MapPin size={14} color="#8B4513" />
            <Text style={styles.listCardLocation} numberOfLines={1}>{item.location}</Text>
          </View>
          <Text style={styles.listCardDescription} numberOfLines={2}>{item.description}</Text>
          {formatPeriod(item.period) && (
            <View style={styles.listCardMeta}>
              <Text style={styles.listCardPeriod}>{formatPeriod(item.period)}</Text>
            </View>
          )}
        </View>
        <View style={styles.listCardActions}>
          <TouchableOpacity 
            style={styles.listActionButton}
            onPress={(e) => {
              e.stopPropagation();
              // TODO: Implement share functionality
            }}
          >
            <Share2 size={18} color="#8B4513" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#2C3E50" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Your Discoveries</Text>
          <Text style={styles.headerSubtitle}>{history.length} monuments explored</Text>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search monuments or locations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
        </View>
        
        {/* Country Filter */}
        {availableCountries.length > 0 && (
          <View style={styles.countryFilterContainer}>
            <TouchableOpacity 
              style={styles.countryDropdown}
              onPress={() => setShowCountryDropdown(!showCountryDropdown)}
            >
              <Text style={styles.countryDropdownText}>
                {selectedCountry === 'all' ? 'All Countries' : selectedCountry}
              </Text>
              <ChevronDown size={16} color="#64748b" />
            </TouchableOpacity>
            
            {showCountryDropdown && (
              <View style={styles.countryDropdownMenu}>
                <TouchableOpacity
                  style={[styles.countryOption, selectedCountry === 'all' && styles.countryOptionActive]}
                  onPress={() => {
                    setSelectedCountry('all');
                    setShowCountryDropdown(false);
                  }}
                >
                  <Text style={[styles.countryOptionText, selectedCountry === 'all' && styles.countryOptionTextActive]}>
                    All Countries
                  </Text>
                </TouchableOpacity>
                {availableCountries.map((country) => (
                  <TouchableOpacity
                    key={country}
                    style={[styles.countryOption, selectedCountry === country && styles.countryOptionActive]}
                    onPress={() => {
                      setSelectedCountry(country);
                      setShowCountryDropdown(false);
                    }}
                  >
                    <Text style={[styles.countryOptionText, selectedCountry === country && styles.countryOptionTextActive]}>
                      {country}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
        
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortButtons}>
            {[{ key: 'date', label: 'Recent' }, { key: 'name', label: 'Name' }, { key: 'location', label: 'Location' }].map((sort) => (
              <TouchableOpacity
                key={sort.key}
                style={[styles.sortButton, sortBy === sort.key && styles.sortButtonActive]}
                onPress={() => setSortBy(sort.key as any)}
              >
                <Text style={[styles.sortButtonText, sortBy === sort.key && styles.sortButtonTextActive]}>
                  {sort.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'grid' && styles.viewButtonActive]}
              onPress={() => setViewMode('grid')}
            >
              <Grid3X3 size={18} color={viewMode === 'grid' ? '#ffffff' : '#64748b'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive]}
              onPress={() => setViewMode('list')}
            >
              <List size={18} color={viewMode === 'list' ? '#ffffff' : '#64748b'} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {filteredAndSortedHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No discoveries found</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery || selectedCountry !== 'all' ? 'Try adjusting your search terms or filters' : 'Start scanning monuments to build your collection'}
            </Text>
          </View>
        ) : (
          <View style={viewMode === 'grid' ? styles.gridContainer : styles.listContainer}>
            {filteredAndSortedHistory.map((item, index) => 
              viewMode === 'grid' ? renderGridItem(item, index) : renderListItem(item, index)
            )}
          </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "600",
    color: "#2C3E50",
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#64748b",
    fontStyle: "italic",
    marginTop: 2,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#2C3E50",
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sortButtons: {
    flex: 1,
    marginRight: 16,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    marginRight: 8,
  },
  sortButtonActive: {
    backgroundColor: "#8B4513",
  },
  sortButtonText: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#64748b",
    fontWeight: "500",
  },
  sortButtonTextActive: {
    color: "#ffffff",
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 2,
  },
  viewButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  viewButtonActive: {
    backgroundColor: "#8B4513",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  listContainer: {
    gap: 16,
  },
  instagramCard: {
    width: cardWidth,
    height: 280,
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  instagramImageContainer: {
    flex: 1,
    position: "relative",
  },
  instagramImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  instagramOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "100%",
  },
  instagramContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 24,
  },
  instagramTitle: {
    fontSize: 18,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 8,
    lineHeight: 22,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  instagramLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  instagramLocationText: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
    flex: 1,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  instagramPeriod: {
    fontSize: 13,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "rgba(255, 255, 255, 0.8)",
    fontStyle: "italic",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  instagramShareButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    backdropFilter: "blur(10px)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  listCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  listImageContainer: {
    position: "relative",
    marginRight: 16,
  },
  listImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    resizeMode: "cover",
  },

  listCardContent: {
    flex: 1,
    gap: 4,
  },
  listCardTitle: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "600",
    color: "#2C3E50",
    lineHeight: 20,
  },
  listCardInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  listCardLocation: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#8B4513",
    flex: 1,
  },
  listCardDescription: {
    fontSize: 13,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#64748b",
    lineHeight: 18,
  },
  listCardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  listCardPeriod: {
    fontSize: 12,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#8B4513",
    fontStyle: "italic",
  },
  listCardActions: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  listActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f4f0",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
  },
  countryFilterContainer: {
    position: "relative",
    marginBottom: 16,
    zIndex: 1000,
  },
  countryDropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  countryDropdownText: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#2C3E50",
    fontWeight: "500",
  },
  countryDropdownMenu: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginTop: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    maxHeight: 200,
  },
  countryOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  countryOptionActive: {
    backgroundColor: "#f8f4f0",
  },
  countryOptionText: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "Times New Roman"
    }),
    color: "#2C3E50",
  },
  countryOptionTextActive: {
    color: "#8B4513",
    fontWeight: "600",
  },
});