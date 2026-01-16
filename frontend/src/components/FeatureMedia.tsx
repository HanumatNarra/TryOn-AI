import React from 'react';

interface FeatureMediaProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: 'high' | 'low';
  className?: string;
  objectFit?: 'cover' | 'contain';
}

const FeatureMedia: React.FC<FeatureMediaProps> = ({
  src,
  alt,
  width,
  height,
  priority = 'low',
  className = '',
  objectFit = 'cover'
}) => {
  return (
    <div className="relative">
      {/* Soft backdrop blur shadow */}
      <div aria-hidden className="absolute -inset-2 rounded-xl bg-white/60 blur-xl" />
      
      {/* Image container */}
      <div className={`relative rounded-[28px] overflow-hidden ${
        objectFit === 'contain' 
          ? 'bg-white shadow-[0_10px_30px_rgba(0,0,0,0.1)]' 
          : 'shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)] bg-gradient-to-b from-[#0B0B10] to-[#151521]'
      }`}>
        <img
          alt={alt}
          className={`
            w-full aspect-[4/5] sm:aspect-[3/4] md:aspect-[4/5]
            object-${objectFit} rounded-[24px]
            transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)]
            hover:scale-[1.01] transform-gpu
            ${className}
          `}
          decoding="async"
          height={height}
          loading={priority === 'high' ? 'eager' : 'lazy'}
          onError={(e) => {
            // Image failed to load - add fallback styling
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = document.createElement('div');
            fallback.className = 'w-full aspect-[4/5] sm:aspect-[3/4] md:aspect-[4/5] bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 rounded-[24px]';
            fallback.innerHTML = `
              <div class="text-center">
                <svg class="w-16 h-16 mx-auto mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <p class="text-sm">Image not available</p>
              </div>
            `;
            target.parentNode?.appendChild(fallback);
          }}
          src={src}
          width={width}
        />
      </div>
    </div>
  );
};

export default FeatureMedia;
