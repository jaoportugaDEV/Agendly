import { getBusinessBySlug } from '@/lib/actions/business'
import { PublicBookingFlow } from '@/components/booking/public-booking-flow'
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { getClientAppointmentById } from '@/lib/actions/client-appointments'

interface PageProps {
  params: { businessSlug: string }
  searchParams?: { embed?: string; service?: string; remarcar?: string }
}

export default async function PublicBookingPage({
  params,
  searchParams,
}: PageProps) {
  const { businessSlug } = params
  const isEmbed = searchParams?.embed === 'true'
  const preselectedServiceId = searchParams?.service || null
  const remarcarId = searchParams?.remarcar || null

  // Se for remarcação, buscar dados do agendamento original
  let rescheduleData = null
  if (remarcarId) {
    const appointmentResult = await getClientAppointmentById(remarcarId)
    if (appointmentResult.success && appointmentResult.data) {
      rescheduleData = {
        appointmentId: remarcarId,
        serviceId: appointmentResult.data.service_id,
        staffId: appointmentResult.data.staff_id,
      }
    }
  }

  // Get business data
  const result = await getBusinessBySlug(businessSlug)

  if (!result.success || !result.data) {
    notFound()
  }

  const business = result.data

  // Check if business has services and staff
  const hasServices = business.services.length > 0
  const hasStaff = business.staff.length > 0

  if (!hasServices || !hasStaff) {
    return (
      <div className={isEmbed ? 'booking-widget' : 'container py-8'}>
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">{business.name}</h1>
          <p className="text-muted-foreground mb-4">
            Este negócio ainda não está configurado para agendamentos online.
          </p>
          {!hasServices && (
            <p className="text-sm text-muted-foreground">
              Nenhum serviço disponível.
            </p>
          )}
          {!hasStaff && (
            <p className="text-sm text-muted-foreground">
              Nenhum profissional cadastrado.
            </p>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className={isEmbed ? 'booking-widget' : ''}>
      <PublicBookingFlow 
        business={business} 
        preselectedServiceId={preselectedServiceId}
        rescheduleData={rescheduleData}
      />
    </div>
  )
}

// Metadata for SEO
export async function generateMetadata({ params }: PageProps) {
  const result = await getBusinessBySlug(params.businessSlug)

  if (!result.success || !result.data) {
    return {
      title: 'Agendamento',
    }
  }

  return {
    title: `Agendar - ${result.data.name}`,
    description: result.data.description || `Agende seu horário em ${result.data.name}`,
  }
}
