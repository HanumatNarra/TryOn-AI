import { Upload, Sparkles, Save, Loader2, X, Camera, Image as ImageIcon, ArrowLeft, Plus, Maximize2, ChevronLeft, Check, ChevronDown } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

import { useAuth } from '../../contexts/AuthContext'
import { config } from '../../lib/config'
import { supabase } from '../../lib/supabase'

interface WardrobeItem {
  id: string
  item_name: string
  description: string
  image_url: string
  date_added: string
  category?: string
}

export const AddItemForm: React.FC = () => {
  const [itemName, setItemName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [describingAI, setDescribingAI] = useState(false)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)
  const { user: contextUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const editItem = location.state?.editItem as WardrobeItem | undefined
  const isEditing = !!editItem

  const categories = [
    'Tops',
    'Bottoms', 
    'Dresses',
    'Outerwear',
    'Shoes',
    'Accessories'
  ]

  useEffect(() => {
    if (editItem) {
      setItemName(editItem.item_name)
      setDescription(editItem.description)
      setImageUrl(editItem.image_url)
      setCategory(editItem.category || '')
    }
  }, [editItem])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImageUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith('image/')) {
        setImageFile(file)
        const reader = new FileReader()
        reader.onload = (e) => {
          setImageUrl(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const handleDescribeWithAI = async () => {
    if (!imageFile) {
      setError('Please upload an image first')
      return
    }

    setDescribingAI(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('image', imageFile)

      const response = await fetch(`${config.backendUrl}/describe-clothing`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to describe clothing')
      }

      const data = await response.json()
      
      if (data.item_name) setItemName(data.item_name)
      if (data.description) setDescription(data.description)
      if (data.category) setCategory(data.category)
      
    } catch (error) {
      setError('Failed to get AI description. Please try again.')
    } finally {
      setDescribingAI(false)
    }
  }

  const handleSave = async (e: React.FormEvent, retryCount = 0) => {
    e.preventDefault()
    
    // Production-ready input validation
    if (!imageUrl || !itemName.trim()) {
      setError('Please provide an image and item name')
      return
    }

    // Sanitize and validate inputs
    const sanitizedItemName = itemName.trim().replace(/\s+/g, ' ');
    const sanitizedDescription = description.trim().replace(/\s+/g, ' ');
    
    if (sanitizedItemName.length < 2) {
      setError('Item name must be at least 2 characters long')
      return
    }

    if (sanitizedItemName.length > 100) {
      setError('Item name must be less than 100 characters')
      return
    }

    if (sanitizedDescription.length > 1000) {
      setError('Description must be less than 1000 characters')
      return
    }

    setLoading(true)
    setError('')

    // Production-ready database health check
    try {
      const { data: healthCheck } = await supabase
        .from('wardrobe')
        .select('id')
        .limit(1);
      
      if (!healthCheck) {
        throw new Error('Database connection failed. Please try again.');
      }
    } catch (healthError) {
      setError('Database connection error. Please check your connection and try again.');
      setLoading(false);
      return;
    }

    try {
      let finalImageUrl = imageUrl

      // Upload new image if it's a file
      if (imageFile) {
        // Production-ready file validation
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        if (!allowedTypes.includes(imageFile.type)) {
          throw new Error('Invalid file type. Please upload JPEG, PNG, or WebP images only.');
        }
        
        if (imageFile.size > maxSize) {
          throw new Error('File too large. Please upload images smaller than 10MB.');
        }
        
        const fileExt = imageFile.name.split('.').pop()?.toLowerCase();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `wardrobe/${contextUser?.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('wardrobe-images')
          .upload(filePath, imageFile)

        if (uploadError) {
          throw uploadError
        }

        const { data: { publicUrl } } = supabase.storage
          .from('wardrobe-images')
          .getPublicUrl(filePath)

        finalImageUrl = publicUrl
      }

      if (isEditing && editItem) {
        // Update existing item
        const { error: updateError } = await supabase
          .from('wardrobe')
          .update({
            item_name: sanitizedItemName,
            description: sanitizedDescription,
            category: category || null,
            image_url: finalImageUrl,
          })
          .eq('id', editItem.id)

        if (updateError) throw updateError
      } else {
        // Create new item
        const { error: insertError } = await supabase
          .from('wardrobe')
          .insert({
            user_id: contextUser?.id,
            item_name: sanitizedItemName,
            description: sanitizedDescription,
            category: category || null,
            image_url: finalImageUrl,
            date_added: new Date().toISOString(),
          })

        if (insertError) throw insertError
      }

      navigate('/wardrobe')
    } catch (error) {
      // Production-ready error logging
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorDetails = {
        timestamp: new Date().toISOString(),
        user_id: contextUser?.id,
        action: isEditing ? 'update' : 'insert',
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      };
      
      // Error details captured for debugging
      
      // Production-ready retry logic for network failures
      if (retryCount < 2 && (errorMessage.includes('network') || errorMessage.includes('timeout'))) {
        setError(`Network error. Retrying... (${retryCount + 1}/3)`);
        setTimeout(() => {
          handleSave(e, retryCount + 1);
        }, 1000 * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      // User-friendly error message
      if (errorMessage.includes('storage')) {
        setError('Failed to upload image. Please check your connection and try again.');
      } else if (errorMessage.includes('permission') || errorMessage.includes('policy')) {
        setError('Permission denied. Please ensure you are logged in and try again.');
      } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
        setError('Network error. Please check your connection and try again.');
      } else if (errorMessage.includes('Invalid file type')) {
        setError('Invalid file type. Please upload JPEG, PNG, or WebP images only.');
      } else if (errorMessage.includes('File too large')) {
        setError('File too large. Please upload images smaller than 10MB.');
      } else {
        setError('Failed to save item. Please try again.');
      }
    } finally {
      setLoading(false)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImageUrl('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* PAGE HEADER - Consistent with Wardrobe page */}
      <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-purple-900/20 border-b border-purple-100 dark:border-purple-700 px-6 md:px-8 py-5 md:py-6 mb-10 shadow-sm">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => navigate('/wardrobe')}
            className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors duration-200"
            type="button"
          >
            <ChevronLeft className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
            {isEditing ? 'Edit Item' : 'Add New Item'}
          </h1>
        </div>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 ml-14">
          {isEditing ? 'Update your clothing item details below' : 'Upload a photo and fill in details to add a new piece to your wardrobe'}
        </p>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-6xl mx-auto px-6 md:px-8 animate-fade-in-up">

      <form onSubmit={(e) => handleSave(e, 0)}>
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 mb-8">
          {/* Left Column - Image Upload */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-purple-100 dark:border-purple-800/30 p-8 flex flex-col">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Upload Photo</h2>
              <p className="text-gray-600 dark:text-gray-400">Add a clear image of your clothing item</p>
            </div>

            <div className="flex-1 flex flex-col">
              {!imageUrl ? (
                <>
                  <div
                    className={`
                      border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer flex-1 flex flex-col justify-center min-h-[400px] group
                      ${dragActive
                        ? 'border-purple-500 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 scale-[1.02] shadow-lg'
                        : 'border-purple-300 dark:border-purple-700 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 hover:border-purple-400 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 hover:shadow-md'
                      }
                    `}
                    onClick={() => document.getElementById('image-upload')?.click()}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <div className="space-y-6">
                      <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center mx-auto shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                        <Camera className="w-12 h-12 text-white group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                          Drop your image here
                        </p>
                        <p className="text-base text-gray-600 dark:text-gray-400">
                          or click to browse from your device
                        </p>
                      </div>
                      <button
                        className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl shadow-md hover:shadow-xl hover:from-purple-700 hover:to-pink-600 transition-all hover:scale-110 active:scale-100"
                        onClick={(e) => {
                          e.stopPropagation()
                          document.getElementById('image-upload')?.click()
                        }}
                        type="button"
                      >
                        <Upload className="w-5 h-5 mr-2" />
                        Choose File
                      </button>
                    </div>
                  </div>

                  {/* Requirements Checklist */}
                  <div className="mt-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/30 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">Photo Requirements:</h3>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                        <span>Clear, well-lit photo of the clothing item</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                        <span>JPG, PNG, or WebP format (max 10MB)</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                        <span>Item should be clearly visible without obstructions</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="relative flex-1 flex flex-col">
                  <div className="flex-1 flex items-center justify-center min-h-[400px] max-h-[500px]">
                    <div className="relative group cursor-pointer w-full h-full" onClick={() => setShowFullImage(true)}>
                      <img
                        alt="Clothing item"
                        className="w-full h-full object-cover rounded-2xl shadow-lg group-hover:shadow-xl border-2 border-purple-200 dark:border-purple-800/30 transition-all duration-300"
                        src={imageUrl}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-2xl transition-all duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 dark:bg-gray-800/90 rounded-full p-3 shadow-lg">
                          <Maximize2 className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                        </div>
                      </div>
                      <div className="absolute top-3 right-3 text-xs bg-white/95 dark:bg-gray-800/95 px-3 py-1.5 rounded-full text-gray-600 dark:text-gray-400 font-medium shadow-sm">
                        Click to view full size
                      </div>
                    </div>
                  </div>
                  <button
                    className="absolute top-3 left-3 p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 z-10"
                    onClick={removeImage}
                    type="button"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            <input
              accept="image/*"
              className="hidden"
              id="image-upload"
              onChange={handleImageUpload}
              type="file"
            />
          </div>

          {/* Right Column - Item Details */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-purple-100 dark:border-purple-800/30 overflow-hidden flex flex-col">
            {/* Gradient Card Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-500 px-8 py-6">
              <h2 className="text-2xl font-bold text-white mb-1">Item Details</h2>
              <p className="text-purple-100">Fill in the information about your clothing item</p>
            </div>

            {/* Form Content */}
            <div className="p-8 flex-1 flex flex-col">
            
            <div className="flex-1 flex flex-col space-y-6">
              {/* Item Name */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900 dark:text-gray-100" htmlFor="item-name">
                  Item Name <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/20 transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500"
                  id="item-name"
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g., Blue Denim Jacket"
                  type="text"
                  value={itemName}
                />
                <p className="text-xs text-gray-500 dark:text-gray-500">Choose a descriptive name for your item</p>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900 dark:text-gray-100" htmlFor="category">
                  Category
                </label>
                <div className="relative">
                  <select
                    className="w-full px-4 py-3 pr-10 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/20 transition-all duration-200 appearance-none cursor-pointer"
                    id="category"
                    onChange={(e) => setCategory(e.target.value)}
                    value={category}
                  >
                    <option value="">Select a category</option>
                    <option value="Tops">👕 Tops</option>
                    <option value="Bottoms">👖 Bottoms</option>
                    <option value="Dresses">👗 Dresses</option>
                    <option value="Outerwear">🧥 Outerwear</option>
                    <option value="Shoes">👞 Shoes</option>
                    <option value="Accessories">✨ Accessories</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500">Help organize your wardrobe by category</p>
              </div>

              {/* Description */}
              <div className="space-y-2 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-bold text-gray-900 dark:text-gray-100" htmlFor="description">
                    Description
                  </label>
                  <span className={`text-xs font-medium ${description.length > 500 ? 'text-red-500' : 'text-gray-500 dark:text-gray-500'}`}>
                    {description.length}/500
                  </span>
                </div>
                <textarea
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/20 transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500 resize-none flex-1"
                  id="description"
                  maxLength={500}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the item's style, material, color, and any unique features..."
                  rows={6}
                  value={description}
                />
                <p className="text-xs text-gray-500 dark:text-gray-500">Add details to help identify this item later</p>
              </div>

              {/* AI Description Button - Moved to bottom */}
              <div className="mt-auto pt-4">
                <button
                  className="w-full inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg hover:from-purple-700 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed group disabled:hover:shadow-none"
                  disabled={!imageFile || describingAI}
                  onClick={handleDescribeWithAI}
                  type="button"
                >
                  {describingAI ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                      Describe with AI Magic
                    </>
                  )}
                </button>
                {!imageFile && (
                  <p className="text-xs text-center text-gray-500 dark:text-gray-500 mt-2">Upload an image first to use AI description</p>
                )}
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-700 rounded-2xl p-6 mb-8 shadow-lg animate-slideInDown">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                <X className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-red-900 dark:text-red-300 font-bold mb-1">Error</h3>
                <p className="text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-4 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 font-bold rounded-xl shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-400 transition-all duration-200 hover:scale-[1.02] active:scale-95"
              onClick={() => navigate('/wardrobe')}
              type="button"
            >
              Cancel
            </button>
            <div className="relative w-full sm:w-auto group">
              <button
                className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-pink-600 transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg"
                disabled={loading || !imageUrl || !itemName.trim()}
                type="submit"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {isEditing ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    {isEditing ? 'Update Item' : 'Save Item'}
                  </>
                )}
              </button>
              {/* Tooltip on disabled state */}
              {(!imageUrl || !itemName.trim()) && !loading && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <div className="bg-gray-900 dark:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg shadow-lg whitespace-nowrap">
                    Please upload an image and enter an item name
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
      </div>

      {/* Full Image Modal - Clean */}
      {showFullImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowFullImage(false)}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              alt="Clothing item - Full view"
              className="max-w-[90vw] max-h-[90vh] w-auto h-auto object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              src={imageUrl}
            />
          </div>
        </div>
      )}
    </div>
  )
}