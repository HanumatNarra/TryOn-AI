import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 sm:py-16 px-4 animate-fadeIn ${className}`}>
      <div className="mb-6 text-purple-600 opacity-80">
        {icon}
      </div>
      <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 text-center">
        {title}
      </h3>
      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold px-6 py-3 rounded-full hover:shadow-lg hover:from-purple-700 hover:to-pink-600 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-out"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
