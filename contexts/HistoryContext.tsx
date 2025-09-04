import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, ScanHistoryItem } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import createContextHook from '@nkzw/create-context-hook';

interface HistoryContextType {
  history: ScanHistoryItem[];
  loading: boolean;
  addToHistory: (item: Omit<ScanHistoryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  refreshHistory: () => Promise<void>;
  deleteHistoryItem: (id: string) => Promise<void>;
}

export const [HistoryProvider, useHistory] = createContextHook<HistoryContextType>(() => {
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { user } = useAuth();

  const fetchHistory = useCallback(async () => {
    if (!user) {
      setHistory([]);
      return;
    }

    setLoading(true);
    try {
      console.log('Fetching history for user:', user.id);
      const { data, error } = await supabase
        .from('scan_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching history:', error.message);
        throw error;
      }

      console.log('Fetched history items:', data?.length || 0);
      setHistory(data || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addToHistory = useCallback(async (item: Omit<ScanHistoryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      console.error('No user logged in, cannot add to history');
      return;
    }

    try {
      console.log('Adding item to history:', item.monument_name);
      const { data, error } = await supabase
        .from('scan_history')
        .insert({
          ...item,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding to history:', error.message);
        throw error;
      }

      console.log('Successfully added to history:', data.id);
      // Add to local state immediately for better UX
      setHistory(prev => [data, ...prev]);
    } catch (error) {
      console.error('Failed to add to history:', error);
      throw error;
    }
  }, [user]);

  const deleteHistoryItem = useCallback(async (id: string) => {
    if (!user) {
      console.error('No user logged in, cannot delete history item');
      return;
    }

    try {
      console.log('Deleting history item:', id);
      const { error } = await supabase
        .from('scan_history')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Ensure user can only delete their own items

      if (error) {
        console.error('Error deleting history item:', error.message);
        throw error;
      }

      console.log('Successfully deleted history item:', id);
      // Remove from local state immediately
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Failed to delete history item:', error);
      throw error;
    }
  }, [user]);

  const refreshHistory = useCallback(async () => {
    await fetchHistory();
  }, [fetchHistory]);

  // Fetch history when user changes
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return useMemo(() => ({
    history,
    loading,
    addToHistory,
    refreshHistory,
    deleteHistoryItem,
  }), [history, loading, addToHistory, refreshHistory, deleteHistoryItem]);
});