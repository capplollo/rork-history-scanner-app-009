import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";

export interface HistoryItem {
  id: string;
  name: string;
  location: string;
  period: string;
  description: string;
  significance: string;
  facts: string[];
  image: string;
  scannedImage: string;
  scannedAt: string;
  confidence?: number;
  isRecognized?: boolean;
  detailedDescription?: {
    quickOverview: string;
    inDepthContext: string;
    curiosities?: string;
    keyTakeaways: string[];
  };
}

const HISTORY_STORAGE_KEY = "@monument_scanner_history";
const MAX_HISTORY_ITEMS = 10; // Further reduced limit to prevent storage overflow
const EMERGENCY_LIMIT = 3; // Emergency fallback limit
const MAX_STRING_LENGTH = 512 * 1024; // 512KB string length limit (reduced from 1MB)
const CRITICAL_LIMIT = 1; // Critical fallback - only keep 1 item

export const [HistoryProvider, useHistory] = createContextHook(() => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStringSize = (str: string): number => {
    // Calculate string size in bytes (UTF-8 encoding approximation)
    return new TextEncoder().encode(str).length;
  };

  const compressHistoryItem = (item: HistoryItem, level: 'normal' | 'aggressive' | 'critical' = 'normal'): HistoryItem => {
    const compressed = { ...item };
    
    if (level === 'critical') {
      // Critical compression - keep only essential data
      return {
        id: compressed.id,
        name: compressed.name.substring(0, 50),
        location: compressed.location.substring(0, 30),
        period: compressed.period.substring(0, 20),
        description: compressed.description.substring(0, 100) + '...',
        significance: compressed.significance.substring(0, 100) + '...',
        facts: compressed.facts.slice(0, 2),
        image: compressed.image,
        scannedImage: '', // Remove scanned image to save space
        scannedAt: compressed.scannedAt,
        confidence: compressed.confidence,
        isRecognized: compressed.isRecognized,
        // Remove detailed description entirely
      };
    }
    
    if (level === 'aggressive') {
      // Aggressive compression
      compressed.description = compressed.description.substring(0, 200) + '...';
      compressed.significance = compressed.significance.substring(0, 150) + '...';
      compressed.facts = compressed.facts.slice(0, 3);
      compressed.scannedImage = ''; // Remove scanned image
      
      if (compressed.detailedDescription) {
        compressed.detailedDescription = {
          quickOverview: compressed.detailedDescription.quickOverview.substring(0, 200) + '...',
          inDepthContext: compressed.detailedDescription.inDepthContext.substring(0, 300) + '...',
          curiosities: compressed.detailedDescription.curiosities?.substring(0, 100) + '...',
          keyTakeaways: compressed.detailedDescription.keyTakeaways.slice(0, 3)
        };
      }
      
      return compressed;
    }
    
    // Normal compression
    if (compressed.description && compressed.description.length > 500) {
      compressed.description = compressed.description.substring(0, 500) + '...';
    }
    
    if (compressed.significance && compressed.significance.length > 300) {
      compressed.significance = compressed.significance.substring(0, 300) + '...';
    }
    
    if (compressed.facts && compressed.facts.length > 5) {
      compressed.facts = compressed.facts.slice(0, 5);
    }
    
    if (compressed.detailedDescription) {
      if (compressed.detailedDescription.inDepthContext && compressed.detailedDescription.inDepthContext.length > 1000) {
        compressed.detailedDescription.inDepthContext = compressed.detailedDescription.inDepthContext.substring(0, 1000) + '...';
      }
      if (compressed.detailedDescription.curiosities && compressed.detailedDescription.curiosities.length > 500) {
        compressed.detailedDescription.curiosities = compressed.detailedDescription.curiosities.substring(0, 500) + '...';
      }
      if (compressed.detailedDescription.keyTakeaways && compressed.detailedDescription.keyTakeaways.length > 10) {
        compressed.detailedDescription.keyTakeaways = compressed.detailedDescription.keyTakeaways.slice(0, 10);
      }
    }
    
    return compressed;
  };

  const saveHistory = useCallback(async (newHistory: HistoryItem[]) => {
    try {
      // Start with limited items
      let historyToSave = newHistory.slice(0, MAX_HISTORY_ITEMS);
      let historyString = JSON.stringify(historyToSave);
      
      // Check string length and reduce if necessary
      if (historyString.length > MAX_STRING_LENGTH) {
        console.warn('History data too large, applying normal compression');
        historyToSave = historyToSave.map(item => compressHistoryItem(item, 'normal'));
        historyString = JSON.stringify(historyToSave);
        
        // If still too large, apply aggressive compression
        if (historyString.length > MAX_STRING_LENGTH) {
          console.warn('Still too large, applying aggressive compression');
          historyToSave = historyToSave.slice(0, Math.floor(MAX_HISTORY_ITEMS / 2)).map(item => compressHistoryItem(item, 'aggressive'));
          historyString = JSON.stringify(historyToSave);
        }
      }
      
      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, historyString);
      return historyToSave;
    } catch (error: any) {
      if (error?.name === 'QuotaExceededError' || error?.message?.includes('quota') || error?.message?.includes('storage')) {
        console.warn('Storage quota exceeded, trying emergency compression');
        try {
          // Emergency: Keep only most recent items with aggressive compression
          const emergencyHistory = newHistory.slice(0, EMERGENCY_LIMIT).map(item => compressHistoryItem(item, 'aggressive'));
          await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(emergencyHistory));
          return emergencyHistory;
        } catch {
          console.warn('Emergency compression failed, trying critical compression');
          try {
            // Critical: Keep only 1 item with maximum compression
            const criticalHistory = newHistory.slice(0, CRITICAL_LIMIT).map(item => compressHistoryItem(item, 'critical'));
            await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(criticalHistory));
            return criticalHistory;
          } catch (thirdError) {
            console.error('Failed to save even critical history:', thirdError);
            // Last resort: clear all history and try to save just the new item with critical compression
            try {
              await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
              if (newHistory.length > 0) {
                const singleItem = [compressHistoryItem(newHistory[0], 'critical')];
                await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(singleItem));
                return singleItem;
              }
            } catch (clearError) {
              console.error('Failed to clear storage and save single item:', clearError);
            }
            return [];
          }
        }
      }
      console.error("Error saving history:", error);
      throw error;
    }
  }, []);

  const addToHistory = useCallback(async (item: HistoryItem) => {
    try {
      const newHistory = [item, ...history];
      const savedHistory = await saveHistory(newHistory);
      // Update state with the actually saved history (might be reduced)
      setHistory(savedHistory || newHistory);
    } catch (error) {
      console.error('Failed to add item to history:', error);
      // Still add to state even if save fails
      const newHistory = [item, ...history.slice(0, 9)]; // Keep only 10 items in memory
      setHistory(newHistory);
    }
  }, [history, saveHistory]);

  const clearHistory = useCallback(async () => {
    try {
      setHistory([]);
      await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }, []);

  const getStorageInfo = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        const dataSize = getStringSize(stored);
        return {
          itemCount: history.length,
          sizeInBytes: dataSize,
          sizeInMB: (dataSize / (1024 * 1024)).toFixed(2)
        };
      }
      return { itemCount: 0, sizeInBytes: 0, sizeInMB: '0.00' };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { itemCount: 0, sizeInBytes: 0, sizeInMB: '0.00' };
    }
  }, [history]);

  return useMemo(() => ({
    history,
    isLoading,
    addToHistory,
    clearHistory,
    getStorageInfo,
  }), [history, isLoading, addToHistory, clearHistory, getStorageInfo]);
});