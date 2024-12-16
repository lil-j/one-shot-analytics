import { Suspense } from 'react'
import { Card } from '@/components/ui/card'
import { AddSiteModal } from '@/components/sites/AddSiteModal'
import { createServerClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

async function getSitesWithAnalytics() {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    console.error('Auth error:', userError)
    redirect('/login')
  }

  // Get all sites for the user
  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (sitesError) {
    console.error('Sites fetch error:', sitesError)
    return { sites: [], analytics: {} }
  }

  if (!sites || sites.length === 0) {
    return { sites: [], analytics: {} }
  }

  // Get analytics for each site from their respective databases
  const analytics = {}
  
  for (const site of sites) {
    if (!site.is_configured) {
      analytics[site.id] = {
        uniqueVisitors: 0,
        pageviews: 0,
        avgViewsPerVisit: 0
      }
      continue
    }

    try {
      // Extract project ref from URL
      const projectRef = site.db_url
        .replace('https://', '')
        .replace('.supabase.co', '')
        .split('/')[0]

      // Create client for this site's database
      const siteDb = createClient(
        `https://${projectRef}.supabase.co`,
        site.db_key
      )

      const { data: events, error: eventsError } = await siteDb
        .from('analytics_events')
        .select('*')
        .eq('site_id', site.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days

      if (eventsError) {
        console.error(`Analytics fetch error for site ${site.id}:`, eventsError)
        analytics[site.id] = {
          uniqueVisitors: 0,
          pageviews: 0,
          avgViewsPerVisit: 0
        }
        continue
      }

      const uniqueVisitors = new Set(events.map(e => e.session_id)).size
      const pageviews = events.length
      
      analytics[site.id] = {
        uniqueVisitors,
        pageviews,
        avgViewsPerVisit: pageviews / (uniqueVisitors || 1)
      }
    } catch (error) {
      console.error(`Error processing analytics for site ${site.id}:`, error)
      analytics[site.id] = {
        uniqueVisitors: 0,
        pageviews: 0,
        avgViewsPerVisit: 0
      }
    }
  }

  return { sites, analytics }
}

export default async function DashboardPage() {
  const { sites, analytics } = await getSitesWithAnalytics()

  // Calculate total metrics across all sites
  const totalPageviews = Object.values(analytics).reduce((sum: number, site: any) => sum + site.pageviews, 0)
  const totalVisitors = Object.values(analytics).reduce((sum: number, site: any) => sum + site.uniqueVisitors, 0)
  const avgViewsPerVisit = totalPageviews / (totalVisitors || 1)

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Analytics Dashboard</h1>
        <AddSiteModal />
      </div>

      {sites.length === 0 ? (
        <Card className="p-6">
          <p className="text-center text-muted-foreground">
            No sites added yet. Add your first site to start tracking analytics.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <Card className="p-6">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-medium text-muted-foreground">Total Sites</h3>
                <p className="text-2xl font-bold">{sites.length}</p>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-medium text-muted-foreground">Total Pageviews</h3>
                <p className="text-2xl font-bold">{totalPageviews}</p>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-medium text-muted-foreground">Total Visitors</h3>
                <p className="text-2xl font-bold">{totalVisitors}</p>
              </div>
            </Card>
          </div>

          <div className="grid gap-4">
            {sites.map((site) => (
              <Card key={site.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{site.name}</h3>
                    <p className="text-sm text-muted-foreground">{site.url}</p>
                  </div>
                  <Link href={`/dashboard/sites/${site.id}`}>
                    <Button>View Analytics</Button>
                  </Link>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Unique Visitors</p>
                    <p className="text-xl font-semibold">{analytics[site.id]?.uniqueVisitors || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pageviews</p>
                    <p className="text-xl font-semibold">{analytics[site.id]?.pageviews || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Views per Visit</p>
                    <p className="text-xl font-semibold">
                      {analytics[site.id]?.avgViewsPerVisit.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
} 