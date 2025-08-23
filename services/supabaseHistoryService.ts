import { supabase } from '@/lib/supabase';
import { HistoryItem } from '@/providers/HistoryProvider';

// Simplified interface for minimal data storage
export interface SupabaseScanHistory {
  id?: string;
  user_id: string;
  name: string;
  location?: string;
  country?: string;
  period?: string;
  uploaded_picture?: string;
  scanned_at: string;
  created_at?: string;
  updated_at?: string;
}

export class SupabaseHistoryService {
  // Save minimal scan data to Supabase (only for history cards)
  static async saveScan(userId: string, scanData: HistoryItem): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Saving minimal scan data to Supabase for user:', userId);
      
      // Only save minimal data needed for history cards
      const supabaseScanData: Omit<SupabaseScanHistory, 'id' | 'created_at' | 'updated_at'> = {
        user_id: userId,
        name: scanData.name,
        location: scanData.location,
        country: scanData.country,
        period: scanData.period,
        uploaded_picture: scanData.image,
        scanned_at: scanData.scannedAt,
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

      console.log('✅ Minimal scan data saved successfully to Supabase:', data.id);
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

  // Get all scans for a user with pagination (minimal data for history cards)
  static async getUserScans(userId: string, limit: number = 20): Promise<{ scans: HistoryItem[]; error?: string }> {
    try {
      console.log('Fetching minimal scan data from Supabase for user:', userId, 'with limit:', limit);
      
      const { data, error } = await supabase
        .from('scan_history')
        .select('id, name, location, country, period, uploaded_picture, scanned_at')
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

      // Convert Supabase data to HistoryItem format (minimal data for cards)
      const scans: HistoryItem[] = (data || []).map((item: any) => ({
        id: item.id || '',
        name: item.name || '',
        location: item.location || '',
        country: item.country || '',
        period: item.period || '',
        image: item.uploaded_picture || '',
        scannedImage: '', // Not stored in simplified schema
        scannedAt: item.scanned_at || new Date().toISOString(),
        // These will be generated on-demand when user clicks on history card
        description: '',
        significance: '',
        facts: [],
        confidence: undefined,
        isRecognized: undefined,
        detailedDescription: undefined,
      }));

      console.log('✅ Fetched', scans.length, 'minimal scan records from Supabase');
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

  // Update a scan (minimal data only)
  static async updateScan(scanId: string, updates: Partial<HistoryItem>): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Updating minimal scan data in Supabase:', scanId);
      
      const updateData: Partial<SupabaseScanHistory> = {};
      
      // Only update fields that are stored in simplified schema
      if (updates.name) updateData.name = updates.name;
      if (updates.location) updateData.location = updates.location;
      if (updates.country) updateData.country = updates.country;
      if (updates.period) updateData.period = updates.period;
      if (updates.image) updateData.uploaded_picture = updates.image;

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

      console.log('✅ Minimal scan data updated successfully in Supabase');
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

  // Get full scan details by regenerating them via AI API
  static async getFullScanDetails(scanId: string, name: string, location: string, country: string, period: string, imageUrl: string): Promise<{ scanDetails: HistoryItem | null; error?: string }> {
    try {
      console.log('🔄 Regenerating full scan details for:', name);
      console.log('🔄 Input parameters:', { scanId, name, location, country, period, imageUrl });
      
      // Check if we have a valid image URL
      if (!imageUrl || imageUrl === '') {
        console.warn('⚠️ No image URL provided for regeneration, using fallback content');
        throw new Error('No image URL available for regeneration');
      }
      
      // Import the detection service to regenerate details
      const { detectMonumentsAndArt } = await import('./monumentDetectionService');
      
      // Use the stored information as additional context for better recognition
      const additionalInfo = {
        name,
        location,
        building: '',
        notes: `Previously identified as ${name} from ${location}, ${country} (${period})`
      };
      
      console.log('🔄 Calling AI detection service with image URL:', imageUrl);
      
      // Regenerate the full details using AI
      const detectionResult = await detectMonumentsAndArt(imageUrl, additionalInfo);
      
      console.log('🔄 AI detection result received:', {
        artworkName: detectionResult.artworkName,
        confidence: detectionResult.confidence,
        isRecognized: detectionResult.isRecognized,
        hasDescription: !!detectionResult.description,
        hasSignificance: !!detectionResult.significance,
        factsCount: detectionResult.facts?.length || 0
      });
      
      const fullScanDetails: HistoryItem = {
        id: scanId,
        name: detectionResult.artworkName,
        location: detectionResult.location,
        country: detectionResult.country,
        period: detectionResult.period,
        image: imageUrl,
        scannedImage: '',
        scannedAt: new Date().toISOString(),
        description: detectionResult.description,
        significance: detectionResult.significance,
        facts: detectionResult.facts,
        confidence: detectionResult.confidence,
        isRecognized: detectionResult.isRecognized,
        detailedDescription: detectionResult.detailedDescription,
      };
      
      console.log('✅ Full scan details regenerated successfully');
      return { scanDetails: fullScanDetails };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error regenerating scan details:', errorMessage);
      return { 
        scanDetails: null, 
        error: errorMessage
      };
    }
  }
}
