import { redirect } from 'next/navigation'
import { getUser, getUserMembership } from '@/lib/actions/auth'
import { getUserBusinesses } from '@/lib/actions/business'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/sidebar'
import { MobileSidebar } from '@/components/dashboard/mobile-sidebar'
import { UserMenu } from '@/components/dashboard/user-menu'
import { BusinessSwitcher } from '@/components/dashboard/business-switcher'
import { CustomizationProvider } from '@/components/providers/customization-provider'

export default async function BusinessLayout({
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

  // Verificar se o business existe e o usuário tem acesso
  const currentBusiness = businesses.find((b) => b.id === params.businessId)
  
  if (!currentBusiness) {
    // Redirecionar para o primeiro business se não tiver acesso ao solicitado
    redirect(`/${businesses[0].id}`)
  }

  // Get user membership to determine role
  const membership = await getUserMembership()
  const userRole = membership?.role || 'admin'

  // Buscar cores customizadas e avatar do usuário
  const supabase = await createClient()
  const { data: businessData } = await supabase
    .from('businesses')
    .select('custom_colors')
    .eq('id', params.businessId)
    .single()

  // Buscar dados do perfil do usuário (incluindo avatar)
  const { data: userProfile } = await supabase
    .from('users')
    .select('avatar_url, full_name')
    .eq('id', user.id)
    .single()

  // Extract user profile data
  const userData = {
    email: user.email,
    fullName: userProfile?.full_name || user.user_metadata?.full_name,
    avatarUrl: userProfile?.avatar_url,
  }

  return (
    <CustomizationProvider colors={businessData?.custom_colors}>
      <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-slate-200 dark:border-slate-700 shadow-xl">
        <Sidebar businessId={params.businessId} userRole={userRole} />
      </div>

      {/* Main Content */}
      <div className="flex-1 md:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-white via-blue-50/30 to-white dark:from-slate-900 dark:via-blue-950/20 dark:to-slate-900 backdrop-blur-sm shadow-sm">
          <div className="flex h-16 items-center gap-4 px-4">
            <MobileSidebar businessId={params.businessId} userRole={userRole} />
            
            <div className="flex-1 flex items-center gap-4">
              <div className="max-w-[200px]">
                <BusinessSwitcher
                  businesses={businesses}
                  currentBusinessId={params.businessId}
                />
              </div>
            </div>

            <UserMenu user={userData} businessId={params.businessId} />
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
    </CustomizationProvider>
  )
}
