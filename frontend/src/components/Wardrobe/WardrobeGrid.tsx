import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Grid3X3, List, Eye, Edit, Trash2, Filter, Sparkles, Calendar, Tag, X } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { getCachedModels, clearModelsCache } from '../../utils/prefetchUtils';
import { BlurUpImage } from '../ui/BlurUpImage';

import { GallerySkeleton } from './GallerySkeleton';

interface WardrobeItem {
  id: string;
  item_name: string;
  description: string;
  image_url: string;
  category?: string;
  date_added: string;
}

const WardrobeGrid: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filteredItems, setFilteredItems] = useState<WardrobeItem[]>([]);
  const [userFirstName, setUserFirstName] = useState<string>('');
  const [previewItem, setPreviewItem] = useState<WardrobeItem | null>(null);
  const [editItem, setEditItem] = useState<WardrobeItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');

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

  const categories = ['All Categories', 'Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories'];

  useEffect(() => {
    if (user) {
      fetchWardrobeItems();
      fetchUserData();
    }
  }, [user?.id]); // Only depend on user.id, not the entire user object

  // Minimum skeleton display time to prevent flashing
  useEffect(() => {
    if (!loading && showSkeleton) {
      const timer = setTimeout(() => {
        setShowSkeleton(false);
      }, 300); // Minimum 300ms display time
      
      return () => clearTimeout(timer);
    }
  }, [loading, showSkeleton]);

  useEffect(() => {
    filterItems();
  }, [items, searchTerm, selectedCategory]);

  // Don't prevent body scroll - let modal container handle scrolling
  // Removed body scroll lock to fix modal visibility issues

  // No scroll syncing needed - modal uses fixed positioning in viewport

  const fetchWardrobeItems = async () => {
    if (!user) {
      return;
    }
    
    // Check for cached data first
    const cachedData = getCachedModels();
    if (cachedData) {
      setItems(cachedData);
      setFilteredItems(cachedData);
      setLoading(false);
      // Keep skeleton visible for minimum time even with cached data
      setTimeout(() => setShowSkeleton(false), 200);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wardrobe')
        .select('id, item_name, description, category, image_url, date_added')
        .eq('user_id', user.id)
        .order('date_added', { ascending: false });

      if (error) {
        throw error;
      }
      
      
      setItems(data || []);
      
      // Initialize filtered items immediately
      if (data && data.length > 0) {
        setFilteredItems(data);
      } else {
        setFilteredItems([]);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = items;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'All Categories') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    setFilteredItems(filtered);
  };

  const handleDelete = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('wardrobe')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      
      // Remove from local state
      setItems(items.filter(item => item.id !== itemId));
    } catch (error) {
      // Error deleting item - UI will show error state
    }
  };

  const handlePreview = (item: WardrobeItem) => {
    setPreviewItem(item);
  };

  const handleEdit = (item: WardrobeItem) => {
    setEditItem(item);
    setEditName(item.item_name || '');
    setEditDescription(item.description || '');
    setEditCategory(item.category || '');
  };

  const handleTryOn = (item: WardrobeItem) => {
    // Navigate to try-on screen with item data
    navigate('/try-on', { 
      state: { 
        selectedItem: {
          id: item.id,
          name: item.item_name,
          description: item.description,
          image_url: item.image_url,
          category: item.category
        }
      }
    });
  };

  const handleSaveEdit = async () => {
    if (!editItem || !editName.trim()) return;

    try {
      const { error } = await supabase
        .from('wardrobe')
        .update({
          item_name: editName.trim(),
          description: editDescription.trim(),
          category: editCategory || undefined
        })
        .eq('id', editItem.id);

      if (error) throw error;

      // Update local state
      setItems(items.map(item =>
        item.id === editItem.id
          ? { ...item, item_name: editName.trim(), description: editDescription.trim(), category: editCategory || undefined }
          : item
      ));

      // Close modal and reset form
      setEditItem(null);
      setEditName('');
      setEditDescription('');
      setEditCategory('');
    } catch (error) {
      alert('Failed to save changes. Please try again.');
    }
  };

  // Handle Escape key to close modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previewItem) {
          setPreviewItem(null);
        } else if (editItem) {
          setEditItem(null);
          setEditName('');
          setEditDescription('');
          setEditCategory('');
        }
      }
    };

    if (previewItem || editItem) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [previewItem, editItem]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Tops': 'from-purple-600 to-pink-500',
      'Bottoms': 'from-pink-500 to-purple-600',
      'Outerwear': 'from-purple-500 to-purple-700',
      'Shoes': 'from-pink-600 to-purple-500',
      'Accessories': 'from-purple-600 to-pink-600',
      'Dresses': 'from-pink-600 to-purple-600'
    };
    return colors[category as keyof typeof colors] || 'from-purple-500 to-pink-500';
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Tops': '👕',
      'Bottoms': '👖',
      'Outerwear': '🧥',
      'Shoes': '👞',
      'Accessories': '✨',
      'Dresses': '👗'
    };
    return icons[category] || '📦';
  };

  const truncateDescription = (description: string) => {
    if (!description) return '';
    
    // Target approximately 120 characters for a natural break
    const maxLength = 120;
    
    if (description.length <= maxLength) {
      return description;
    }
    
    // Find the last space before the max length
    const truncated = description.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    if (lastSpaceIndex === -1) {
      // No space found, just truncate at max length
      return description.substring(0, maxLength);
    }
    
    // Truncate at the last complete word
    const result = description.substring(0, lastSpaceIndex);
    
    // Don't add ellipsis if it ends with punctuation that makes sense
    const lastChar = result.charAt(result.length - 1);
    if (['.', '!', '?', ':', ';', ','].includes(lastChar)) {
      return result;
    }
    
    // Add ellipsis only if it doesn't end naturally
    return result + '...';
  };

  if (loading || showSkeleton) {
    return <GallerySkeleton itemCount={8} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 animate-fade-in-up">
      {/* WARDROBE HEADER - Compact design */}
      <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 border-b border-purple-100 px-6 md:px-8 py-5 md:py-6 mb-10 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          {/* Left Section - Title & Subtitle */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Wardrobe
              </h1>
              <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 font-bold rounded-full text-xs border border-purple-200">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <p className="text-sm md:text-base text-gray-600">
              <span className="font-semibold text-gray-900">{userFirstName ? `${userFirstName}'s collection` : 'Your collection'}</span> • Manage your fashion items
            </p>
          </div>

          {/* Right Section - Add Button */}
          <button
            onClick={() => navigate('/add-item')}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-full shadow-md hover:shadow-lg hover:from-purple-700 hover:to-pink-600 hover:scale-[1.02] active:scale-95 transition-all duration-200 ease-out whitespace-nowrap flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Item</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      <div className="px-6 md:px-8">

        {/* Search and Filter Bar - Redesigned */}
        <div className="relative">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-purple-900/20 rounded-xl blur-sm"></div>
          
          {/* Main Container */}
          <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-purple-200/50 dark:border-purple-700/30 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Search - Enhanced */}
              <div className="flex-1 relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                <div className="relative flex items-center">
                  <div className="absolute left-4 z-10">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-500 rounded-lg flex items-center justify-center shadow-sm">
                      <Search className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <input
                    className="w-full pl-14 pr-4 py-3 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm border border-purple-200/50 dark:border-purple-600/30 rounded-xl text-gray-700 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 dark:focus:ring-purple-400/50 dark:focus:border-purple-500 transition-all duration-300 hover:bg-white/90 dark:hover:bg-gray-700/90"
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search your wardrobe..."
                    type="text"
                    value={searchTerm}
                  />
                </div>
              </div>

              {/* Category Filter - Enhanced */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                <div className="relative">
                  <select
                    className="appearance-none pl-4 pr-12 py-3 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm border border-purple-200/50 dark:border-purple-600/30 rounded-xl text-gray-700 dark:text-gray-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 dark:focus:ring-purple-400/50 dark:focus:border-purple-500 transition-all duration-300 hover:bg-white/90 dark:hover:bg-gray-700/90 min-w-[160px]"
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    value={selectedCategory}
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-pink-500 rounded-md flex items-center justify-center shadow-sm">
                      <Filter className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* View Mode Toggle - Enhanced */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                <div className="relative bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm border border-purple-200/50 dark:border-purple-600/30 rounded-xl p-1 shadow-sm">
                  <button
                    className={`p-2 rounded-lg transition-all duration-300 ${
                      viewMode === 'grid'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-sm scale-105'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-600/50'
                    }`}
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="w-5 h-5" />
                  </button>
                  <button
                    className={`p-2 rounded-lg transition-all duration-300 ${
                      viewMode === 'list'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-sm scale-105'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-600/50'
                    }`}
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Search Results Indicator */}
            {searchTerm && (
              <div className="mt-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Found {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {searchTerm && (
                  <button
                    className="flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                    onClick={() => setSearchTerm('')}
                  >
                    <X className="w-4 h-4" />
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

      {/* Items Grid/List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 animate-fade-in-up">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-12 h-12 text-gray-500 dark:text-gray-400" />
          </div>
          <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {searchTerm || selectedCategory !== 'All Categories' ? 'No items found' : 'Your wardrobe is empty'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchTerm || selectedCategory !== 'All Categories'
              ? 'Try adjusting your search or filters'
              : 'Start building your collection by adding your first item!'
            }
          </p>
          <div className="text-sm text-gray-400 mb-4">
            Debug: items={items.length}, filtered={filteredItems.length}, user={user?.id}
          </div>
                     {!searchTerm && selectedCategory === 'All Categories' && (
             <button
               className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-95 hover:from-purple-700 hover:to-pink-600"
               onClick={() => navigate('/add-item')}
             >
               <Plus className="w-5 h-5 mr-2" />
               Add Your First Item
             </button>
           )}
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 py-8' : 'space-y-4 py-8'}>
          {filteredItems.map((item, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`bg-white rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer ${
                viewMode === 'list' ? 'flex items-center gap-4' : 'h-full flex flex-col'
              } shadow-lg hover:shadow-2xl border border-gray-100 hover:border-purple-300 hover:scale-[1.02] group`}
              key={item.id}
            >
              {/* IMAGE CONTAINER - Enhanced */}
              <div className={`relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 ${
                viewMode === 'list' ? 'w-32 h-32 flex-shrink-0' : 'w-full h-64 md:h-72'
              }`}>
                {/* Image - with dramatic zoom on hover */}
                <img
                  alt={item.item_name}
                  className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-75"
                  src={item.image_url}
                />

                {/* Category Badge - Enhanced with icon */}
                {item.category && (
                  <div className="absolute top-3 left-3 transition-all duration-300 group-hover:scale-110">
                    <span className={`inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-white rounded-full bg-gradient-to-r ${getCategoryColor(item.category)} shadow-lg`}>
                      <span className="text-base">{getCategoryIcon(item.category)}</span>
                      {item.category}
                    </span>
                  </div>
                )}

                {/* Hover Actions - Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4">
                  <button
                    className="p-3 bg-white/95 rounded-full hover:bg-white hover:scale-110 transition-all duration-200 shadow-xl"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(item);
                    }}
                    title="Preview Item"
                  >
                    <Eye className="w-5 h-5 text-purple-600" />
                  </button>
                  <button
                    className="p-3 bg-white/95 rounded-full hover:bg-white hover:scale-110 transition-all duration-200 shadow-xl"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(item);
                    }}
                    title="Edit Item"
                  >
                    <Edit className="w-5 h-5 text-purple-600" />
                  </button>
                  <button
                    className="p-3 bg-white/95 rounded-full hover:bg-white hover:scale-110 transition-all duration-200 shadow-xl"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    title="Delete Item"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </div>

              {/* CONTENT SECTION - Enhanced */}
              <div className={`flex-1 flex flex-col ${viewMode === 'list' ? 'min-w-0 p-4' : 'p-5 md:p-6'}`}>
                {/* Title - changes color on hover */}
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors duration-300 min-h-[2.5rem]">
                  {item.item_name}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed flex-1">
                  {truncateDescription(item.description)}
                </p>

                {/* Footer - Date and Button */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                    <Calendar className="w-4 h-4" />
                    {formatDate(item.date_added)}
                  </div>

                  {/* Try On Button - Enhanced */}
                  <button
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-sm font-bold rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.05] active:scale-95 hover:from-purple-700 hover:to-pink-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTryOn(item);
                    }}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden sm:inline">Try On</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}





      {/* Preview Modal */}
      {previewItem && (
        <>
          {/* BACKDROP - Fixed overlay covering entire viewport */}
          <div
            className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-200"
            onClick={() => setPreviewItem(null)}
            role="presentation"
            aria-hidden="true"
          />

          {/* MODAL CONTAINER - Scrollable overlay */}
          <div
            className="fixed top-0 left-0 right-0 bottom-0 z-50 overflow-y-auto py-8 px-4 md:px-8"
            onClick={() => setPreviewItem(null)}
            style={{ backgroundColor: 'rgba(0, 0, 0, 0)' }}
          >
            {/* MODAL CONTENT - Centered horizontally, scrollable */}
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-auto max-h-[90vh] animate-scale-in flex flex-col"
              onClick={(e) => e.stopPropagation()}
              style={{ marginTop: '2rem', marginBottom: '2rem' }}
            >
              {/* HEADER - Title and close button */}
              <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 md:px-8 py-4 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200 truncate pr-4">
                  {previewItem.item_name}
                </h2>
                <button
                  onClick={() => setPreviewItem(null)}
                  className="flex-shrink-0 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* MODAL BODY - Scrollable content */}
              <div className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto">
                {/* Category Badge */}
                <div className="text-center">
                  {previewItem.category && (
                    <span className={`inline-flex items-center gap-1 px-4 py-2 text-sm font-bold text-white rounded-full bg-gradient-to-r ${getCategoryColor(previewItem.category)} shadow-lg`}>
                      <span className="text-base">{getCategoryIcon(previewItem.category)}</span>
                      {previewItem.category}
                    </span>
                  )}
                </div>

                {/* Image and Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Image Section */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-600 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-600">
                      <img
                        src={previewItem.image_url}
                        alt={previewItem.item_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="space-y-6">
                    {/* Description */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-3">
                        Description
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                        {previewItem.description}
                      </p>
                    </div>

                    {/* Details Box */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-5 border border-purple-100 dark:border-purple-800 space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400">
                        Details
                      </h3>
                      <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        <p className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            <span className="font-semibold">Added:</span>{' '}
                            {formatDate(previewItem.date_added)}
                          </span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Tag className="w-4 h-4" />
                          <span>
                            <span className="font-semibold">Category:</span>{' '}
                            {previewItem.category}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS - Footer */}
              <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-6 md:px-8 py-4 flex gap-3 rounded-b-2xl">
                <button
                  onClick={() => {
                    setPreviewItem(null);
                    handleEdit(previewItem);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-purple-600 text-purple-600 font-bold rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/20 active:scale-95 transition-all duration-200"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>

                <button
                  onClick={() => {
                    setPreviewItem(null);
                    handleTryOn(previewItem);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-full shadow-md hover:shadow-lg hover:from-purple-700 hover:to-pink-600 hover:scale-[1.01] active:scale-95 transition-all duration-200"
                >
                  <Sparkles className="w-4 h-4" />
                  Try On
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {editItem && (
        <>
          {/* BACKDROP - Fixed overlay covering entire viewport */}
          <div
            className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-200"
            onClick={() => {
              setEditItem(null);
              setEditName('');
              setEditDescription('');
              setEditCategory('');
            }}
            role="presentation"
            aria-hidden="true"
          />

          {/* MODAL CONTAINER - Scrollable overlay */}
          <div
            className="fixed top-0 left-0 right-0 bottom-0 z-50 overflow-y-auto py-8 px-4 md:px-8"
            onClick={() => {
              setEditItem(null);
              setEditName('');
              setEditDescription('');
              setEditCategory('');
            }}
            style={{ backgroundColor: 'rgba(0, 0, 0, 0)' }}
          >
            {/* MODAL CONTENT - Centered horizontally, scrollable */}
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-auto max-h-[90vh] animate-scale-in flex flex-col"
              onClick={(e) => e.stopPropagation()}
              key={editItem.id}
              style={{ marginTop: '2rem', marginBottom: '2rem' }}
            >
              {/* HEADER - Title and close button */}
              <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 md:px-8 py-4 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200">
                  Edit Item
                </h2>
                <button
                  className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-110 active:scale-95"
                  onClick={() => {
                    setEditItem(null);
                    setEditName('');
                    setEditDescription('');
                    setEditCategory('');
                  }}
                  aria-label="Close modal"
                >
                  <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* SCROLLABLE BODY - Form content */}
              <div className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Item Image */}
                  <div className="relative overflow-hidden rounded-xl shadow-md">
                    <img
                      alt={editItem.item_name}
                      className="w-full h-64 object-cover"
                      src={editItem.image_url}
                    />
                  </div>

                  {/* Edit Form */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="editName">
                        Item Name *
                      </label>
                      <input
                        className="input-modern w-full"
                        id="editName"
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Enter item name"
                        required
                        style={{ color: 'black' }}
                        type="text"
                        value={editName}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="editCategory">
                        Category
                      </label>
                      <select
                        className="input-modern w-full"
                        id="editCategory"
                        onChange={(e) => setEditCategory(e.target.value)}
                        style={{ color: 'black' }}
                        value={editCategory}
                      >
                        <option value="">Select Category</option>
                        <option value="Tops">Tops</option>
                        <option value="Bottoms">Bottoms</option>
                        <option value="Outerwear">Outerwear</option>
                        <option value="Shoes">Shoes</option>
                        <option value="Accessories">Accessories</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="editDescription">
                        Description
                      </label>
                      <textarea
                        className="input-modern w-full h-24 resize-none"
                        id="editDescription"
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Describe your item..."
                        style={{ color: 'black' }}
                        value={editDescription}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER - Action buttons */}
              <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-6 md:px-8 py-4 flex gap-3 justify-end rounded-b-2xl">
                <button
                  className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-full shadow-sm hover:shadow-md hover:bg-gray-300 transition-all duration-200 hover:scale-[1.02] active:scale-95"
                  onClick={() => {
                    setEditItem(null);
                    setEditName('');
                    setEditDescription('');
                    setEditCategory('');
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-95 hover:from-purple-700 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  disabled={!editName.trim()}
                  onClick={handleSaveEdit}
                >
                  Save Changes
                </button>
                <button
                  className="px-6 py-3 bg-red-600 text-white font-semibold rounded-full shadow-md hover:shadow-lg hover:bg-red-700 transition-all duration-200 hover:scale-[1.02] active:scale-95 inline-flex items-center"
                  onClick={() => {
                    setEditItem(null);
                    handleDelete(editItem.id);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      </div>
    </div>
  );
};

export default WardrobeGrid;