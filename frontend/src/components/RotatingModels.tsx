import React from 'react';

import { MODEL_IMAGES } from '../utils/imagePreloader';
import SimpleImageRotator from './ui/SimpleImageRotator';

interface RotatingModelsProps {
  className?: string;
}

const RotatingModels: React.FC<RotatingModelsProps> = ({ className = '' }) => {
  return (
    <div className={`relative w-full ${className}`}>
      {/* Image container with premium card styling */}
      <div className="relative rounded-2xl shadow-lg bg-gradient-to-b from-[#0B0B10] to-[#151521] overflow-hidden border border-gray-100">
        {/* Simple Image Rotator */}
        <SimpleImageRotator
          autoStart={true}
          className="w-full aspect-[4/5]"
          images={MODEL_IMAGES}
          interval={12000}
          showDots={false}
          transitionDuration={0.6}
        />
      </div>
    </div>
  );
};

export default RotatingModels;
