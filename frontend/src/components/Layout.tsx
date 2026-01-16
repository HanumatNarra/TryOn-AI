import {
  Home,
  Star,
  Camera,
  User,
  Moon,
  Sun,
  LogOut,
  ShoppingBag,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  MessageCircle
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

import FashionChatBot from './FashionChatBot';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [userFirstName, setUserFirstName] = useState<string>('');
  const [showGlobalChat, setShowGlobalChat] = useState(false);
  const [showChatPulse, setShowChatPulse] = useState(false);

  // Fetch user's first name
  const fetchUserData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('first_name')
        .eq('id', user.id)
        .single();

      if (error) {
        return;
      }

      if (data && data.first_name) {
        setUserFirstName(data.first_name);
      }
    } catch (error) {
      // Error fetching user data - continue without name
    }
  };

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user?.id]);

  // Listen for close chat modal event from FashionChatBot
  useEffect(() => {
    const handleCloseChatModal = () => {
      setShowGlobalChat(false);
    };

    window.addEventListener('closeChatModal', handleCloseChatModal);
    return () => window.removeEventListener('closeChatModal', handleCloseChatModal);
  }, []);

  // Periodic animation for chatbot button to grab attention
  useEffect(() => {
    const interval = setInterval(() => {
      setShowChatPulse(true);
      setTimeout(() => setShowChatPulse(false), 4000); // Animation lasts 4 seconds
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      // Error during sign out - user will be navigated anyway
    }
  };

  const navigationItems = [
    {
      path: '/wardrobe',
      icon: Home,
      label: 'Wardrobe',
      description: 'Manage your clothing collection'
    },
    {
      path: '/suggestions',
      icon: Star,
      label: 'Suggestions',
      description: 'Get AI-powered outfit ideas'
    },
    {
      path: '/try-on',
      icon: Camera,
      label: 'Try-On',
      description: 'Virtual fitting room'
    },
    {
      path: '/profile',
      icon: User,
      label: 'Profile',
      description: 'Your account settings'
    }
  ];

  const isActive = (path: string) => {
    // Handle exact matches and sub-paths
    const active = (path === '/wardrobe' && location.pathname.startsWith('/wardrobe')) ||
                   (path === '/suggestions' && location.pathname.startsWith('/suggestions')) ||
                   (path === '/try-on' && location.pathname.startsWith('/try-on')) ||
                   (path === '/profile' && location.pathname.startsWith('/profile')) ||
                   location.pathname === path;
    
    return active;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-500">
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full z-50 transition-all duration-500 ease-in-out ${
        isSidebarCollapsed ? 'w-24' : 'w-80'
      }`}>
        <div className="h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-r border-white/20 dark:border-gray-700/50 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className={`${isSidebarCollapsed ? 'p-4' : 'p-6'} border-b border-white/20 dark:border-gray-700/50`}>
            <div className="flex items-center">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-sm animate-float">
                    <ShoppingBag className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center animate-pulse-slow">
                    <Sparkles className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
                {!isSidebarCollapsed && (
                  <div className="animate-fade-in-right">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                      TryOn.AI
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      AI-Powered Virtual Styling
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className={`${isSidebarCollapsed ? 'px-2 py-4' : 'px-4 py-6'} space-y-3`}>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Link
                  className={`group relative block transition-all duration-300 ${
                    active 
                      ? 'transform scale-[1.02]' 
                      : 'hover:transform hover:scale-[1.01]'
                  }`}
                  key={item.path}
                  to={item.path}
                >
                  {/* Active Background */}
                  {active && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-100 via-pink-50 to-purple-50 dark:from-purple-900/30 dark:via-pink-900/20 dark:to-purple-900/30 rounded-xl border border-purple-200/50 dark:border-purple-600/30 shadow-sm" />
                  )}
                  
                  {/* Content Container */}
                  <div className={`relative flex items-center gap-4 rounded-xl ${
                    isSidebarCollapsed ? 'p-3 justify-center' : 'p-4'
                  }`}>
                    {/* Icon Container */}
                    <div 
                      className={`flex-shrink-0 p-3 rounded-xl transition-all duration-300 ${
                        active 
                          ? 'bg-white/80 dark:bg-white/20 text-purple-600 dark:text-purple-400 shadow-md' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 group-hover:bg-purple-100 group-hover:text-purple-600 dark:group-hover:bg-purple-900/30'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    {/* Text Content */}
                    {!isSidebarCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div 
                          className={`font-semibold text-base transition-colors duration-300 ${
                            active 
                              ? 'text-gray-800 dark:text-gray-200' 
                              : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-200'
                          }`}
                        >
                          {item.label}
                        </div>
                        <div 
                          className={`text-sm mt-1 transition-colors duration-300 ${
                            active 
                              ? 'text-gray-600 dark:text-gray-400' 
                              : 'text-gray-500 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400'
                          }`}
                        >
                          {item.description}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Active Indicator Bar */}
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-r-full shadow-sm" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className={`absolute bottom-0 left-0 right-0 border-t border-white/20 dark:border-gray-700/50 ${
            isSidebarCollapsed ? 'p-3' : 'p-6'
          }`}>
            {/* User Info - Enhanced with gradient background */}
            {!isSidebarCollapsed ? (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200/50 dark:border-purple-600/30 rounded-2xl p-4 mb-3 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center shadow-md text-white font-bold text-lg">
                    {userFirstName ? userFirstName[0].toUpperCase() : user?.email?.[0].toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate">
                      {userFirstName || user?.email?.split('@')[0] || 'User'}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {user?.email}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center shadow-md text-white font-bold text-sm">
                  {userFirstName ? userFirstName[0].toUpperCase() : user?.email?.[0].toUpperCase() || 'U'}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className={`flex gap-3 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
              <button
                className={`p-3 rounded-xl transition-all duration-300 ${
                  isSidebarCollapsed ? 'w-12 h-12' : 'flex-1'
                } ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-sm hover:scale-105' 
                    : 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 hover:from-gray-300 hover:to-gray-400'
                }`}
                onClick={toggleTheme}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? <Sun className="w-5 h-5 mx-auto" /> : <Moon className="w-5 h-5 mx-auto" />}
              </button>

              <button
                className={`p-3 bg-gradient-to-r from-red-400 to-pink-500 text-white rounded-xl shadow-sm hover:scale-105 transition-all duration-300 ${
                  isSidebarCollapsed ? 'w-12 h-12' : 'flex-1'
                }`}
                onClick={handleSignOut}
                title="Sign Out"
              >
                <LogOut className="w-5 h-5 mx-auto" />
              </button>
            </div>

            {/* Footer */}
            {!isSidebarCollapsed && (
              <div className="mt-4 text-center animate-fade-in-up">
                <p className="text-xs text-gray-500 dark:text-gray-500 font-medium">
                  Powered by AI • Made with ❤️
                </p>
              </div>
            )}
          </div>

          {/* Collapse Toggle - positioned at the edge */}
          <button
            className="absolute -right-5 top-1/2 -translate-y-1/2 w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full shadow-xl border-3 border-white dark:border-gray-900 flex items-center justify-center hover:scale-110 hover:shadow-2xl transition-all duration-300 group z-10"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-5 h-5 text-white font-bold group-hover:translate-x-0.5 transition-transform duration-200" strokeWidth={3} />
            ) : (
              <ChevronLeft className="w-5 h-5 text-white font-bold group-hover:-translate-x-0.5 transition-transform duration-200" strokeWidth={3} />
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-500 ease-in-out ${
        isSidebarCollapsed ? 'ml-24' : 'ml-80'
      }`}>
        <div className="min-h-screen p-6">
          {children}
        </div>
      </div>

      {/* Global Chat Button */}
      <button
        className={`group fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full shadow-large hover:shadow-glow transition-all duration-300 hover:scale-110 flex items-center justify-center ${
          showChatPulse ? 'animate-bounce ring-4 ring-purple-400/60 dark:ring-purple-500/60' : ''
        }`}
        onClick={() => setShowGlobalChat(true)}
        title="Chat with AI Fashion Assistant"
      >
        <ShoppingBag className={`w-6 h-6 text-white ${showChatPulse ? 'animate-pulse' : ''}`} />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse-soft opacity-75"></div>

        {/* Notification Badge - appears during pulse */}
        {showChatPulse && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center shadow-lg animate-pulse border-2 border-white dark:border-gray-900">
            <MessageCircle className="w-3.5 h-3.5 text-white" />
          </div>
        )}
      </button>

      {/* Global Chat Modal */}
      {showGlobalChat && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowGlobalChat(false);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowGlobalChat(false);
            }
          }}
          tabIndex={0}
        >
          <div className="relative w-full max-w-2xl h-[600px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
            <FashionChatBot onClose={() => setShowGlobalChat(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;