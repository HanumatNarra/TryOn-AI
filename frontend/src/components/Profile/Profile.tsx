import {
  User,
  Settings,
  Bell,
  Sparkles,
  Moon,
  Globe,
  Shield,
  Smartphone,
  Calendar,
  CheckCircle,
  Mail,
  Crown,
  Palette,
  Zap,
  Camera,
  Edit2,
  TrendingUp,
  ShoppingBag,
  Heart,
  Eye,
  X,
  Sun,
  Check,
  AlertCircle,
  Info,
  Award,
  Target,
  Gift,
  Star,
  Clock,
  HelpCircle,
  MessageCircle,
  Plus,
  Upload,
  ChevronRight
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState('');
  const [stats, setStats] = useState({ tryOns: 0, wardrobeItems: 0, favorites: 0 });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchUserStats();
      fetchRecentActivity();
    }

    // Check current theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
    }

    // Load saved notification preferences
    const savedEmailNotif = localStorage.getItem('emailNotifications');
    const savedAISugg = localStorage.getItem('aiSuggestions');
    if (savedEmailNotif !== null) setEmailNotifications(savedEmailNotif === 'true');
    if (savedAISugg !== null) setAiSuggestions(savedAISugg === 'true');
  }, [user]);

  const fetchUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setUserData(data);
    } catch (error) {
      // Error fetching user data - will display empty state
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      // Fetch try-on count
      const { count: tryOnCount } = await supabase
        .from('tryon_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Fetch wardrobe items count
      const { count: wardrobeCount } = await supabase
        .from('wardrobe')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get favorites from localStorage
      const savedFavorites = localStorage.getItem('tryOnFavorites');
      const favoritesCount = savedFavorites ? JSON.parse(savedFavorites).length : 0;

      setStats({
        tryOns: tryOnCount || 0,
        wardrobeItems: wardrobeCount || 0,
        favorites: favoritesCount
      });
    } catch (error) {
      // Error fetching stats - will use default values
    }
  };

  const fetchRecentActivity = async () => {
    if (!user) return;

    try {
      // Fetch recent try-ons
      const { data: tryOns, error: tryOnError } = await supabase
        .from('tryon_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (tryOnError) throw tryOnError;

      const activities = (tryOns || []).map(item => ({
        id: item.id,
        type: 'tryon',
        description: `Tried on ${item.clothing_item_name || 'an outfit'}`,
        time: item.created_at,
        icon: Camera
      }));

      setRecentActivity(activities);
    } catch (error) {
      // Error fetching recent activity - will show empty state
    }
  };

  const calculateProfileCompletion = () => {
    let completion = 0;
    const totalFields = 7;

    // Email is always present (required for signup)
    completion += 1;

    // Check for other fields
    if (userData?.first_name) completion += 1;
    if (stats.tryOns > 0) completion += 1;
    if (stats.wardrobeItems > 0) completion += 1;
    if (emailNotifications !== null) completion += 1;
    if (aiSuggestions !== null) completion += 1;
    if (stats.favorites > 0) completion += 1;

    return Math.round((completion / totalFields) * 100);
  };

  const getAchievements = () => {
    const achievements = [];

    if (stats.tryOns >= 1) {
      achievements.push({
        id: 'first-tryon',
        name: 'First Steps',
        description: 'Created your first virtual try-on',
        icon: Camera,
        color: 'from-purple-500 to-pink-500',
        unlocked: true
      });
    }

    if (stats.tryOns >= 10) {
      achievements.push({
        id: 'fashion-explorer',
        name: 'Fashion Explorer',
        description: 'Created 10 virtual try-ons',
        icon: Star,
        color: 'from-yellow-500 to-orange-500',
        unlocked: true
      });
    }

    if (stats.wardrobeItems >= 5) {
      achievements.push({
        id: 'wardrobe-builder',
        name: 'Wardrobe Builder',
        description: 'Added 5 items to wardrobe',
        icon: ShoppingBag,
        color: 'from-blue-500 to-cyan-500',
        unlocked: true
      });
    }

    if (stats.favorites >= 3) {
      achievements.push({
        id: 'style-curator',
        name: 'Style Curator',
        description: 'Saved 3 favorite looks',
        icon: Heart,
        color: 'from-pink-500 to-rose-500',
        unlocked: true
      });
    }

    return achievements;
  };

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

  const getMemberSince = () => {
    if (user?.created_at) {
      return new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return 'Recently';
  };

  const handleNotificationToggle = (type: 'email' | 'ai', value: boolean) => {
    if (type === 'email') {
      setEmailNotifications(value);
      localStorage.setItem('emailNotifications', value.toString());
    } else {
      setAiSuggestions(value);
      localStorage.setItem('aiSuggestions', value.toString());
    }
  };

  const showComingSoon = (feature: string) => {
    setComingSoonFeature(feature);
    setShowComingSoonModal(true);
  };

  if (loading) {
    return (
      <div className="animate-fade-in-up">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div className="card animate-pulse" key={i}>
              <div className="space-y-4">
                <div className="loading-shimmer h-6 rounded w-1/3"></div>
                <div className="loading-shimmer h-4 rounded w-full"></div>
                <div className="loading-shimmer h-4 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-10">
      {/* Enhanced Header with Profile Picture */}
      <div className="text-center mb-10">
        <div className="relative inline-block mb-6">
          <div className="w-32 h-32 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center text-white text-5xl font-black shadow-2xl border-4 border-white dark:border-gray-900">
            {userData?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <button
            className="absolute bottom-0 right-0 p-3 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border-3 border-white dark:border-gray-900"
            onClick={() => showComingSoon('Profile Photo Upload')}
            title="Edit profile picture"
          >
            <Camera className="w-5 h-5 text-white" />
          </button>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-3 tracking-tight">
          {userData?.first_name || 'Your'} Profile
        </h1>
        <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 font-medium">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Completion */}
      {!loading && calculateProfileCompletion() < 100 && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-3xl shadow-xl border-3 border-purple-200 dark:border-purple-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-gray-100">Profile Completion</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {calculateProfileCompletion()}% Complete
                </p>
              </div>
            </div>
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {calculateProfileCompletion()}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${calculateProfileCompletion()}%` }}
            />
          </div>

          {calculateProfileCompletion() < 100 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 font-medium">
              {!userData?.first_name && "Add your name, "}
              {stats.wardrobeItems === 0 && "add wardrobe items, "}
              {stats.tryOns === 0 && "create your first try-on, "}
              {stats.favorites === 0 && "save a favorite look "}
              to complete your profile!
            </p>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <button
          className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border-2 border-purple-200 dark:border-purple-700 p-4 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group"
          onClick={() => navigate('/wardrobe')}
        >
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Add Item</p>
        </button>

        <button
          className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl border-2 border-blue-200 dark:border-blue-700 p-4 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group"
          onClick={() => navigate('/try-on')}
        >
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Try On</p>
        </button>

        <button
          className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-2xl border-2 border-pink-200 dark:border-pink-700 p-4 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group"
          onClick={() => navigate('/suggestions')}
        >
          <div className="w-12 h-12 bg-gradient-to-br from-pink-600 to-rose-500 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Get Ideas</p>
        </button>

        <button
          className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border-2 border-green-200 dark:border-green-700 p-4 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group"
          onClick={() => navigate('/wardrobe')}
        >
          <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
            <Eye className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">View All</p>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-3xl border-3 border-purple-200 dark:border-purple-700 p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Camera className="w-7 h-7 text-white" />
            </div>
            <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-4xl font-black text-gray-900 dark:text-gray-100 mb-2">
            {stats.tryOns}
          </div>
          <div className="text-sm font-bold text-gray-600 dark:text-gray-400">
            Virtual Try-Ons Created
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-3xl border-3 border-blue-200 dark:border-blue-700 p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
              <ShoppingBag className="w-7 h-7 text-white" />
            </div>
            <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-4xl font-black text-gray-900 dark:text-gray-100 mb-2">
            {stats.wardrobeItems}
          </div>
          <div className="text-sm font-bold text-gray-600 dark:text-gray-400">
            Wardrobe Items
          </div>
        </div>

        <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-3xl border-3 border-pink-200 dark:border-pink-700 p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-14 h-14 bg-gradient-to-br from-pink-600 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <TrendingUp className="w-6 h-6 text-pink-600 dark:text-pink-400" />
          </div>
          <div className="text-4xl font-black text-gray-900 dark:text-gray-100 mb-2">
            {stats.favorites}
          </div>
          <div className="text-sm font-bold text-gray-600 dark:text-gray-400">
            Favorite Try-Ons
          </div>
        </div>
      </div>

      {/* Recent Activity & Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Recent Activity */}
        <div className="lg:col-span-1 bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-800 dark:to-blue-900/20 rounded-3xl shadow-xl border-3 border-blue-200 dark:border-blue-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-gray-100">Recent Activity</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Your latest actions</p>
            </div>
          </div>

          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity, index) => {
                const Icon = activity.icon;
                const timeAgo = new Date(activity.time).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                });

                return (
                  <div
                    className="flex items-start gap-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-blue-700 hover:shadow-md transition-all duration-200"
                    key={activity.id}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200 line-clamp-1">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        {timeAgo}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                No recent activity yet
              </p>
              <button
                className="mt-3 text-sm text-purple-600 dark:text-purple-400 font-bold hover:underline"
                onClick={() => navigate('/try-on')}
              >
                Create your first try-on
              </button>
            </div>
          )}
        </div>

        {/* Account Info & Settings */}
        <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Information */}
        <div className="bg-gradient-to-br from-white to-purple-50/50 dark:from-gray-800 dark:to-purple-900/20 rounded-3xl shadow-xl border-3 border-purple-200 dark:border-purple-700 p-8 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <User className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100">Account Information</h2>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Your profile details</p>
              </div>
            </div>
            <button
              className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-xl transition-colors"
              onClick={() => showComingSoon('Edit Profile')}
              title="Edit profile"
            >
              <Edit2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Email */}
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
              <Mail className="w-5 h-5 text-blue-500" />
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">{user?.email}</div>
              </div>
            </div>

            {/* Member Since */}
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
              <Calendar className="w-5 h-5 text-green-500" />
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Member Since</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">{getMemberSince()}</div>
              </div>
            </div>

            {/* Account Status */}
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Account Status</div>
                <div className="flex items-center gap-2">
                  <span className="status-badge status-active">Active</span>
                  <span className="text-xs text-slate-500 dark:text-slate-500">Premium Member</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-gradient-to-br from-white to-pink-50/50 dark:from-gray-800 dark:to-pink-900/20 rounded-3xl shadow-xl border-3 border-pink-200 dark:border-pink-700 p-8 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Settings className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100">Preferences</h2>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Manage your app settings</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Email Notifications */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border-2 border-purple-100 dark:border-purple-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-gray-800 dark:text-gray-200">Email Notifications</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Outfit suggestions and style tips</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  checked={emailNotifications}
                  className="sr-only peer"
                  onChange={(e) => handleNotificationToggle('email', e.target.checked)}
                  type="checkbox"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-pink-500"></div>
              </label>
            </div>

            {/* AI Suggestions */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border-2 border-blue-100 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-gray-800 dark:text-gray-200">AI Suggestions</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Personalized outfit recommendations</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  checked={aiSuggestions}
                  className="sr-only peer"
                  onChange={(e) => handleNotificationToggle('ai', e.target.checked)}
                  type="checkbox"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-cyan-500"></div>
              </label>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Achievements */}
      {!loading && getAchievements().length > 0 && (
        <div className="mb-10">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-black bg-gradient-to-r from-yellow-600 via-orange-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Your Achievements
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">Milestones you've unlocked</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {getAchievements().map((achievement) => {
              const Icon = achievement.icon;
              return (
                <div
                  className="bg-gradient-to-br from-white to-yellow-50/50 dark:from-gray-800 dark:to-yellow-900/20 rounded-3xl shadow-xl border-3 border-yellow-200 dark:border-yellow-700 p-6 text-center hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group"
                  key={achievement.id}
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${achievement.color} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform animate-bounce-once`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-black text-gray-900 dark:text-gray-100 mb-2 text-lg">
                    {achievement.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {achievement.description}
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full border-2 border-green-200 dark:border-green-700">
                    <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-black text-green-700 dark:text-green-300">Unlocked</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Additional Preferences */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-black bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-3">
            Additional Preferences
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">Customize your experience</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Theme */}
          <div className="bg-gradient-to-br from-white to-yellow-50/50 dark:from-gray-800 dark:to-yellow-900/20 rounded-3xl shadow-xl border-3 border-yellow-200 dark:border-yellow-700 p-6 text-center group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-200">
              {isDarkMode ? <Moon className="w-8 h-8 text-white" /> : <Sun className="w-8 h-8 text-white" />}
            </div>
            <h3 className="font-black text-gray-900 dark:text-gray-100 mb-2 text-lg">Theme</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-medium">
              {isDarkMode ? 'Dark Mode Active' : 'Light Mode Active'}
            </p>
            <button
              className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
              onClick={toggleTheme}
            >
              <Palette className="w-4 h-4 mr-2" />
              Switch to {isDarkMode ? 'Light' : 'Dark'}
            </button>
          </div>

          {/* Language */}
          <div className="bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-800 dark:to-blue-900/20 rounded-3xl shadow-xl border-3 border-blue-200 dark:border-blue-700 p-6 text-center group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-200">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-black text-gray-900 dark:text-gray-100 mb-2 text-lg">Language</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-medium">English (US)</p>
            <button
              className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
              onClick={() => showComingSoon('Multi-Language Support')}
            >
              <Globe className="w-4 h-4 mr-2" />
              Change Language
            </button>
          </div>

          {/* Privacy */}
          <div className="bg-gradient-to-br from-white to-green-50/50 dark:from-gray-800 dark:to-green-900/20 rounded-3xl shadow-xl border-3 border-green-200 dark:border-green-700 p-6 text-center group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-200">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-black text-gray-900 dark:text-gray-100 mb-2 text-lg">Privacy</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-medium">Manage data & privacy</p>
            <button
              className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
              onClick={() => showComingSoon('Privacy Settings')}
            >
              <Shield className="w-4 h-4 mr-2" />
              Privacy Settings
            </button>
          </div>

          {/* Mobile App */}
          <div className="bg-gradient-to-br from-white to-purple-50/50 dark:from-gray-800 dark:to-purple-900/20 rounded-3xl shadow-xl border-3 border-purple-200 dark:border-purple-700 p-6 text-center group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-200">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-black text-gray-900 dark:text-gray-100 mb-2 text-lg">Mobile App</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-medium">Download mobile version</p>
            <button
              className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
              onClick={() => showComingSoon('Mobile App Download')}
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Download App
            </button>
          </div>
        </div>
      </div>

      {/* Premium Features */}
      <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 dark:from-yellow-900/20 dark:via-orange-900/20 dark:to-pink-900/20 rounded-3xl shadow-2xl border-3 border-yellow-200 dark:border-yellow-700 p-10 text-center hover:shadow-3xl transition-all duration-300">
        <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-float border-4 border-white dark:border-gray-900">
          <Crown className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-4xl font-black bg-gradient-to-r from-yellow-600 via-orange-600 to-pink-600 bg-clip-text text-transparent mb-4">
          Unlock Premium Features
        </h2>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto font-medium leading-relaxed">
          Get access to advanced AI styling, unlimited outfit suggestions, priority support, and exclusive fashion insights to elevate your style game.
        </p>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-3xl mx-auto">
          <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-4 border-2 border-purple-200 dark:border-purple-700">
            <Zap className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Unlimited Try-Ons</p>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-4 border-2 border-pink-200 dark:border-pink-700">
            <Sparkles className="w-8 h-8 text-pink-600 dark:text-pink-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">AI Style Insights</p>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-4 border-2 border-orange-200 dark:border-orange-700">
            <Crown className="w-8 h-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Priority Support</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-black rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 text-lg"
            onClick={() => showComingSoon('Premium Subscription')}
          >
            <Zap className="w-5 h-5 mr-2" />
            Upgrade to Premium
          </button>
          <button
            className="inline-flex items-center justify-center px-8 py-4 bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 font-black rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-3 border-purple-200 dark:border-purple-700 text-lg"
            onClick={() => showComingSoon('Premium Features Info')}
          >
            <Info className="w-5 h-5 mr-2" />
            Learn More
          </button>
        </div>
      </div>

      {/* Help & Support */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Help Center */}
        <div className="bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-800 dark:to-blue-900/20 rounded-3xl shadow-xl border-3 border-blue-200 dark:border-blue-700 p-8 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
              <HelpCircle className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100">Help Center</h2>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Get assistance anytime</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl hover:shadow-md transition-all duration-200 border-2 border-blue-100 dark:border-blue-800 group"
              onClick={() => showComingSoon('FAQ Section')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Info className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-gray-800 dark:text-gray-200">FAQs</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl hover:shadow-md transition-all duration-200 border-2 border-purple-100 dark:border-purple-800 group"
              onClick={() => showComingSoon('Video Tutorials')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-gray-800 dark:text-gray-200">Tutorials</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl hover:shadow-md transition-all duration-200 border-2 border-green-100 dark:border-green-800 group"
              onClick={() => showComingSoon('User Guide')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <Info className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-gray-800 dark:text-gray-200">User Guide</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-gradient-to-br from-white to-purple-50/50 dark:from-gray-800 dark:to-purple-900/20 rounded-3xl shadow-xl border-3 border-purple-200 dark:border-purple-700 p-8 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              <MessageCircle className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100">Contact Support</h2>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">We're here to help</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border-2 border-purple-100 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="font-bold text-gray-800 dark:text-gray-200">Email</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">support@tryon.ai</p>
            </div>

            <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border-2 border-blue-100 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-bold text-gray-800 dark:text-gray-200">Response Time</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Within 24 hours</p>
            </div>

            <button
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-black rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
              onClick={() => showComingSoon('Live Chat Support')}
            >
              <MessageCircle className="w-5 h-5" />
              Start Live Chat
            </button>
          </div>
        </div>
      </div>

      {/* Coming Soon Modal */}
      {showComingSoonModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowComingSoonModal(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowComingSoonModal(false);
            }
          }}
          tabIndex={0}
        >
          <div
            className="bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900/30 rounded-3xl shadow-2xl border-3 border-purple-200 dark:border-purple-700 p-8 max-w-md w-full animate-fade-in-scale"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Sparkles className="w-10 h-10 text-white" />
            </div>

            {/* Title */}
            <h3 className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-3 text-center">
              Coming Soon!
            </h3>

            {/* Feature Name */}
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 rounded-2xl p-4 mb-4 border-2 border-purple-200 dark:border-purple-700">
              <p className="text-lg font-black text-purple-700 dark:text-purple-300 text-center">
                {comingSoonFeature}
              </p>
            </div>

            {/* Message */}
            <p className="text-gray-700 dark:text-gray-300 mb-6 text-center leading-relaxed font-medium">
              This feature is currently under development and will be available soon. Stay tuned for updates as we continue to enhance your TryOn.AI experience!
            </p>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6 border-2 border-blue-200 dark:border-blue-700">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                  Want to be notified when this feature launches? Enable email notifications in your preferences!
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-black rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
              onClick={() => setShowComingSoonModal(false)}
            >
              <Check className="w-5 h-5" />
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;