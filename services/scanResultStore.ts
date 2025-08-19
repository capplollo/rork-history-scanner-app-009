import { HistoryItem } from '@/providers/HistoryProvider';

// Simple in-memory store for scan results to avoid URL parameter size limits
class ScanResultStore {
  private results: Map<string, HistoryItem> = new Map();
  
  store(result: HistoryItem): string {
    const id = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Create a copy with size-optimized data for storage
      const optimizedResult = this.optimizeForStorage(result);
      
      // Check total size before storing
      const serialized = JSON.stringify(optimizedResult);
      if (serialized.length > 50000) { // 50KB limit per item
        console.warn('Scan result too large, applying emergency optimization');
        const emergencyResult = this.createEmergencyResult(result);
        this.results.set(id, emergencyResult);
      } else {
        this.results.set(id, optimizedResult);
      }
      
      // Clean up old results more aggressively (keep only last 3)
      if (this.results.size > 3) {
        const keys = Array.from(this.results.keys());
        const oldestKey = keys[0];
        this.results.delete(oldestKey);
      }
      
      return id;
    } catch (error) {
      console.error('Error storing scan result:', error);
      // Return a simple ID even if storage fails
      return id;
    }
  }
  
  private optimizeForStorage(result: HistoryItem): HistoryItem {
    // Create a deep copy and aggressively limit content to prevent browser history issues
    const optimized = JSON.parse(JSON.stringify(result));
    
    // Truncate descriptions more aggressively
    if (optimized.description && optimized.description.length > 1000) {
      optimized.description = optimized.description.substring(0, 1000) + '...';
    }
    
    if (optimized.significance && optimized.significance.length > 1000) {
      optimized.significance = optimized.significance.substring(0, 1000) + '...';
    }
    
    // Limit detailed description content more aggressively
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
    
    // Limit facts array and individual facts
    if (optimized.facts && Array.isArray(optimized.facts)) {
      optimized.facts = optimized.facts
        .slice(0, 8)
        .map((fact: string) => fact.length > 120 ? fact.substring(0, 120) + '...' : fact);
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
  
  retrieve(id: string): HistoryItem | null {
    return this.results.get(id) || null;
  }
  
  clear(id: string): void {
    this.results.delete(id);
  }
  
  clearAll(): void {
    this.results.clear();
  }
  
  createEmergencyResult(result: HistoryItem): HistoryItem {
    return {
      id: result.id,
      name: result.name.substring(0, 100),
      location: result.location.substring(0, 50),
      period: result.period.substring(0, 30),
      description: result.description.substring(0, 200) + '...',
      significance: result.significance.substring(0, 200) + '...',
      facts: result.facts.slice(0, 3).map(fact => fact.substring(0, 80) + '...'),
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