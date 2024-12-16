import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

export const createClient = () => {
  return createClientComponentClient<Database>()
}

export const createAnalyticsClient = (url: string, key: string) => {
  // Extract project ref from URL and ensure proper URL format
  const projectRef = url
    .replace('https://', '')
    .replace('.supabase.co', '')
    .split('/')[0]

  return createSupabaseClient(
    `https://${projectRef}.supabase.co`,
    key,
    {
      auth: {
        persistSession: false // Don't persist auth state for analytics client
      }
    }
  )
}

export type Database = {
  public: {
    Tables: {
      sites: {
        Row: {
          id: string
          created_at: string
          name: string
          url: string
          user_id: string
          db_url: string
          db_key: string
          is_configured: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          url: string
          user_id: string
          db_url?: string
          db_key?: string
          is_configured?: boolean
        }
      }
      analytics_events: {
        Row: {
          id: string
          created_at: string
          site_id: string
          event_type: string
          page_url: string
          referrer: string | null
          user_agent: string
          country: string | null
          city: string | null
          browser: string
          os: string
          device: string
          session_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          site_id: string
          event_type: string
          page_url: string
          referrer?: string | null
          user_agent: string
          country?: string | null
          city?: string | null
          browser: string
          os: string
          device: string
          session_id: string
        }
      }
    }
  }
} 