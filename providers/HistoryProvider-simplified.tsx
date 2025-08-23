import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";

// Simplified HistoryItem interface - only essential fields including country
export interface HistoryItem {
  id: string;
  name: string;
  location: string;
  country: string;
  period: string;
  image: string;
  scannedAt: string;
}

const HISTORY_STORAGE_KEY = "@monument_scanner_history";
const LOCAL_STORAGE_LIMIT = 10; // Increased limit for simplified data
const EMERGENCY_LIMIT = 3; // Emergency fallback

export const [HistoryProvider, useHistory] = createContextHook(() => {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const loadHistory = useCallback(async () => {
    let isCancelled = false;
    
    try {
      if (user) {
        // Load from Supabase with simplified data structure
        try {
          console.log('Loading simplified history from Supabase for user:', user.id);
          
          const { data, error } = await supabase
            .from('scan_history')
            .select('id, name, location, country, period, image, scanned_at')
            .eq('user_id', user.id)
            .order('scanned_at', { ascending: false })
            .limit(20);
          
          // Check if component was unmounted during the request
          if (isCancelled) {
            console.log('History load was cancelled due to component unmount');
            return;
          }
          
          if (error) {
            console.error('Error loading history from Supabase:', error.message || 'Unknown error');
            console.warn('Falling back to local storage due to Supabase error');
            await loadFromLocalStorage();
          } else {
            console.log('Successfully loaded', data?.length || 0, 'simplified items from Supabase');
            
            // Map Supabase data to simplified HistoryItem format
            const mappedData = (data || []).map((item: any) => {
              try {
                return {
                  id: item.id || '',
                  name: item.name || '',
                  location: item.location || '',
                  country: item.country || '',
                  period: item.period || '',
                  image: item.image || '',
                  scannedAt: item.scanned_at ? new Date(item.scanned_at).toISOString() : new Date().toISOString(),
                };
              } catch (mappingError) {
                console.error('Error mapping history item:', mappingError, item);
                return null;
              }
            }).filter(Boolean) as HistoryItem[];
            
            if (!isCancelled) {
              setHistory(mappedData);
              setHasLoadedOnce(true);
            }
          }
        } catch (requestError: unknown) {
          console.error('Supabase query failed:', requestError);
          if (!isCancelled) {
            await loadFromLocalStorage();
          }
        }
      } else {
        // Load from local storage if not authenticated
        console.log('User not authenticated, loading from local storage');
        await loadFromLocalStorage();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error loading history:", errorMessage);
      if (!isCancelled) {
        await loadFromLocalStorage();
      }
    } finally {
      if (!isCancelled) {
        setIsLoading(false);
      }
    }
    
    // Return cleanup function
    return () => {
      isCancelled = true;
    };
  }, [user]);

  useEffect(() => {
    // Only load if we haven't loaded before or user changed
    if (!hasLoadedOnce || (user && history.length === 0)) {
      const cleanup = loadHistory();
      
      // Return cleanup function for useEffect
      return () => {
        if (cleanup && typeof cleanup.then === 'function') {
          cleanup.then(cleanupFn => {
            if (typeof cleanupFn === 'function') {
              cleanupFn();
            }
          });
        }
      };
    } else {
      // If we already have data, don't show loading
      setIsLoading(false);
    }
  }, [loadHistory, hasLoadedOnce, user, history.length]);

  const loadFromLocalStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Limit local storage to prevent quota issues
        setHistory(parsed.slice(0, LOCAL_STORAGE_LIMIT));
        setHasLoadedOnce(true);
      }
    } catch (error) {
      console.error("Error loading from local storage:", error);
      setHistory([]);
    }
  };

  const saveToSupabase = useCallback(async (item: HistoryItem) => {
    if (!user) return false;
    
    try {
      // Save simplified data to Supabase - only essential fields including country
      const { error } = await supabase
        .from('scan_history')
        .insert({
          user_id: user.id,
          name: item.name,
          location: item.location,
          country: item.country,
          period: item.period,
          image: item.image,
          scanned_at: new Date(item.scannedAt).toISOString(),
        });
      
      if (error) {
        console.error('Error saving to Supabase:', error.message || 'Unknown error');
        return false;
      }
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error saving to Supabase:', errorMessage);
      return false;
    }
  }, [user]);

  const saveToLocalStorage = useCallback(async (newHistory: HistoryItem[]) => {
    try {
      // Create a simplified version of history items to save space
      const simplifiedHistory = newHistory.slice(0, LOCAL_STORAGE_LIMIT).map(item => ({
        id: item.id,
        name: item.name,
        location: item.location,
        country: item.country,
        period: item.period,
        image: item.image?.length > 1000 ? '' : item.image, // Skip large images
        scannedAt: item.scannedAt,
      }));
      
      const dataString = JSON.stringify(simplifiedHistory);
      
      // Check if data is too large (rough estimate)
      if (dataString.length > 50000) { // 50KB limit
        console.warn('Data too large for local storage, using emergency limit');
        const emergencyHistory = simplifiedHistory.slice(0, EMERGENCY_LIMIT);
        await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(emergencyHistory));
        return emergencyHistory;
      }
      
      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, dataString);
      return simplifiedHistory;
    } catch (error: any) {
      if (error?.name === 'QuotaExceededError' || error?.message?.includes('quota') || error?.message?.includes('storage')) {
        console.warn('Storage quota exceeded, attempting emergency save');
        try {
          // Clear all storage first
          await AsyncStorage.clear();
          
          if (newHistory.length > 0) {
            // Save only the most recent items with minimal data
            const emergencyItems = newHistory.slice(0, EMERGENCY_LIMIT).map(item => ({
              id: item.id,
              name: item.name,
              location: item.location,
              country: item.country,
              scannedAt: item.scannedAt,
            }));
            await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(emergencyItems));
            console.log('Emergency save successful');
            return emergencyItems;
          }
        } catch (emergencyError) {
          console.error('Emergency save failed:', emergencyError);
          // If even emergency save fails, just return empty array
          return [];
        }
      }
      console.error("Error saving to local storage:", error);
      return [];
    }
  }, []);

  const addToHistory = useCallback(async (item: HistoryItem) => {
    try {
      // Add to state immediately for better UX
      const newHistory = [item, ...history];
      setHistory(newHistory);
      
      if (user) {
        // Save simplified data to Supabase for history cards only
        const supabaseSuccess = await saveToSupabase(item);
        if (!supabaseSuccess) {
          console.warn('Supabase save failed, using local storage fallback');
          await saveToLocalStorage(newHistory);
        } else {
          console.log('✅ Simplified history data saved to Supabase for card display');
          // Also save simplified data locally as backup
          const simplifiedBackup = [{
            id: item.id,
            name: item.name,
            location: item.location,
            country: item.country,
            period: item.period,
            image: item.image,
            scannedAt: item.scannedAt,
          }];
          try {
            await AsyncStorage.setItem(HISTORY_STORAGE_KEY + '_backup', JSON.stringify(simplifiedBackup));
          } catch (backupError) {
            console.warn('Backup save failed, but Supabase save was successful:', backupError);
          }
        }
      } else {
        // Save simplified data to local storage if not authenticated
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
          .from('scan_history')
          .delete()
          .eq('user_id', user.id);
        
        if (error) {
          console.error('Error clearing Supabase history:', error.message || 'Unknown error');
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
    hasLoadedOnce,
  }), [history, isLoading, addToHistory, clearHistory, getStorageInfo, hasLoadedOnce]);
});
