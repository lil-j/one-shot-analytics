import { Card } from '@/components/ui/card'
import { AddSiteModal } from '@/components/sites/AddSiteModal'
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect('/login')
  }

  const { data: sites, error } = await supabase
    .from('sites')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 text-red-500 p-4 rounded-md">
          Error: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Sites</h1>
        <AddSiteModal />
      </div>

      {(!sites || sites.length === 0) ? (
        <Card className="p-12 text-center">
          <h2 className="text-xl font-semibold mb-2">Welcome to One Shot Analytics!</h2>
          <p className="text-muted-foreground mb-4">
            Get started by adding your first site to track.
          </p>
          <AddSiteModal />
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => (
            <Link key={site.id} href={`/dashboard/sites/${site.id}`}>
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">{site.name}</h2>
                  {site.is_configured ? (
                    <div className="bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs">
                      Active
                    </div>
                  ) : (
                    <div className="bg-amber-50 text-amber-700 px-2 py-1 rounded-full text-xs">
                      Setup Required
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate mb-4">{site.url}</p>
                <div className="text-sm text-muted-foreground">
                  Added {new Date(site.created_at).toLocaleDateString()}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
} 