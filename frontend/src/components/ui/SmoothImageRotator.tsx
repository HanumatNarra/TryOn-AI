import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect, useRef, useCallback } from 'react';

import { imagePreloader, MODEL_IMAGES, preloadModelImages } from '../../utils/imagePreloader';
import SmoothImage from './SmoothImage';

interface SmoothImageRotatorProps {
  images: readonly string[];
  interval?: number;
  transitionDuration?: number;
  autoStart?: boolean;
  showDots?: boolean;
  showLoadingState?: boolean;
  className?: string;
  onImageChange?: (index: number) => void;
}

const SmoothImageRotator: React.FC<SmoothImageRotatorProps> = ({
  images,
  interval = 12000,
  transitionDuration = 0.6,
  autoStart = true,
  showDots = true,
  showLoadingState = true,
  className = '',
  onImageChange
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPreloading, setIsPreloading] = useState(true);
  const [preloadedCount, setPreloadedCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Preload all images on mount
  useEffect(() => {
    const preloadImages = async () => {
      try {
        await preloadModelImages();
        setIsPreloading(false);
      } catch (error) {
        setIsPreloading(false);
      }
    };

    // Start preloading
    preloadImages();
    
    // Fallback: stop preloading after 5 seconds regardless
    const fallbackTimer = setTimeout(() => {
      setIsPreloading(false);
    }, 5000);

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, [images]);

  // Auto-rotation logic
  useEffect(() => {
    if (!autoStart || isPreloading) return;

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

    // Start rotation after a short delay
    const timer = setTimeout(startRotation, 2000);

    return () => {
      clearTimeout(timer);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [autoStart, isPreloading, interval, transitionDuration, images.length, currentIndex, onImageChange]);

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
    if (autoStart && !isPreloading) {
      intervalRef.current = setInterval(() => {
        setIsTransitioning(true);
        timeoutRef.current = setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % images.length);
          setIsTransitioning(false);
          onImageChange?.((currentIndex + 1) % images.length);
        }, transitionDuration * 1000);
      }, interval);
    }
  }, [autoStart, isPreloading, interval, transitionDuration, images.length, currentIndex, onImageChange]);

  if (isPreloading && showLoadingState) {
    return (
      <div className={`relative ${className}`}>
        <div className="absolute inset-0 bg-slate-200 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-slate-300 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600 text-sm">Loading images...</p>
          </div>
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
          <SmoothImage
            alt={`AI Fashion Model ${currentIndex + 1}`}
            className="w-full h-full"
            priority={currentIndex === 0}
            showLoadingState={false}
            src={images[currentIndex]}
            transitionDuration={transitionDuration}
          />
        </motion.div>
      </AnimatePresence>

      {/* Removed: Image counter for cleaner carousel appearance */}
    </div>
  );
};

export default SmoothImageRotator;
