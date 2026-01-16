import { motion } from 'framer-motion';
import React from 'react';

interface AnimatedCursorProps {
  x: number;
  y: number;
  isClicking?: boolean;
  isVisible?: boolean;
  className?: string;
}

const AnimatedCursor: React.FC<AnimatedCursorProps> = ({
  x,
  y,
  isClicking = false,
  isVisible = true,
  className = ''
}) => {
  if (!isVisible) return null;

  return (
    <motion.div
      animate={{ 
        opacity: 1, 
        scale: isClicking ? [1, 1.2, 1] : 1 
      }}
      className={`fixed pointer-events-none z-50 ${className}`}
      initial={{ opacity: 0, scale: 0 }}
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)'
      }}
      transition={{ 
        duration: isClicking ? 0.3 : 0.2,
        ease: "easeOut"
      }}
    >
      {/* Cursor dot */}
      <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm border-2 border-white" />
      
      {/* Click ripple effect */}
      {isClicking && (
        <motion.div
          animate={{ scale: 3, opacity: 0 }}
          className="absolute inset-0 w-3 h-3 bg-blue-400 rounded-full"
          initial={{ scale: 1, opacity: 0.7 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      )}
    </motion.div>
  );
};

export default AnimatedCursor;
