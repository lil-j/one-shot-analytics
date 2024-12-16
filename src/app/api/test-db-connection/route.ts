import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SETUP_SQL = `
  -- Create analytics_events table
  create table if not exists public.analytics_events (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    site_id uuid not null,
    event_type text not null,
    page_url text not null,
    referrer text,
    user_agent text,
    country text,
    city text,
    browser text,
    os text,
    device text,
    session_id text not null
  );

  -- Create indexes
  create index if not exists analytics_events_site_id_idx on public.analytics_events(site_id);
  create index if not exists analytics_events_created_at_idx on public.analytics_events(created_at);
  create index if not exists analytics_events_session_id_idx on public.analytics_events(session_id);

  -- Enable RLS
  alter table public.analytics_events enable row level security;

  -- Drop existing policies
  drop policy if exists "Allow inserts from tracking script" on public.analytics_events;
  drop policy if exists "Allow reads with service role" on public.analytics_events;

  -- Create policies
  create policy "Allow inserts from tracking script" on public.analytics_events for insert with check (true);
  create policy "Allow reads with service role" on public.analytics_events for select using (true);
`

export async function POST(request: Request) {
  try {
    const { projectRef, serviceKey } = await request.json()

    if (!projectRef || !serviceKey) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // Create Supabase client
    const supabase = createClient(
      `https://${projectRef}.supabase.co`,
      serviceKey
    )

    // Test connection
    const { error: connectionError } = await supabase
      .from('_dummy_query_for_connection_test_')
      .select('*')
      .limit(1)
    
    if (connectionError && !connectionError.message.includes('does not exist')) {
      return new NextResponse('Failed to connect to database: ' + connectionError.message, { status: 500 })
    }

    // Split SQL into individual statements
    const statements = SETUP_SQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    // Execute each statement
    for (const sql of statements) {
      const { error } = await supabase.rpc('exec', { sql: sql + ';' })
      
      if (error) {
        console.error('Failed to execute SQL:', sql)
        console.error('Error:', error)
        
        // If it's not just a "function doesn't exist" error, return the error
        if (!error.message.includes('function') && !error.message.includes('does not exist')) {
          return new NextResponse('Failed to setup database: ' + error.message, { status: 500 })
        }
      }
    }

    // Verify table exists
    const { error: verifyError } = await supabase
      .from('analytics_events')
      .select('*')
      .limit(1)

    if (verifyError && !verifyError.message.includes('permission denied')) {
      return new NextResponse('Failed to verify table creation: ' + verifyError.message, { status: 500 })
    }

    return new NextResponse('OK')
  } catch (error) {
    console.error('Test connection error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
} 