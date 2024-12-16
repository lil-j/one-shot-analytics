import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

export const createServerClient = (cookieStore: ReturnType<typeof cookies>) => {
  return createServerComponentClient<Database>({
    cookies: () => cookieStore,
  })
} 