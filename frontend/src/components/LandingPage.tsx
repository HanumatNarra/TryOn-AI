import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Upload, 
  MessageCircle, 
  Camera, 
  DollarSign, 
  Eye, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Star,
  Users,
  Zap,
  Heart,
  Shield,
  CheckCircle,
  Play,
  Clock,
  CreditCard
} from 'lucide-react';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';

import { prefetchModels } from '../utils/prefetchUtils';
import { MODEL_IMAGES } from '../utils/imagePreloader';

import HowItWorks from './HowItWorks';
import OutfitSuggestionsSection from './OutfitSuggestionsSection';
import WhyChooseSplit from './WhyChooseSplit';
import SmoothImageRotator from './ui/SmoothImageRotator';

// Hero Rotator Component with smooth image transitions
const HeroRotator: React.FC = () => {
  return (
    <div className="relative rounded-2xl shadow-lg overflow-hidden bg-gray-100" style={{ aspectRatio: '4/5' }}>
      {/* Smooth Image Rotator */}
      <SmoothImageRotator
        autoStart={true}
        className="w-full h-full"
        images={MODEL_IMAGES}
        interval={8000}
        showDots={true}
        showLoadingState={true}
        transitionDuration={0.6}
      />

      {/* Enhanced gradient overlay for better text contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent pointer-events-none" />

      {/* AI Try-On Chip */}
      <div className="absolute top-4 right-4 z-20 animate-slideInDown">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/95 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-purple-600 shadow-lg border border-white/50">
          <span className="inline-block w-2 h-2 bg-purple-600 rounded-full animate-pulse"></span>
          AI Try-On
        </div>
      </div>
    </div>
  );
};

// FAQ Component
const FAQ: React.FC = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const faqData = [
    {
      question: "What is AI Virtual Try-On?",
      answer: "AI Virtual Try-On uses advanced machine learning to digitally place clothing items on your photos, allowing you to see how outfits look on you before making a purchase. It's like having a virtual fitting room powered by artificial intelligence.",
      icon: <Camera className="w-5 h-5" />
    },
    {
      question: "How accurate are the outfit recommendations?",
      answer: "Our AI analyzes your wardrobe, style preferences, weather conditions, and occasion to provide highly personalized recommendations. The more you use the app, the better it understands your style and improves its suggestions.",
      icon: <Star className="w-5 h-5" />
    },
    {
      question: "Can I upload my own wardrobe?",
      answer: "Absolutely! You can upload photos of your existing clothing items. Our AI will automatically describe and categorize them, making them available for outfit suggestions and virtual try-ons.",
      icon: <Upload className="w-5 h-5" />
    },
    {
      question: "Is it free to get started?",
      answer: "Yes! You can start using our AI Virtual Try-On completely free. Upload your wardrobe, chat with your AI stylist, and try on outfits instantly. No credit card required to begin your style journey.",
      icon: <Shield className="w-5 h-5" />
    },
    {
      question: "How does the AI stylist work?",
      answer: "Our AI stylist learns your preferences through conversations and analyzes your wardrobe to suggest perfect outfit combinations. It considers weather, occasion, and your personal style to create tailored recommendations.",
      icon: <MessageCircle className="w-5 h-5" />
    },
    {
      question: "Is my data secure?",
      answer: "Your privacy and data security are our top priorities. All images are processed securely, and we never share your personal information with third parties. Your wardrobe data belongs to you.",
      icon: <Shield className="w-5 h-5" />
    }
  ];

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-purple-50 to-white">
      <div className="container">
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 animate-fadeIn">Frequently Asked Questions</h2>
            <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto animate-fadeIn animation-delay-100">Everything you need to know about AI-powered fashion styling</p>
          </div>

          <div className="space-y-4 animate-slideInUp animation-delay-200">
            {faqData.map((item, index) => (
              <motion.div
                className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden group hover:shadow-lg hover:border-purple-200 transition-all duration-200"
                initial={{ opacity: 0, y: 20 }}
                key={index}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <button
                  className="w-full flex items-center justify-between p-6 text-left transition-colors"
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
                      <div className="text-purple-600">
                        {item.icon}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{item.question}</h3>
                  </div>
                  <motion.div
                    animate={{ rotate: openFAQ === index ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {openFAQ === index && (
                    <motion.div
                      animate={{ height: 'auto', opacity: 1 }}
                      className="overflow-hidden"
                      exit={{ height: 0, opacity: 0 }}
                      initial={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="px-6 pb-6">
                        <div className="pt-4 border-t border-gray-100">
                          <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// CTA Section
const CTASection: React.FC = () => {
  return (
    <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-purple-100 to-white">
      <div className="container">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >


            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">Your AI Stylist is Ready — Are You?</h2>
            <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-2xl mx-auto leading-relaxed">
              Join thousands of fashion enthusiasts who are already using AI to transform their style. 
              Start your personalized fashion journey today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-full shadow-md hover:shadow-lg hover:from-purple-700 hover:to-pink-600 hover:scale-[1.02] active:scale-95 transition-all duration-200 ease-out" to="/signup">
                Get Started Free
              </Link>
            </div>

            <div className="mt-8 text-sm text-gray-500">
              <p>No credit card required • Free forever plan available</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// Social Proof Component
const SocialProof: React.FC = () => {
  const testimonials = [
    {
      quote: "TryOn.AI transformed how I think about fashion. The AI suggestions are spot-on!",
      author: "Sarah Chen",
      role: "Fashion Blogger",
      avatar: "/images/avatar-1.jpg"
    },
    {
      quote: "Finally, an AI that understands my style! The outfit combinations are incredible.",
      author: "Marcus Rodriguez",
      role: "Tech Professional",
      avatar: "/images/avatar-2.jpg"
    },
    {
      quote: "This is the future of personal styling. I've never felt more confident in my outfits.",
      author: "Emma Thompson",
      role: "Marketing Director",
      avatar: "/images/avatar-3.jpg"
    }
  ];

  const partners = [
    { name: "Vogue", logo: "/images/partner-vogue.svg" },
    { name: "TechCrunch", logo: "/images/partner-techcrunch.svg" },
    { name: "Fashion Week", logo: "/images/partner-fashionweek.svg" }
  ];

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-white to-purple-50">
      <div className="container">
        {/* Testimonials */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Loved by fashion enthusiasts worldwide</h2>
          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
            Join thousands of users who have transformed their style with AI-powered fashion recommendations
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {testimonials.map((testimonial, index) => (
            <motion.div
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              key={index}
              transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-purple-600 font-semibold text-lg">
                    {testimonial.author.charAt(0)}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{testimonial.author}</h4>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
              <p className="text-gray-700 italic">"{testimonial.quote}"</p>
            </motion.div>
          ))}
        </div>

        {/* As Featured In */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm text-gray-500 mb-6 font-medium">As Featured In</p>
          <div className="flex justify-center items-center gap-8 opacity-60">
            {partners.map((partner, index) => (
              <div className="text-gray-400 font-semibold text-lg" key={index}>
                {partner.name}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Footer Component
const Footer: React.FC = () => {
  return (
    <footer className="border-t border-gray-200 py-12">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-500 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">TryOn.AI</h3>
              <p className="text-sm text-gray-500">AI-powered virtual styling</p>
            </div>
          </div>

          {/* Middle: Links */}
          <nav className="flex flex-wrap justify-center gap-6 text-sm">
            <Link className="text-gray-600 hover:text-gray-900 transition-colors" to="/features">Features</Link>
            <Link className="text-gray-600 hover:text-gray-900 transition-colors" to="/how-it-works">How it Works</Link>
            <Link className="text-gray-600 hover:text-gray-900 transition-colors" to="/pricing">Pricing</Link>
            <Link className="text-gray-600 hover:text-gray-900 transition-colors" to="/reviews">Reviews</Link>
            <Link className="text-gray-600 hover:text-gray-900 transition-colors" to="/privacy">Privacy</Link>
            <Link className="text-gray-600 hover:text-gray-900 transition-colors" to="/terms">Terms</Link>
          </nav>

          {/* Right: Socials */}
          <div className="flex justify-center md:justify-end gap-4">
            <a className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors" href="#">
              <span className="sr-only">Twitter</span>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors" href="#">
              <span className="sr-only">Instagram</span>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.718-1.297c-.875.807-2.026 1.297-3.323 1.297s-2.448-.49-3.323-1.297c-.807-.875-1.297-2.026-1.297-3.323s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323z" />
              </svg>
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            © 2024 TryOn.AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

const LandingPage: React.FC = () => {
  // Prefetch models data on Sign In button interaction
  const handleSignInPrefetch = useCallback(async () => {
    try {
      await prefetchModels();
    } catch (error) {
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-purple-100">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <nav className="container">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link className="flex items-center gap-3 group" to="/">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-500 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-300">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                TryOn.AI
              </span>
            </Link>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                className="hidden sm:inline-flex items-center px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-full hover:border-purple-600 hover:text-purple-600 hover:bg-purple-50 active:scale-95 transition-all duration-200 ease-out"
                onFocus={handleSignInPrefetch}
                onMouseEnter={handleSignInPrefetch}
                to="/login"
              >
                Sign In
              </Link>
              <Link
                className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-full shadow-md hover:shadow-lg hover:from-purple-700 hover:to-pink-600 hover:scale-[1.02] active:scale-95 transition-all duration-200 ease-out"
                to="/signup"
              >
                Get Started
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center py-12 md:py-16 lg:py-20">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left: Content - 5/12 columns */}
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-5"
              initial={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.6 }}
            >
              {/* Headline */}
              <h1
                className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-[1.15] -tracking-wide max-w-[16ch] mb-5 animate-slideInUp"
                style={{ textWrap: 'balance' }}
              >
                Your AI Stylist is ready to transform your wardrobe.
              </h1>

              {/* Body Copy */}
              <p className="text-lg sm:text-xl text-gray-700 leading-relaxed mb-8 max-w-xl animate-slideInUp animation-delay-100">
                Upload your clothes, chat with your AI stylist, and see how outfits look on you instantly.
                No more guesswork—just confident, personalized fashion choices powered by artificial intelligence.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 animate-slideInUp animation-delay-200">
                <Link
                  className="btn btn-primary group inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold rounded-full shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all duration-200 ease-out"
                  to="/signup"
                >
                  Get Started Free
                </Link>
              </div>
            </motion.div>

            {/* Right: Media - 7/12 columns */}
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="lg:col-span-7 relative"
              initial={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {/* Ambient fill for ultra-wide screens */}
              <div className="absolute inset-0 -right-20 lg:-right-32">
                <div className="absolute top-1/2 right-0 w-96 h-96 bg-gradient-radial from-violet-500/6 via-purple-500/4 to-transparent rounded-full blur-3xl transform -translate-y-1/2" />
              </div>

              {/* Hero Rotator */}
              <div className="relative">
                <HeroRotator />
              </div>
            </motion.div>
          </div>

          {/* Scroll Down Indicator */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 animate-bounce">
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <HowItWorks />

      {/* Why Choose Us */}
      <WhyChooseSplit />

      {/* Outfit Suggestions */}
      <OutfitSuggestionsSection />

      {/* FAQ */}
      <FAQ />

      {/* CTA Section */}
      <CTASection />

      {/* Social Proof */}
      <SocialProof />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
