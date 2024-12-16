'use client'

import { useEffect, useState, use } from 'react'
import { Card } from '@/components/ui/card'
import { createClient, createAnalyticsClient } from '@/lib/supabase/client'
import { SetupWizard } from '@/components/sites/SetupWizard'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function SitePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [site, setSite] = useState<any>(null)
  const [analytics, setAnalytics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadSiteData() {
      try {
        // Get site details
        const { data: siteData, error: siteError } = await supabase
          .from('sites')
          .select('*')
          .eq('id', resolvedParams.id)
          .single()

        if (siteError) throw siteError
        if (!siteData) throw new Error('Site not found')

        setSite(siteData)

        // Only fetch analytics if database is configured
        if (siteData.is_configured) {
          // Create client for the site's database using service role key
          const siteDb = createAnalyticsClient(
            siteData.db_url,
            siteData.db_key // This is already the service role key from setup
          )
          
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

          // First verify the table exists
          const { error: tableCheckError } = await siteDb
            .from('analytics_events')
            .select('id')
            .limit(1)

          if (tableCheckError) {
            console.error('Table check error:', tableCheckError)
            throw new Error('Unable to access analytics data. Please ensure setup completed successfully.')
          }

          const { data: events, error: eventsError } = await siteDb
            .from('analytics_events')
            .select('*')
            .eq('site_id', resolvedParams.id)
            .gte('created_at', thirtyDaysAgo.toISOString())
            .order('created_at', { ascending: true })

          if (eventsError) {
            console.error('Events query error:', eventsError)
            throw eventsError
          }

          // Process analytics data
          const dailyData = (events || []).reduce((acc: any, event: any) => {
            const date = new Date(event.created_at).toLocaleDateString()
            if (!acc[date]) {
              acc[date] = {
                date,
                pageviews: 0,
                uniqueVisitors: new Set()
              }
            }
            acc[date].pageviews++
            acc[date].uniqueVisitors.add(event.session_id)
            return acc
          }, {})

          // Convert to array and calculate final unique visitors count
          const chartData = Object.values(dailyData).map((day: any) => ({
            date: day.date,
            pageviews: day.pageviews,
            uniqueVisitors: day.uniqueVisitors.size
          }))

          setAnalytics(chartData)
        }
      } catch (err: any) {
        console.error('Error loading site data:', err)
        setError(err.message)
        if (err.message.includes('not found')) {
          router.push('/dashboard')
        }
      } finally {
        setLoading(false)
      }
    }

    loadSiteData()
  }, [resolvedParams.id, supabase, router])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-6">
          <p className="text-red-500">Error: {error}</p>
          <p className="text-sm text-muted-foreground mt-2">
            If this persists, try running the setup wizard again.
          </p>
        </Card>
      </div>
    )
  }

  if (!site.is_configured) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">{site.name}</h1>
          <p className="text-muted-foreground">{site.url}</p>
        </div>
        <SetupWizard site={site} />
      </div>
    )
  }

  if (!analytics.length) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">{site.name}</h1>
          <p className="text-muted-foreground">{site.url}</p>
        </div>
        {step === 1 ? (
          <Card className="p-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold">Waiting for Data</h2>
              <p className="text-sm text-muted-foreground mt-1">
                No analytics data found yet. Make sure you've added the tracking code to your website.
              </p>
              <Button
                className="mt-4"
                onClick={() => setStep(2)}
              >
                View Integration Instructions
              </Button>
            </div>
          </Card>
        ) : (
          <SetupWizard site={site} initialStep={2} />
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">{site.name}</h1>
          <p className="text-muted-foreground">{site.url}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Total Pageviews</h3>
          <p className="text-2xl font-bold">
            {analytics.reduce((sum, day) => sum + day.pageviews, 0)}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Unique Visitors</h3>
          <p className="text-2xl font-bold">
            {analytics.reduce((sum, day) => sum + day.uniqueVisitors, 0)}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Avg. Views per Visit</h3>
          <p className="text-2xl font-bold">
            {(analytics.reduce((sum, day) => sum + day.pageviews, 0) / 
              Math.max(1, analytics.reduce((sum, day) => sum + day.uniqueVisitors, 0))).toFixed(2)}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Traffic Overview</h2>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="pageviews"
                stroke="#2563eb"
                name="Pageviews"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="uniqueVisitors"
                stroke="#16a34a"
                name="Unique Visitors"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
} 