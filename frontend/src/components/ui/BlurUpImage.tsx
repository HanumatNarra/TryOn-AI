import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect, useRef } from 'react';

interface BlurUpImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  placeholder?: string;
}

export const BlurUpImage: React.FC<BlurUpImageProps> = ({
  src,
  alt,
  className = '',
  aspectRatio = '4/5',
  priority = false,
  onLoad,
  onError,
  placeholder
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Set image source with cache busting
    setImageSrc(`${src}?v=${Date.now()}`);
  }, [src]);

  useEffect(() => {
    if (!priority && 'IntersectionObserver' in window) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && imgRef.current) {
              // Load image when it comes into view
              imgRef.current.src = imageSrc;
              observerRef.current?.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '50px' }
      );

      if (imgRef.current) {
        observerRef.current.observe(imgRef.current);
      }
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [imageSrc, priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    setIsError(true);
    if (onError) onError();
  };

  const containerStyle = {
    aspectRatio: aspectRatio
  };

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={containerStyle}
    >
      {/* Placeholder/Blur Background */}
      <AnimatePresence>
        {!isLoaded && !isError && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300"
            exit={{ opacity: 0 }}
            initial={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {placeholder && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-slate-400 rounded-xl opacity-60" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Image */}
      <AnimatePresence>
        {isLoaded && (
          <motion.img
            alt={alt}
            animate={{ 
              opacity: 1,
              filter: 'blur(0px)',
              scale: 1
            }}
            className="w-full h-full object-cover"
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            initial={{ 
              opacity: 0,
              filter: 'blur(12px)',
              scale: 1.05
            }}
            loading={priority ? 'eager' : 'lazy'}
            onError={handleError}
            onLoad={handleLoad}
            src={imageSrc}
            transition={{
              duration: 0.4,
              ease: [0.4, 0.0, 0.2, 1]
            }}
          />
        )}
      </AnimatePresence>

      {/* Hidden Image for Preloading */}
      {priority && (
        <img
          alt=""
          className="hidden"
          onError={handleError}
          onLoad={handleLoad}
          ref={imgRef}
          src={imageSrc}
        />
      )}

      {/* Error State */}
      <AnimatePresence>
        {isError && (
          <motion.div
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-slate-100 flex items-center justify-center"
            initial={{ opacity: 0 }}
          >
            <div className="text-center text-slate-500">
              <div className="w-12 h-12 bg-slate-300 rounded-full mx-auto mb-2" />
              <p className="text-sm">Image unavailable</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
