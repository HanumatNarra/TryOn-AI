import { Eye, ExternalLink } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

interface WardrobeItem {
  id: string;
  item_name: string;
  description: string;
  category: string;
  image_url: string;
  date_added: string;
}

interface WardrobeItemLinkProps {
  item: WardrobeItem;
  children: React.ReactNode;
  onItemClick?: (item: WardrobeItem) => void;
}

const WardrobeItemLink: React.FC<WardrobeItemLinkProps> = ({ 
  item, 
  children, 
  onItemClick 
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout>();
  const linkRef = useRef<HTMLSpanElement>(null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Calculate position for preview
    const rect = e.currentTarget.getBoundingClientRect();
    setPreviewPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
    
    setShowPreview(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShowPreview(false);
    }, 200); // Small delay to prevent flickering
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onItemClick) {
      onItemClick(item);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <span
        aria-label={`View details for ${item.item_name}`}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 mx-0.5 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 text-purple-700 dark:text-purple-300 hover:from-purple-200 hover:to-pink-200 dark:hover:from-purple-800/50 dark:hover:to-pink-800/50 cursor-pointer rounded-lg border border-purple-200 dark:border-purple-700 shadow-sm hover:shadow-md transition-all duration-200 font-medium hover:scale-105"
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (onItemClick) {
              onItemClick(item);
            }
          }
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        ref={linkRef}
        role="button"
        tabIndex={0}
      >
        {children}
        <Eye className="w-3.5 h-3.5 opacity-70" />
      </span>

      {/* Hover Preview */}
      {showPreview && (
        <div
          className="fixed z-[60] transform -translate-x-1/2 -translate-y-full pointer-events-none animate-fade-in-up"
          style={{
            left: previewPosition.x,
            top: previewPosition.y,
          }}
        >
          <div className="bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900/20 rounded-xl shadow-2xl border-2 border-purple-200 dark:border-purple-700 p-4 max-w-xs">
            {/* Preview Arrow */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-6 border-r-6 border-t-6 border-transparent border-t-purple-200 dark:border-t-purple-700" />

            {/* Item Image */}
            <div className="w-20 h-20 mx-auto mb-3 rounded-xl overflow-hidden bg-white dark:bg-gray-700 border-2 border-purple-200 dark:border-purple-700 shadow-md">
              {item.image_url ? (
                <img
                  alt={item.item_name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  src={item.image_url}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-purple-400">
                  <Eye className="w-8 h-8" />
                </div>
              )}
            </div>

            {/* Item Details */}
            <div className="text-center">
              <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-2 line-clamp-1">
                {item.item_name}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3 leading-relaxed">
                {item.description}
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="inline-flex items-center px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded-full border border-purple-200 dark:border-purple-700">
                  {item.category}
                </span>
                <span className="text-xs text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  Click to view
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WardrobeItemLink;
