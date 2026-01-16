import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface ReliableImageRotatorProps {
  images: readonly string[];
  interval?: number;
  transitionDuration?: number;
  autoStart?: boolean;
  showDots?: boolean;
  className?: string;
  onImageChange?: (index: number) => void;
}

const ReliableImageRotator: React.FC<ReliableImageRotatorProps> = ({
  images,
  interval = 8000,
  transitionDuration = 0.6,
  autoStart = true,
  showDots = true,
  className = '',
  onImageChange
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle image load
  const handleImageLoad = useCallback((index: number) => {
    setLoadedImages(prev => new Set([...prev, index]));
  }, []);

  // Auto-rotation logic
  useEffect(() => {
    if (!autoStart || images.length <= 1) return;

    const startRotation = () => {
      intervalRef.current = setInterval(() => {
        setIsTransitioning(true);
        timeoutRef.current = setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % images.length);
          setIsTransitioning(false);
          onImageChange?.((currentIndex + 1) % images.length);
        }, transitionDuration * 1000);
      }, interval);
    };

    // Start rotation after 3 seconds
    const timer = setTimeout(startRotation, 3000);

    return () => {
      clearTimeout(timer);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [autoStart, interval, transitionDuration, images.length, currentIndex, onImageChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const goToImage = useCallback((index: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
      onImageChange?.(index);
    }, transitionDuration * 1000);

    // Restart auto-rotation after manual selection
    if (autoStart) {
      setTimeout(() => {
        intervalRef.current = setInterval(() => {
          setIsTransitioning(true);
          timeoutRef.current = setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
            setIsTransitioning(false);
            onImageChange?.((currentIndex + 1) % images.length);
          }, transitionDuration * 1000);
        }, interval);
      }, 3000);
    }
  }, [autoStart, interval, transitionDuration, images.length, currentIndex, onImageChange]);

  const handleMouseEnter = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (autoStart && images.length > 1) {
      intervalRef.current = setInterval(() => {
        setIsTransitioning(true);
        timeoutRef.current = setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % images.length);
          setIsTransitioning(false);
          onImageChange?.((currentIndex + 1) % images.length);
        }, transitionDuration * 1000);
      }, interval);
    }
  }, [autoStart, interval, transitionDuration, images.length, currentIndex, onImageChange]);

  if (images.length === 0) {
    return (
      <div className={`relative bg-slate-200 flex items-center justify-center ${className}`}>
        <div className="text-center text-slate-500">
          <p>No images available</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <AnimatePresence mode="sync">
        <motion.div
          animate={{
            opacity: 1,
            scale: 1
          }}
          className="absolute inset-0"
          exit={{
            opacity: 0,
            scale: 1.05
          }}
          initial={{
            opacity: 0,
            scale: 1.05
          }}
          key={currentIndex}
          transition={{
            duration: transitionDuration,
            ease: [0.4, 0, 0.2, 1]
          }}
        >
          <img
            alt={`AI Fashion Model ${currentIndex + 1}`}
            className="w-full h-full object-cover"
            decoding="async"
            loading={currentIndex === 0 ? "eager" : "lazy"}
            onLoad={() => handleImageLoad(currentIndex)}
            onError={() => {}}
            src={images[currentIndex]}
          />
        </motion.div>
      </AnimatePresence>

      {/* Loading state for first image */}
      {!loadedImages.has(currentIndex) && (
        <div className="absolute inset-0 bg-slate-200 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-violet-500 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-slate-600 text-xs">Loading...</p>
          </div>
        </div>
      )}

      {/* Progress Dots */}
      {showDots && images.length > 1 && (
        <div className="absolute bottom-4 left-4 z-10">
          <div className="flex gap-2">
            {Array.from({ length: Math.min(3, images.length) }, (_, i) => {
              const dotIndex = Math.floor(currentIndex / 3) * 3 + i;
              const isActive = dotIndex === currentIndex;
              return (
                <motion.button
                  aria-label={`Go to image ${dotIndex + 1}`}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'bg-white scale-125 shadow-sm'
                      : 'bg-white/60 hover:bg-white/80'
                  }`}
                  key={i}
                  onClick={() => goToImage(dotIndex)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReliableImageRotator;
