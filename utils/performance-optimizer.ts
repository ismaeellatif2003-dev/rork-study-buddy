import { Platform } from 'react-native';

// Performance optimization configuration
const PERFORMANCE_CONFIG = {
  // Debounce delays for various operations
  DEBOUNCE_DELAYS: {
    SUBSCRIPTION_UPDATE: 500,
    PASSKIT_OPERATION: 1000,
    UI_UPDATE: 100,
  },
  
  // Cache expiration times
  CACHE_EXPIRATION: {
    SUBSCRIPTION_DATA: 5 * 60 * 1000, // 5 minutes
    PASSKIT_STATUS: 2 * 60 * 1000, // 2 minutes
    PRODUCT_DATA: 10 * 60 * 1000, // 10 minutes
  },
  
  // Memory management
  MEMORY_LIMITS: {
    MAX_CACHED_ITEMS: 50,
    CLEANUP_INTERVAL: 5 * 60 * 1000, // 5 minutes
  },
};

// Debounce utility for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Throttle utility for performance optimization
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

// Memory management utility
class MemoryManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startCleanupInterval();
  }

  // Set cache item with TTL
  set(key: string, data: any, ttl: number = PERFORMANCE_CONFIG.CACHE_EXPIRATION.SUBSCRIPTION_DATA): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    // Cleanup if cache is too large
    if (this.cache.size > PERFORMANCE_CONFIG.MEMORY_LIMITS.MAX_CACHED_ITEMS) {
      this.cleanup();
    }
  }

  // Get cache item
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > item.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  // Remove cache item
  delete(key: string): void {
    this.cache.delete(key);
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
  }

  // Cleanup expired items
  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Start cleanup interval
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, PERFORMANCE_CONFIG.MEMORY_LIMITS.CLEANUP_INTERVAL);
  }

  // Stop cleanup interval
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Performance monitoring utility
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private isEnabled = __DEV__;

  // Start timing an operation
  startTimer(operation: string): void {
    if (!this.isEnabled) return;
    
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    const startTime = performance.now();
    this.metrics.get(operation)!.push(startTime);
  }

  // End timing an operation
  endTimer(operation: string): number | null {
    if (!this.isEnabled) return null;
    
    const times = this.metrics.get(operation);
    if (!times || times.length === 0) return null;
    
    const startTime = times.pop()!;
    const duration = performance.now() - startTime;
    
    // Log slow operations
    if (duration > 1000) {
      console.warn(`Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }

  // Get average time for an operation
  getAverageTime(operation: string): number {
    const times = this.metrics.get(operation);
    if (!times || times.length === 0) return 0;
    
    const sum = times.reduce((acc, time) => acc + time, 0);
    return sum / times.length;
  }

  // Clear metrics
  clear(): void {
    this.metrics.clear();
  }
}

// PassKit performance optimization
class PassKitOptimizer {
  private memoryManager = new MemoryManager();
  private performanceMonitor = new PerformanceMonitor();
  private operationQueue: Array<() => Promise<void>> = [];
  private isProcessing = false;

  // Queue PassKit operation to prevent conflicts
  async queueOperation(operation: () => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.operationQueue.push(async () => {
        try {
          await operation();
          resolve();
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  // Process operation queue
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.operationQueue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.operationQueue.length > 0) {
      const operation = this.operationQueue.shift()!;
      await operation();
      
      // Add small delay between operations to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.isProcessing = false;
  }

  // Optimized PassKit operation with caching
  async optimizedPassKitOperation<T>(
    operationKey: string,
    operation: () => Promise<T>,
    cacheKey?: string,
    cacheTTL?: number
  ): Promise<T> {
    this.performanceMonitor.startTimer(operationKey);
    
    try {
      // Check cache first
      if (cacheKey) {
        const cached = this.memoryManager.get(cacheKey);
        if (cached) {
          this.performanceMonitor.endTimer(operationKey);
          return cached;
        }
      }

      // Execute operation directly
      const result = await operation();

      // Cache result
      if (cacheKey) {
        this.memoryManager.set(cacheKey, result, cacheTTL);
      }

      this.performanceMonitor.endTimer(operationKey);
      return result;
    } catch (error) {
      this.performanceMonitor.endTimer(operationKey);
      throw error;
    }
  }

  // Cleanup resources
  destroy(): void {
    this.memoryManager.destroy();
    this.performanceMonitor.clear();
  }
}

// Export utilities
export const memoryManager = new MemoryManager();
export const performanceMonitor = new PerformanceMonitor();
export const passKitOptimizer = new PassKitOptimizer();

// Performance optimization hooks
export const performanceConfig = PERFORMANCE_CONFIG;

// Platform-specific performance optimizations
export const platformOptimizations = {
  ios: {
    // iOS-specific optimizations
    enableMetalRendering: true,
    optimizeMemoryUsage: true,
    reduceAnimations: false,
  },
  android: {
    // Android-specific optimizations
    enableHardwareAcceleration: true,
    optimizeMemoryUsage: true,
    reduceAnimations: false,
  },
  web: {
    // Web-specific optimizations
    enableVirtualScrolling: true,
    optimizeMemoryUsage: true,
    reduceAnimations: false,
  },
};

// Get platform-specific optimizations
export function getPlatformOptimizations() {
  return platformOptimizations[Platform.OS as keyof typeof platformOptimizations] || platformOptimizations.web;
}

// Performance optimization recommendations
export function getPerformanceRecommendations(): string[] {
  const recommendations: string[] = [];
  
  if (Platform.OS === 'ios') {
    recommendations.push(
      'Enable Metal rendering for better graphics performance',
      'Use PassKit caching to reduce API calls',
      'Implement proper memory management for large datasets'
    );
  } else if (Platform.OS === 'android') {
    recommendations.push(
      'Enable hardware acceleration for smooth animations',
      'Optimize image loading and caching',
      'Use RecyclerView for large lists'
    );
  } else {
    recommendations.push(
      'Enable virtual scrolling for large datasets',
      'Optimize bundle size and code splitting',
      'Use efficient state management patterns'
    );
  }
  
  return recommendations;
}
