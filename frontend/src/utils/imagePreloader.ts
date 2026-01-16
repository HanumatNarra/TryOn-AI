// Production-grade image preloading utility for seamless transitions
interface ImagePreloadOptions {
  priority?: 'high' | 'low';
  timeout?: number;
  retries?: number;
}

interface PreloadedImage {
  src: string;
  element: HTMLImageElement;
  loaded: boolean;
  error: boolean;
}

class ImagePreloader {
  private static instance: ImagePreloader;
  private preloadedImages: Map<string, PreloadedImage> = new Map();
  private loadingPromises: Map<string, Promise<PreloadedImage>> = new Map();

  static getInstance(): ImagePreloader {
    if (!ImagePreloader.instance) {
      ImagePreloader.instance = new ImagePreloader();
    }
    return ImagePreloader.instance;
  }

  async preloadImages(
    imageSrcs: string[], 
    options: ImagePreloadOptions = {}
  ): Promise<PreloadedImage[]> {
    const { priority = 'high', timeout = 10000, retries = 2 } = options;
    
    const preloadPromises = imageSrcs.map(src => this.preloadSingleImage(src, { priority, timeout, retries }));
    
    try {
      const results = await Promise.allSettled(preloadPromises);
      return results
        .filter((result): result is PromiseFulfilledResult<PreloadedImage> => result.status === 'fulfilled')
        .map(result => result.value);
    } catch (error) {
      return [];
    }
  }

  private async preloadSingleImage(
    src: string, 
    options: ImagePreloadOptions
  ): Promise<PreloadedImage> {
    // Return cached image if already preloaded
    if (this.preloadedImages.has(src)) {
      return this.preloadedImages.get(src)!;
    }

    // Return existing promise if already loading
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)!;
    }

    const promise = this.loadImage(src, options);
    this.loadingPromises.set(src, promise);

    try {
      const result = await promise;
      this.preloadedImages.set(src, result);
      this.loadingPromises.delete(src);
      return result;
    } catch (error) {
      this.loadingPromises.delete(src);
      throw error;
    }
  }

  private loadImage(src: string, options: ImagePreloadOptions): Promise<PreloadedImage> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      // Set loading priority (with fallback for unsupported browsers)
      if (options.priority === 'high') {
        try {
          (img as any).fetchPriority = 'high';
        } catch (e) {
          // Ignore if fetchPriority is not supported
        }
      }

      // Set timeout
      const timeoutId = setTimeout(() => {
        reject(new Error(`Image load timeout: ${src}`));
      }, options.timeout);

      img.onload = () => {
        clearTimeout(timeoutId);
        resolve({
          src,
          element: img,
          loaded: true,
          error: false
        });
      };

      img.onerror = () => {
        clearTimeout(timeoutId);
        resolve({
          src,
          element: img,
          loaded: false,
          error: true
        });
      };

      // Start loading
      img.src = src;
    });
  }

  // Get preloaded image element
  getPreloadedImage(src: string): HTMLImageElement | null {
    const preloaded = this.preloadedImages.get(src);
    return preloaded?.loaded ? preloaded.element : null;
  }

  // Check if image is preloaded
  isPreloaded(src: string): boolean {
    const preloaded = this.preloadedImages.get(src);
    return preloaded?.loaded === true;
  }

  // Clear cache (useful for development)
  clearCache(): void {
    this.preloadedImages.clear();
    this.loadingPromises.clear();
  }
}

export const imagePreloader = ImagePreloader.getInstance();

// Model images configuration
export const MODEL_IMAGES = [
  '/images/model_1.jpg',
  '/images/model_2.jpg',
  '/images/model_3.jpg',
  '/images/model_4.jpg',
  '/images/model_5.jpg',
  '/images/model_6.jpg',
  '/images/model_7.jpg',
  '/images/model_8.jpg',
  '/images/model_9.jpg',
  '/images/model_10.jpg',
  '/images/model_11.jpg',
  '/images/model_12.jpg',
  '/images/model_13.jpg'
] as const;

// Preload all model images with high priority
export const preloadModelImages = async (): Promise<void> => {
  try {
    const results = await imagePreloader.preloadImages(MODEL_IMAGES, { 
      priority: 'high', 
      timeout: 15000,
      retries: 3 
    });
  } catch (error) {
  }
};

// Check if all model images are preloaded
export const areModelImagesPreloaded = (): boolean => {
  return MODEL_IMAGES.every(src => imagePreloader.isPreloaded(src));
};
