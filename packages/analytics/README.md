# @one-shot-analytics/react

A lightweight, privacy-focused analytics component for React and Next.js applications.

## Features

- 🪶 Lightweight and fast
- 🔒 Privacy-focused
- 🎯 Automatic page view tracking
- 📱 SPA support with automatic route change detection
- 🔄 Session tracking
- 📊 Referrer and user agent tracking
- 🗄️ Self-hosted data with Supabase

## Installation

```bash
npm install @one-shot-analytics/react
# or
yarn add @one-shot-analytics/react
# or
pnpm add @one-shot-analytics/react
```

## Quick Start

Add the Analytics component to your app's root layout:

```jsx
import { Analytics } from '@one-shot-analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics 
          siteId="your-site-id" 
          apiKey="your-api-key"
        />
      </body>
    </html>
  )
}
```

## Configuration

### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| siteId | string | Your site ID from One Shot Analytics | (required) |
| apiKey | string | Your API key from One Shot Analytics | (required) |
| endpoint | string | The analytics API endpoint URL | https://one-shot-analytics.vercel.app/api/analytics |

### Custom Endpoint

By default, the Analytics component sends data to our hosted service. If you're self-hosting the analytics service, you can specify your own endpoint:

```jsx
<Analytics 
  siteId="your-site-id" 
  apiKey="your-api-key"
  endpoint="https://your-analytics-service.com/api/analytics"
/>
```

## What Gets Tracked

The Analytics component automatically tracks:

- Page views
- Session information
- Referrer
- User agent information
- Route changes in SPAs
- Browser type
- Operating system
- Device type

## Privacy

One Shot Analytics is designed with privacy in mind:

- No cookies used
- No personal information collected
- No cross-site tracking
- Session IDs are randomly generated and temporary
- All data is stored in your own Supabase database

## Self-Hosted Data

Your analytics data is stored in your own Supabase project, giving you:

- Complete data ownership
- GDPR compliance
- No vendor lock-in
- Direct database access
- Custom queries and reporting

## Usage with Next.js App Router

The Analytics component is fully compatible with Next.js 13+ and the App Router:

```jsx
// app/layout.tsx
import { Analytics } from '@one-shot-analytics/react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics 
          siteId="your-site-id" 
          apiKey="your-api-key"
        />
      </body>
    </html>
  )
}
```

## Getting Your Credentials

1. Create an account at [one-shot-analytics.vercel.app](https://one-shot-analytics.vercel.app)
2. Add your site in the dashboard
3. Complete the setup wizard to get your `siteId` and `apiKey`

## Debugging

The Analytics component logs helpful information to the console in development:

- Successful pageview tracking
- Failed requests with error details
- Configuration issues

You can monitor these logs in your browser's developer tools console.

## License

MIT © One Shot Analytics