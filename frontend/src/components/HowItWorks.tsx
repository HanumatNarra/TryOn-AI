import { motion } from 'framer-motion';
import { Upload, MessageCircle, Camera } from 'lucide-react';
import React from 'react';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      icon: <Upload className="w-7 h-7" />,
      title: "Upload Your Wardrobe",
      description: "Take photos of your clothes and let our AI automatically categorize and describe them for your digital wardrobe.",
      images: [
        { src: "/images/s1_wardrobe.png", alt: "Digital wardrobe interface showing uploaded clothing items" },
        { src: "/images/s1_wardrobe_newitem.png", alt: "Adding new item to wardrobe" }
      ]
    },
    {
      icon: <MessageCircle className="w-7 h-7" />,
      title: "Chat with Your AI Stylist",
      description: "Get personalized outfit recommendations based on your style, weather, and occasion through natural conversation.",
      images: [
        { src: "/images/s2_chatbot_question.png", alt: "AI stylist chat interface with user question" },
        { src: "/images/s2_chatbot_answer.png", alt: "AI stylist providing personalized recommendations" }
      ]
    },
    {
      icon: <Camera className="w-7 h-7" />,
      title: "Try On Instantly",
      description: "See how outfits look on you with our advanced AI try-on technology. No more guesswork—just confident styling.",
      images: [
        { src: "/images/s3_tryon_result.png", alt: "Virtual try-on result showing outfit on user" },
        { src: "/images/s3_tryon_gallery.png", alt: "Try-on gallery with multiple outfit results" }
      ]
    }
  ];

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-white to-purple-50" id="how-it-works">
      <div className="container">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 animate-fadeIn">How It Works</h2>
          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed animate-fadeIn animation-delay-100">
            Transform your fashion experience in three simple steps. Upload, chat, and try on—all powered by AI.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, index) => (
            <motion.div
              className="flex flex-col items-center p-6 rounded-2xl bg-white hover:bg-purple-50 hover:shadow-lg transition-all duration-300 group cursor-pointer h-full"
              initial={{ opacity: 0, y: 40 }}
              key={index}
              transition={{ duration: 0.6, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              {/* Icon Container - Enhanced with background and hover effect */}
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-200 group-hover:scale-110 transition-all duration-300">
                <div className="text-purple-600">
                  {step.icon}
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-gray-700 text-center leading-relaxed max-w-sm mb-6 flex-grow">
                {step.description}
              </p>

              {/* Demo Images - Enhanced card styling with vertical stack for multiple images */}
              <div className="mt-auto w-full">
                {step.images.length === 1 ? (
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100">
                    <img
                      alt={step.images[0].alt}
                      className="w-full h-auto object-cover"
                      decoding="async"
                      loading="lazy"
                      src={step.images[0].src}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {step.images.map((image, imgIndex) => (
                      <div
                        className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 hover:scale-[1.02]"
                        key={imgIndex}
                      >
                        <img
                          alt={image.alt}
                          className="w-full h-auto object-cover"
                          decoding="async"
                          loading="lazy"
                          src={image.src}
                        />
                      </div>
                    ))}
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

export default HowItWorks;
