import { redirect } from 'next/navigation'
import { getUser } from '@/lib/actions/auth'
import { getUserBusinesses } from '@/lib/actions/business'
import { Sidebar } from '@/components/dashboard/sidebar'
import { MobileSidebar } from '@/components/dashboard/mobile-sidebar'
import { UserMenu } from '@/components/dashboard/user-menu'
import { BusinessSwitcher } from '@/components/dashboard/business-switcher'

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { businessId: string }
}) {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  const businesses = await getUserBusinesses()

  if (businesses.length === 0) {
    redirect('/onboarding')
  }

  // Extract user profile data
  const userData = {
    email: user.email,
    fullName: user.user_metadata?.full_name,
    avatarUrl: user.user_metadata?.avatar_url,
  }

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r bg-card">
        <Sidebar businessId={params?.businessId} />
      </div>

      {/* Main Content */}
      <div className="flex-1 md:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center gap-4 px-4">
            <MobileSidebar businessId={params?.businessId} />
            
            <div className="flex-1 flex items-center gap-4">
              <div className="max-w-[200px]">
                <BusinessSwitcher
                  businesses={businesses}
                  currentBusinessId={params?.businessId}
                />
              </div>
            </div>

            <UserMenu user={userData} />
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
