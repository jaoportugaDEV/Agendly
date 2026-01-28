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

  // Extract user profile data
  const userData = {
    email: user.email,
    fullName: user.user_metadata?.full_name,
    avatarUrl: user.user_metadata?.avatar_url,
  }

  // Get user membership to determine role
  const membership = await getUserMembership()
  const userRole = membership?.role || 'admin'

  // Buscar cores customizadas e logo
  const supabase = await createClient()
  const { data: businessData } = await supabase
    .from('businesses')
    .select('custom_colors, logo_url, name')
    .eq('id', params.businessId)
    .single()

  return (
    <CustomizationProvider colors={businessData?.custom_colors}>
      <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r bg-card">
        <Sidebar 
          businessId={params.businessId} 
          userRole={userRole}
          logoUrl={businessData?.logo_url}
          businessName={businessData?.name}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 md:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center gap-4 px-4">
            <MobileSidebar 
              businessId={params.businessId} 
              userRole={userRole}
              logoUrl={businessData?.logo_url}
              businessName={businessData?.name}
            />
            
            <div className="flex items-center gap-4">
              <div className="max-w-[200px]">
                <BusinessSwitcher
                  businesses={businesses}
                  currentBusinessId={params.businessId}
                />
              </div>
            </div>

            {/* Logo da Empresa no Centro */}
            <div className="flex-1 flex justify-center">
              {businessData?.logo_url && (
                <div className="relative h-10 w-10">
                  <img
                    src={businessData.logo_url}
                    alt={businessData?.name || 'Logo'}
                    className="h-full w-full object-contain"
                  />
                </div>
              )}
            </div>

            <UserMenu user={userData} />
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
    </CustomizationProvider>
  )
}
