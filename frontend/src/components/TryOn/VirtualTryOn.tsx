import { Upload, Camera, Sparkles, Download, X, Loader2, Search, Filter, Image as ImageIcon, Zap, TrendingUp, Star, Share2, Heart, Info, CheckCircle2, Wand2, Eye, Maximize, StickyNote, Clock, Layers } from 'lucide-react'
import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../../contexts/AuthContext'
import { config } from '../../lib/config'
import { supabase } from '../../lib/supabase'

interface WardrobeItem {
  id: string
  item_name: string
  description: string
  image_url: string
}

export const VirtualTryOn: React.FC = () => {
  const [userPhoto, setUserPhoto] = useState<string>('') // stores the URL to display (local or remote)
  const [userPhotoFile, setUserPhotoFile] = useState<File | null>(null)
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null)
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([])
  const [tryOnResult, setTryOnResult] = useState<string>('')
  // localGallery: { id, result_image_url, clothing_item_name }
  const [localGallery, setLocalGallery] = useState<any[]>([]) // for immediate try-on gallery update
  const [loading, setLoading] = useState(false)
  const [loadingWardrobe, setLoadingWardrobe] = useState(true)
  const [error, setError] = useState('')
  const [tryOnHistory, setTryOnHistory] = useState<any[]>([])
  const [currentClothingName, setCurrentClothingName] = useState<string>('') // clothing name for currently displayed try-on result
  const [currentResultUrl, setCurrentResultUrl] = useState<string>(''); // currently displayed try-on image URL
  const [currentResultClothing, setCurrentResultClothing] = useState<string>(''); // currently displayed clothing name/desc
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showTips, setShowTips] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [compareMode, setCompareMode] = useState(false)
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([])
  const [showComparison, setShowComparison] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null)
  const [batchMode, setBatchMode] = useState(false)
  const [selectedForBatch, setSelectedForBatch] = useState<string[]>([])
  const [processingStage, setProcessingStage] = useState<string>('')
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // If coming from another page with a selected wardrobe item, set it as selected on mount.
  useEffect(() => {
    // Support both selectedItem (object) and selectedItemId (string) from location.state
    const selectedFromWardrobe = location.state?.selectedItem as WardrobeItem;
    const selectedItemId = location.state?.selectedItemId as string | undefined;
    if (selectedFromWardrobe) {
      setSelectedItem(selectedFromWardrobe);
    }
    // If a selectedItemId is present, use it to select the corresponding wardrobe item (even if not latest)
    else if (selectedItemId && wardrobeItems.length > 0) {
      const found = wardrobeItems.find(item => item.id === selectedItemId);
      if (found) {
        setSelectedItem(found);
      }
    }
    // If neither, default logic will apply in fetchWardrobeItems.
  // Only run this effect if wardrobeItems or location.state changes
  // (so wardrobeItems are loaded before attempting to select by id)
  }, [location.state, wardrobeItems]);

  // Fetch user's latest photo_url from users table (always after login or user.id change)
  useEffect(() => {
    if (!user?.id) return;

    const fetchUserPhoto = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('photo_url')
        .eq('id', user.id)
        .single();
      if (!error && data?.photo_url) {
        setUserPhoto(data.photo_url);
        setUserPhotoFile(null); // clear file if loading from DB
      } else {
        setUserPhoto('');
        setUserPhotoFile(null);
      }
    };
    fetchUserPhoto();
  }, [user?.id])

  useEffect(() => {
    fetchWardrobeItems()
    fetchTryOnHistory()
  }, [user])

  const fetchWardrobeItems = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('wardrobe')
        .select('*')
        .eq('user_id', user.id)
        .order('date_added', { ascending: false });

      if (error) throw error;

      if (data.length === 0) {
        const sampleItems = [
          {
            id: '1',
            item_name: 'Navy Blue Blazer',
            description: 'Classic navy blue blazer perfect for business meetings and formal occasions',
            image_url: 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=400'
          },
          {
            id: '2',
            item_name: 'White Cotton Shirt',
            description: 'Crisp white cotton shirt, versatile for both casual and formal wear',
            image_url: 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=400'
          },
          {
            id: '3',
            item_name: 'Dark Denim Jeans',
            description: 'Comfortable dark wash denim jeans, perfect for casual outings',
            image_url: 'https://images.pexels.com/photos/1598508/pexels-photo-1598508.jpeg?auto=compress&cs=tinysrgb&w=400'
          }
        ];
        setWardrobeItems(sampleItems);
        // Don't setSelectedItem here if selectedItemId is pending in location.state; let the useEffect above handle it.
        if (!selectedItem && !(location.state?.selectedItemId)) setSelectedItem(sampleItems[0]);
      } else {
        setWardrobeItems(data);
        // Don't setSelectedItem here if selectedItemId is pending in location.state; let the useEffect above handle it.
        if (!selectedItem && !(location.state?.selectedItemId) && data.length > 0) setSelectedItem(data[0]);
      }
    } catch (err) {
      setError('Failed to fetch wardrobe items');
    } finally {
      setLoadingWardrobe(false);
    }
  };

  const fetchTryOnHistory = async () => {
    if (!user) return [];
    const { data, error } = await supabase
      .from('tryon_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) {
      // Map each gallery item to include clothing_item_name (fallback if possible)
      const galleryData = data.map((item: any) => ({
        ...item,
        clothing_item_name: item.clothing_item_name || item.item_name || '', // fallback to item_name if present
      }));
      setTryOnHistory(galleryData);
      setLocalGallery(galleryData.slice(0, 10)); // update local gallery as fallback
      return galleryData;
    }
    return [];
  }

  // Enhanced: Upload user photo to Supabase storage, update users table, and always prefill
  const handleUserPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return

    // Preview instantly
    const reader = new FileReader()
    reader.onload = (e) => {
      setUserPhoto(e.target?.result as string)
    }
    reader.readAsDataURL(file)
    setUserPhotoFile(file)
    setTryOnResult('') // Clear previous result

    // Upload to Supabase Storage (avatars bucket)
    const fileExt = file.name.split('.').pop()
    const filePath = `${user.id}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })
    if (uploadError) {
      setError('Failed to upload image to storage.')
      return
    }
    // Get public URL
    const { data: publicData } = supabase
      .storage
      .from('avatars')
      .getPublicUrl(filePath)
    const publicUrl = publicData?.publicUrl

    if (publicUrl) {
      // Save to users table
      const { error: updateErr } = await supabase
        .from('users')
        .update({ photo_url: publicUrl })
        .eq('id', user.id)
      if (!updateErr) {
        setUserPhoto(publicUrl);
        setUserPhotoFile(file);
      }
    }
  }

  // Helper function to perform a single try-on
  const performSingleTryOn = async (item: WardrobeItem) => {
    try {
      let avatarFile = userPhotoFile;

      // If we don't have a file but have a remote URL, fetch and convert to File
      if (!avatarFile && userPhoto) {
        const resp = await fetch(userPhoto);
        const blob = await resp.blob();
        avatarFile = new File([blob], 'avatar.jpg', { type: blob.type });
      }

      if (!avatarFile) {
        throw new Error('Please upload your photo');
      }

      // Fetch clothing image as blob, then create a File
      const imageResp = await fetch(item.image_url)
      const imageBlob = await imageResp.blob()
      const clothingFile = new File([imageBlob], 'clothing.jpg', { type: imageBlob.type })

      const formData = new FormData()
      formData.append('user_id', user.id)
      formData.append('avatar_image', avatarFile)
      formData.append('clothing_image', clothingFile)
      formData.append('as_image', 'false')
      formData.append('clothing_item_name', item.item_name || '')

      const response = await fetch(`${config.backendUrl}${config.apiEndpoints.tryOn}`, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        // Get blob result and show immediately
        const blob = await response.blob();
        const localUrl = URL.createObjectURL(blob);
        setTryOnResult(localUrl);
        setCurrentClothingName(item?.item_name || '');
        setCurrentResultUrl(localUrl);
        setCurrentResultClothing(item?.item_name || '');

        // Add to gallery immediately (at top), as a temporary item (until DB updates)
        setLocalGallery(prev => {
          const filtered = prev.filter(existingItem => existingItem.result_image_url !== localUrl);
          return [
            {
              id: 'local-preview-' + Date.now(),
              result_image_url: localUrl,
              clothing_item_name: item?.item_name || '',
            },
            ...filtered,
          ].slice(0, 10);
        });

        // Fetch latest history from DB and update gallery
        const updatedHistory = await fetchTryOnHistory();
        if (updatedHistory && updatedHistory.length > 0) {
          const latestDBRecord = updatedHistory[0];
          if (latestDBRecord.result_image_url && latestDBRecord.result_image_url !== tryOnResult) {
            setTryOnResult(latestDBRecord.result_image_url);
            setCurrentClothingName(latestDBRecord.clothing_item_name || latestDBRecord.item_name || '');
            setCurrentResultUrl(latestDBRecord.result_image_url);
            setCurrentResultClothing(
              latestDBRecord.clothing_item_name ||
              latestDBRecord.item_name ||
              ''
            );
          }
          setLocalGallery(prev => {
            const filtered = prev.filter(existingItem => existingItem.result_image_url !== updatedHistory[0].result_image_url);
            return [updatedHistory[0], ...filtered].slice(0, 10);
          });
        }

        return true;
      } else {
        const data = await response.json();
        throw new Error(data?.error || 'Try-on failed. Please try again.');
      }
    } catch (err) {
      throw err;
    }
  }

  // ---- Main Change: Support both file and URL for try-on ----
  const handleTryOn = async () => {
    if (!selectedItem) {
      setError('Please upload your photo and select a clothing item');
      return;
    }

    setLoading(true)
    setError('')
    setTryOnResult('')
    setCurrentClothingName(selectedItem?.item_name || '')

    try {
      await performSingleTryOn(selectedItem);
    } catch (err: any) {
      setError(err.message || 'Failed to generate try-on image. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!tryOnResult) return;

    const isBlob = tryOnResult.startsWith('blob:');
    const fileName = `tryon-${currentResultClothing || 'result'}.jpg`;

    if (isBlob) {
      const link = document.createElement('a');
      link.href = tryOnResult;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      fetch(tryOnResult)
        .then(response => response.blob())
        .then(blob => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        });
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const fakeEvent = {
          target: { files: [file] }
        } as any;
        handleUserPhotoUpload(fakeEvent);
      }
    }
  };

  // Filter wardrobe items based on search and category
  const filteredWardrobeItems = wardrobeItems.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories from wardrobe items
  const categories = ['all', ...Array.from(new Set(wardrobeItems.map(item => item.category || 'other')))];

  // Share functionality
  const handleShare = async () => {
    if (!tryOnResult) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My Virtual Try-On',
          text: `Check out how I look in ${currentResultClothing}!`,
          url: window.location.href
        });
      } else {
        // Fallback: copy link to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      // Error during sharing - user will see fallback message
    }
  };

  // Comparison functionality
  const toggleCompareMode = () => {
    setCompareMode(!compareMode);
    if (compareMode) {
      setSelectedForCompare([]);
    }
  };

  const toggleSelectForCompare = (itemId: string) => {
    setSelectedForCompare(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        // Limit to 3 items for comparison
        if (prev.length >= 3) {
          return prev;
        }
        return [...prev, itemId];
      }
    });
  };

  const handleCompare = () => {
    if (selectedForCompare.length >= 2) {
      setShowComparison(true);
    }
  };

  const getComparedItems = () => {
    return localGallery.filter(item => selectedForCompare.includes(item.id));
  };

  // Favorites functionality
  const toggleFavorite = (itemId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      const wasRemoved = newFavorites.has(itemId);

      if (wasRemoved) {
        newFavorites.delete(itemId);
        // If we just removed the last favorite while in favorites view, turn off the filter
        if (newFavorites.size === 0 && showOnlyFavorites) {
          setShowOnlyFavorites(false);
        }
      } else {
        newFavorites.add(itemId);
      }

      // Save to localStorage
      localStorage.setItem('tryOnFavorites', JSON.stringify(Array.from(newFavorites)));
      return newFavorites;
    });
  };

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('tryOnFavorites');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  }, []);

  // Batch try-on functionality
  const toggleBatchMode = () => {
    setBatchMode(!batchMode);
    if (batchMode) {
      setSelectedForBatch([]);
    }
  };

  const toggleSelectForBatch = (itemId: string) => {
    setSelectedForBatch(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        // Limit to 4 items for batch
        if (prev.length >= 4) {
          return prev;
        }
        return [...prev, itemId];
      }
    });
  };

  const handleBatchTryOn = async () => {
    if (!userPhoto || selectedForBatch.length === 0) return;

    setLoading(true);
    setError('');
    setTryOnResult('');

    const batchItems = wardrobeItems.filter(item => selectedForBatch.includes(item.id));

    try {
      for (let i = 0; i < batchItems.length; i++) {
        const item = batchItems[i];
        setProcessingStage(`Processing ${i + 1} of ${batchItems.length}: ${item.item_name}`);
        setSelectedItem(item);

        // Actually perform the try-on for this item
        try {
          await performSingleTryOn(item);
          // Small delay between items to prevent overwhelming the server
          if (i < batchItems.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (itemErr) {
          // Error processing this item - continue with next item
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete batch try-on. Please try again.');
    } finally {
      setProcessingStage('');
      setBatchMode(false);
      setSelectedForBatch([]);
      setLoading(false);
    }
  };

  // Get favorite items
  const favoriteItems = localGallery.filter(item => favorites.has(item.id));

  if (loadingWardrobe) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 dark:from-gray-900 dark:via-purple-900/10 dark:to-pink-900/10 py-8 px-4">
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Refined Header - Matching other screens */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-4 tracking-tight">
            Virtual Try-On
          </h1>
          <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 font-medium max-w-3xl mx-auto leading-relaxed">
            Experience the future of fashion with AI-powered virtual styling
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 rounded-full border-2 border-purple-200 dark:border-purple-700 shadow-md">
              <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-bold text-purple-700 dark:text-purple-300">Instant Results</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 rounded-full border-2 border-purple-200 dark:border-purple-700 shadow-md">
              <Star className="w-4 h-4 text-pink-600 dark:text-pink-400" />
              <span className="text-sm font-bold text-pink-700 dark:text-pink-300">Photorealistic Quality</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 rounded-full border-2 border-purple-200 dark:border-purple-700 shadow-md">
              <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-bold text-purple-700 dark:text-purple-300">
                {tryOnHistory.length} Try-Ons Created
              </span>
            </div>
          </div>
        </div>

        {wardrobeItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              <Camera className="h-12 w-12 text-gray-400 dark:text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No wardrobe items found</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Add some clothing items to your wardrobe to try them on!</p>
            <button
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-medium rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 hover:from-purple-600 hover:to-blue-700"
              onClick={() => navigate('/wardrobe')}
            >
              Go to Wardrobe
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Upload & Selection */}
            <div className="space-y-8">
              {/* User Photo Upload - Enhanced */}
              <div className="bg-gradient-to-br from-white to-purple-50/50 dark:from-gray-800 dark:to-purple-900/20 rounded-3xl shadow-xl border-3 border-purple-200 dark:border-purple-700 p-8 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                    Upload Your Photo
                  </h2>
                  <button
                    className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-xl transition-colors"
                    onClick={() => setShowTips(!showTips)}
                    title="Tips for better results"
                  >
                    <Info className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </button>
                </div>

                {/* Tips Section */}
                {showTips && (
                  <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-2xl border-2 border-blue-200 dark:border-blue-700 space-y-3">
                    <h3 className="text-base font-black text-blue-900 dark:text-blue-100 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      Tips for Best Results
                    </h3>
                    <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200 font-medium">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                        <span>Use a full-length photo with good lighting</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                        <span>Stand straight with arms slightly away from body</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                        <span>Wear form-fitting clothes for better accuracy</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                        <span>Plain background works best</span>
                      </li>
                    </ul>
                  </div>
                )}

                <div
                  className={`border-3 border-dashed rounded-2xl p-8 text-center transition-all duration-300 relative overflow-hidden ${
                    isDragging
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 scale-[1.02]'
                      : userPhoto
                      ? 'border-purple-300 dark:border-purple-600 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50/30 dark:hover:bg-purple-900/10'
                  }`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  {userPhoto ? (
                    <div className="relative flex flex-col items-center">
                      <div className="relative group">
                        <img
                          alt="User"
                          className="max-h-80 mx-auto rounded-2xl shadow-xl border-3 border-purple-200 dark:border-purple-700 group-hover:shadow-2xl transition-all duration-300"
                          src={userPhoto}
                        />
                        <button
                          aria-label="Remove photo"
                          className="absolute -top-3 -right-3 p-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full hover:from-red-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border-3 border-white dark:border-gray-900"
                          onClick={() => {
                            setUserPhoto('');
                            setUserPhotoFile(null);
                            setTryOnResult('');
                          }}
                          type="button"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      <button
                        className="mt-6 inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 text-white font-black text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:from-purple-700 hover:via-pink-600 hover:to-purple-700 border-2 border-white dark:border-gray-900"
                        onClick={() => fileInputRef.current?.click()}
                        type="button"
                      >
                        <Camera className="w-6 h-6" />
                        Change Photo
                      </button>
                      <input
                        accept="image/*"
                        className="hidden"
                        onChange={handleUserPhotoUpload}
                        ref={fileInputRef}
                        type="file"
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 rounded-3xl flex items-center justify-center border-3 border-purple-200 dark:border-purple-700 shadow-lg">
                        <Upload className="h-12 w-12 text-purple-600 dark:text-purple-400" />
                      </div>
                      <p className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">
                        {isDragging ? 'Drop your photo here!' : 'Drag & drop your photo'}
                      </p>
                      <p className="text-base text-gray-600 dark:text-gray-400 mb-2">
                        or click to browse
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        JPG, PNG or WEBP (max 10MB)
                      </p>
                      <input
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleUserPhotoUpload}
                        ref={fileInputRef}
                        type="file"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Clothing Item Selection - Enhanced */}
              <div className="bg-gradient-to-br from-white to-pink-50/50 dark:from-gray-800 dark:to-pink-900/20 rounded-3xl shadow-xl border-3 border-pink-200 dark:border-pink-700 p-8 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-600 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <ImageIcon className="w-6 h-6 text-white" />
                    </div>
                    Select Clothing
                  </h2>
                  <div className="flex items-center gap-2">
                    {/* Batch Mode Toggle */}
                    <button
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-sm transition-all duration-300 border-2 ${
                        batchMode
                          ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white border-purple-600 shadow-lg'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 shadow-sm hover:shadow-md'
                      }`}
                      onClick={toggleBatchMode}
                      title="Try on multiple items at once"
                    >
                      <Layers className="w-4 h-4" />
                      {batchMode ? 'Cancel' : 'Batch'}
                    </button>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/40 dark:to-purple-900/40 rounded-full border-2 border-pink-200 dark:border-pink-700">
                      <span className="text-sm font-black text-pink-700 dark:text-pink-300">
                        {filteredWardrobeItems.length} items
                      </span>
                    </div>
                  </div>
                </div>

                {/* Batch Mode Info */}
                {batchMode && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border-2 border-purple-200 dark:border-purple-700">
                    <p className="text-sm font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Select up to 4 items to try on in sequence
                      {selectedForBatch.length > 0 && (
                        <span className="ml-2 px-3 py-1 bg-purple-600 text-white rounded-full text-xs">
                          {selectedForBatch.length} selected
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {/* Search and Filter Bar */}
                <div className="mb-6 space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 font-medium shadow-sm"
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search your wardrobe..."
                      type="text"
                      value={searchQuery}
                    />
                  </div>

                  {/* Category Filter */}
                  {categories.length > 1 && (
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <button
                          className={`px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300 border-2 ${
                            selectedCategory === category
                              ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white border-purple-600 shadow-lg scale-105'
                              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 hover:scale-105 shadow-sm'
                          }`}
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                        >
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Items Grid */}
                <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                  {filteredWardrobeItems.length > 0 ? (
                    filteredWardrobeItems.map((item) => {
                      const isSelectedForBatch = selectedForBatch.includes(item.id);
                      const canSelectForBatch = selectedForBatch.length < 4 || isSelectedForBatch;

                      return (
                        <button
                          className={`group relative p-4 rounded-2xl border-3 transition-all duration-300 ${
                            batchMode && isSelectedForBatch
                              ? 'border-purple-500 dark:border-purple-400 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 shadow-xl scale-105 ring-4 ring-purple-300 dark:ring-purple-600'
                              : selectedItem?.id === item.id && !batchMode
                              ? 'border-purple-500 dark:border-purple-400 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 shadow-xl scale-105'
                              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700/50 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg hover:scale-[1.02]'
                          }`}
                          key={item.id}
                          onClick={() => {
                            if (batchMode) {
                              if (canSelectForBatch) {
                                toggleSelectForBatch(item.id);
                              }
                            } else {
                              setSelectedItem(item);
                              setTryOnResult('');
                            }
                          }}
                        >
                          {/* Batch selection checkbox */}
                          {batchMode && (
                            <div className="absolute -top-2 -left-2 z-10">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-3 border-white dark:border-gray-900 transition-all duration-300 ${
                                isSelectedForBatch
                                  ? 'bg-gradient-to-r from-purple-600 to-pink-500 scale-110'
                                  : canSelectForBatch
                                  ? 'bg-white dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                                  : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed opacity-50'
                              }`}>
                                {isSelectedForBatch && (
                                  <CheckCircle2 className="w-5 h-5 text-white" />
                                )}
                              </div>
                            </div>
                          )}

                          {/* Batch selection number */}
                          {batchMode && isSelectedForBatch && (
                            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white w-8 h-8 rounded-full shadow-lg font-black text-sm flex items-center justify-center border-2 border-white dark:border-gray-900 z-10">
                              {selectedForBatch.indexOf(item.id) + 1}
                            </div>
                          )}

                          <div className="aspect-square mb-3 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-600 border-2 border-gray-200 dark:border-gray-600 shadow-md group-hover:shadow-lg transition-all duration-300">
                            <img
                              alt={item.item_name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              src={item.image_url}
                            />
                          </div>
                          <p className="text-sm font-black text-gray-900 dark:text-gray-100 truncate leading-tight">
                            {item.item_name}
                          </p>
                          {selectedItem?.id === item.id && !batchMode && (
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center shadow-lg animate-bounce-once border-2 border-white dark:border-gray-900">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="col-span-2 text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400 font-medium">No items found</p>
                    </div>
                  )}
                </div>

                {/* Batch Try-On Button */}
                {batchMode && selectedForBatch.length > 0 && (
                  <div className="mt-6">
                    <button
                      className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 text-white font-black text-base rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border-2 border-white dark:border-gray-900 flex items-center justify-center gap-3"
                      disabled={!userPhoto || loading}
                      onClick={handleBatchTryOn}
                    >
                      <Layers className="w-5 h-5" />
                      Try All {selectedForBatch.length} Items
                      <Sparkles className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Refined Try It On Button */}
              <button
                className={`group relative w-full overflow-hidden rounded-2xl font-black text-lg py-5 px-8 shadow-xl transition-all duration-500 border-3 ${
                  loading || !userPhoto || !selectedItem
                    ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-60 border-gray-500'
                    : 'bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 hover:from-purple-700 hover:via-pink-600 hover:to-purple-700 hover:shadow-2xl hover:scale-[1.01] border-white dark:border-gray-900 animate-gradient'
                }`}
                disabled={loading || !userPhoto || !selectedItem}
                onClick={handleTryOn}
                style={{
                  backgroundSize: '200% 100%',
                }}
              >
                {/* Animated background overlay */}
                {!loading && userPhoto && selectedItem && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div>
                )}

                <div className="relative flex items-center justify-center gap-3 text-white">
                  {loading ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>Generating Your Try-On...</span>
                      <div className="absolute -right-4 flex gap-1">
                        <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                        <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                        <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
                      <span className="tracking-wide">✨ Try It On</span>
                      <Wand2 className="h-6 w-6 group-hover:-rotate-12 transition-transform duration-300" />
                    </>
                  )}
                </div>
              </button>

              {error && (
                <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 border-3 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 p-5 rounded-2xl font-bold shadow-lg">
                  <div className="flex items-start gap-3">
                    <X className="w-6 h-6 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Results - Enhanced */}
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-white to-purple-50/50 dark:from-gray-800 dark:to-purple-900/20 rounded-3xl shadow-xl border-3 border-purple-200 dark:border-purple-700 p-8 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                    Try-On Result
                  </h2>
                  {tryOnResult && (
                    <div className="flex gap-2">
                      <button
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border-2 border-white dark:border-gray-900"
                        onClick={handleShare}
                        title="Share"
                      >
                        <Share2 className="h-5 w-5" />
                      </button>
                      <button
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-black rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border-2 border-white dark:border-gray-900"
                        onClick={handleDownload}
                        title="Download"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-3 border-dashed border-purple-300 dark:border-purple-600 rounded-3xl p-8 min-h-[600px] flex items-center justify-center bg-gradient-to-br from-purple-50/30 to-pink-50/30 dark:from-purple-900/10 dark:to-pink-900/10 relative overflow-hidden">
                  {/* Background pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0" style={{
                      backgroundImage: 'radial-gradient(circle, #9333ea 1px, transparent 1px)',
                      backgroundSize: '20px 20px'
                    }}></div>
                  </div>

                  {loading ? (
                    <div className="text-center z-10">
                      <div className="relative inline-block mb-6">
                        <Loader2 className="h-16 w-16 animate-spin text-purple-600 mx-auto" />
                        <div className="absolute inset-0 animate-ping">
                          <div className="h-16 w-16 rounded-full bg-purple-400 opacity-20"></div>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
                        {processingStage || 'Creating Magic...'}
                      </p>
                      <p className="text-base text-gray-600 dark:text-gray-400 mb-6 font-medium">
                        {processingStage ? 'Processing in batch mode' : 'Our AI is working on your virtual try-on'}
                      </p>

                      {/* Progress stages */}
                      {!processingStage && (
                        <div className="mb-6 space-y-3 max-w-sm mx-auto">
                          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-700">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <CheckCircle2 className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Analyzing your photo...</span>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-xl border-2 border-gray-200 dark:border-gray-600 animate-pulse">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <Loader2 className="w-5 h-5 text-white animate-spin" />
                            </div>
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Applying clothing item...</span>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-xl border-2 border-gray-200 dark:border-gray-600 opacity-50">
                            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <Clock className="w-5 h-5 text-gray-500" />
                            </div>
                            <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Finalizing result...</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-700 rounded-full shadow-lg border-2 border-purple-200 dark:border-purple-600">
                        <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400 animate-pulse" />
                        <span className="text-sm font-bold text-purple-700 dark:text-purple-300">
                          This may take 30-60 seconds
                        </span>
                      </div>
                    </div>
                  ) : tryOnResult ? (
                    <div className="text-center z-10 w-full">
                      <div className="relative group inline-block mb-5">
                        <img
                          alt="Try-on result"
                          className="max-h-[450px] mx-auto rounded-2xl shadow-2xl border-4 border-white dark:border-gray-700 group-hover:shadow-[0_0_60px_rgba(168,85,247,0.4)] transition-all duration-300 cursor-pointer"
                          onClick={() => setFullscreenImage(tryOnResult)}
                          src={tryOnResult}
                        />
                        {/* Zoom hint overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 rounded-2xl">
                          <div className="bg-white/90 dark:bg-gray-800/90 px-4 py-2 rounded-full shadow-xl">
                            <div className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-200">
                              <Maximize className="w-4 h-4" />
                              Click to zoom
                            </div>
                          </div>
                        </div>
                        {/* Success badge overlay */}
                        <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full shadow-xl font-black text-sm flex items-center gap-2 border-3 border-white dark:border-gray-900 animate-bounce-once">
                          <CheckCircle2 className="w-4 h-4" />
                          Success!
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 rounded-2xl p-4 border-2 border-purple-200 dark:border-purple-700 shadow-lg">
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                          You're wearing:
                        </p>
                        <p className="text-lg font-black bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                          {currentResultClothing}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 z-10">
                      <div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 rounded-full flex items-center justify-center border-3 border-purple-200 dark:border-purple-700 shadow-xl">
                        <Camera className="h-14 w-14 text-purple-600 dark:text-purple-400" />
                      </div>
                      <p className="text-xl font-black text-gray-800 dark:text-gray-200 mb-2">
                        Ready to Try On!
                      </p>
                      <p className="text-base font-medium text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                        Upload your photo and select a clothing item to see how you look
                      </p>

                      {/* Simplified steps */}
                      <div className="flex items-center justify-center gap-4 max-w-2xl mx-auto">
                        <div className="flex-1 flex items-center gap-3 p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl border-2 border-purple-200 dark:border-purple-700">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                            <Upload className="w-5 h-5 text-white" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold text-purple-700 dark:text-purple-300">Step 1</p>
                            <p className="text-sm font-black text-gray-800 dark:text-gray-200">Upload Photo</p>
                          </div>
                        </div>

                        <div className="flex-1 flex items-center gap-3 p-4 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-2xl border-2 border-pink-200 dark:border-pink-700">
                          <div className="w-10 h-10 bg-gradient-to-br from-pink-600 to-purple-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                            <ImageIcon className="w-5 h-5 text-white" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold text-pink-700 dark:text-pink-300">Step 2</p>
                            <p className="text-sm font-black text-gray-800 dark:text-gray-200">Select Item</p>
                          </div>
                        </div>

                        <div className="flex-1 flex items-center gap-3 p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl border-2 border-purple-200 dark:border-purple-700">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-white" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold text-purple-700 dark:text-purple-300">Step 3</p>
                            <p className="text-sm font-black text-gray-800 dark:text-gray-200">Try It On</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Enhanced Gallery Section */}
              {localGallery.length > 0 && (
                <div className="bg-gradient-to-br from-white to-pink-50/50 dark:from-gray-800 dark:to-pink-900/20 rounded-3xl shadow-xl border-3 border-pink-200 dark:border-pink-700 p-8">
                  <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-pink-600 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <ImageIcon className="w-6 h-6 text-white" />
                      </div>
                      Your Gallery
                    </h3>
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Favorites filter toggle */}
                      {favoriteItems.length > 0 && !compareMode && (
                        <button
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300 border-2 ${
                            showOnlyFavorites
                              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-pink-600 shadow-lg'
                              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-pink-400 dark:hover:border-pink-500 shadow-sm hover:shadow-md'
                          }`}
                          onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                          title="Show only favorites"
                        >
                          <Heart className={`w-4 h-4 ${showOnlyFavorites ? 'fill-white' : ''}`} />
                          Favorites ({favoriteItems.length})
                        </button>
                      )}
                      {compareMode && selectedForCompare.length >= 2 && (
                        <button
                          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-black rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 border-white dark:border-gray-900"
                          onClick={handleCompare}
                        >
                          <Eye className="w-5 h-5" />
                          Compare ({selectedForCompare.length})
                        </button>
                      )}
                      <button
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300 border-2 ${
                          compareMode
                            ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white border-purple-600 shadow-lg'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 shadow-sm hover:shadow-md'
                        }`}
                        onClick={toggleCompareMode}
                      >
                        {compareMode ? (
                          <>
                            <X className="w-4 h-4" />
                            Cancel
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" />
                            Compare
                          </>
                        )}
                      </button>
                      {/* Total count badge - always shows total, clickable to show all when in favorites mode */}
                      <button
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all duration-300 ${
                          showOnlyFavorites
                            ? 'bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 border-purple-300 dark:border-purple-700 shadow-md hover:shadow-lg hover:scale-105 cursor-pointer'
                            : 'bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/40 dark:to-purple-900/40 border-pink-300 dark:border-pink-700 shadow-md cursor-default'
                        }`}
                        onClick={() => {
                          if (showOnlyFavorites) {
                            setShowOnlyFavorites(false);
                          }
                        }}
                        title={showOnlyFavorites ? 'Click to view all try-ons' : 'Total try-ons'}
                      >
                        <Star className={`w-5 h-5 ${showOnlyFavorites ? 'text-purple-600 dark:text-purple-400' : 'text-pink-600 dark:text-pink-400'}`} />
                        <span className={`text-sm font-black ${showOnlyFavorites ? 'text-purple-700 dark:text-purple-300' : 'text-pink-700 dark:text-pink-300'}`}>
                          {localGallery.length} {localGallery.length === 1 ? 'Try-On' : 'Try-Ons'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {compareMode && (
                    <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border-2 border-purple-200 dark:border-purple-700">
                      <p className="text-sm font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Select 2-3 try-ons to compare side by side
                        {selectedForCompare.length > 0 && (
                          <span className="ml-2 px-3 py-1 bg-purple-600 text-white rounded-full text-xs">
                            {selectedForCompare.length} selected
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  {showOnlyFavorites && favoriteItems.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                      <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/40 dark:to-rose-900/40 rounded-full flex items-center justify-center border-3 border-pink-200 dark:border-pink-700">
                        <Heart className="w-10 h-10 text-pink-400 dark:text-pink-500" />
                      </div>
                      <p className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">No favorites yet</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Click the heart icon on try-ons to add them to favorites</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {(showOnlyFavorites ? favoriteItems : localGallery.slice(0, 10)).map(item => {
                        const isSelected = selectedForCompare.includes(item.id);
                        const canSelect = selectedForCompare.length < 3 || isSelected;

                        return (
                        <div className="group relative" key={item.id + '-' + item.result_image_url}>
                          {/* Favorites heart button - always show top-left */}
                          {!compareMode && (
                            <button
                              aria-label={favorites.has(item.id) ? 'Remove from favorites' : 'Add to favorites'}
                              className={`absolute -top-2 -left-2 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 border-2 border-white dark:border-gray-900 ${
                                favorites.has(item.id)
                                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 opacity-100'
                                  : 'bg-white dark:bg-gray-700 opacity-0 group-hover:opacity-100'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(item.id);
                              }}
                            >
                              <Heart className={`h-4 w-4 ${favorites.has(item.id) ? 'text-white fill-white' : 'text-pink-500'}`} />
                            </button>
                          )}

                          {/* Delete button - only show when not in compare mode */}
                          {!compareMode && (
                            <button
                              aria-label="Delete try-on"
                              className="absolute -top-2 -right-2 z-10 w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full flex items-center justify-center shadow-lg hover:from-red-600 hover:to-pink-600 transition-all duration-300 hover:scale-110 opacity-0 group-hover:opacity-100 border-2 border-white dark:border-gray-900"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (item.id !== 'local-preview') {
                                  await supabase.from('tryon_history').delete().eq('id', item.id);
                                }
                                setLocalGallery(gallery => gallery.filter(g => g.id !== item.id));
                                if (tryOnResult === item.result_image_url) {
                                  setTryOnResult('');
                                  setCurrentClothingName('');
                                  setCurrentResultClothing('');
                                }
                              }}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}

                          {/* Selection checkbox - show in compare mode */}
                          {compareMode && (
                            <div
                              className="absolute -top-2 -left-2 z-10"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (canSelect) {
                                  toggleSelectForCompare(item.id);
                                }
                              }}
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-3 border-white dark:border-gray-900 cursor-pointer transition-all duration-300 ${
                                isSelected
                                  ? 'bg-gradient-to-r from-purple-600 to-pink-500 scale-110'
                                  : canSelect
                                  ? 'bg-white dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                                  : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed opacity-50'
                              }`}>
                                {isSelected && (
                                  <CheckCircle2 className="w-5 h-5 text-white" />
                                )}
                              </div>
                            </div>
                          )}

                          {/* Gallery image */}
                          <div className="relative">
                            <button
                              className={`w-full relative overflow-hidden rounded-2xl border-3 transition-all duration-300 shadow-md hover:shadow-xl ${
                                isSelected && compareMode
                                  ? 'border-purple-500 dark:border-purple-400 scale-[1.02] ring-4 ring-purple-300 dark:ring-purple-600'
                                  : 'border-pink-200 dark:border-pink-700 hover:border-purple-400 dark:hover:border-purple-500 group-hover:scale-105'
                              }`}
                              onClick={() => {
                                if (compareMode) {
                                  if (canSelect) {
                                    toggleSelectForCompare(item.id);
                                  }
                                } else {
                                  setTryOnResult(item.result_image_url);
                                  setCurrentResultUrl(item.result_image_url);
                                  setCurrentResultClothing(item.clothing_item_name || item.item_name || '');
                                  setCurrentClothingName(item.clothing_item_name || item.item_name || '');
                                }
                              }}
                            >
                              <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-700">
                                <img
                                  alt="Try-on"
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                  src={item.result_image_url}
                                />
                              </div>

                              {/* Overlay on hover */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                                <div className="w-full">
                                  <p className="text-white text-xs font-black truncate">
                                    {item.clothing_item_name || item.item_name || 'View'}
                                  </p>
                                </div>
                              </div>

                              {/* Active indicator - only show when not in compare mode */}
                              {!compareMode && tryOnResult === item.result_image_url && (
                                <div className="absolute top-2 left-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full shadow-lg font-black text-xs flex items-center gap-1 border-2 border-white dark:border-gray-900">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Active
                                </div>
                              )}

                              {/* Selected number badge in compare mode */}
                              {compareMode && isSelected && (
                                <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white w-8 h-8 rounded-full shadow-lg font-black text-sm flex items-center justify-center border-2 border-white dark:border-gray-900">
                                  {selectedForCompare.indexOf(item.id) + 1}
                                </div>
                              )}
                            </button>

                            {/* Zoom button - show on hover when not in compare mode */}
                            {!compareMode && (
                              <button
                                className="absolute bottom-2 right-2 p-2 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 border-2 border-purple-200 dark:border-purple-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFullscreenImage(item.result_image_url);
                                }}
                                title="View fullscreen"
                              >
                                <Maximize className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Comparison Modal */}
        {showComparison && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowComparison(false);
              }
            }}
          >
            <div className="relative w-full max-w-6xl bg-gradient-to-br from-white to-purple-50/50 dark:from-gray-800 dark:to-purple-900/20 rounded-3xl shadow-2xl border-3 border-purple-200 dark:border-purple-700 p-8 max-h-[90vh] overflow-y-auto animate-fade-in-scale">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Eye className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                      Compare Try-Ons
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      Side by side comparison of your virtual try-ons
                    </p>
                  </div>
                </div>
                <button
                  className="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-300 hover:scale-110"
                  onClick={() => setShowComparison(false)}
                >
                  <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </button>
              </div>

              {/* Comparison Grid */}
              <div className={`grid gap-6 ${getComparedItems().length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {getComparedItems().map((item, index) => (
                  <div className="space-y-4" key={item.id}>
                    {/* Position badge */}
                    <div className="flex items-center justify-center gap-2">
                      <div className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-full shadow-lg font-black text-sm">
                        Option {index + 1}
                      </div>
                    </div>

                    {/* Image card */}
                    <div className="bg-white dark:bg-gray-700 rounded-2xl p-4 shadow-xl border-3 border-purple-200 dark:border-purple-700">
                      <div className="aspect-[3/4] rounded-xl overflow-hidden mb-4 bg-gray-100 dark:bg-gray-600">
                        <img
                          alt={`Try-on ${index + 1}`}
                          className="w-full h-full object-cover"
                          src={item.result_image_url}
                        />
                      </div>

                      {/* Item info */}
                      <div className="space-y-3">
                        <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 rounded-xl p-3 border-2 border-purple-200 dark:border-purple-700">
                          <p className="text-xs font-bold text-purple-700 dark:text-purple-300 mb-1">
                            Clothing Item
                          </p>
                          <p className="text-sm font-black text-gray-900 dark:text-gray-100">
                            {item.clothing_item_name || item.item_name || 'Unknown Item'}
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2">
                          <button
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 text-sm flex items-center justify-center gap-2"
                            onClick={() => {
                              // Open fullscreen zoom modal
                              setFullscreenImage(item.result_image_url);
                              // Keep comparison modal open in background (don't close it)
                            }}
                          >
                            <Maximize className="w-4 h-4" />
                            View Full
                          </button>
                          <button
                            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 text-sm"
                            onClick={() => {
                              fetch(item.result_image_url)
                                .then(response => response.blob())
                                .then(blob => {
                                  const url = URL.createObjectURL(blob);
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.download = `tryon-${item.clothing_item_name || 'result'}.jpg`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  URL.revokeObjectURL(url);
                                });
                            }}
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl border-2 border-blue-200 dark:border-blue-700">
                <p className="text-sm text-center text-gray-700 dark:text-gray-300 font-medium flex items-center justify-center gap-2">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Compare different outfits to find your perfect look!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Tips Section */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-3xl border-3 border-blue-200 dark:border-blue-700 p-6 md:p-8 shadow-xl">
          <div className="flex items-start gap-4 md:gap-6">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
              <Info className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-gray-100 mb-4">
                Pro Tips for Best Results
              </h3>
              <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-1">
                      Full-Length Photo
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Use a photo showing your entire body from head to toe for accurate results
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-1">
                      Good Lighting
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Well-lit photos produce better try-on results with clearer details
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-1">
                      Stand Straight
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Face the camera directly with arms slightly away from your body
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-1">
                      Plain Background
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      A simple, uncluttered background helps the AI focus on you
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Zoom Modal */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in"
          onClick={() => setFullscreenImage(null)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setFullscreenImage(null);
            }
          }}
          tabIndex={0}
        >
          <button
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-md border-2 border-white/20"
            onClick={() => setFullscreenImage(null)}
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <div className="relative max-w-6xl max-h-[90vh] animate-fade-in-scale">
            <img
              alt="Fullscreen try-on result"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
              src={fullscreenImage}
            />

            {/* Download button in fullscreen */}
            <button
              className="absolute bottom-6 right-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-black rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-white flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                fetch(fullscreenImage)
                  .then(response => response.blob())
                  .then(blob => {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `tryon-fullscreen.jpg`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  });
              }}
            >
              <Download className="w-5 h-5" />
              Download
            </button>
          </div>
        </div>
      )}
    </div>
  )
}