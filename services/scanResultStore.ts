import { HistoryItem } from '@/providers/HistoryProvider';

// Simple in-memory store for scan results to avoid URL parameter size limits
class ScanResultStore {
  private results: Map<string, HistoryItem> = new Map();
  
  store(result: HistoryItem): string {
    const id = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.results.set(id, result);
    
    // Clean up old results to prevent memory leaks (keep only last 10)
    if (this.results.size > 10) {
      const keys = Array.from(this.results.keys());
      const oldestKey = keys[0];
      this.results.delete(oldestKey);
    }
    
    return id;
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
}

export const scanResultStore = new ScanResultStore();