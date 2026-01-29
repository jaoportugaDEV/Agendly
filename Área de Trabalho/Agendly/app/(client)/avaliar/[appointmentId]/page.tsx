import { getAuthenticatedClient } from '@/lib/utils/jwt'
import { canCustomerReview } from '@/lib/actions/reviews'
import { createPublicClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreateReviewForm } from '@/components/client/create-review-form'

export default async function CreateReviewPage({
  params,
}: {
  params: { appointmentId: string }
}) {
  // 1. Verificar autenticação
  const auth = await getAuthenticatedClient()
  if (!auth) {
    redirect(`/entrar?redirect=/avaliar/${params.appointmentId}`)
  }

  // 2. Verificar se pode avaliar
  const canReview = await canCustomerReview(params.appointmentId, auth.customerId)
  if (!canReview.success || !canReview.canReview) {
    redirect('/meus-agendamentos')
  }

  // 3. Buscar dados do agendamento
  const supabase = createPublicClient()
  const { data: appointment } = await supabase
    .from('appointments')
    .select(`
      *,
      service:services(name),
      staff:users(full_name),
      business:businesses(name)
    `)
    .eq('id', params.appointmentId)
    .single()

  if (!appointment) {
    redirect('/meus-agendamentos')
  }

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-3xl font-bold mb-2">Avaliar Atendimento</h1>
      <p className="text-muted-foreground mb-8">
        Como foi sua experiência com {appointment.business.name}?
      </p>

      <CreateReviewForm
        appointmentId={params.appointmentId}
        serviceName={appointment.service.name}
        staffName={appointment.staff?.full_name}
        businessName={appointment.business.name}
      />
    </div>
  )
}
