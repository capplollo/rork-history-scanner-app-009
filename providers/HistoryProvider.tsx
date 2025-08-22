import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";

export interface HistoryItem {
  id: string;
  name: string;
  location: string;
  country?: string;
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
    keyTakeaways: string;
    inDepthContext: string;
    curiosities?: string;
    keyTakeawaysList: string[];
  };
}

const HISTORY_STORAGE_KEY = "@monument_scanner_history";
const LOCAL_STORAGE_LIMIT = 3; // Very small limit for local storage to prevent quota issues
const EMERGENCY_LIMIT = 1; // Emergency fallback

export const [HistoryProvider, useHistory] = createContextHook(() => {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const loadHistory = useCallback(async () => {
    let isCancelled = false;
    
    try {
      if (user) {
        // Load from Supabase with improved error handling and faster timeout
        try {
          console.log('Loading history from Supabase for user:', user.id);
          
          // Reduce timeout to 5 seconds for faster fallback
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 5000); // 5 second timeout
          });
          
          // Reduce initial limit to 8 items for faster loading
          const queryPromise = supabase
            .from('scan_history')
            .select('id, name, location, country, period, scanned_at, image, is_recognized, confidence')
            .eq('user_id', user.id)
            .order('scanned_at', { ascending: false })
            .limit(8);
          
          const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;
          
          // Check if component was unmounted during the request
          if (isCancelled) {
            console.log('History load was cancelled due to component unmount');
            return;
          }
          
          if (error) {
            console.error('Error loading history from Supabase:', error.message || 'Unknown error');
            // Don't log full error details to reduce noise
            console.warn('Falling back to local storage due to Supabase error');
            await loadFromLocalStorage();
          } else {
            console.log('Successfully loaded', data?.length || 0, 'items from Supabase');
            
            // Map Supabase data to HistoryItem format with minimal data for history cards
            const mappedData = (data || []).map((item: any) => {
              try {
                return {
                  id: item.id || '',
                  name: item.name || '',
                  location: item.location || '',
                  country: item.country || '',
                  period: item.period || '', // Keep period for display
                  description: '', // Will be regenerated via API when needed
                  significance: '', // Will be regenerated via API when needed
                  facts: [], // Will be regenerated via API when needed
                  image: item.image || '',
                  scannedImage: '', // Not stored in simplified schema
                  scannedAt: item.scanned_at ? new Date(item.scanned_at).toISOString() : new Date().toISOString(),
                  confidence: typeof item.confidence === 'number' ? item.confidence : undefined,
                  isRecognized: typeof item.is_recognized === 'boolean' ? item.is_recognized : undefined,
                  detailedDescription: undefined, // Will be regenerated via API when needed
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
          // Handle different types of errors more gracefully
          if (requestError instanceof Error) {
            if (requestError.name === 'AbortError' || requestError.message.includes('aborted')) {
              console.warn('Supabase query was cancelled, falling back to local storage');
            } else if (requestError.message === 'Request timeout') {
              console.warn('Supabase query timed out, falling back to local storage');
            } else {
              console.error('Supabase query failed:', requestError.message);
            }
          } else {
            console.error('Unknown error during Supabase query:', requestError);
          }
          
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
      // Only save minimal data to Supabase - no detailed descriptions or large content
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
        console.error('Supabase error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        return false;
      }
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error saving to Supabase:', errorMessage);
      console.error('Full error details:', error);
      return false;
    }
  }, [user]);

  const saveToLocalStorage = useCallback(async (newHistory: HistoryItem[]) => {
    try {
      // Create a minimal version of history items to save space
      const minimalHistory = newHistory.slice(0, LOCAL_STORAGE_LIMIT).map(item => ({
        id: item.id,
        name: item.name,
        location: item.location,
        scannedAt: item.scannedAt,
        // Only store essential data locally
        image: item.image?.length > 1000 ? '' : item.image, // Skip large images
        scannedImage: '', // Don't store scanned images locally
      }));
      
      const dataString = JSON.stringify(minimalHistory);
      
      // Check if data is too large (rough estimate)
      if (dataString.length > 50000) { // 50KB limit
        console.warn('Data too large for local storage, using emergency limit');
        const emergencyHistory = minimalHistory.slice(0, EMERGENCY_LIMIT);
        await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(emergencyHistory));
        return emergencyHistory;
      }
      
      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, dataString);
      return minimalHistory;
    } catch (error: any) {
      if (error?.name === 'QuotaExceededError' || error?.message?.includes('quota') || error?.message?.includes('storage')) {
        console.warn('Storage quota exceeded, attempting emergency save');
        try {
          // Clear all storage first
          await AsyncStorage.clear();
          
          if (newHistory.length > 0) {
            // Save only the most recent item with minimal data
            const emergencyItem = {
              id: newHistory[0].id,
              name: newHistory[0].name,
              scannedAt: newHistory[0].scannedAt,
            };
            await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([emergencyItem]));
            console.log('Emergency save successful');
            return [emergencyItem as any];
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
        // Save minimal data to Supabase for history cards only
        const supabaseSuccess = await saveToSupabase(item);
        if (!supabaseSuccess) {
          console.warn('Supabase save failed, using local storage fallback');
          await saveToLocalStorage(newHistory);
        } else {
          console.log('✅ Minimal history data saved to Supabase for card display');
          // Also save minimal data locally as backup
          const minimalBackup = [{
            id: item.id,
            name: item.name,
            location: item.location,
            country: item.country,
            period: item.period,
            image: item.image,
            scannedAt: item.scannedAt,
          }];
          try {
            await AsyncStorage.setItem(HISTORY_STORAGE_KEY + '_backup', JSON.stringify(minimalBackup));
          } catch (backupError) {
            console.warn('Backup save failed, but Supabase save was successful:', backupError);
          }
        }
      } else {
        // Save minimal data to local storage if not authenticated
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
          console.error('Supabase error details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          });
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