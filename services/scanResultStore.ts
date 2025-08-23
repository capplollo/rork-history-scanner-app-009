import { HistoryItem } from '@/providers/HistoryProvider';

// Extended interface for full scan results with all details
export interface DetailedHistoryItem extends HistoryItem {
  description?: string;
  significance?: string;
  facts?: string[];
  confidence?: number;
  isRecognized?: boolean;
  detailedDescription?: {
    keyTakeaways: string[];
    inDepthContext: string;
    curiosities?: string;
  };
  scannedImage?: string;
}

// Simple in-memory store for scan results to avoid URL parameter size limits
class ScanResultStore {
  private results: Map<string, DetailedHistoryItem> = new Map();
  
  store(result: DetailedHistoryItem): string {
    const id = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log('Storing detailed scan result with ID:', id);
      console.log('Original result name:', result.name);
      
      // Validate the result before storing
      if (!result || !result.name || result.name.trim().length === 0) {
        console.error('Invalid scan result: missing or empty name');
        throw new Error('Invalid scan result data');
      }
      
      // Create a copy with size-optimized data for storage
      const optimizedResult = this.optimizeForStorage(result);
      
      // Validate optimized result
      if (!optimizedResult.name || optimizedResult.name.trim().length === 0) {
        console.error('Optimized result is invalid: missing name');
        throw new Error('Optimization failed');
      }
      
      // Check total size before storing
      const serialized = JSON.stringify(optimizedResult);
      console.log('Serialized result size:', serialized.length, 'bytes');
      
      if (serialized.length > 50000) { // 50KB limit per item
        console.warn('Scan result too large, applying emergency optimization');
        const emergencyResult = this.createEmergencyResult(result);
        this.results.set(id, emergencyResult);
        console.log('Stored emergency result');
      } else {
        this.results.set(id, optimizedResult);
        console.log('Stored optimized result successfully');
      }
      
      // Clean up old results more aggressively (keep only last 5 instead of 3)
      if (this.results.size > 5) {
        const keys = Array.from(this.results.keys());
        const keysToRemove = keys.slice(0, keys.length - 5);
        keysToRemove.forEach(key => {
          this.results.delete(key);
          console.log('Cleaned up old result:', key);
        });
      }
      
      console.log('Current store size:', this.results.size, 'items');
      return id;
    } catch (error) {
      console.error('Error storing scan result:', error);
      // Try to store a minimal version as fallback
      try {
        const minimalResult = {
          id: result.id || 'unknown',
          name: result.name || 'Unknown Monument',
          location: result.location || 'Unknown Location',
          country: result.country || 'Unknown Country',
          period: result.period || 'Unknown Period',
          description: result.description || 'Monument information available',
          significance: result.significance || 'Historical significance',
          facts: result.facts || ['This monument has historical importance'],
          image: '',
          scannedImage: '',
          scannedAt: result.scannedAt || new Date().toISOString(),
          confidence: result.confidence || 50,
          isRecognized: result.isRecognized || false,
        };
        this.results.set(id, minimalResult);
        console.log('Stored minimal fallback result');
        return id;
      } catch (fallbackError) {
        console.error('Failed to store even minimal result:', fallbackError);
        return id;
      }
    }
  }
  
  private optimizeForStorage(result: DetailedHistoryItem): DetailedHistoryItem {
    // Create a deep copy and optimize for storage
    const optimized = JSON.parse(JSON.stringify(result));
    
    // Truncate text fields if they're too long
    if (optimized.name && optimized.name.length > 200) {
      optimized.name = optimized.name.substring(0, 200) + '...';
    }
    
    if (optimized.location && optimized.location.length > 100) {
      optimized.location = optimized.location.substring(0, 100) + '...';
    }
    
    if (optimized.country && optimized.country.length > 50) {
      optimized.country = optimized.country.substring(0, 50) + '...';
    }
    
    if (optimized.period && optimized.period.length > 50) {
      optimized.period = optimized.period.substring(0, 50) + '...';
    }
    
    if (optimized.description && optimized.description.length > 500) {
      optimized.description = optimized.description.substring(0, 500) + '...';
    }
    
    if (optimized.significance && optimized.significance.length > 500) {
      optimized.significance = optimized.significance.substring(0, 500) + '...';
    }
    
    // Limit facts array
    if (optimized.facts && Array.isArray(optimized.facts)) {
      optimized.facts = optimized.facts
        .slice(0, 8)
        .map((fact: string) => fact.length > 120 ? fact.substring(0, 120) + '...' : fact);
    }
    
    // Limit detailed description content
    if (optimized.detailedDescription) {
      if (optimized.detailedDescription.quickOverview && optimized.detailedDescription.quickOverview.length > 600) {
        optimized.detailedDescription.quickOverview = optimized.detailedDescription.quickOverview.substring(0, 600) + '...';
      }
      
      if (optimized.detailedDescription.inDepthContext && optimized.detailedDescription.inDepthContext.length > 2000) {
        optimized.detailedDescription.inDepthContext = optimized.detailedDescription.inDepthContext.substring(0, 2000) + '...';
      }
      
      if (optimized.detailedDescription.curiosities && optimized.detailedDescription.curiosities.length > 800) {
        optimized.detailedDescription.curiosities = optimized.detailedDescription.curiosities.substring(0, 800) + '...';
      }
      
      // Limit keyTakeaways array and individual items
      if (optimized.detailedDescription.keyTakeaways && Array.isArray(optimized.detailedDescription.keyTakeaways)) {
        optimized.detailedDescription.keyTakeaways = optimized.detailedDescription.keyTakeaways
          .slice(0, 5)
          .map((item: string) => item.length > 150 ? item.substring(0, 150) + '...' : item);
      }
    }
    
    // Remove or limit image data that might be too large
    if (optimized.image && optimized.image.startsWith('data:')) {
      // If it's a base64 image, remove it to prevent size issues
      optimized.image = '';
    }
    
    if (optimized.scannedImage && optimized.scannedImage.startsWith('data:')) {
      // If it's a base64 image, remove it to prevent size issues
      optimized.scannedImage = '';
    }
    
    return optimized;
  }
  
  retrieve(id: string): DetailedHistoryItem | null {
    try {
      console.log('Retrieving scan result with ID:', id);
      console.log('Available IDs in store:', Array.from(this.results.keys()));
      
      const result = this.results.get(id);
      
      if (result) {
        console.log('✅ Successfully retrieved result:', result.name);
        return result;
      } else {
        console.warn('❌ No result found for ID:', id);
        console.log('Current store contents:', this.results.size, 'items');
        return null;
      }
    } catch (error) {
      console.error('Error retrieving scan result:', error);
      return null;
    }
  }
  
  update(id: string, result: DetailedHistoryItem): boolean {
    try {
      console.log('Updating scan result with ID:', id);
      
      if (!this.results.has(id)) {
        console.warn('Cannot update: ID not found in store:', id);
        return false;
      }
      
      // Validate the result before updating
      if (!result || !result.name || result.name.trim().length === 0) {
        console.error('Invalid scan result for update: missing or empty name');
        return false;
      }
      
      // Create optimized version for storage
      const optimizedResult = this.optimizeForStorage(result);
      
      // Update the stored result
      this.results.set(id, optimizedResult);
      console.log('✅ Successfully updated result:', result.name);
      return true;
    } catch (error) {
      console.error('Error updating scan result:', error);
      return false;
    }
  }

  clear(id: string): void {
    this.results.delete(id);
  }
  
  clearAll(): void {
    this.results.clear();
  }
  
  createEmergencyResult(result: DetailedHistoryItem): DetailedHistoryItem {
    return {
      id: result.id,
      name: result.name.substring(0, 100),
      location: result.location.substring(0, 50),
      country: result.country.substring(0, 30),
      period: result.period.substring(0, 30),
      description: result.description ? result.description.substring(0, 200) + '...' : 'Description available',
      significance: result.significance ? result.significance.substring(0, 200) + '...' : 'Historical significance',
      facts: result.facts ? result.facts.slice(0, 3).map(fact => fact.substring(0, 80) + '...') : ['Historical importance'],
      image: '', // Remove images in emergency mode
      scannedImage: '',
      scannedAt: result.scannedAt,
      confidence: result.confidence,
      isRecognized: result.isRecognized,
    };
  }

  getStorageInfo(): { count: number; totalSize: number } {
    let totalSize = 0;
    try {
      this.results.forEach(result => {
        totalSize += JSON.stringify(result).length;
      });
    } catch (error) {
      console.error('Error calculating storage size:', error);
    }
    return {
      count: this.results.size,
      totalSize
    };
  }
}

export const scanResultStore = new ScanResultStore();