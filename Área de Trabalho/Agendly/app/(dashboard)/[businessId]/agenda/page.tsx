import { redirect } from 'next/navigation'
import { getUser } from '@/lib/actions/auth'
import { getAppointments } from '@/lib/actions/appointments'
import { getServices } from '@/lib/actions/services'
import { getStaffMembers } from '@/lib/actions/staff'
import { AgendaPageClient } from '@/components/appointments/agenda-page-client'
import { createClient } from '@/lib/supabase/server'

export default async function AgendaPage({
  params,
}: {
  params: { businessId: string }
}) {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  // Buscar dados iniciais
  const [appointmentsResult, servicesResult, staffResult] = await Promise.all([
    getAppointments(params.businessId),
    getServices(params.businessId),
    getStaffMembers(params.businessId),
  ])

  if (!appointmentsResult.success) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Agenda</h1>
        <p className="text-destructive">
          Erro ao carregar agendamentos: {appointmentsResult.error}
        </p>
      </div>
    )
  }

  const appointments = appointmentsResult.data || []
  const services = servicesResult.success ? servicesResult.data || [] : []
  const staff = staffResult.success ? staffResult.data || [] : []

  // Buscar moeda da empresa
  const supabase = await createClient()
  const { data: business } = await supabase
    .from('businesses')
    .select('country_code')
    .eq('id', params.businessId)
    .single()

  const currency = business?.country_code === 'PT' ? 'EUR' : 'BRL'

  return (
    <AgendaPageClient
      businessId={params.businessId}
      initialAppointments={appointments}
      services={services}
      staff={staff}
      currentUserId={user.id}
      currency={currency}
    />
  )
}
