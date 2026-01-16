import { supabase } from './supabase'

interface WardrobeItem {
  id: string
  item_name: string
  description: string
  image_url: string
}

interface OutfitSuggestion {
  id: string
  occasion: string
  items: WardrobeItem[]
  reasoning: string
  style_tips: string[]
}

// Mock function for AI clothing description
export const describeClothingWithAI = async (imageFile: File | string): Promise<string> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Mock responses based on image analysis
  const descriptions = [
    'A stylish and versatile piece perfect for both casual and formal occasions. Features high-quality fabric with contemporary design elements that make it easy to pair with other wardrobe items.',
    'Elegant and comfortable clothing item with excellent fit and modern styling. Ideal for various occasions and offers great versatility for creating multiple outfit combinations.',
    'Premium quality garment with attention to detail and sophisticated design. Perfect for professional settings while maintaining comfort for all-day wear.',
    'Contemporary design with classic appeal. Well-crafted piece that combines style and functionality, making it a valuable addition to any wardrobe.',
    'Versatile and fashionable item with timeless design elements. Excellent quality construction ensures durability while maintaining a polished appearance.'
  ]
  
  return descriptions[Math.floor(Math.random() * descriptions.length)]
}

// Mock function for outfit suggestions
export const generateOutfitSuggestions = async (
  wardrobeItems: WardrobeItem[], 
  occasions: string[]
): Promise<OutfitSuggestion[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  const occasionMap: Record<string, string> = {
    business: 'Business Meeting',
    date: 'Date Night',
    casual: 'Casual Friday',
    weekend: 'Weekend Outing',
    evening: 'Evening Event',
    workout: 'Gym/Workout',
    travel: 'Travel Day'
  }
  
  const suggestions: OutfitSuggestion[] = []
  
  for (const occasion of occasions) {
    // Select random items from wardrobe (2-3 items per outfit)
    const itemCount = Math.min(wardrobeItems.length, Math.floor(Math.random() * 2) + 2)
    const selectedItems = [...wardrobeItems]
      .sort(() => 0.5 - Math.random())
      .slice(0, itemCount)
    
    const reasoningMap: Record<string, string> = {
      business: 'This combination creates a professional and polished look that commands respect in business settings. The colors work harmoniously together while maintaining a sophisticated appearance.',
      date: 'Perfect for making a great impression while staying comfortable. This outfit strikes the right balance between stylish and approachable, ideal for romantic occasions.',
      casual: 'Relaxed yet put-together look that\'s perfect for a casual workplace environment. Comfortable enough for all-day wear while still looking professional.',
      weekend: 'Comfortable and versatile outfit perfect for weekend activities. Easy to move in while maintaining a stylish appearance for various casual occasions.',
      evening: 'Elegant and sophisticated combination that\'s perfect for evening events. The pieces work together to create a refined look that\'s appropriate for special occasions.',
      workout: 'Functional and comfortable pieces that allow for full range of motion during exercise. Moisture-wicking materials and proper fit ensure optimal performance.',
      travel: 'Comfortable and versatile pieces that are perfect for travel. Easy to mix and match, wrinkle-resistant, and suitable for various activities during your trip.'
    }
    
    const tipsMap: Record<string, string[]> = {
      business: [
        'Ensure all pieces are well-fitted and pressed',
        'Choose neutral colors that work well together',
        'Add a professional accessory like a watch or belt',
        'Keep jewelry minimal and classic'
      ],
      date: [
        'Choose colors that complement your skin tone',
        'Ensure you feel confident and comfortable',
        'Add a subtle fragrance',
        'Consider the venue when choosing shoes'
      ],
      casual: [
        'Layer pieces for easy temperature adjustment',
        'Choose comfortable footwear for all-day wear',
        'Mix textures for visual interest',
        'Keep accessories simple and functional'
      ],
      weekend: [
        'Prioritize comfort without sacrificing style',
        'Choose versatile pieces that work for multiple activities',
        'Layer for changing weather conditions',
        'Opt for easy-care fabrics'
      ],
      evening: [
        'Pay attention to the dress code of your venue',
        'Choose one statement piece and keep others simple',
        'Ensure your outfit photographs well',
        'Consider comfort for extended wear'
      ],
      workout: [
        'Choose moisture-wicking fabrics',
        'Ensure proper fit for movement',
        'Layer for temperature regulation',
        'Invest in quality athletic footwear'
      ],
      travel: [
        'Choose wrinkle-resistant fabrics',
        'Pack versatile pieces that mix and match',
        'Wear your heaviest items while traveling',
        'Choose comfortable shoes for walking'
      ]
    }
    
    suggestions.push({
      id: `${occasion}-${Date.now()}`,
      occasion: occasionMap[occasion] || occasion,
      items: selectedItems,
      reasoning: reasoningMap[occasion] || 'This combination works well together and is appropriate for the selected occasion.',
      style_tips: tipsMap[occasion] || ['Choose pieces that make you feel confident', 'Ensure proper fit and comfort']
    })
  }
  
  return suggestions
}

// Mock function for virtual try-on
export const generateTryOnImage = async (userPhoto: string, clothingImage: string): Promise<string> => {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 8000))
  
  // For demo purposes, return a mock try-on result
  // In a real implementation, this would call the RapidAPI try-on diffusion API
  
  // Mock try-on results (using fashion model images as placeholders)
  const mockResults = [
    'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1040856/pexels-photo-1040856.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1182825/pexels-photo-1182825.jpeg?auto=compress&cs=tinysrgb&w=400'
  ]
  
  return mockResults[Math.floor(Math.random() * mockResults.length)]
}

// Function to upload image to Supabase Storage
export const uploadImage = async (file: File, bucket: string, path: string): Promise<string> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file)

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return publicUrl
  } catch (error) {
    throw new Error('Failed to upload image')
  }
}

// Function to delete image from Supabase Storage
export const deleteImage = async (bucket: string, path: string): Promise<void> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) throw error
  } catch (error) {
    throw new Error('Failed to delete image')
  }
}