import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse rounded ${className}`}
    style={{
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s ease-in-out infinite',
    }}
  />
);

export const WardrobeItemSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 animate-fadeIn">
    <Skeleton className="w-full h-48 rounded-lg mb-4" />
    <Skeleton className="h-4 w-3/4 mb-3" />
    <Skeleton className="h-4 w-1/2 mb-4" />
    <Skeleton className="h-10 w-32 rounded-full" />
  </div>
);

export const SuggestionSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 animate-fadeIn">
    <Skeleton className="h-6 w-1/2 mb-4" />
    <div className="space-y-3">
      <Skeleton className="h-20 w-full rounded-lg" />
      <Skeleton className="h-20 w-full rounded-lg" />
      <Skeleton className="h-20 w-full rounded-lg" />
    </div>
    <Skeleton className="h-10 w-full mt-4 rounded-full" />
  </div>
);

export const ChatMessageSkeleton: React.FC = () => (
  <div className="mb-4 animate-fadeIn">
    <div className="flex gap-2 mb-2">
      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-4 w-1/2 rounded" />
      </div>
    </div>
  </div>
);

export const ProfileSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 animate-fadeIn">
    <div className="flex items-center gap-4 mb-6">
      <Skeleton className="w-20 h-20 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-6 w-1/2 mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
    <div className="space-y-3">
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  </div>
);

export const CardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 animate-fadeIn">
    <Skeleton className="h-6 w-1/3 mb-4" />
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-5/6 mb-4" />
    <Skeleton className="h-10 w-1/4 rounded-full" />
  </div>
);
