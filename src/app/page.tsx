import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-8 items-center text-center max-w-2xl">
        <h1 className="text-5xl font-bold font-[family-name:var(--font-geist-sans)]">Drop Dead Analytics</h1>
        <p className="text-xl text-muted-foreground">
          Self-hosted analytics for your Next.js applications. Simple setup, powerful insights.
        </p>

        <div className="flex gap-4 mt-4">
          <Link href="/dashboard">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="https://github.com/yourusername/drop-dead-analytics" target="_blank">
            <Button variant="outline" size="lg">View on GitHub</Button>
          </Link>
        </div>

        <div className="mt-12 space-y-8">
          <div className="text-left">
            <h2 className="text-2xl font-bold mb-4">Quick Setup</h2>
            <div className="bg-muted p-4 rounded-lg font-[family-name:var(--font-geist-mono)] text-sm">
              <p>1. Install the package:</p>
              <pre className="bg-background p-2 rounded mt-2">npm install @drop-dead/analytics</pre>
              
              <p className="mt-4">2. Add to your app:</p>
              <pre className="bg-background p-2 rounded mt-2">
{`import { Analytics } from '@drop-dead/analytics'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics siteId="your-site-id" apiKey="your-api-key" />
      </body>
    </html>
  )
}`}
              </pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
