import { redirect } from 'next/navigation'
import { getAuthenticatedClient } from '@/lib/utils/jwt'
import { getClientAppointmentById, canCancelAppointment } from '@/lib/actions/client-appointments'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, User, Building2, Phone, Mail, FileText, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { CancelAppointmentButton } from '@/components/client/cancel-appointment-button'
import { DownloadReceiptButton } from '@/components/client/download-receipt-button'

export default async function AppointmentDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const auth = await getAuthenticatedClient()
  
  if (!auth) {
    redirect('/entrar')
  }

  const appointmentResult = await getClientAppointmentById(params.id)
  
  if (!appointmentResult.success || !appointmentResult.data) {
    redirect('/meus-agendamentos')
  }

  const appointment = appointmentResult.data
  const canCancelResult = await canCancelAppointment(params.id)
  const canCancel = canCancelResult.success && canCancelResult.canCancel

  const statusConfig = {
    confirmed: { label: 'Confirmado', color: 'bg-green-100 text-green-800' },
    completed: { label: 'Concluído', color: 'bg-blue-100 text-blue-800' },
    cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
    pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  }

  const status = statusConfig[appointment.status as keyof typeof statusConfig] || statusConfig.pending

  const isPast = new Date(appointment.start_time) < new Date()
  const isCancelled = appointment.status === 'cancelled'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/meus-agendamentos">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">Detalhes do Agendamento</CardTitle>
                  <CardDescription>ID: {appointment.id.slice(0, 8)}</CardDescription>
                </div>
                <Badge className={status.color}>
                  {status.label}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Business Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {appointment.business?.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {appointment.business?.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{appointment.business.phone}</span>
                </div>
              )}
              {appointment.business?.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{appointment.business.email}</span>
                </div>
              )}
              {appointment.business?.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-muted-foreground">
                    {appointment.business.address}
                    {appointment.business.city && `, ${appointment.business.city}`}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Appointment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Serviço</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Serviço</p>
                <p className="font-medium">{appointment.service?.name}</p>
                {appointment.service?.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {appointment.service.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Data</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {format(new Date(appointment.start_time), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Horário</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {format(new Date(appointment.start_time), "HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Duração</p>
                <p className="font-medium">{appointment.service?.duration_minutes} minutos</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Profissional</p>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{appointment.staff?.full_name}</span>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Preço</p>
                <p className="font-medium text-lg">
                  {new Intl.NumberFormat('pt-PT', {
                    style: 'currency',
                    currency: appointment.currency,
                  }).format(appointment.price)}
                </p>
              </div>

              {appointment.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Observações</p>
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-sm">{appointment.notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Review */}
          {appointment.review && (
            <Card>
              <CardHeader>
                <CardTitle>Sua Avaliação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star}>
                        {star <= appointment.review.rating ? '⭐' : '☆'}
                      </span>
                    ))}
                  </div>
                  {appointment.review.comment && (
                    <p className="text-sm">{appointment.review.comment}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-3">
                <DownloadReceiptButton appointment={appointment} />

                {!isPast && !isCancelled && canCancel && (
                  <>
                    <CancelAppointmentButton 
                      appointmentId={appointment.id}
                      minHours={canCancelResult.minHours || 24}
                    />
                    <Button variant="outline" asChild>
                      <Link href={`/agendar/${appointment.business?.slug}?remarcar=${appointment.id}`}>
                        Remarcar
                      </Link>
                    </Button>
                  </>
                )}

                {isPast && !appointment.review && appointment.status === 'completed' && (
                  <Button asChild>
                    <Link href={`/avaliar/${appointment.id}`}>
                      Avaliar Atendimento
                    </Link>
                  </Button>
                )}
              </div>

              {!canCancel && !isPast && !isCancelled && canCancelResult.hoursUntil !== undefined && (
                <p className="text-sm text-muted-foreground mt-4">
                  Cancelamento disponível apenas com {canCancelResult.minHours}h de antecedência.
                  Faltam {Math.ceil(canCancelResult.hoursUntil)}h para o agendamento.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
