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

  const loadHistory = useCallback(async () => {
    try {
      if (user) {
        // Load from Supabase with improved timeout handling
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        let controller: AbortController | null = null;
        
        try {
          controller = new AbortController();
          
          // Set up timeout with proper cleanup
          timeoutId = setTimeout(() => {
            if (controller && !controller.signal.aborted) {
              controller.abort();
            }
          }, 8000); // Reduced to 8 seconds
          
          // Only fetch essential fields first for better performance
          const { data, error } = await supabase
            .from('scan_history')
            .select('id, monument_name, location, scanned_at, image_url, is_recognized, confidence')
            .eq('user_id', user.id)
            .order('scanned_at', { ascending: false })
            .limit(15) // Further reduced limit
            .abortSignal(controller.signal);
          
          // Clear timeout on successful completion
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          
          if (error) {
            console.error('Error loading history from Supabase:', error.message || 'Unknown error');
            console.error('Supabase error details:', JSON.stringify({
              message: error.message,
              code: error.code,
              details: error.details,
              hint: error.hint,
            }));
            // Fallback to local storage
            await loadFromLocalStorage();
          } else {
            // Map Supabase data to HistoryItem format with minimal data
            const mappedData = (data || []).map(item => {
              try {
                return {
                  id: item.id || '',
                  name: item.monument_name || '',
                  location: item.location || '',
                  period: '', // Will be loaded on demand
                  description: '', // Will be loaded on demand
                  significance: '', // Will be loaded on demand
                  facts: [], // Will be loaded on demand
                  image: item.image_url || '',
                  scannedImage: '', // Will be loaded on demand
                  scannedAt: item.scanned_at ? new Date(item.scanned_at).toISOString() : new Date().toISOString(),
                  confidence: typeof item.confidence === 'number' ? item.confidence : undefined,
                  isRecognized: typeof item.is_recognized === 'boolean' ? item.is_recognized : undefined,
                  detailedDescription: undefined, // Will be loaded on demand
                };
              } catch (mappingError) {
                console.error('Error mapping history item:', mappingError, item);
                return null;
              }
            }).filter(Boolean) as HistoryItem[];
            setHistory(mappedData);
          }
        } catch (requestError: unknown) {
          // Clean up timeout
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          
          // Handle different types of errors
          if (requestError instanceof Error) {
            if (requestError.name === 'AbortError') {
              console.warn('Supabase query was cancelled (timeout or abort), falling back to local storage');
            } else {
              console.error('Supabase query failed:', requestError.message);
              console.error('Error details:', JSON.stringify(requestError));
            }
          } else {
            console.error('Unknown error during Supabase query:', requestError);
          }
          
          await loadFromLocalStorage();
        }
      } else {
        // Load from local storage if not authenticated
        await loadFromLocalStorage();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error loading history:", errorMessage);
      console.error("Full error details:", JSON.stringify(error));
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
        setHistory(parsed.slice(0, LOCAL_STORAGE_LIMIT));
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
        .from('scan_history')
        .insert({
          user_id: user.id,
          monument_name: item.name,
          location: item.location,
          period: item.period,
          description: item.description,
          significance: item.significance,
          facts: item.facts,
          image_url: item.image,
          scanned_image_url: item.scannedImage,
          scanned_at: new Date(item.scannedAt).toISOString(),
          confidence: item.confidence || null,
          is_recognized: item.isRecognized || null,
          detailed_description: item.detailedDescription || null,
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
        // Try to save to Supabase first
        const supabaseSuccess = await saveToSupabase(item);
        if (!supabaseSuccess) {
          console.warn('Supabase save failed, using local storage fallback');
          await saveToLocalStorage(newHistory);
        } else {
          // If Supabase save successful, only save minimal data locally as backup
          const minimalBackup = [{
            id: item.id,
            name: item.name,
            scannedAt: item.scannedAt,
          }];
          try {
            await AsyncStorage.setItem(HISTORY_STORAGE_KEY + '_backup', JSON.stringify(minimalBackup));
          } catch (backupError) {
            console.warn('Backup save failed, but Supabase save was successful:', backupError);
          }
        }
      } else {
        // Save to local storage if not authenticated (with size limits)
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
  }), [history, isLoading, addToHistory, clearHistory, getStorageInfo]);
});