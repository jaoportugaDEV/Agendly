import { redirect } from 'next/navigation'
import { getUser } from '@/lib/actions/auth'
import { getAppointments } from '@/lib/actions/appointments'
import { StaffAgendaPageClient } from '@/components/appointments/staff-agenda-page-client'

export default async function MinhaAgendaPage({
  params,
}: {
  params: { businessId: string }
}) {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  // Buscar apenas agendamentos do staff logado
  const appointmentsResult = await getAppointments(params.businessId, {
    staffId: user.id,
  })

  if (!appointmentsResult.success) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Minha Agenda</h1>
        <p className="text-destructive">
          Erro ao carregar agendamentos: {appointmentsResult.error}
        </p>
      </div>
    )
  }

  const appointments = appointmentsResult.data || []

  return (
    <StaffAgendaPageClient
      businessId={params.businessId}
      initialAppointments={appointments}
      staffId={user.id}
    />
  )
}
