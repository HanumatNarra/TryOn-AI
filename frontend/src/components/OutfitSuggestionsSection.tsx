import { motion } from 'framer-motion';
import { RotateCcw, Cloud } from 'lucide-react';
import React, { useState } from 'react';

const OutfitSuggestionsSection: React.FC = () => {
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = () => {
    setIsRegenerating(true);
    setTimeout(() => setIsRegenerating(false), 1000);
  };

  // Simple cache busting for the outfit image
  const outfitImageSrc = `/images/s4_outfit_day.png?v=${Date.now()}`;

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-white to-purple-50">
      <div className="container max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 animate-fadeIn">Your AI Stylist's Picks — Just for You</h2>
          <p
            className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto animate-fadeIn animation-delay-100"
            style={{ textWrap: 'balance' }}
          >
            Personalized outfit recommendations based on your style, weather, and occasion.
          </p>
        </div>

        {/* Two-column layout with equal heights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Left: Today's Pick */}
          <motion.div
            className="card h-full min-h-[580px] lg:min-h-[620px] p-8 flex flex-col"
            initial={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-semibold text-gray-900 tracking-wide">Today's Pick</h3>
              <button
                aria-label="Regenerate outfit suggestions"
                className="btn btn-ghost p-2 rounded-full hover:bg-gray-100 transition-colors"
                disabled={isRegenerating}
                onClick={handleRegenerate}
              >
                <RotateCcw
                  className={`w-4 h-4 transition-transform duration-300 ${
                    isRegenerating ? 'animate-spin' : ''
                  }`}
                />
              </button>
            </div>

            {/* Enhanced weather pill with purple theme */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 rounded-xl border border-purple-100/50 shadow-sm">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-sm">
                  <span className="text-white text-sm font-bold">23°</span>
                </div>
                <div className="flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-semibold text-gray-700">Partly Cloudy</span>
                </div>
              </div>
              <span className="text-sm text-gray-600">Perfect for a casual day out</span>
            </div>

            {/* Outfit of the Day screenshot with better proportions */}
            <div className="relative group flex-grow">
              <div className="relative overflow-hidden rounded-xl bg-gray-50 border border-gray-200 group-hover:border-purple-200 transition-colors h-full">
                <img
                  alt="Today's recommended outfit"
                  className="w-full h-full object-contain p-6 group-hover:scale-[1.02] transition-transform duration-300 cursor-zoom-in"
                  decoding="async"
                  loading="eager"
                  src={outfitImageSrc}
                />
              </div>
            </div>
          </motion.div>

          {/* Right: Formal & Sophisticated */}
          <motion.div
            className="card h-full min-h-[580px] lg:min-h-[620px] p-8 flex flex-col"
            initial={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-semibold text-gray-900 tracking-wide">Formal & Sophisticated</h3>
              <div className="px-3 py-2 bg-purple-100 rounded-full text-sm font-semibold text-purple-600 border border-purple-200">
                Premium
              </div>
            </div>

            {/* Vertical layout for better screenshot visibility */}
            <div className="space-y-8 flex-grow">
              {/* Top: Select an occasion(s) */}
              <div className="text-center">
                <div className="relative overflow-hidden rounded-xl border border-gray-200/50 shadow-sm mb-3">
                  <img
                    alt="Select an occasion - Various options for users to choose from"
                    className="w-full h-auto object-contain hover:scale-105 transition-transform duration-300"
                    decoding="async"
                    loading="lazy"
                    src="/images/s4_suggestions_selected.png"
                  />
                </div>
                <p className="text-sm font-medium text-gray-700">Select an occasion(s)</p>
              </div>
              {/* Bottom: AI-generated outfit suggestions */}
              <div className="text-center">
                <div className="relative overflow-hidden rounded-xl border border-gray-200/50 shadow-sm mb-3">
                  <img
                    alt="AI-generated outfit suggestions for selected occasion"
                    className="w-full h-auto object-contain hover:scale-105 transition-transform duration-300"
                    decoding="async"
                    loading="lazy"
                    src="/images/s4_suggestions_result.png"
                  />
                </div>
                <p className="text-sm font-medium text-gray-700">AI-outfit suggestions</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default OutfitSuggestionsSection;
