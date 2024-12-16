'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

interface AnalyticsProps {
  siteId: string
  apiKey: string
}

export function Analytics({ siteId, apiKey }: AnalyticsProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const trackPageView = async () => {
      try {
        const event = {
          site_id: siteId,
          event_type: 'pageview',
          page_url: window.location.href,
          referrer: document.referrer,
          user_agent: window.navigator.userAgent,
          browser: getBrowser(),
          os: getOS(),
          device: getDevice(),
          session_id: getSessionId(),
        }

        await fetch('https://api.yourdomain.com/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify(event),
        })
      } catch (error) {
        console.error('Failed to track page view:', error)
      }
    }

    trackPageView()
  }, [pathname, searchParams, siteId, apiKey])

  return null
}

function getBrowser() {
  const ua = navigator.userAgent
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Safari')) return 'Safari'
  if (ua.includes('Edge')) return 'Edge'
  if (ua.includes('Opera')) return 'Opera'
  return 'Unknown'
}

function getOS() {
  const ua = navigator.userAgent
  if (ua.includes('Windows')) return 'Windows'
  if (ua.includes('Mac')) return 'MacOS'
  if (ua.includes('Linux')) return 'Linux'
  if (ua.includes('Android')) return 'Android'
  if (ua.includes('iOS')) return 'iOS'
  return 'Unknown'
}

function getDevice() {
  const ua = navigator.userAgent
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'Tablet'
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return 'Mobile'
  return 'Desktop'
}

function getSessionId() {
  let sessionId = sessionStorage.getItem('analytics_session_id')
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2, 15)
    sessionStorage.setItem('analytics_session_id', sessionId)
  }
  return sessionId
} 