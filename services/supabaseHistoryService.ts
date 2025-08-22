import { supabase } from '@/lib/supabase';
import { HistoryItem } from '@/providers/HistoryProvider';

export interface SupabaseScanHistory {
  id?: string;
  user_id: string;
  monument_name: string;
  location?: string;
  period?: string;
  description?: string;
  significance?: string;
  facts?: string[];
  image_url?: string;
  scanned_image_url?: string;
  scanned_at: string;
  confidence?: number;
  is_recognized?: boolean;
  detailed_description?: any;
  created_at?: string;
  updated_at?: string;
}

export class SupabaseHistoryService {
  // Save a scan to Supabase
  static async saveScan(userId: string, scanData: HistoryItem): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Saving scan to Supabase for user:', userId);
      
      const supabaseScanData: Omit<SupabaseScanHistory, 'id' | 'created_at' | 'updated_at'> = {
        user_id: userId,
        monument_name: scanData.name,
        location: scanData.location,
        period: scanData.period,
        description: scanData.description,
        significance: scanData.significance,
        facts: scanData.facts,
        image_url: scanData.image,
        scanned_image_url: scanData.scannedImage,
        scanned_at: scanData.scannedAt,
        confidence: scanData.confidence,
        is_recognized: scanData.isRecognized,
        detailed_description: scanData.detailedDescription,
      };

      const { data, error } = await supabase
        .from('scan_history')
        .insert(supabaseScanData)
        .select()
        .single();

      if (error) {
        console.error('Error saving scan to Supabase:', error.message || 'Unknown error');
        console.error('Supabase error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        return { success: false, error: error.message };
      }

      console.log('✅ Scan saved successfully to Supabase:', data.id);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Unexpected error saving scan:', errorMessage);
      console.error('Full error details:', error);
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  // Get all scans for a user with pagination
  static async getUserScans(userId: string, limit: number = 20): Promise<{ scans: HistoryItem[]; error?: string }> {
    try {
      console.log('Fetching scans from Supabase for user:', userId, 'with limit:', limit);
      
      // Simple query without abort controller to avoid AbortError issues
      const { data, error } = await supabase
        .from('scan_history')
        .select('id, monument_name, location, period, description, significance, facts, image_url, scanned_image_url, scanned_at, confidence, is_recognized, detailed_description')
        .eq('user_id', userId)
        .order('scanned_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching scans from Supabase:', error.message || 'Unknown error');
        console.error('Supabase error details:', JSON.stringify({
          message: error.message,
          code: error.code,
          details: error.details,
        }));
        return { scans: [], error: error.message };
      }

      // Convert Supabase data to HistoryItem format
      const scans: HistoryItem[] = (data || []).map((item: any) => ({
        id: item.id || '',
        name: item.monument_name || '',
        location: item.location || '',
        country: '', // Not stored in current schema
        period: item.period || '',
        image: item.image_url || '',
        scannedImage: item.scanned_image_url || '',
        scannedAt: item.scanned_at || new Date().toISOString(),
        description: item.description || '',
        significance: item.significance || '',
        facts: item.facts || [],
        confidence: item.confidence,
        isRecognized: item.is_recognized,
        detailedDescription: item.detailed_description,
      }));

      console.log('✅ Fetched', scans.length, 'scans from Supabase');
      return { scans };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Unexpected error fetching scans:', errorMessage);
      console.error('Full error details:', error);
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
        console.error('Supabase error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
        });
        return { success: false, error: error.message };
      }

      console.log('✅ Scan deleted successfully from Supabase');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Unexpected error deleting scan:', errorMessage);
      console.error('Full error details:', error);
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  // Update a scan
  static async updateScan(scanId: string, updates: Partial<HistoryItem>): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Updating scan in Supabase:', scanId);
      
      const updateData: Partial<SupabaseScanHistory> = {};
      
      if (updates.name) updateData.monument_name = updates.name;
      if (updates.location) updateData.location = updates.location;
      if (updates.period) updateData.period = updates.period;
      if (updates.description) updateData.description = updates.description;
      if (updates.significance) updateData.significance = updates.significance;
      if (updates.facts) updateData.facts = updates.facts;
      if (updates.image) updateData.image_url = updates.image;
      if (updates.scannedImage) updateData.scanned_image_url = updates.scannedImage;
      if (updates.confidence !== undefined) updateData.confidence = updates.confidence;
      if (updates.isRecognized !== undefined) updateData.is_recognized = updates.isRecognized;
      if (updates.detailedDescription) updateData.detailed_description = updates.detailedDescription;

      const { error } = await supabase
        .from('scan_history')
        .update(updateData)
        .eq('id', scanId);

      if (error) {
        console.error('Error updating scan in Supabase:', error.message || 'Unknown error');
        console.error('Supabase error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
        });
        return { success: false, error: error.message };
      }

      console.log('✅ Scan updated successfully in Supabase');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Unexpected error updating scan:', errorMessage);
      console.error('Full error details:', error);
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
      
      // Simple query without abort controller to avoid AbortError issues
      const { data, error } = await supabase
        .from('scan_history')
        .select('id')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user stats from Supabase:', error.message || 'Unknown error');
        console.error('Supabase error details:', JSON.stringify({
          message: error.message,
          code: error.code,
          details: error.details,
        }));
        return { totalScans: 0, error: error.message };
      }

      const totalScans = data?.length || 0;

      console.log('✅ User stats calculated:', { totalScans });
      return { totalScans };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Unexpected error fetching user stats:', errorMessage);
      console.error('Full error details:', error);
      return { 
        totalScans: 0, 
        error: errorMessage
      };
    }
  }
}
