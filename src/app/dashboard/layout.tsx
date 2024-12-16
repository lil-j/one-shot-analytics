import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { DashboardNav } from '@/components/dashboard/nav'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/')
  }

  return (
    <div className={`min-h-screen bg-background ${inter.className}`}>
      <DashboardNav user={user} />
      {children}
    </div>
  )
} 