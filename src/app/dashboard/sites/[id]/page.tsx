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
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowDown, ArrowUp, Users, Link as LinkIcon, Search, Filter } from 'lucide-react'
import Image from 'next/image'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface AnalyticsEvent {
  page_url: string
  referrer: string | null
  session_id: string
  created_at: string
  site_id: string
}

interface PageView {
  page_url: string
  count: number
}

interface Source {
  referrer: string
  count: number
}

type SourceViewType = 'channels' | 'sources' | 'campaigns'

// Channel grouping rules
const CHANNEL_GROUPS: Record<string, (referrer: string) => boolean> = {
  'Social': (ref) => /facebook|twitter|linkedin|instagram|youtube|pinterest|tiktok|reddit/i.test(ref),
  'Search': (ref) => /google|bing|yahoo|duckduckgo|baidu/i.test(ref),
  'Direct': (ref) => ref === 'Direct / None',
  'Email': (ref) => /gmail|outlook|yahoo|mail/i.test(ref),
  'Other': () => true, // Catch-all
}

type TimePeriod = 'realtime' | 'day' | 'yesterday' | '7d' | '30d' | 'month' | 'lastMonth' | '12mo' | 'all'

interface TimePeriodOption {
  label: string
  value: TimePeriod
  shortcut: string
  description?: string
}

const TIME_PERIODS: TimePeriodOption[] = [
  { label: 'Today', value: 'day', shortcut: 'D' },
  { label: 'Yesterday', value: 'yesterday', shortcut: 'E' },
  { label: 'Realtime', value: 'realtime', shortcut: 'R' },
  { label: 'Last 7 Days', value: '7d', shortcut: 'W' },
  { label: 'Last 30 Days', value: '30d', shortcut: 'T' },
  { label: 'Month to Date', value: 'month', shortcut: 'M' },
  { label: 'Last Month', value: 'lastMonth', shortcut: 'L' },
  { label: 'Year to Date', value: 'all', shortcut: 'Y' },
  { label: 'Last 12 Months', value: '12mo', shortcut: 'A' },
]

interface MetricOption {
  key: 'pageviews' | 'uniqueVisitors' | 'bounceRate' | 'visitDuration'
  label: string
  formatter: (value: number) => string
  color: string
}

const METRICS: MetricOption[] = [
  { 
    key: 'pageviews', 
    label: 'Total Pageviews',
    formatter: (v) => v.toLocaleString(),
    color: '#3b82f6'
  },
  { 
    key: 'uniqueVisitors', 
    label: 'Unique Visitors',
    formatter: (v) => v.toLocaleString(),
    color: '#8b5cf6'
  },
  { 
    key: 'bounceRate', 
    label: 'Bounce Rate',
    formatter: (v) => `${Math.round(v)}%`,
    color: '#10b981'
  },
  { 
    key: 'visitDuration', 
    label: 'Visit Duration',
    formatter: (v) => `${Math.floor(v / 60)}m ${v % 60}s`,
    color: '#f59e0b'
  }
]

export default function SitePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const searchParams = useSearchParams()
  const [site, setSite] = useState<any>(null)
  const [analytics, setAnalytics] = useState<any[]>([])
  const [currentVisitors, setCurrentVisitors] = useState(0)
  const [topPages, setTopPages] = useState<PageView[]>([])
  const [topSources, setTopSources] = useState<Source[]>([])
  const [campaigns, setCampaigns] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const [sourceViewType, setSourceViewType] = useState<SourceViewType>('channels')
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('30d')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<MetricOption>(METRICS[0])
  const [confirmDelete, setConfirmDelete] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  async function loadSiteData(period: TimePeriod = timePeriod) {
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
          siteData.db_key
        )

        // First check if we have any data at all
        const { data: anyData, error: anyDataError } = await siteDb
          .from('analytics_events')
          .select('id')
          .eq('site_id', resolvedParams.id)
          .limit(1)

        if (anyDataError) {
          console.error('Data check error:', anyDataError)
          throw new Error('Unable to access analytics data. Please ensure setup completed successfully.')
        }

        // If no data at all, mark site as not configured to show setup wizard
        if (!anyData || anyData.length === 0) {
          setSite({ ...siteData, is_configured: false })
          return
        }
        
        // Calculate date range based on period
        const now = new Date()
        let startDate = new Date()
        
        switch (period) {
          case 'realtime':
            startDate.setMinutes(startDate.getMinutes() - 30)
            break
          case 'day':
            startDate.setHours(0, 0, 0, 0)
            break
          case 'yesterday':
            startDate.setDate(startDate.getDate() - 1)
            startDate.setHours(0, 0, 0, 0)
            now.setDate(now.getDate() - 1)
            now.setHours(23, 59, 59, 999)
            break
          case '7d':
            startDate.setDate(startDate.getDate() - 7)
            break
          case '30d':
            startDate.setDate(startDate.getDate() - 30)
            break
          case 'month':
            startDate.setDate(1)
            startDate.setHours(0, 0, 0, 0)
            break
          case 'lastMonth':
            startDate.setMonth(startDate.getMonth() - 1, 1)
            now.setDate(0)
            break
          case '12mo':
            startDate.setFullYear(startDate.getFullYear() - 1)
            break
          case 'all':
            startDate = new Date(0)
            break
        }

        // First verify the table exists
        const { error: tableCheckError } = await siteDb
          .from('analytics_events')
          .select('id')
          .limit(1)

        if (tableCheckError) {
          console.error('Table check error:', tableCheckError)
          throw new Error('Unable to access analytics data. Please ensure setup completed successfully.')
        }

        // Get current visitors (events in last 5 minutes)
        const fiveMinutesAgo = new Date()
        fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5)
        const { data: currentVisitorEvents } = await siteDb
          .from('analytics_events')
          .select('session_id')
          .eq('site_id', resolvedParams.id)
          .gte('created_at', fiveMinutesAgo.toISOString())

        if (currentVisitorEvents) {
          const uniqueSessions = new Set(currentVisitorEvents.map(e => e.session_id))
          setCurrentVisitors(uniqueSessions.size)
        }

        // Get daily analytics
        const { data: events, error: eventsError } = await siteDb
          .from('analytics_events')
          .select('*')
          .eq('site_id', resolvedParams.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', now.toISOString())
          .order('created_at', { ascending: true })

        if (eventsError) {
          console.error('Events query error:', eventsError)
          throw eventsError
        }

        // Process daily analytics
        const dailyData = events.reduce((acc: any, event: any) => {
          const date = new Date(event.created_at).toLocaleDateString()
          if (!acc[date]) {
            acc[date] = {
              date,
              pageviews: 0,
              uniqueVisitors: new Set(),
              bounceRate: 0,
              visitDuration: 0
            }
          }
          acc[date].pageviews++
          acc[date].uniqueVisitors.add(event.session_id)
          return acc
        }, {})

        // Calculate bounce rate and visit duration
        const chartData = Object.values(dailyData).map((day: any) => ({
          date: day.date,
          pageviews: day.pageviews,
          uniqueVisitors: day.uniqueVisitors.size,
          bounceRate: Math.round(Math.random() * 100), // Placeholder - need to implement actual calculation
          visitDuration: Math.round(Math.random() * 300) // Placeholder - need to implement actual calculation
        }))

        setAnalytics(chartData)

        // Get top pages
        const pageViews = events.reduce((acc: Record<string, number>, event: AnalyticsEvent) => {
          try {
            const url = new URL(event.page_url)
            const pathname = url.pathname
            acc[pathname] = (acc[pathname] || 0) + 1
          } catch (err) {
            // If URL is invalid, use the raw page_url
            acc[event.page_url] = (acc[event.page_url] || 0) + 1
          }
          return acc
        }, {})

        const sortedPages = Object.entries(pageViews)
          .map(([url, count]) => ({ page_url: url, count: count as number }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)

        setTopPages(sortedPages)

        // Get top sources
        const sources = events.reduce((acc: Record<string, number>, event: AnalyticsEvent) => {
          let referrer = 'Direct / None'
          if (event.referrer) {
            try {
              const url = new URL(event.referrer)
              referrer = url.hostname
            } catch (err) {
              // If URL is invalid, use the raw referrer
              referrer = event.referrer
            }
          }
          acc[referrer] = (acc[referrer] || 0) + 1
          return acc
        }, {})

        const sortedSources = Object.entries(sources)
          .map(([referrer, count]) => ({ referrer, count: count as number }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)

        setTopSources(sortedSources)

        // Process campaign data
        const campaignData = events.reduce((acc: Record<string, number>, event: AnalyticsEvent) => {
          try {
            const url = new URL(event.page_url)
            const campaign = url.searchParams.get('utm_campaign')
            if (campaign) {
              acc[campaign] = (acc[campaign] || 0) + 1
            }
          } catch (err) {
            // Skip invalid URLs
            console.debug('Invalid URL:', event.page_url)
          }
          return acc
        }, {} as Record<string, number>)

        const sortedCampaigns = Object.entries(campaignData)
          .map(([campaign, count]) => ({ referrer: campaign, count: count as number }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)

        setCampaigns(sortedCampaigns)
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

  // Add loadSiteData to useEffect dependencies
  useEffect(() => {
    loadSiteData()
    const interval = setInterval(() => loadSiteData(), 60000)
    return () => clearInterval(interval)
  }, [resolvedParams.id, supabase, router, timePeriod])

  // Handle keyboard shortcuts
  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      const period = TIME_PERIODS.find(p => p.shortcut.toLowerCase() === e.key.toLowerCase())
      if (period) {
        setTimePeriod(period.value)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

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
    const initialStep = parseInt(searchParams.get('step') || '1')
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">{site.name}</h1>
          <p className="text-muted-foreground">{site.url}</p>
        </div>
        <SetupWizard site={site} initialStep={initialStep} />
      </div>
    )
  }

  // Check if we have any data at all (not just for current period)
  const hasAnyData = site.is_configured && !loading && analytics.length > 0

  if (!analytics.length) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-bold">{site.name}</h1>
              <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full">
                <Users size={16} />
                <span>{currentVisitors} current visitors</span>
              </div>
            </div>
            <p className="text-muted-foreground">{site.url}</p>
          </div>
          <div className="flex items-center gap-4">
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter size={16} />
                  {TIME_PERIODS.find(p => p.value === timePeriod)?.label}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="end">
                <div className="py-2">
                  {TIME_PERIODS.map((period) => (
                    <button
                      key={period.value}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center justify-between ${
                        timePeriod === period.value ? 'text-indigo-600 bg-indigo-50' : ''
                      }`}
                      onClick={() => {
                        setTimePeriod(period.value)
                        setIsFilterOpen(false)
                        loadSiteData(period.value)
                      }}
                    >
                      <span>{period.label}</span>
                      <kbd className="px-2 py-0.5 text-xs bg-gray-100 rounded">
                        {period.shortcut}
                      </kbd>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Card className="p-6 mt-8">
          <div className="text-center">
            {!hasAnyData ? (
              <>
                <h2 className="text-lg font-semibold">No Analytics Data Found</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  We haven't received any analytics data from your site yet.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => router.push(`/dashboard/sites/${site.id}?step=2`)}
                >
                  View Integration Instructions
                </Button>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold">No Data for Selected Period</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  There is no analytics data for {TIME_PERIODS.find(p => p.value === timePeriod)?.label.toLowerCase()}.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try selecting a different time period.
                </p>
              </>
            )}
          </div>
        </Card>
      </div>
    )
  }

  // Calculate total metrics and changes
  const totalPageviews = analytics.reduce((sum, day) => sum + day.pageviews, 0)
  const totalVisitors = analytics.reduce((sum, day) => sum + day.uniqueVisitors, 0)
  const avgViewsPerVisit = totalPageviews / (totalVisitors || 1)
  const avgBounceRate = analytics.reduce((sum, day) => sum + day.bounceRate, 0) / analytics.length
  const avgVisitDuration = analytics.reduce((sum, day) => sum + day.visitDuration, 0) / analytics.length

  // Calculate changes (placeholder - need to implement actual calculation)
  const pageviewsChange = -89
  const visitorsChange = -80
  const bounceRateChange = 8
  const durationChange = -13

  // Group sources by channel
  const groupedSources = topSources.reduce((acc: Record<string, number>, source) => {
    for (const [channel, matcher] of Object.entries(CHANNEL_GROUPS)) {
      if (matcher(source.referrer)) {
        acc[channel] = (acc[channel] || 0) + source.count
        break
      }
    }
    return acc
  }, {})

  const sortedGroupedSources = Object.entries(groupedSources)
    .map(([channel, count]) => ({ referrer: channel, count }))
    .sort((a, b) => b.count - a.count)

  // Function to get current view data
  const getCurrentViewData = () => {
    switch (sourceViewType) {
      case 'channels':
        return sortedGroupedSources
      case 'campaigns':
        return campaigns
      default:
        return topSources
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      const { data, error } = await supabase
        .from('sites')
        .delete()
        .eq('id', resolvedParams.id)

      if (error) {
        console.error('Error deleting site:', error)
        setError('An error occurred while deleting the site.')
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error deleting site:', error)
      setError('An error occurred while deleting the site.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-bold">{site.name}</h1>
            <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full">
              <Users size={16} />
              <span>{currentVisitors} current visitors</span>
            </div>
          </div>
          <p className="text-muted-foreground">{site.url}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Search className="text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search..."
              className="px-3 py-1.5 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                Delete Site
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Site</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this site? This will permanently remove all analytics data.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-3 bg-amber-50 text-amber-700 rounded-md text-sm">
                  <p className="font-medium">Warning</p>
                  <p>This action cannot be undone. All analytics data for {site.name} will be permanently deleted.</p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      Yes, Delete Site
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Final Confirmation</DialogTitle>
                      <DialogDescription>
                        Please type the site name to confirm deletion
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Type site name here"
                        value={confirmDelete}
                        onChange={(e) => setConfirmDelete(e.target.value)}
                      />
                      <Button
                        variant="destructive"
                        className="w-full"
                        disabled={confirmDelete !== site.name || isDeleting}
                        onClick={handleDelete}
                      >
                        {isDeleting ? 'Deleting...' : 'Permanently Delete Site'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </DialogContent>
          </Dialog>
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter size={16} />
                {TIME_PERIODS.find(p => p.value === timePeriod)?.label}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="end">
              <div className="py-2">
                {TIME_PERIODS.map((period) => (
                  <button
                    key={period.value}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center justify-between ${
                      timePeriod === period.value ? 'text-indigo-600 bg-indigo-50' : ''
                    }`}
                    onClick={() => {
                      setTimePeriod(period.value)
                      setIsFilterOpen(false)
                      loadSiteData(period.value)
                    }}
                  >
                    <span>{period.label}</span>
                    <kbd className="px-2 py-0.5 text-xs bg-gray-100 rounded">
                      {period.shortcut}
                    </kbd>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {METRICS.map((metric) => {
          const value = metric.key === 'pageviews' ? totalPageviews
            : metric.key === 'uniqueVisitors' ? totalVisitors
            : metric.key === 'bounceRate' ? avgBounceRate
            : avgVisitDuration

          const change = metric.key === 'pageviews' ? pageviewsChange
            : metric.key === 'uniqueVisitors' ? visitorsChange
            : metric.key === 'bounceRate' ? bounceRateChange
            : durationChange

          const isSelected = selectedMetric.key === metric.key

          return (
            <Card 
              key={metric.key}
              className={`p-6 cursor-pointer transition-colors ${
                isSelected ? 'ring-2 ring-indigo-500 bg-indigo-50/50' : 'hover:bg-gray-50'
              }`}
              onClick={() => setSelectedMetric(metric)}
            >
              <h3 className="text-sm font-medium text-muted-foreground">{metric.label}</h3>
              <p className="text-2xl font-bold mt-2">{metric.formatter(value)}</p>
              <div className="flex items-center gap-1 text-sm mt-1">
                {change > 0 ? (
                  <ArrowUp className="text-green-500" size={16} />
                ) : (
                  <ArrowDown className="text-red-500" size={16} />
                )}
                <span className={change > 0 ? 'text-green-500' : 'text-red-500'}>
                  {Math.abs(change)}%
                </span>
                <span className="text-muted-foreground">vs previous period</span>
              </div>
            </Card>
          )
        })}
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{selectedMetric.label}</h2>
          <div className="text-sm text-muted-foreground">
            {TIME_PERIODS.find(p => p.value === timePeriod)?.label}
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={selectedMetric.key} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={selectedMetric.color} stopOpacity={0.1}/>
                  <stop offset="95%" stopColor={selectedMetric.color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(date) => {
                  const d = new Date(date)
                  return timePeriod === 'day' || timePeriod === 'realtime'
                    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : d.toLocaleDateString([], { 
                        month: 'short', 
                        day: 'numeric',
                        ...(timePeriod === '12mo' && { year: '2-digit' })
                      })
                }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={40}
                tickFormatter={(value) => selectedMetric.formatter(value)}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #eee',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
                formatter={(value: number) => [selectedMetric.formatter(value), selectedMetric.label]}
                labelFormatter={(label) => {
                  const d = new Date(label)
                  return timePeriod === 'day' || timePeriod === 'realtime'
                    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : d.toLocaleDateString([], { 
                        weekday: 'short',
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })
                }}
              />
              <Area
                type="monotone"
                dataKey={selectedMetric.key}
                stroke={selectedMetric.color}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#${selectedMetric.key})`}
                name={selectedMetric.label}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Top Sources</h2>
              <div className="flex items-center gap-2 text-sm">
                <button 
                  className={`font-medium ${sourceViewType === 'channels' ? 'text-indigo-600' : 'text-gray-500'}`}
                  onClick={() => setSourceViewType('channels')}
                >
                  Channels
                </button>
                <button 
                  className={`font-medium ${sourceViewType === 'sources' ? 'text-indigo-600' : 'text-gray-500'}`}
                  onClick={() => setSourceViewType('sources')}
                >
                  Sources
                </button>
                <button 
                  className={`font-medium ${sourceViewType === 'campaigns' ? 'text-indigo-600' : 'text-gray-500'}`}
                  onClick={() => setSourceViewType('campaigns')}
                >
                  Campaigns
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {getCurrentViewData().map((source) => {
                const maxCount = getCurrentViewData()[0]?.count || 1
                const percentage = (source.count / maxCount) * 100
                const isDirectTraffic = source.referrer === 'Direct / None' || source.referrer === 'Direct'
                const showFavicon = sourceViewType === 'sources' && !isDirectTraffic
                const faviconUrl = showFavicon 
                  ? `https://www.google.com/s2/favicons?domain=${source.referrer}&sz=32`
                  : null

                return (
                  <div key={source.referrer} className="relative">
                    <div 
                      className="absolute inset-0 bg-blue-50 rounded" 
                      style={{ width: `${percentage}%` }}
                    />
                    <div className="relative flex justify-between items-center p-2">
                      <div className="flex items-center gap-2">
                        {isDirectTraffic ? (
                          <LinkIcon size={16} className="text-gray-500" />
                        ) : showFavicon && faviconUrl ? (
                          <Image
                            src={faviconUrl}
                            alt={source.referrer}
                            width={16}
                            height={16}
                            className="rounded-sm"
                          />
                        ) : null}
                        <span className="text-sm">{source.referrer}</span>
                      </div>
                      <span className="text-sm font-medium">{source.count}</span>
                    </div>
                  </div>
                )
              })}
              {sourceViewType === 'campaigns' && campaigns.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No campaign data available
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Top Pages</h2>
          <div className="space-y-4">
            {topPages.map((page, index) => {
              const maxCount = topPages[0].count
              const percentage = (page.count / maxCount) * 100

              return (
                <div key={page.page_url} className="relative">
                  <div 
                    className="absolute inset-0 bg-blue-50 rounded" 
                    style={{ width: `${percentage}%` }}
                  />
                  <div className="relative flex justify-between items-center p-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{page.page_url}</span>
                    </div>
                    <span className="text-sm font-medium">{page.count}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
} 