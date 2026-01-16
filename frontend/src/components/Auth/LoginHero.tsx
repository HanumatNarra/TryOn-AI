import React, { useState, useEffect } from 'react';
import { MODEL_IMAGES } from '../../utils/imagePreloader';

interface LoginHeroProps {
  className?: string;
}

const LoginHero: React.FC<LoginHeroProps> = ({ className = '' }): JSX.Element => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const modelImages = MODEL_IMAGES as unknown as string[];

  // Simple rotation - change the index every 12 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % modelImages.length);
    }, 12000);

    return () => clearInterval(interval);
  }, [modelImages.length]);

  return (
    <div className={`relative min-h-screen overflow-hidden ${className}`}>
      {/* Simple rotating image - just like the static one that worked */}
      <div className="absolute inset-0">
        <img
          alt={`AI Fashion Model ${currentIndex + 1}`}
          className="w-full h-full object-cover transition-opacity duration-1000"
          src={modelImages[currentIndex]}
        />
      </div>

      {/* Dark Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent pointer-events-none" />

      {/* AI Try-On Chip */}
      <div className="absolute bottom-8 left-8 z-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-sm px-4 py-2 text-sm font-medium text-gray-900 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-500" />
          AI Try-On
        </div>
      </div>
    </div>
  );
};

export default LoginHero;
