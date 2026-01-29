import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function BusinessDashboardPage({
  params,
}: {
  params: { businessId: string }
}) {
  const supabase = await createClient()

  // Buscar informações da empresa para pegar a moeda
  const { data: business } = await supabase
    .from('businesses')
    .select('currency')
    .eq('id', params.businessId)
    .single()

  if (!business) {
    redirect('/onboarding')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Acompanhe o desempenho do seu negócio
        </p>
      </div>

      <AnalyticsDashboard 
        businessId={params.businessId}
        currency={business.currency}
      />
    </div>
  )
}
