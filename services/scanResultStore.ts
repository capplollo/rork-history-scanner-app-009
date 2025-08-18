import { HistoryItem } from '@/providers/HistoryProvider';

// Simple in-memory store for scan results to avoid URL parameter size limits
class ScanResultStore {
  private results: Map<string, HistoryItem> = new Map();
  
  store(result: HistoryItem): string {
    const id = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create a copy with size-optimized data for storage
    const optimizedResult = this.optimizeForStorage(result);
    this.results.set(id, optimizedResult);
    
    // Clean up old results to prevent memory leaks (keep only last 5)
    if (this.results.size > 5) {
      const keys = Array.from(this.results.keys());
      const oldestKey = keys[0];
      this.results.delete(oldestKey);
    }
    
    return id;
  }
  
  private optimizeForStorage(result: HistoryItem): HistoryItem {
    // Limit text content to prevent memory issues
    const optimized = { ...result };
    
    // Truncate very long descriptions
    if (optimized.description && optimized.description.length > 2000) {
      optimized.description = optimized.description.substring(0, 2000) + '...';
    }
    
    if (optimized.significance && optimized.significance.length > 2000) {
      optimized.significance = optimized.significance.substring(0, 2000) + '...';
    }
    
    // Limit detailed description content
    if (optimized.detailedDescription) {
      if (optimized.detailedDescription.inDepthContext && optimized.detailedDescription.inDepthContext.length > 3000) {
        optimized.detailedDescription.inDepthContext = optimized.detailedDescription.inDepthContext.substring(0, 3000) + '...';
      }
      
      if (optimized.detailedDescription.curiosities && optimized.detailedDescription.curiosities.length > 1000) {
        optimized.detailedDescription.curiosities = optimized.detailedDescription.curiosities.substring(0, 1000) + '...';
      }
    }
    
    // Limit facts array
    if (optimized.facts && optimized.facts.length > 10) {
      optimized.facts = optimized.facts.slice(0, 10);
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
  
  getStorageInfo(): { count: number; totalSize: number } {
    let totalSize = 0;
    this.results.forEach(result => {
      totalSize += JSON.stringify(result).length;
    });
    return {
      count: this.results.size,
      totalSize
    };
  }
}

export const scanResultStore = new ScanResultStore();