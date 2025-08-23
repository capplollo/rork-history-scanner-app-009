import { supabase } from '@/lib/supabase';
import { HistoryItem } from '@/providers/HistoryProvider-simplified';

// Simplified interface matching the new database schema with country field
export interface SupabaseScanHistory {
  id?: string;
  user_id: string;
  name: string;
  location?: string;
  country?: string;
  period?: string;
  image?: string;
  scanned_at: string;
  created_at?: string;
}

export class SupabaseHistoryService {
  // Save a scan to Supabase - only essential data including country
  static async saveScan(userId: string, scanData: HistoryItem): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Saving simplified scan to Supabase for user:', userId);
      
      const supabaseScanData: Omit<SupabaseScanHistory, 'id' | 'created_at'> = {
        user_id: userId,
        name: scanData.name,
        location: scanData.location,
        country: scanData.country,
        period: scanData.period,
        image: scanData.image,
        scanned_at: scanData.scannedAt,
      };

      const { data, error } = await supabase
        .from('scan_history')
        .insert(supabaseScanData)
        .select()
        .single();

      if (error) {
        console.error('Error saving scan to Supabase:', error.message || 'Unknown error');
        return { success: false, error: error.message };
      }

      console.log('✅ Simplified scan saved successfully to Supabase:', data.id);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Unexpected error saving scan:', errorMessage);
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  // Get all scans for a user - simplified data only including country
  static async getUserScans(userId: string, limit: number = 20): Promise<{ scans: HistoryItem[]; error?: string }> {
    try {
      console.log('Fetching simplified scans from Supabase for user:', userId, 'with limit:', limit);
      
      const { data, error } = await supabase
        .from('scan_history')
        .select('id, name, location, country, period, image, scanned_at')
        .eq('user_id', userId)
        .order('scanned_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching scans from Supabase:', error.message || 'Unknown error');
        return { scans: [], error: error.message };
      }

      // Convert Supabase data to simplified HistoryItem format
      const scans: HistoryItem[] = (data || []).map((item: any) => ({
        id: item.id || '',
        name: item.name || '',
        location: item.location || '',
        country: item.country || '',
        period: item.period || '',
        image: item.image || '',
        scannedAt: item.scanned_at || new Date().toISOString(),
      }));

      console.log('✅ Fetched', scans.length, 'simplified scans from Supabase');
      return { scans };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Unexpected error fetching scans:', errorMessage);
      return { 
        scans: [], 
        error: errorMessage
      };
    }
  }

  // Delete a scan
  static async deleteScan(scanId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Deleting scan from Supabase:', scanId);
      
      const { error } = await supabase
        .from('scan_history')
        .delete()
        .eq('id', scanId);

      if (error) {
        console.error('Error deleting scan from Supabase:', error.message || 'Unknown error');
        return { success: false, error: error.message };
      }

      console.log('✅ Scan deleted successfully from Supabase');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Unexpected error deleting scan:', errorMessage);
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  // Update a scan - simplified fields only including country
  static async updateScan(scanId: string, updates: Partial<HistoryItem>): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Updating simplified scan in Supabase:', scanId);
      
      const updateData: Partial<SupabaseScanHistory> = {};
      
      if (updates.name) updateData.name = updates.name;
      if (updates.location) updateData.location = updates.location;
      if (updates.country) updateData.country = updates.country;
      if (updates.period) updateData.period = updates.period;
      if (updates.image) updateData.image = updates.image;

      const { error } = await supabase
        .from('scan_history')
        .update(updateData)
        .eq('id', scanId);

      if (error) {
        console.error('Error updating scan in Supabase:', error.message || 'Unknown error');
        return { success: false, error: error.message };
      }

      console.log('✅ Simplified scan updated successfully in Supabase');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Unexpected error updating scan:', errorMessage);
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  // Get scan statistics for a user
  static async getUserStats(userId: string): Promise<{ 
    totalScans: number; 
    error?: string 
  }> {
    try {
      console.log('Fetching user stats from Supabase for user:', userId);
      
      const { data, error } = await supabase
        .from('scan_history')
        .select('id')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user stats from Supabase:', error.message || 'Unknown error');
        return { totalScans: 0, error: error.message };
      }

      const totalScans = data?.length || 0;

      console.log('✅ User stats calculated:', { totalScans });
      return { totalScans };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Unexpected error fetching user stats:', errorMessage);
      return { 
        totalScans: 0, 
        error: errorMessage
      };
    }
  }

  // Get user profile with customer ID
  static async getUserProfile(userId: string): Promise<{ 
    customerId?: string; 
    error?: string 
  }> {
    try {
      console.log('Fetching user profile from Supabase for user:', userId);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('customer_id')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile from Supabase:', error.message || 'Unknown error');
        return { error: error.message };
      }

      console.log('✅ User profile fetched:', { customerId: data?.customer_id });
      return { customerId: data?.customer_id };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Unexpected error fetching user profile:', errorMessage);
      return { 
        error: errorMessage
      };
    }
  }
}
