import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";

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
const MAX_HISTORY_ITEMS = 50; // Increased since we're using Supabase
const FALLBACK_LIMIT = 5; // Fallback limit for local storage

export const [HistoryProvider, useHistory] = createContextHook(() => {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    try {
      if (user) {
        // Load from Supabase if user is authenticated
        const { data, error } = await supabase
          .from('history')
          .select('*')
          .eq('user_id', user.id)
          .order('scanned_at', { ascending: false })
          .limit(MAX_HISTORY_ITEMS);
        
        if (error) {
          console.error('Error loading history from Supabase:', error);
          // Fallback to local storage
          await loadFromLocalStorage();
        } else {
          // Map Supabase data to HistoryItem format
          const mappedData = (data || []).map(item => ({
            id: item.id,
            name: item.name,
            location: item.location,
            period: item.period,
            description: item.description,
            significance: item.significance,
            facts: item.facts,
            image: item.image,
            scannedImage: item.scanned_image,
            scannedAt: item.scanned_at,
            confidence: item.confidence,
            isRecognized: item.is_recognized,
            detailedDescription: item.detailed_description,
          }));
          setHistory(mappedData);
        }
      } else {
        // Load from local storage if not authenticated
        await loadFromLocalStorage();
      }
    } catch (error) {
      console.error("Error loading history:", error);
      await loadFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const loadFromLocalStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Limit local storage to prevent quota issues
        setHistory(parsed.slice(0, FALLBACK_LIMIT));
      }
    } catch (error) {
      console.error("Error loading from local storage:", error);
      setHistory([]);
    }
  };



  const saveToSupabase = useCallback(async (item: HistoryItem) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('history')
        .insert({
          id: item.id,
          user_id: user.id,
          name: item.name,
          location: item.location,
          period: item.period,
          description: item.description,
          significance: item.significance,
          facts: item.facts,
          image: item.image,
          scanned_image: item.scannedImage,
          scanned_at: item.scannedAt,
          confidence: item.confidence || null,
          is_recognized: item.isRecognized || null,
          detailed_description: item.detailedDescription || null,
          created_at: new Date().toISOString(),
        });
      
      if (error) {
        console.error('Error saving to Supabase:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error saving to Supabase:', error);
      return false;
    }
  }, [user]);

  const saveToLocalStorage = useCallback(async (newHistory: HistoryItem[]) => {
    try {
      // Only keep a few items in local storage to prevent quota issues
      const limitedHistory = newHistory.slice(0, FALLBACK_LIMIT);
      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(limitedHistory));
      return limitedHistory;
    } catch (error: any) {
      if (error?.name === 'QuotaExceededError' || error?.message?.includes('quota')) {
        console.warn('Local storage quota exceeded, clearing and keeping only 1 item');
        try {
          await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
          if (newHistory.length > 0) {
            const singleItem = [newHistory[0]];
            await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(singleItem));
            return singleItem;
          }
        } catch (clearError) {
          console.error('Failed to clear and save to local storage:', clearError);
        }
      }
      console.error("Error saving to local storage:", error);
      return newHistory.slice(0, FALLBACK_LIMIT);
    }
  }, []);

  const addToHistory = useCallback(async (item: HistoryItem) => {
    try {
      // Add to state immediately for better UX
      const newHistory = [item, ...history];
      setHistory(newHistory);
      
      if (user) {
        // Try to save to Supabase first
        const supabaseSuccess = await saveToSupabase(item);
        if (!supabaseSuccess) {
          // Fallback to local storage
          await saveToLocalStorage(newHistory);
        }
      } else {
        // Save to local storage if not authenticated
        await saveToLocalStorage(newHistory);
      }
    } catch (error) {
      console.error('Failed to add item to history:', error);
    }
  }, [history, user, saveToSupabase, saveToLocalStorage]);

  const clearHistory = useCallback(async () => {
    try {
      setHistory([]);
      
      if (user) {
        // Clear from Supabase
        const { error } = await supabase
          .from('history')
          .delete()
          .eq('user_id', user.id);
        
        if (error) {
          console.error('Error clearing Supabase history:', error);
        }
      }
      
      // Also clear local storage
      await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }, [user]);

  const getStorageInfo = useCallback(async () => {
    try {
      return {
        itemCount: history.length,
        storageType: user ? 'Supabase Cloud' : 'Local Storage',
        isAuthenticated: !!user
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { itemCount: 0, storageType: 'Unknown', isAuthenticated: false };
    }
  }, [history, user]);

  return useMemo(() => ({
    history,
    isLoading,
    addToHistory,
    clearHistory,
    getStorageInfo,
  }), [history, isLoading, addToHistory, clearHistory, getStorageInfo]);
});