'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient, createAnalyticsClient } from '@/lib/supabase/client'
import { Check, Copy, AlertCircle } from 'lucide-react'

export function SetupWizard({ site, initialStep = 1 }: { site: any, initialStep?: number }) {
  const [step, setStep] = useState(initialStep)
  const [projectUrl, setProjectUrl] = useState(site.db_url || '')
  const [serviceKey, setServiceKey] = useState(site.db_key || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  const [hasConfiguredSite, setHasConfiguredSite] = useState(false)
  const [siteData, setSiteData] = useState(site)
  const supabase = createClient()

  useEffect(() => {
    // Check if user has any configured sites
    async function checkConfiguredSites() {
      const { data: sites, error } = await supabase
        .from('sites')
        .select('id')
        .eq('is_configured', true)
        .limit(1)

      if (!error && sites && sites.length > 0) {
        setHasConfiguredSite(true)
        // If this is a new site and user has configured sites, skip to integration step
        if (!siteData.is_configured) {
          setStep(2)
        }
      }
    }

    checkConfiguredSites()
  }, [siteData.is_configured])

  const refreshSiteData = async () => {
    const { data: updatedSite } = await supabase
      .from('sites')
      .select('*')
      .eq('id', siteData.id)
      .single()

    if (updatedSite) {
      setSiteData(updatedSite)
    }
  }

  const testConnection = async () => {
    setLoading(true)
    setError(null)
    try {
      // If user has a configured site, copy its database settings
      if (hasConfiguredSite) {
        const { data: configuredSite } = await supabase
          .from('sites')
          .select('db_url, db_key')
          .eq('is_configured', true)
          .limit(1)
          .single()

        if (configuredSite) {
          // Update site with existing database credentials
          const { error: updateError } = await supabase
            .from('sites')
            .update({
              db_url: configuredSite.db_url,
              db_key: configuredSite.db_key,
              is_configured: true,
            })
            .eq('id', siteData.id)

          if (updateError) throw updateError
          await refreshSiteData()
          setSuccess(true)
          setStep(2)
          return
        }
      }

      // Otherwise, proceed with new database setup
      const projectRef = projectUrl
        .replace('https://', '')
        .replace('.supabase.co', '')
        .split('/')[0]

      const response = await fetch('/api/test-db-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectRef,
          serviceKey,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText)
      }

      // Update site with database credentials
      const { error: updateError } = await supabase
        .from('sites')
        .update({
          db_url: projectUrl,
          db_key: serviceKey,
          is_configured: true,
        })
        .eq('id', siteData.id)

      if (updateError) throw updateError
      await refreshSiteData()
      setSuccess(true)
      setStep(2)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const verifyIntegration = async () => {
    setVerifying(true)
    setError(null)
    try {
      // Refresh site data before verification
      await refreshSiteData()

      if (!siteData.db_url || !siteData.db_key) {
        throw new Error('Database configuration is missing. Please complete the setup first.')
      }

      // Create client for the site's database
      const projectRef = siteData.db_url
        .replace('https://', '')
        .replace('.supabase.co', '')
        .split('/')[0]

      if (!projectRef) {
        throw new Error('Invalid database URL format')
      }

      const siteDb = createAnalyticsClient(
        `https://${projectRef}.supabase.co`,
        siteData.db_key
      )
      
      // Just check for any data at all
      const { data: events, error: eventsError } = await siteDb
        .from('analytics_events')
        .select('id')
        .eq('site_id', siteData.id)
        .limit(1)

      if (eventsError) {
        console.error('Events query error:', eventsError)
        throw new Error('Failed to query analytics events. Please ensure your database is configured correctly.')
      }

      if (!events || events.length === 0) {
        throw new Error('No analytics data found yet. Make sure you have added the tracking code to your website and visited it.')
      }

      setVerified(true)
      setStep(3)
    } catch (err: any) {
      console.error('Verification error:', err)
      setError(err.message || 'Failed to verify integration')
    } finally {
      setVerifying(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getIntegrationCode = () => {
    return `// Install the package
npm install @one-shot-analytics/react

// Add to your app's root layout
import { Analytics } from '@one-shot-analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics 
          siteId="${siteData.id}"
          apiKey="${siteData.api_key}" 
        />
      </body>
    </html>
  )
}`
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {step === 1 && !hasConfiguredSite && (
          <>
            <div>
              <h2 className="text-lg font-semibold">Setup Your Analytics Database</h2>
              <p className="text-sm text-muted-foreground mt-1">
                You'll need a Supabase project to store your analytics data. This keeps your data under your control.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 text-blue-700 rounded-md">
                <h3 className="font-medium">Step 1: Create a Supabase Project</h3>
                <ol className="mt-2 list-decimal list-inside space-y-2 text-sm">
                  <li>Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline">supabase.com</a> and create a new project</li>
                  <li>Once created, go to Project Settings → API</li>
                  <li>Copy your Project URL and service_role key</li>
                </ol>
              </div>

              <div className="p-4 bg-amber-50 text-amber-700 rounded-md">
                <h3 className="font-medium">Important Security Note</h3>
                <p className="mt-2 text-sm">
                  We need your service role key to set up the analytics tables. This key has admin privileges,
                  so keep it secure and never expose it in client-side code. After setup, we'll use a restricted API key for tracking.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Project URL</label>
                <Input
                  value={projectUrl}
                  onChange={(e) => setProjectUrl(e.target.value)}
                  placeholder="https://xxx.supabase.co"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Find this in Project Settings → API → Project URL
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Service Role Key</label>
                <Input
                  value={serviceKey}
                  onChange={(e) => setServiceKey(e.target.value)}
                  type="password"
                  placeholder="service_role key"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Find this in Project Settings → API → service_role key
                </p>
              </div>

              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                  {error}
                </div>
              )}

              <Button
                onClick={testConnection}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Setting up database...' : 'Setup Analytics Database'}
              </Button>
            </div>
          </>
        )}

        {step === 1 && hasConfiguredSite && (
          <>
            <div>
              <h2 className="text-lg font-semibold">Configure Analytics</h2>
              <p className="text-sm text-muted-foreground mt-1">
                We'll use your existing analytics database for this site.
              </p>
            </div>

            <Button
              onClick={testConnection}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Configuring...' : 'Use Existing Database'}
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <h2 className="text-lg font-semibold">Add Analytics to Your Site</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Install our npm package and add the Analytics component to your app.
              </p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <pre className="p-4 bg-gray-900 text-gray-100 rounded-md text-sm overflow-x-auto">
                  {getIntegrationCode()}
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(getIntegrationCode())}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div className="p-4 bg-blue-50 text-blue-700 rounded-md space-y-2">
                <h3 className="font-medium flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Integration Instructions
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Install the <code>@one-shot-analytics/react</code> package using your package manager</li>
                  <li>Add the Analytics component to your app's root layout</li>
                  <li>Deploy your website with the changes</li>
                  <li>Visit your website to generate some test data</li>
                  <li>Click the verify button below to check the integration</li>
                </ol>
              </div>

              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Integration Not Verified</p>
                    <p className="mt-1">{error}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                {initialStep === 2 && (
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="flex-1"
                  >
                    Back to Dashboard
                  </Button>
                )}
                <Button
                  onClick={verifyIntegration}
                  disabled={verifying}
                  className="flex-1"
                >
                  {verifying ? 'Verifying...' : 'Verify Integration'}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <Check className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-semibold">Analytics Verified!</h2>
              <p className="text-sm text-muted-foreground mt-1">
                We've detected analytics data from your site. You can now view your dashboard.
              </p>
            </div>

            <Button
              onClick={() => window.location.reload()}
              className="w-full"
            >
              View Dashboard
            </Button>
          </>
        )}
      </div>
    </Card>
  )
} 