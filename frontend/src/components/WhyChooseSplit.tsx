import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

import RotatingModels from './RotatingModels';

const features = [
  {
    chip: "Save on Photoshoot Costs",
    title: "Studio-quality visuals without the studio",
    body: "Skip expensive shoots. Generate polished, on-model visuals directly from product photos to keep your pipeline fast, flexible, and budget-friendly.",
    cta: {
      label: "Get Started",
      href: "/signup"
    },
    media: "rotating-models",
    reverse: false
  },
  {
    chip: "Visualize Before You Try",
    title: "Know the look before you commit",
    body: "See how outfits look in seconds—mix, match, and compare. Eliminate guesswork and make confident, faster styling decisions.",
    cta: {
      label: "Try it now",
      href: "/signup"
    },
    media: "tryon-screenshots",
    reverse: true
  },
  {
    chip: "AI Stylist at Your Fingertips",
    title: "Personal recommendations, instantly",
    body: "Chat with your AI stylist for outfit ideas, style tips, and smart pairings tailored to you—available 24/7 inside TryOn.AI.",
    cta: {
      label: "Chat with the Stylist",
      href: "/signup"
    },
    media: "chat-interface",
    reverse: false
  }
];

const WhyChooseSplit: React.FC = () => {
  return (
    <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-purple-50 to-white" id="why">
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 animate-fadeIn">Why Choose Us</h2>
          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed animate-fadeIn animation-delay-100">
            Experience the future of fashion with AI-powered styling that understands your unique style.
          </p>
        </div>

        {/* Feature Rows */}
        <div className="space-y-16 lg:space-y-20">
          {features.map((feature, index) => (
            <motion.div
              className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center ${
                feature.reverse ? 'lg:grid-flow-col-dense' : ''
              }`}
              initial={{ opacity: 0, y: 40 }}
              key={feature.chip}
              transition={{ duration: 0.6, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true, margin: "-100px" }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              {/* Content */}
              <div className={`${feature.reverse ? 'lg:col-start-2' : ''}`}>
                <div className="max-w-lg">
                  {/* Eyebrow Text - Professional label styling */}
                  <div className="flex items-center gap-3 mb-4 animate-slideInLeft">
                    <span className="text-xs font-bold uppercase tracking-widest text-purple-600">
                      {feature.chip}
                    </span>
                    <div className="flex-grow h-px bg-gradient-to-r from-purple-200 to-transparent"></div>
                  </div>

                  {/* Title - Increased text size */}
                  <h3 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 leading-tight -mt-2 animate-slideInLeft animation-delay-100">
                    {feature.title}
                  </h3>

                  {/* Body - Increased text size */}
                  <p className="text-lg md:text-xl text-gray-700 mb-8 leading-relaxed animate-slideInLeft animation-delay-200">
                    {feature.body}
                  </p>

                  {/* CTA Button */}
                  <Link
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-full shadow-md hover:shadow-lg hover:from-purple-700 hover:to-pink-600 hover:scale-[1.02] active:scale-95 transition-all duration-200 ease-out animate-slideInLeft animation-delay-300"
                    to={feature.cta.href}
                  >
                    {feature.cta.label}
                  </Link>
                </div>
              </div>

              {/* Media - Reduced width by ~10% */}
              <div className={`${feature.reverse ? 'lg:col-start-1' : ''} lg:w-[90%] animate-slideInRight`}>
                {feature.media === 'rotating-models' ? (
                  <RotatingModels />
                ) : feature.media === 'tryon-screenshots' ? (
                  <div className="relative rounded-2xl shadow-lg overflow-hidden bg-white border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                    <img
                      alt="Try-on interface showing input and result comparison"
                      className="w-full aspect-[4/3] object-cover"
                      decoding="async"
                      loading="lazy"
                      src="/images/s3_tryon_compare.png"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
                  </div>
                ) : (
                  <div className="relative rounded-2xl shadow-lg overflow-hidden bg-white border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                    <img
                      alt="AI stylist chat interface with personalized recommendations"
                      className="w-full aspect-[4/3] object-cover"
                      decoding="async"
                      loading="lazy"
                      src="/images/s2_chatbot_answer.png?v=2"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseSplit;
