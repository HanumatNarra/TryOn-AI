import { motion } from 'framer-motion';
import React from 'react';

import FeatureMedia from './FeatureMedia';

interface FeatureRowProps {
  chip: string;
  title: string;
  body: string;
  cta: {
    label: string;
    href: string;
  };
  image: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  reverse?: boolean;
  priority?: 'high' | 'low';
  objectFit?: 'cover' | 'contain';
}

const FeatureRow: React.FC<FeatureRowProps> = ({
  chip,
  title,
  body,
  cta,
  image,
  reverse = false,
  priority = 'low',
  objectFit = 'cover'
}) => {
  const content = (
    <div className="max-w-xl">
      {/* Chip */}
      <div className="mb-4">
        <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium bg-[rgba(114,46,209,0.08)] text-[#6D4AFF]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#6D4AFF]" />
          {chip}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 mt-4 mb-4" id={`feature-${Math.random().toString(36).substr(2, 9)}-title`}>
        {title}
      </h3>

      {/* Body */}
      <p className="text-slate-600 leading-relaxed tracking-[-0.01em] mb-6">
        {body}
      </p>

      {/* CTA Button */}
      <a
        className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-white bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:opacity-95 active:opacity-90 transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600 focus-visible:outline-offset-2"
        href={cta.href}
      >
        {cta.label}
        <svg
          aria-hidden="true"
          className="w-4 h-4"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M12.293 3.293a1 1 0 011.414 0l4 4a.997.997 0 01.083 1.32l-.083.094-4 4a1 1 0 01-1.414-1.414L14.586 9H4a1 1 0 01-.117-1.993L4 7h10.586l-2.293-2.293a1 1 0 01-.083-1.32l.083-.094z" />
        </svg>
      </a>
    </div>
  );

  const media = (
    <FeatureMedia
      alt={image.alt}
      height={image.height}
      objectFit={objectFit}
      priority={priority}
      src={image.src}
      width={image.width}
    />
  );

  return (
    <motion.div
      aria-label={`Why choose us — ${chip.toLowerCase()}`}
      className="grid items-center gap-10 md:gap-16"
      initial={{ opacity: 0, y: 6 }}
      role="region"
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: true, amount: 0.3 }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      {/* Mobile: Always stack with image first for reverse rows */}
      <div className="md:hidden">
        {reverse ? (
          <>
            {media}
            {content}
          </>
        ) : (
          <>
            {content}
            {media}
          </>
        )}
      </div>

      {/* Desktop: Use reverse logic */}
      <div className="hidden md:grid md:grid-cols-2 md:items-center md:gap-16">
        {reverse ? (
          <>
            {media}
            {content}
          </>
        ) : (
          <>
            {content}
            {media}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default FeatureRow;
