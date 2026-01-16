import { motion } from 'framer-motion';
import React from 'react';

interface ProgressDotsProps {
  total: number;
  current: number;
  onDotClick: (index: number) => void;
  className?: string;
}

const ProgressDots: React.FC<ProgressDotsProps> = ({
  total,
  current,
  onDotClick,
  className = ''
}) => {
  return (
    <div className={`flex justify-center gap-3 ${className}`}>
      {Array.from({ length: total }, (_, index) => (
        <motion.button
          animate={current === index ? { scale: [1, 1.2, 1] } : {}}
          aria-current={current === index ? "true" : "false"}
          aria-label={`Go to slide ${index + 1} of ${total}`}
          className={`w-3 h-3 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
            current === index
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 scale-125'
              : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
          }`}
          key={index}
          onClick={() => onDotClick(index)}
          role="button"
          tabIndex={0}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
};

export default ProgressDots;
