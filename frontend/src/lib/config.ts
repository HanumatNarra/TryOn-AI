// Environment-based configuration
const getBackendUrl = (): string => {
  // Check for environment variable first
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL
  }
  
  // Fallback for development
  if (import.meta.env.DEV) {
    return 'http://localhost:8000'
  }
  
  // Production fallback
  return window.location.origin
}

export const config = {
  backendUrl: getBackendUrl(),
  apiEndpoints: {
    describeClothing: '/describe-clothing',
    chat: '/chat',
    tryOn: '/virtual-try-on',
    weather: '/api/weather',
    outfitOfTheDay: '/api/outfit-of-the-day',
    tryonHistory: '/api/tryon-history'
  },
  // Feature flags
  features: {
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    enableErrorTracking: import.meta.env.VITE_ENABLE_ERROR_TRACKING === 'true',
    enablePerformanceMonitoring: import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true'
  },
  // App configuration
  app: {
    name: 'TryOn.AI',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    environment: import.meta.env.MODE
  }
}
