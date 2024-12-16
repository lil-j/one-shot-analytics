'use client'

import { useEffect } from 'react'

interface AnalyticsProps {
  siteId: string
  apiKey: string
  /**
   * The endpoint URL for the analytics API.
   * This should be the full URL of your analytics service.
   * Example: 'https://your-analytics-site.com/api/analytics'
   */
  endpoint?: string
}

function getBrowser(userAgent: string) {
  if (userAgent.includes('Chrome')) return 'Chrome'
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Safari')) return 'Safari'
  if (userAgent.includes('Edge')) return 'Edge'
  if (userAgent.includes('Opera')) return 'Opera'
  return 'Unknown'
}

function getOS(userAgent: string) {
  if (userAgent.includes('Windows')) return 'Windows'
  if (userAgent.includes('Mac')) return 'MacOS'
  if (userAgent.includes('Linux')) return 'Linux'
  if (userAgent.includes('Android')) return 'Android'
  if (userAgent.includes('iOS')) return 'iOS'
  return 'Unknown'
}

function getDevice(userAgent: string) {
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) return 'Tablet'
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) return 'Mobile'
  return 'Desktop'
}

export function Analytics({ 
  siteId, 
  apiKey, 
  endpoint = 'https://one-shot-analytics.vercel.app/api/analytics' 
}: AnalyticsProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const SESSION_ID = Math.random().toString(36).substring(2)
    const userAgent = window.navigator.userAgent
    
    async function sendAnalytics() {
      try {
        console.log('[One Shot Analytics] Sending pageview:', {
          url: window.location.href,
          siteId,
          endpoint
        })

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            site_id: siteId,
            event_type: 'pageview',
            page_url: window.location.href,
            referrer: document.referrer || null,
            user_agent: userAgent,
            browser: getBrowser(userAgent),
            os: getOS(userAgent),
            device: getDevice(userAgent),
            session_id: SESSION_ID,
            country: null, // Will be set by the server
            city: null // Will be set by the server
          })
        })

        if (!response.ok) {
          const text = await response.text()
          throw new Error(`Analytics request failed: ${text}`)
        }

        console.log('[One Shot Analytics] Pageview tracked successfully')
      } catch (error) {
        console.error('[One Shot Analytics] Failed to send analytics:', error)
      }
    }

    // Send analytics on page load
    sendAnalytics()

    // Send analytics on page navigation (for SPAs)
    let lastUrl = window.location.href
    const observer = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href
        sendAnalytics()
      }
    })

    observer.observe(document, { subtree: true, childList: true })

    return () => {
      observer.disconnect()
    }
  }, [siteId, apiKey, endpoint])

  return null
} 