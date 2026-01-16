import { useState, useEffect, useRef, useCallback } from 'react';

interface UseCarouselOptions {
  interval?: number;
  reducedMotionAware?: boolean;
  autoPlay?: boolean;
}

export const useCarousel = ({
  interval = 12000,
  reducedMotionAware = true,
  autoPlay = true
}: UseCarouselOptions = {}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const prefersReducedMotion = reducedMotionAware && 
    typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const goToNext = useCallback(() => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    timeoutRef.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % 3); // Assuming 3 images
      setIsTransitioning(false);
    }, prefersReducedMotion ? 0 : 300); // Half of transition duration
  }, [isTransitioning, prefersReducedMotion]);

  const goToPrevious = useCallback(() => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    timeoutRef.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + 3) % 3); // Assuming 3 images
      setIsTransitioning(false);
    }, prefersReducedMotion ? 0 : 300);
  }, [isTransitioning, prefersReducedMotion]);

  const goToIndex = useCallback((index: number) => {
    if (isTransitioning || index === currentIndex) return;
    
    setIsTransitioning(true);
    timeoutRef.current = setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, prefersReducedMotion ? 0 : 300);
  }, [isTransitioning, currentIndex, prefersReducedMotion]);

  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => setIsPaused(false), []);

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || isPaused || prefersReducedMotion) return;

    intervalRef.current = setInterval(goToNext, interval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoPlay, isPaused, interval, goToNext, prefersReducedMotion]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious]);

  // Touch swipe support
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }

    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, goToNext, goToPrevious]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return {
    currentIndex,
    isTransitioning,
    isPaused,
    goToNext,
    goToPrevious,
    goToIndex,
    pause,
    resume,
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    }
  };
};
