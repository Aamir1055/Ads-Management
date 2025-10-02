// Simple in-memory cache for dashboard data
class DashboardCache {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL
  }

  // Generate cache key
  generateKey(service, method, params = {}) {
    const paramString = JSON.stringify(params, Object.keys(params).sort());
    return `${service}_${method}_${paramString}`;
  }

  // Set cache entry
  set(key, data, ttl = this.defaultTTL) {
    this.cache.set(key, data);
    this.timestamps.set(key, Date.now() + ttl);
  }

  // Get cache entry
  get(key) {
    const timestamp = this.timestamps.get(key);
    
    if (!timestamp || Date.now() > timestamp) {
      // Cache expired or doesn't exist
      this.cache.delete(key);
      this.timestamps.delete(key);
      return null;
    }

    return this.cache.get(key);
  }

  // Check if cache entry exists and is valid
  has(key) {
    return this.get(key) !== null;
  }

  // Clear specific cache entry
  delete(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
  }

  // Clear all cache entries
  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }

  // Clear expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, timestamp] of this.timestamps.entries()) {
      if (now > timestamp) {
        this.cache.delete(key);
        this.timestamps.delete(key);
      }
    }
  }

  // Get cache stats
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  // Estimate memory usage (rough calculation)
  estimateMemoryUsage() {
    let totalSize = 0;
    for (const [key, value] of this.cache.entries()) {
      totalSize += key.length * 2; // Rough estimate for string size
      totalSize += JSON.stringify(value).length * 2; // Rough estimate for object size
    }
    return totalSize;
  }
}

// Create singleton instance
const dashboardCache = new DashboardCache();

// Cached wrapper for dashboard service methods
export const createCachedService = (service, serviceName) => {
  const cachedService = {};

  // Wrap each method in the service
  Object.keys(service).forEach(methodName => {
    if (typeof service[methodName] === 'function') {
      cachedService[methodName] = async (...args) => {
        // Generate cache key
        const params = args[0] || {};
        const cacheKey = dashboardCache.generateKey(serviceName, methodName, params);

        // Check cache first
        const cachedData = dashboardCache.get(cacheKey);
        if (cachedData) {
          console.log(`[Cache] Hit for ${serviceName}.${methodName}`);
          return cachedData;
        }

        // Cache miss - fetch from service
        console.log(`[Cache] Miss for ${serviceName}.${methodName} - fetching...`);
        try {
          const data = await service[methodName](...args);
          
          // Cache the result with appropriate TTL
          let ttl = dashboardCache.defaultTTL;
          
          // Set different TTLs based on data type
          if (methodName === 'getDashboardOverview') {
            ttl = 2 * 60 * 1000; // 2 minutes for overview data
          } else if (methodName === 'getRecentActivities') {
            ttl = 1 * 60 * 1000; // 1 minute for activities
          } else if (methodName.includes('Trends')) {
            ttl = 10 * 60 * 1000; // 10 minutes for trend data
          }

          dashboardCache.set(cacheKey, data, ttl);
          return data;
        } catch (error) {
          console.error(`[Cache] Error fetching ${serviceName}.${methodName}:`, error);
          throw error;
        }
      };
    } else {
      // Non-function properties
      cachedService[methodName] = service[methodName];
    }
  });

  return cachedService;
};

// Cache invalidation patterns
export const invalidateCache = {
  // Invalidate all dashboard data
  all: () => {
    dashboardCache.clear();
    console.log('[Cache] Cleared all dashboard cache');
  },

  // Invalidate specific data types
  overview: () => {
    const keys = Array.from(dashboardCache.cache.keys());
    keys.forEach(key => {
      if (key.includes('getDashboardOverview')) {
        dashboardCache.delete(key);
      }
    });
    console.log('[Cache] Cleared overview cache');
  },

  campaigns: () => {
    const keys = Array.from(dashboardCache.cache.keys());
    keys.forEach(key => {
      if (key.includes('Campaign')) {
        dashboardCache.delete(key);
      }
    });
    console.log('[Cache] Cleared campaign cache');
  },

  brands: () => {
    const keys = Array.from(dashboardCache.cache.keys());
    keys.forEach(key => {
      if (key.includes('Brand')) {
        dashboardCache.delete(key);
      }
    });
    console.log('[Cache] Cleared brand cache');
  },

  activities: () => {
    const keys = Array.from(dashboardCache.cache.keys());
    keys.forEach(key => {
      if (key.includes('Activities')) {
        dashboardCache.delete(key);
      }
    });
    console.log('[Cache] Cleared activities cache');
  }
};

// Preload critical data
export const preloadDashboardData = async (cachedService) => {
  console.log('[Cache] Preloading critical dashboard data...');
  
  const preloadPromises = [
    cachedService.getDashboardOverview(),
    cachedService.getRecentActivities({ limit: 10 }),
    cachedService.getCampaignPerformance({ limit: 5 })
  ];

  try {
    await Promise.allSettled(preloadPromises);
    console.log('[Cache] Critical data preloaded successfully');
  } catch (error) {
    console.warn('[Cache] Some preload operations failed:', error);
  }
};

// Auto-cleanup expired cache entries every 10 minutes
setInterval(() => {
  dashboardCache.cleanup();
  console.log('[Cache] Cleaned up expired entries');
}, 10 * 60 * 1000);

// Lazy loading utility for charts
export const createLazyChartLoader = () => {
  const loadedCharts = new Set();
  const observers = new Map();

  return {
    // Register a chart for lazy loading
    register: (chartId, element, loadCallback) => {
      if (loadedCharts.has(chartId)) {
        return; // Already loaded
      }

      // Create intersection observer for this chart
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !loadedCharts.has(chartId)) {
              console.log(`[LazyLoad] Loading chart: ${chartId}`);
              loadCallback();
              loadedCharts.add(chartId);
              observer.disconnect();
              observers.delete(chartId);
            }
          });
        },
        {
          rootMargin: '50px', // Start loading 50px before the element comes into view
          threshold: 0.1
        }
      );

      observer.observe(element);
      observers.set(chartId, observer);
    },

    // Force load a chart
    forceLoad: (chartId, loadCallback) => {
      if (!loadedCharts.has(chartId)) {
        console.log(`[LazyLoad] Force loading chart: ${chartId}`);
        loadCallback();
        loadedCharts.add(chartId);
        
        // Disconnect observer if it exists
        const observer = observers.get(chartId);
        if (observer) {
          observer.disconnect();
          observers.delete(chartId);
        }
      }
    },

    // Check if chart is loaded
    isLoaded: (chartId) => loadedCharts.has(chartId),

    // Clean up observers
    cleanup: () => {
      observers.forEach(observer => observer.disconnect());
      observers.clear();
      loadedCharts.clear();
    }
  };
};

export default dashboardCache;
