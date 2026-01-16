import { supabase } from '../lib/supabase';
import { preloadModelImages } from './imagePreloader';

// Global cache for models data
let modelsCache: any[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60 * 1000; // 60 seconds
const GC_DURATION = 5 * 60 * 1000; // 5 minutes

export interface PrefetchOptions {
  userId?: string;
  forceRefresh?: boolean;
}

/**
 * Prefetch models list and store in global cache
 */
export const prefetchModels = async (options: PrefetchOptions = {}) => {
  try {
    // Check if cache is still valid
    if (!options.forceRefresh && modelsCache && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
      return modelsCache;
    }

    // If no userId provided, try to get from current session
    let userId = options.userId;
    if (!userId) {
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id;
    }

    if (!userId) {
      return null;
    }

    // Fetch models data
    const { data, error } = await supabase
      .from('wardrobe')
      .select('id, item_name, description, category, image_url, date_added')
      .eq('user_id', userId)
      .order('date_added', { ascending: false});

    if (error) {
      return null;
    }

    // Store in cache
    modelsCache = data || [];
    cacheTimestamp = Date.now();

    // Prefetch model images using the new image preloader
    await preloadModelImages();

    return modelsCache;
  } catch (error) {
    return null;
  }
};

/**
 * Prefetch model images to browser cache
 */
export const prefetchModelImages = async (models: any[]) => {
  try {
    const imageUrls = models
      .filter(model => model.image_url)
      .map(model => model.image_url);

    // Use Promise.allSettled to handle individual image failures gracefully
    const prefetchPromises = imageUrls.map(async (url) => {
      try {
        // Create a link element for prefetching
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.as = 'image';
        link.href = url;
        document.head.appendChild(link);

        // Also fetch the image to warm up the cache
        await fetch(url, {
          method: 'HEAD',
          cache: 'force-cache'
        });
      } catch (error) {
        // Silently handle image prefetch failures
      }
    });

    await Promise.allSettled(prefetchPromises);
  } catch (error) {
    // Silently handle prefetch errors
  }
};

/**
 * Get cached models data
 */
export const getCachedModels = () => {
  if (!modelsCache || (Date.now() - cacheTimestamp) > GC_DURATION) {
    // Clear expired cache
    modelsCache = null;
    cacheTimestamp = 0;
    return null;
  }
  return modelsCache;
};

/**
 * Clear the models cache
 */
export const clearModelsCache = () => {
  modelsCache = null;
  cacheTimestamp = 0;
};

/**
 * Check if models are currently being prefetched
 */
export const isPrefetching = () => {
  return modelsCache === null && cacheTimestamp === 0;
};
