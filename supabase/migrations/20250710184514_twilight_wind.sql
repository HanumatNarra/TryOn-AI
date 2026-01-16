/*
  # TryOn.AI Wardrobe Database Schema

  1. New Tables
    - `wardrobe`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `item_name` (text)
      - `description` (text)
      - `image_url` (text)
      - `date_added` (timestamptz)
      - `category` (text, optional for future categorization)

  2. Security
    - Enable RLS on `wardrobe` table
    - Add policies for authenticated users to manage their own wardrobe items
    - Users can only access their own wardrobe items

  3. Storage
    - Create storage bucket for wardrobe images
    - Set up policies for authenticated users to upload images
*/

-- Create wardrobe table
CREATE TABLE IF NOT EXISTS wardrobe (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_name text NOT NULL,
  description text NOT NULL,
  image_url text NOT NULL,
  category text DEFAULT 'general',
  date_added timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE wardrobe ENABLE ROW LEVEL SECURITY;

-- Create policies for wardrobe table
CREATE POLICY "Users can view own wardrobe items"
  ON wardrobe
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wardrobe items"
  ON wardrobe
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wardrobe items"
  ON wardrobe
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wardrobe items"
  ON wardrobe
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create storage bucket for wardrobe images
INSERT INTO storage.buckets (id, name, public)
VALUES ('wardrobe-images', 'wardrobe-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for wardrobe images storage
CREATE POLICY "Users can upload wardrobe images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'wardrobe-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view wardrobe images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'wardrobe-images');

CREATE POLICY "Users can update own wardrobe images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'wardrobe-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own wardrobe images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'wardrobe-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_wardrobe_user_id ON wardrobe(user_id);
CREATE INDEX IF NOT EXISTS idx_wardrobe_date_added ON wardrobe(date_added DESC);

-- Create tryon_history table
CREATE TABLE IF NOT EXISTS tryon_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    clothing_item_name TEXT NOT NULL,
    avatar_image_url TEXT,
    clothing_image_url TEXT,
    result_image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for tryon_history
ALTER TABLE tryon_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own try-on history
CREATE POLICY "Users can view own tryon history" ON tryon_history
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own try-on history
CREATE POLICY "Users can insert own tryon history" ON tryon_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own try-on history
CREATE POLICY "Users can delete own tryon history" ON tryon_history
    FOR DELETE USING (auth.uid() = user_id);
