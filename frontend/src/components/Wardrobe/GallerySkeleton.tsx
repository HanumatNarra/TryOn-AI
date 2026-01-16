import { motion } from 'framer-motion';
import React from 'react';

interface GallerySkeletonProps {
  itemCount?: number;
  className?: string;
}

export const GallerySkeleton: React.FC<GallerySkeletonProps> = ({
  itemCount = 12,
  className = ''
}) => {
  const shimmerAnimation = {
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite'
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Skeleton */}
      <div className="text-center mb-10">
        <div className="h-12 w-64 bg-gray-200 rounded-xl mx-auto mb-4" style={shimmerAnimation} />
        <div className="h-6 w-80 bg-gray-200 rounded-xl mx-auto" style={shimmerAnimation} />
      </div>

      {/* Search and Filter Skeleton */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="h-12 flex-1 bg-gray-200 rounded-xl" style={shimmerAnimation} />
        <div className="h-12 w-32 bg-gray-200 rounded-xl" style={shimmerAnimation} />
        <div className="h-12 w-24 bg-gray-200 rounded-xl" style={shimmerAnimation} />
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: itemCount }).map((_, index) => (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200/50 overflow-hidden shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            key={index}
            transition={{
              duration: 0.4,
              delay: index * 0.05,
              ease: [0.4, 0.0, 0.2, 1]
            }}
          >
            {/* Image Skeleton */}
            <div className="aspect-[4/5] bg-gray-200 relative overflow-hidden" style={shimmerAnimation}>
              {/* Placeholder for image content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-gray-300 rounded-xl opacity-60" />
              </div>
            </div>

            {/* Content Skeleton */}
            <div className="p-4 space-y-3">
              {/* Title */}
              <div className="h-5 bg-gray-200 rounded-lg w-3/4" style={shimmerAnimation} />
              
              {/* Description */}
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full" style={shimmerAnimation} />
                <div className="h-4 bg-gray-200 rounded w-2/3" style={shimmerAnimation} />
              </div>

              {/* Category and Date */}
              <div className="flex items-center justify-between">
                <div className="h-6 w-20 bg-gray-200 rounded-full" style={shimmerAnimation} />
                <div className="h-4 w-24 bg-gray-200 rounded" style={shimmerAnimation} />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <div className="h-8 w-16 bg-gray-200 rounded-lg" style={shimmerAnimation} />
                <div className="h-8 w-16 bg-gray-200 rounded-lg" style={shimmerAnimation} />
                <div className="h-8 w-16 bg-gray-200 rounded-lg" style={shimmerAnimation} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State Skeleton (if no items) */}
      {itemCount === 0 && (
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
          initial={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4 }}
        >
          <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-6" style={shimmerAnimation} />
          <div className="h-8 w-64 bg-gray-200 rounded-xl mx-auto mb-4" style={shimmerAnimation} />
          <div className="h-6 w-96 bg-gray-200 rounded-xl mx-auto mb-8" style={shimmerAnimation} />
          <div className="h-12 w-48 bg-gray-200 rounded-xl mx-auto" style={shimmerAnimation} />
        </motion.div>
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};
