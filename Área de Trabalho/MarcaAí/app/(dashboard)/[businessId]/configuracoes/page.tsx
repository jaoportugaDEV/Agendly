import { redirect } from 'next/navigation'
import { getUser } from '@/lib/actions/auth'
import { getUserBusinesses } from '@/lib/actions/business'
import { createClient } from '@/lib/supabase/server'
import { DeleteBusinessSection } from '@/components/settings/delete-business-section'
import { BrandCustomizationSection } from '@/components/settings/brand-customization-section'
import { HelpTooltip } from '@/components/help-tooltip'
import { OnboardingTour } from '@/components/onboarding-tour'
import { configuracoesTourSteps } from '@/lib/tours/dashboard-tours'
import { hslToHex } from '@/lib/utils/colors'

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

  // Buscar dados de customização
  const supabase = await createClient()
  const { data: business } = await supabase
    .from('businesses')
    .select('logo_url, custom_colors')
    .eq('id', params.businessId)
    .single()

  // Converter cores HSL para HEX para o color picker
  let currentColors
  if (business?.custom_colors) {
    currentColors = {
      primary: hslToHex(business.custom_colors.primary),
      secondary: hslToHex(business.custom_colors.secondary),
      accent: hslToHex(business.custom_colors.accent),
    }
  }

  return (
    <>
      <OnboardingTour steps={configuracoesTourSteps} tourKey="configuracoes" />
      
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">Configurações</h1>
          <HelpTooltip content="Configure a identidade visual da sua empresa e outras opções avançadas." />
        </div>

        {/* Customização de marca */}
        <div className="tour-brand-customization">
          <BrandCustomizationSection
            businessId={params.businessId}
            currentLogo={business?.logo_url}
            currentColors={currentColors}
          />
        </div>

        {/* Zona de perigo - Excluir empresa */}
        <DeleteBusinessSection
          businessId={params.businessId}
          businessName={currentBusiness.name}
        />
      </div>
    </>
  )
}
