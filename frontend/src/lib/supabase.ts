import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project-url.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      wardrobe: {
        Row: {
          id: string
          user_id: string
          item_name: string
          description: string
          image_url: string
          date_added: string
        }
        Insert: {
          id?: string
          user_id: string
          item_name: string
          description: string
          image_url: string
          date_added?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_name?: string
          description?: string
          image_url?: string
          date_added?: string
        }
      }
    }
  }
}