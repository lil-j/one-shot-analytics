import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Helper function to add CORS headers
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() })
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const body = await request.json()

    // Get the authorization token
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new NextResponse('Missing or invalid authorization header', { 
        status: 401,
        headers: corsHeaders()
      })
    }
    const apiKey = authHeader.slice(7) // Remove 'Bearer ' prefix

    // Verify the site exists and get its database credentials
    const { data: site } = await supabase
      .from('sites')
      .select('*')
      .eq('id', body.site_id)
      .eq('api_key', apiKey)
      .single()

    if (!site) {
      return new NextResponse('Site not found or invalid API key', { 
        status: 404,
        headers: corsHeaders()
      })
    }

    if (!site.is_configured || !site.db_url || !site.db_key) {
      return new NextResponse('Site database not configured', { 
        status: 400,
        headers: corsHeaders()
      })
    }

    // Extract project ref from URL
    const projectRef = site.db_url
      .replace('https://', '')
      .replace('.supabase.co', '')
      .split('/')[0]

    // Create client for the site's database
    const siteDb = createClient(
      `https://${projectRef}.supabase.co`,
      site.db_key
    )

    // Insert the analytics event
    const { error: insertError } = await siteDb
      .from('analytics_events')
      .insert([{
        ...body,
        created_at: new Date().toISOString()
      }])

    if (insertError) {
      console.error('Error inserting analytics:', insertError)
      throw insertError
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders() })
  } catch (error) {
    console.error('Error processing analytics:', error)
    return new NextResponse('Internal Server Error', { 
      status: 500,
      headers: corsHeaders()
    })
  }
} 