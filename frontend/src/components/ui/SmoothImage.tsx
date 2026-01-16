import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect, useRef } from 'react';

import { imagePreloader } from '../../utils/imagePreloader';

interface SmoothImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  transitionDuration?: number;
  showLoadingState?: boolean;
}

const SmoothImage: React.FC<SmoothImageProps> = ({
  src,
  alt,
  className = '',
  priority = false,
  onLoad,
  onError,
  transitionDuration = 0.4,
  showLoadingState = true
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isPreloaded, setIsPreloaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    
    // Check if image is already preloaded
    const preloadedElement = imagePreloader.getPreloadedImage(src);
    if (preloadedElement) {
      setIsPreloaded(true);
      setIsLoaded(true);
      onLoad?.();
      return;
    }

    // If not preloaded, load normally
    const img = new Image();
    
    if (priority) {
      try {
        (img as any).fetchPriority = 'high';
      } catch (e) {
        // Ignore if fetchPriority is not supported
      }
    }

    img.onload = () => {
      setIsLoaded(true);
      setIsPreloaded(false);
      onLoad?.();
    };

    img.onerror = () => {
      setHasError(true);
      onError?.();
    };

    img.src = src;
  }, [src, priority, onLoad, onError]);

  if (hasError) {
    return (
      <div className={`bg-slate-200 flex items-center justify-center ${className}`}>
        <div className="text-center text-slate-500">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-red-500 text-sm">!</span>
          </div>
          <p className="text-xs">Failed to load</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Loading state */}
      <AnimatePresence>
        {!isLoaded && showLoadingState && (
          <motion.div
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-slate-200 flex items-center justify-center z-10"
            exit={{ opacity: 0 }}
            initial={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-slate-300 border-t-violet-500 rounded-full animate-spin mx-auto mb-2" />
              <p className="text-slate-600 text-xs">Loading...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image */}
      <motion.img
        ref={imgRef}
        alt={alt}
        animate={{ 
          opacity: isLoaded ? 1 : 0,
          scale: isLoaded ? 1 : 1.05
        }}
        className="w-full h-full object-cover"
        decoding="async"
        initial={{ opacity: 0, scale: 1.05 }}
        loading={priority ? "eager" : "lazy"}
        onError={() => {
          setHasError(true);
          onError?.();
        }}
        onLoad={() => {
          setIsLoaded(true);
          onLoad?.();
        }}
        src={src}
        transition={{ 
          duration: transitionDuration,
          ease: [0.22, 1, 0.36, 1]
        }}
      />
    </div>
  );
};

export default SmoothImage;
