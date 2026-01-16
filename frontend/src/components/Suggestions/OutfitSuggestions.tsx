import { 
  Sparkles, 
  Target, 
  Thermometer, 
  RefreshCw, 
  Briefcase,
  Heart,
  Coffee,
  Sun,
  Moon,
  Clock,
  Luggage,
  Zap as Lightning,
  Cloud,
  CloudRain,
  CloudSnow,
  Wind
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { useAuth } from '../../contexts/AuthContext';
import { config } from '../../lib/config';

interface WardrobeItem {
  id: string;
  item_name: string;
  description: string;
  category: string;
  image_url: string;
}

interface WeatherInfo {
  temp: number;
  description: string;
  isFahrenheit?: boolean;
}

interface OutfitOfTheDay {
  outfit: {
    top: string;
    bottom: string;
    outerwear: string;
  };
  outfit_details: {
    top: {
      name: string;
      image_url: string;
      description: string;
    } | null;
    bottom: {
      name: string;
      image_url: string;
      description: string;
    } | null;
    outerwear: {
      name: string;
      image_url: string;
      description: string;
    } | null;
  };
  weather: string;
  reasoning: string;
  wardrobe_count: number;
  categories_available: string[];
}

interface OutfitSuggestion {
  id: string;
  occasion: string;
  items: WardrobeItem[];
  reasoning: string;
  style_tips: string[];
  style?: string;
  weather_considered?: boolean;
}

const OutfitSuggestions: React.FC = () => {
  const { user } = useAuth();
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [ootdSuggestion, setOotdSuggestion] = useState<OutfitOfTheDay | null>(null);
  const [suggestions, setSuggestions] = useState<OutfitSuggestion[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const motivationalMessages = [
    "You've got this! Your outfit is as ready as you are! 🚀",
    "Looking sharp! Confidence starts with what you wear! ✨",
    "Style is a way to say who you are without having to speak! 💫",
    "Fashion is the armor to survive the reality of everyday life! 🛡️",
    "Your outfit today is your mood board for success! 🎯",
    "Dress like you're going to meet your biggest fan! 🌟",
    "Style is not about being noticed, it's about being remembered! 🎭",
    "Fashion is the most powerful art there is! 🎨"
  ];

  const occasions = [
    {
      id: 'business',
      label: 'Business Meeting',
      description: 'Professional attire for meetings, presentations, and office environments',
      icon: Briefcase,
      color: 'from-blue-500 to-indigo-600'
    },
    {
      id: 'date',
      label: 'Date Night',
      description: 'Elegant and attractive outfits for romantic evenings and special dates',
      icon: Heart,
      color: 'from-pink-500 to-rose-600'
    },
    {
      id: 'casual',
      label: 'Casual Friday',
      description: 'Comfortable yet stylish wear for relaxed work environments',
      icon: Coffee,
      color: 'from-green-500 to-emerald-600'
    },
    {
      id: 'weekend',
      label: 'Weekend Outing',
      description: 'Relaxed weekend wear for leisure activities and social gatherings',
      icon: Sun,
      color: 'from-yellow-500 to-orange-600'
    },
    {
      id: 'evening',
      label: 'Evening Event',
      description: 'Sophisticated evening wear for formal events and special occasions',
      icon: Moon,
      color: 'from-purple-500 to-violet-600'
    },
    {
      id: 'workout',
      label: 'Gym/Workout',
      description: 'Performance athletic wear for gym workouts and physical activities',
      icon: Clock,
      color: 'from-red-500 to-pink-600'
    },
    {
      id: 'travel',
      label: 'Travel Day',
      description: 'Versatile travel wear that is comfortable and easy to mix and match',
      icon: Luggage,
      color: 'from-cyan-500 to-blue-600'
    }
  ];

  useEffect(() => {
    if (user?.id) {
      fetchWeatherAndOOTD();
    }
  }, [user?.id]); // Only fetch once when user ID is available

  const fetchWeatherAndOOTD = async () => {
    setRefreshing(true);
    try {
      // NOTE: Weather-based outfit selection is handled by the backend API
      // If outfits don't match weather (e.g., shorts in cold weather),
      // this is a backend logic issue that needs to be fixed in the API
      const response = await fetch(`${config.backendUrl}${config.apiEndpoints.outfitOfTheDay}?user_id=${user?.id}&lat=42.6614&lon=-83.9095`);
      const data = await response.json();

      if (response.ok) {
        setOotdSuggestion(data);
        setLastUpdated(new Date());

        // Rotate to a random motivational message
        setCurrentMessage(Math.floor(Math.random() * motivationalMessages.length));

        // Parse weather from the response
        const weatherMatch = data.weather.match(/(\d+(?:\.\d+)?)°F/);
        if (weatherMatch) {
          setWeather({
            temp: parseFloat(weatherMatch[1]),
            description: data.weather.split(', ')[1] || 'Clear',
            isFahrenheit: true
          });
        }
      }
    } catch (error) {
      // Error fetching OOTD - UI will show retry option
    } finally {
      setRefreshing(false);
    }
  };

  const toggleOccasion = (occasionId: string) => {
    setSelectedOccasions(prev =>
      prev.includes(occasionId)
        ? prev.filter(id => id !== occasionId)
        : [...prev, occasionId]
    );
  };

  const handleGetSuggestions = async () => {
    if (selectedOccasions.length === 0) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${config.backendUrl}/api/outfit-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user?.id,
          occasions: selectedOccasions,
          weather_consideration: true
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuggestions(data.suggestions);
      } else if (response.status === 429) {
        // Handle rate limiting
        alert(`Rate limit exceeded. Please try again later. ${data.detail || 'You have made too many requests recently.'}`);
      } else {
        // Handle other errors
        alert(`Failed to get outfit suggestions: ${data.detail || 'An unexpected error occurred. Please try again.'}`);
      }
    } catch (error) {
      alert('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (description: string) => {
    const desc = description.toLowerCase();
    if (desc.includes('rain') || desc.includes('drizzle')) return CloudRain;
    if (desc.includes('snow')) return CloudSnow;
    if (desc.includes('cloud')) return Cloud;
    if (desc.includes('wind')) return Wind;
    return Sun;
  };

  const getWeatherColor = (temp: number) => {
    if (temp < 50) return 'from-blue-500 to-cyan-500';
    if (temp < 70) return 'from-yellow-500 to-orange-500';
    return 'from-orange-500 to-red-500';
  };

  // Format reasoning to be more natural and readable
  const formatReasoning = (reasoning: string) => {
    // Remove the pipe-separated collection phrases and reformat
    let formatted = reasoning
      .replace(/\|\s*Selected from your (tops|bottoms|outerwear) collection/gi, '')
      .replace(/\s*\|\s*/g, '. ')
      .trim();

    // Add helpful context about the outfit
    if (ootdSuggestion?.outfit_details) {
      const items = [];
      if (ootdSuggestion.outfit_details.top) items.push(ootdSuggestion.outfit_details.top.name);
      if (ootdSuggestion.outfit_details.bottom) items.push(ootdSuggestion.outfit_details.bottom.name);
      if (ootdSuggestion.outfit_details.outerwear) items.push(ootdSuggestion.outfit_details.outerwear.name);

      if (items.length > 0) {
        formatted += ` This combination features your ${items.join(', ')}.`;
      }
    }

    return formatted;
  };

  return (
    <div className="animate-fade-in-up">
      {/* Header - Matching Wardrobe Style */}
      <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-purple-900/20 border-b border-purple-100 dark:border-purple-700 px-6 md:px-8 py-6 md:py-8 mb-10 shadow-sm">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Outfit Suggestions</h1>
        <div className="flex items-center gap-2 text-sm md:text-base text-gray-600 dark:text-gray-400">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span>{ootdSuggestion?.wardrobe_count || 0} items in your wardrobe • AI-powered styling</span>
        </div>
      </div>

      <div className="space-y-10 px-6 md:px-8 pb-10">

      {/* Outfit of the Day - Redesigned */}
      <div className="relative group">
        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-purple-200 dark:border-purple-700 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
          {/* Header with Gradient Background */}
          <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-md border border-white/30">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Outfit of the Day</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-purple-100 text-sm">AI-curated for today's weather</p>
                    {lastUpdated && (
                      <>
                        <span className="text-purple-100 hidden sm:inline">•</span>
                        <p className="text-purple-100 text-xs">
                          Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Weather Display */}
                {weather && (
                  <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/30 shadow-md">
                    <div className={`w-10 h-10 bg-white/30 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0`}>
                      {React.createElement(getWeatherIcon(weather.description), { className: "w-5 h-5 text-white" })}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="text-2xl font-bold text-white leading-none">
                        {Math.round(weather.temp)}°F
                      </div>
                      <div className="text-xs text-purple-100 capitalize leading-tight mt-1">
                        {weather.description}
                      </div>
                    </div>
                  </div>
                )}

                {/* Refresh Button - More Prominent */}
                <button
                  className="group relative p-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl transition-all duration-200 disabled:opacity-50 border border-white/30 shadow-md hover:scale-110"
                  disabled={refreshing}
                  onClick={fetchWeatherAndOOTD}
                >
                  <RefreshCw className={`w-5 h-5 text-white ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="absolute -bottom-10 right-0 bg-gray-900 text-white text-xs px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
                    Get new outfit
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          {ootdSuggestion ? (
            <div className="p-6 space-y-6 animate-fade-in-up" key={ootdSuggestion.outfit.top + ootdSuggestion.outfit.bottom}>
              {/* Outfit Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {ootdSuggestion.outfit_details.top && (
                  <div className="group relative bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl p-6 border-2 border-blue-300 dark:border-blue-600 hover:shadow-2xl hover:scale-[1.03] transition-all duration-300" key={ootdSuggestion.outfit.top}>
                    <div className="absolute top-4 left-4">
                      <span className="px-4 py-2 text-xs font-black text-blue-800 dark:text-blue-100 bg-white dark:bg-blue-900/60 rounded-full shadow-md border-2 border-blue-300 dark:border-blue-600">
                        👕 TOP
                      </span>
                    </div>
                    <div className="text-center pt-10">
                      <div className="w-36 h-36 mx-auto mb-5 rounded-2xl overflow-hidden bg-white dark:bg-gray-700 border-3 border-blue-300 dark:border-blue-600 shadow-lg group-hover:shadow-2xl transition-all duration-300">
                        <img
                          alt={ootdSuggestion.outfit_details.top.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          src={ootdSuggestion.outfit_details.top.image_url}
                        />
                      </div>
                      <p className="text-base font-bold text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight">
                        {ootdSuggestion.outfit_details.top.name}
                      </p>
                    </div>
                  </div>
                )}
                
                {ootdSuggestion.outfit_details.bottom && (
                  <div className="group relative bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-2xl p-6 border-2 border-green-300 dark:border-green-600 hover:shadow-2xl hover:scale-[1.03] transition-all duration-300" key={ootdSuggestion.outfit.bottom}>
                    <div className="absolute top-4 left-4">
                      <span className="px-4 py-2 text-xs font-black text-green-800 dark:text-green-100 bg-white dark:bg-green-900/60 rounded-full shadow-md border-2 border-green-300 dark:border-green-600">
                        👖 BOTTOM
                      </span>
                    </div>
                    <div className="text-center pt-10">
                      <div className="w-36 h-36 mx-auto mb-5 rounded-2xl overflow-hidden bg-white dark:bg-gray-700 border-3 border-green-300 dark:border-green-600 shadow-lg group-hover:shadow-2xl transition-all duration-300">
                        <img
                          alt={ootdSuggestion.outfit_details.bottom.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          src={ootdSuggestion.outfit_details.bottom.image_url}
                        />
                      </div>
                      <p className="text-base font-bold text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight">
                        {ootdSuggestion.outfit_details.bottom.name}
                      </p>
                    </div>
                  </div>
                )}
                
                {ootdSuggestion.outfit_details.outerwear ? (
                  <div className="group relative bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-2xl p-6 border-2 border-orange-300 dark:border-orange-600 hover:shadow-2xl hover:scale-[1.03] transition-all duration-300" key={ootdSuggestion.outfit.outerwear}>
                    <div className="absolute top-4 left-4">
                      <span className="px-4 py-2 text-xs font-black text-orange-800 dark:text-orange-100 bg-white dark:bg-orange-900/60 rounded-full shadow-md border-2 border-orange-300 dark:border-orange-600">
                        🧥 OUTERWEAR
                      </span>
                    </div>
                    <div className="text-center pt-10">
                      <div className="w-36 h-36 mx-auto mb-5 rounded-2xl overflow-hidden bg-white dark:bg-gray-700 border-3 border-orange-300 dark:border-orange-600 shadow-lg group-hover:shadow-2xl transition-all duration-300">
                        <img
                          alt={ootdSuggestion.outfit_details.outerwear.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          src={ootdSuggestion.outfit_details.outerwear.image_url}
                        />
                      </div>
                      <p className="text-base font-bold text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight">
                        {ootdSuggestion.outfit_details.outerwear.name}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="group relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-2xl p-6 border-2 border-gray-300 dark:border-gray-600 transition-all duration-300" key="no-outerwear">
                    <div className="absolute top-4 left-4">
                      <span className="px-4 py-2 text-xs font-black text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900/60 rounded-full shadow-md border-2 border-gray-300 dark:border-gray-600">
                        🧥 OUTERWEAR
                      </span>
                    </div>
                    <div className="text-center pt-10">
                      <div className="w-36 h-36 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl mx-auto mb-5 flex items-center justify-center shadow-lg border-3 border-yellow-300 dark:border-yellow-700">
                        <Sun className="w-16 h-16 text-yellow-500 dark:text-yellow-400" />
                      </div>
                      <p className="text-base font-bold text-gray-800 dark:text-gray-200">
                        Not needed today
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Perfect weather to go jacket-free!
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Reasoning */}
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 p-6 rounded-2xl border-2 border-purple-300 dark:border-purple-600 shadow-md">
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-3">Why This Outfit?</h4>
                    <p className="text-base text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                      {formatReasoning(ootdSuggestion.reasoning)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Motivational Message */}
              <div className="text-center pt-3">
                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 px-8 py-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  <Sparkles className="w-6 h-6 text-white animate-pulse" />
                  <p className="text-base font-bold text-white">
                    {motivationalMessages[currentMessage]}
                  </p>
                  <Sparkles className="w-6 h-6 text-white animate-pulse" />
                </div>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <RefreshCw className="w-10 h-10 text-white animate-spin" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">Loading your perfect outfit...</p>
            </div>
          )}
        </div>
      </div>

      {/* Occasion Selection Section */}
      <div className="space-y-6">
        {/* Section Header */}
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Create Your Perfect Look
          </h2>
          <p className="text-base text-gray-600 dark:text-gray-400">
            Select occasions and get AI-powered outfit recommendations
          </p>
        </div>

        {/* Occasion Cards */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-purple-200 dark:border-purple-700 shadow-lg overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-pink-600 via-purple-500 to-pink-600 p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-md border border-white/30">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Select Occasions</h3>
                <p className="text-pink-100 text-sm">Choose one or more occasions</p>
              </div>
            </div>
          </div>

          {/* Occasions Grid */}
          <div className="p-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {occasions.map((occasion) => {
                const Icon = occasion.icon;
                const isSelected = selectedOccasions.includes(occasion.id);
                return (
                  <button
                    className={`group relative overflow-hidden rounded-2xl border-3 transition-all duration-300 ${
                      isSelected
                        ? `border-purple-500 dark:border-purple-400 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 shadow-xl scale-105`
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg hover:scale-[1.02]'
                    }`}
                    key={occasion.id}
                    onClick={() => toggleOccasion(occasion.id)}
                  >
                    <div className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`p-4 rounded-2xl transition-all duration-300 shadow-lg ${
                          isSelected
                            ? 'bg-gradient-to-br from-purple-600 to-pink-500 text-white scale-110'
                            : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700 text-gray-700 dark:text-gray-200 group-hover:scale-105'
                        }`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className={`text-lg font-black ${
                          isSelected
                            ? 'text-purple-900 dark:text-purple-50'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {occasion.label}
                        </span>
                      </div>
                      <p className={`text-sm leading-relaxed text-left font-medium ${
                        isSelected
                          ? 'text-purple-800 dark:text-purple-200'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {occasion.description}
                      </p>
                      {isSelected && (
                        <div className="absolute top-4 right-4">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center shadow-lg animate-bounce-once">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Get Suggestions Button */}
            <div className="mt-8 flex justify-center">
              <button
                className={`relative group overflow-hidden px-10 py-5 rounded-2xl font-black text-lg text-white shadow-xl transition-all duration-300 ${
                  selectedOccasions.length === 0 || loading
                    ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-60'
                    : 'bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 hover:from-purple-700 hover:via-pink-600 hover:to-purple-700 hover:shadow-2xl hover:scale-110'
                }`}
                disabled={selectedOccasions.length === 0 || loading}
                onClick={handleGetSuggestions}
              >
                {!loading && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                )}
                <div className="relative flex items-center gap-4">
                  {loading ? (
                    <>
                      <RefreshCw className="w-7 h-7 animate-spin" />
                      <span>Generating Your Outfits...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-7 h-7 group-hover:rotate-12 transition-transform duration-300" />
                      <span>✨ Get Outfit Ideas</span>
                      <Sparkles className="w-7 h-7 group-hover:-rotate-12 transition-transform duration-300" />
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

        {/* Suggestions Results */}
        {suggestions.length > 0 && (
          <div className="space-y-8 animate-fade-in-up">
            {/* Results Header */}
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-gray-100 mb-4 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                Your Personalized Outfit Suggestions
              </h2>
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-500 px-6 py-3 rounded-full shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
                <span className="text-base font-black text-white">
                  {suggestions.length} outfit{suggestions.length !== 1 ? 's' : ''} generated
                </span>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Suggestions Cards Grid */}
            <div className={`grid gap-8 ${
              suggestions.length === 1
                ? 'max-w-4xl mx-auto'
                : suggestions.length === 2
                ? 'grid-cols-1 lg:grid-cols-2 max-w-6xl mx-auto'
                : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
            }`}>
              {suggestions.map((suggestion, index) => (
                <div
                  className="group relative animate-fade-in-up"
                  key={suggestion.id}
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  {/* Main Card */}
                  <div className="bg-white dark:bg-gray-800 rounded-3xl border-3 border-purple-300 dark:border-purple-600 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.03] h-full flex flex-col">
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 p-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-2xl font-black text-white">{suggestion.occasion}</h4>
                        <span className="px-4 py-2 bg-white/30 backdrop-blur-sm text-white text-sm font-black rounded-full capitalize border-2 border-white/40 shadow-lg">
                          {suggestion.style || 'Stylish'}
                        </span>
                      </div>
                    </div>
                      
                    {/* Card Content */}
                    <div className="p-6 space-y-6 flex-1 flex flex-col">
                      {/* Outfit Items */}
                      <div className="flex-1">
                        <h5 className="font-black text-gray-900 dark:text-gray-100 mb-5 text-lg flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          Recommended Items:
                        </h5>
                        <div className="space-y-4">
                          {suggestion.items.map((item) => (
                            <div className="group/item flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border-2 border-purple-200 dark:border-purple-700 hover:shadow-lg hover:scale-[1.02] transition-all duration-300" key={item.id}>
                              <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-white dark:bg-gray-700 border-2 border-purple-300 dark:border-purple-600 shadow-md group-hover/item:shadow-lg">
                                <img
                                  alt={item.item_name}
                                  className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-300"
                                  src={item.image_url}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-base font-black text-gray-900 dark:text-gray-100 line-clamp-1 mb-2">
                                  {item.item_name}
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 font-medium">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Reasoning */}
                      <div>
                        <h5 className="font-black text-gray-900 dark:text-gray-100 mb-4 text-lg flex items-center gap-2">
                          <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          Why This Works:
                        </h5>
                        <div className="bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 p-5 rounded-2xl border-2 border-blue-300 dark:border-blue-600 shadow-sm">
                          <p className="text-base text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                            {suggestion.reasoning}
                          </p>
                        </div>
                      </div>

                      {/* Style Tips */}
                      {suggestion.style_tips && suggestion.style_tips.length > 0 && (
                        <div>
                          <h5 className="font-black text-gray-900 dark:text-gray-100 mb-4 text-lg flex items-center gap-2">
                            <Lightning className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            Pro Style Tips:
                          </h5>
                          <ul className="space-y-3">
                            {suggestion.style_tips.map((tip, index) => (
                              <li className="flex items-start gap-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-2xl border-2 border-purple-200 dark:border-purple-700 hover:shadow-md transition-all duration-200" key={index}>
                                <span className="text-xl flex-shrink-0">💡</span>
                                <span className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-medium">{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Weather Badge - Always at bottom */}
                      <div className="pt-4 border-t-2 border-purple-300 dark:border-purple-600 mt-auto">
                        <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 px-4 py-2 rounded-full">
                          <Thermometer className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span className="text-sm font-black text-purple-800 dark:text-purple-200">Weather-Optimized</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutfitSuggestions;