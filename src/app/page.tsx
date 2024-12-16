import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowRight, BarChart2, Lock, Globe, Zap, Code, LineChart, Database } from 'lucide-react'
import Image from 'next/image'

const features = [
  {
    name: 'Privacy-First Analytics',
    description: 'Your data stays on your infrastructure. No third-party tracking or data sharing.',
    icon: Lock,
  },
  {
    name: 'Lightning Fast',
    description: 'Built for speed with real-time analytics and instant insights.',
    icon: Zap,
  },
  {
    name: 'Simple Integration',
    description: 'One line of code to add analytics to any website or app.',
    icon: Code,
  },
  {
    name: 'Self-Hosted',
    description: 'Deploy on your own infrastructure with complete control.',
    icon: Database,
  },
]

const metrics = [
  { name: 'Active Users', value: '100K+' },
  { name: 'Data Points', value: '1M+' },
  { name: 'Response Time', value: '<100ms' },
  { name: 'Uptime', value: '99.9%' },
]

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-8 h-14 flex items-center">
        <Link
          className="flex items-center gap-2 font-semibold"
          href="/"
        >
          <BarChart2 className="h-6 w-6" />
          <span>One Shot Analytics</span>
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link href="/login">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>
      <main className="flex-1">
        <section className="py-20 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                Privacy-First Analytics in{' '}
                <span className="text-indigo-600">One Shot</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Simple, powerful, and privacy-focused analytics that you can self-host.
                Get insights without compromising your users' data.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link href="/login">
                  <Button size="lg" className="gap-2">
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="https://github.com/yourusername/one-shot-analytics" target="_blank">
                  <Button variant="outline" size="lg">View on GitHub</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative isolate overflow-hidden bg-indigo-600 px-6 py-24 shadow-2xl rounded-3xl sm:px-24 xl:py-32">
              <h2 className="mx-auto max-w-2xl text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Get started in minutes
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-center text-lg leading-8 text-indigo-100">
                Add the package to your site and start getting insights immediately.
              </p>
              <div className="mt-8">
                <div className="bg-black/30 rounded-lg p-4">
                  <pre className="text-indigo-100 overflow-x-auto">
                    <code>npm install @one-shot-analytics/react</code>
                  </pre>
                </div>
              </div>
              <div className="mt-4">
                <div className="bg-black/30 rounded-lg p-4">
                  <pre className="text-indigo-100 overflow-x-auto">
                    <code>{`import { Analytics } from '@one-shot-analytics/react'

export default function App() {
  return (
    <>
      <Analytics siteId="your-site-id" />
      {/* Your app */}
    </>
  )
}`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl sm:text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need</h2>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Get powerful analytics without the complexity. One Shot Analytics provides everything you need to understand your users.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
                {features.map((feature) => (
                  <div key={feature.name} className="flex flex-col">
                    <dt className="text-base font-semibold leading-7">
                      <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                        <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                      </div>
                      {feature.name}
                    </dt>
                    <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                      <p className="flex-auto">{feature.description}</p>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="flex flex-col justify-center">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Beautiful dashboards that just work
                </h2>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                  Get instant insights with our intuitive dashboards. Track visitors,
                  page views, sources, and more in real-time.
                </p>
                <div className="mt-10">
                  <Link href="/login">
                    <Button size="lg" className="gap-2">
                      Try it now
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-gray-50">
                  <Image
                    src="/dashboard-preview.png"
                    alt="Dashboard preview"
                    width={800}
                    height={600}
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-px bg-white/5 sm:grid-cols-2 lg:grid-cols-4">
              {metrics.map((metric) => (
                <div key={metric.name} className="bg-white/5 p-8 backdrop-blur-xl">
                  <p className="text-sm font-medium leading-6 text-gray-600">{metric.name}</p>
                  <p className="mt-2 flex items-baseline gap-x-2">
                    <span className="text-4xl font-semibold tracking-tight text-indigo-600">
                      {metric.value}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to get started?
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Join thousands of developers who trust One Shot Analytics for their analytics needs.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link href="/login">
                  <Button size="lg" className="gap-2">
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t border-gray-900/10 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <p className="text-sm leading-6 text-gray-500">
              &copy; {new Date().getFullYear()} One Shot Analytics. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link href="/privacy" className="text-sm leading-6 text-gray-500 hover:text-gray-900">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm leading-6 text-gray-500 hover:text-gray-900">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
