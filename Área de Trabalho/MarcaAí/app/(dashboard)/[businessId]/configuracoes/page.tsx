import { redirect } from 'next/navigation'
import { getUser } from '@/lib/actions/auth'
import { getUserBusinesses } from '@/lib/actions/business'
import { createClient } from '@/lib/supabase/server'
import { DeleteBusinessSection } from '@/components/settings/delete-business-section'
import { BrandCustomizationSection } from '@/components/settings/brand-customization-section'
import { BusinessHoursSection } from '@/components/settings/business-hours-section'
import { HelpTooltip } from '@/components/help-tooltip'
import { OnboardingTour } from '@/components/onboarding-tour'
import { configuracoesTourSteps } from '@/lib/tours/dashboard-tours'

export default async function ConfiguracoesPage({
  params,
}: {
  params: { businessId: string }
}) {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  const businesses = await getUserBusinesses()
  const currentBusiness = businesses.find((b) => b.id === params.businessId)

  if (!currentBusiness) {
    redirect('/dashboard')
  }

  // Buscar logo da empresa
  const supabase = await createClient()
  const { data: business } = await supabase
    .from('businesses')
    .select('logo_url')
    .eq('id', params.businessId)
    .single()

  return (
    <>
      <OnboardingTour steps={configuracoesTourSteps} tourKey="configuracoes" />
      
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">Configurações</h1>
          <HelpTooltip content="Configure a identidade visual da sua empresa e outras opções avançadas." />
        </div>

        {/* Logo da empresa */}
        <div className="tour-brand-customization">
          <BrandCustomizationSection
            businessId={params.businessId}
            currentLogo={business?.logo_url}
          />
        </div>

        {/* Horários de Funcionamento */}
        <BusinessHoursSection businessId={params.businessId} />

        {/* Zona de perigo - Excluir empresa */}
        <DeleteBusinessSection
          businessId={params.businessId}
          businessName={currentBusiness.name}
        />
      </div>
    </>
  )
}
