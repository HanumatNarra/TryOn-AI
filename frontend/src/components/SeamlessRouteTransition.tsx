import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

interface SeamlessRouteTransitionProps {
  children: React.ReactNode;
  isTransitioning: boolean;
  onTransitionComplete?: () => void;
  className?: string;
}

export const SeamlessRouteTransition: React.FC<SeamlessRouteTransitionProps> = ({
  children,
  isTransitioning,
  onTransitionComplete,
  className = ''
}) => {
  const [showProgressChip, setShowProgressChip] = useState(false);
  const [progressText, setProgressText] = useState('Signing you in...');
  const [progressState, setProgressState] = useState<'loading' | 'success' | 'error'>('loading');
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isTransitioning) {
      setShowProgressChip(true);
      setProgressState('loading');
      
      // Simulate progress states
      timeoutRef.current = setTimeout(() => {
        setProgressText('Fetching your models...');
      }, 800);
      
      timeoutRef.current = setTimeout(() => {
        setProgressText('Almost ready...');
      }, 1600);
    } else {
      setShowProgressChip(false);
      setProgressText('Signing you in...');
      setProgressState('loading');
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isTransitioning]);

  const handleTransitionComplete = () => {
    if (onTransitionComplete) {
      onTransitionComplete();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Content */}
      <motion.div
        animate={{
          filter: isTransitioning ? 'blur(8px)' : 'blur(0px)',
          opacity: isTransitioning ? 0.85 : 1
        }}
        initial={false}
        onAnimationComplete={handleTransitionComplete}
        transition={{
          duration: 0.3,
          ease: [0.4, 0.0, 0.2, 1]
        }}
      >
        {children}
      </motion.div>

      {/* Progress Chip */}
      <AnimatePresence>
        {showProgressChip && (
          <motion.div
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="fixed top-24 right-6 z-50"
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0.0, 0.2, 1]
            }}
          >
            <div className="bg-white/95 backdrop-blur-xl border border-slate-200/50 rounded-2xl px-4 py-3 shadow-xl">
              <div className="flex items-center gap-3">
                {progressState === 'loading' && (
                  <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                )}
                {progressState === 'success' && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                {progressState === 'error' && (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm font-medium text-slate-700">
                  {progressText}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop Overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/5 backdrop-blur-[2px] z-40 pointer-events-none"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
